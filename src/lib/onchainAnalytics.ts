import { summarizeObservationScore } from "./observationScore";

export interface ExplorerAddress {
  hash?: string;
  name?: string;
  is_contract?: boolean;
  is_verified?: boolean;
}

export function deriveAnalyticsRiskScore(tx: ExplorerTransaction, transfers: TokenTransfer[], recipient: AddressInfo | null) {
  const data = deriveAnalytics(tx, transfers, recipient);
  const contract = recipient?.is_contract ?? tx.to?.is_contract;
  const verified = recipient?.is_verified ?? tx.to?.is_verified;
  const methodAvailable = Boolean(data.method) || tx.raw_input === "0x";
  const methodEvidence = (label: string) => data.method ? `Method: ${data.method}; ${label} inference only, not a confirmed protocol state.` : "No decoded method; empty call data is assessed as no method hint.";
  return summarizeObservationScore([
    { name: "Execution failure", weight: 25, available: tx.status === "ok" || tx.status === "error", triggered: tx.status === "error", evidence: `Execution: ${data.status}; failure is an operational concern, not proof of malicious behavior.` },
    { name: "Gas near limit", weight: 15, available: data.gasPct !== null, triggered: (data.gasPct ?? 0) > 95, evidence: data.gasPct === null ? "Gas usage unavailable." : `${formatNumber(data.gasPct, 1)}% used; review threshold >95%.` },
    { name: "Unverified contract", weight: 15, available: !tx.to || contract === false || (contract === true && typeof verified === "boolean"), triggered: contract === true && verified === false, evidence: contract === true ? verified === false ? "Recipient source unverified; this does not establish malicious code." : verified === true ? "Recipient source verified; this does not establish safety." : "Verification unavailable." : "No verified contract-risk finding; unknown address types remain unassessed." },
    { name: "Liquidation risk", weight: 10, available: methodAvailable, triggered: /liquidat/i.test(data.method), evidence: methodEvidence("liquidation") },
    { name: "Redemption risk", weight: 10, available: methodAvailable, triggered: /redeem|withdraw|closetrove/i.test(data.method), evidence: methodEvidence("redemption / exit") },
    { name: "Bridge & interoperability risk", weight: 10, available: methodAvailable, triggered: /bridge|relay|crosschain|teleport|message/i.test(data.method), evidence: methodEvidence("bridge / cross-chain") },
    { name: "Yield sustainability risk", weight: 10, available: methodAvailable, triggered: /harvest|claimrewards|compound|reinvest|yield/i.test(data.method), evidence: methodEvidence("yield / reward") },
    { name: "Fee / native value", weight: 5, available: data.feeRatio !== null && tx.fee?.type !== "maximum", triggered: (data.feeRatio ?? 0) > 5, evidence: data.feeRatio === null || tx.fee?.type === "maximum" ? "No usable actual fee-to-native-value ratio; token values excluded." : `${formatNumber(data.feeRatio, 2)}%; review threshold >5%, token values excluded.` },
  ]);
}

export interface TokenTransfer {
  from?: ExplorerAddress;
  to?: ExplorerAddress;
  token?: { address?: string; address_hash?: string; symbol?: string; decimals?: string | number };
  total?: { value?: string; decimals?: string | number };
  type?: string;
}

export interface ExplorerTransaction {
  hash: string;
  status?: string | null;
  result?: string;
  block?: number;
  block_number?: number;
  confirmations?: number;
  timestamp?: string;
  gas_used?: string | null;
  gas_limit?: string | null;
  gas_price?: string | null;
  base_fee_per_gas?: string | null;
  fee?: { value?: string; type?: string };
  value?: string;
  nonce?: number;
  position?: number;
  method?: string;
  raw_input?: string;
  from?: ExplorerAddress;
  to?: ExplorerAddress | null;
  decoded_input?: { method_call?: string; parameters?: { name: string; type: string; value: unknown }[] } | null;
  token_transfers?: TokenTransfer[];
}

export interface AddressInfo { coin_balance?: string | null; is_verified?: boolean; is_contract?: boolean }
export interface AddressCounters { transactions_count?: string | number; token_transfers_count?: string | number }

export const finiteNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
};

export const formatNumber = (value: number | null, maximumFractionDigits = 6) => {
  if (value === null || !Number.isFinite(value)) return "—";
  if (value > 0 && value < 0.000001) return value.toExponential(3);
  return value.toLocaleString(undefined, { maximumFractionDigits });
};

export const formatUnits = (value: unknown, decimals = 18) => {
  const number = finiteNumber(value);
  return formatNumber(number === null ? null : number / 10 ** decimals);
};

export const shortAddress = (address?: string) => address ? `${address.slice(0, 8)}…${address.slice(-6)}` : "—";

export function deriveAnalytics(tx: ExplorerTransaction, transfers: TokenTransfer[], recipient: AddressInfo | null) {
  const method = tx.decoded_input?.method_call || tx.method || "";
  const methodName = method.split("(")[0].trim();
  const lending = /borrow|repay|supply|deposit|withdraw|liquidat|collateral|opentrove|closetrove|adjusttrove|redeem/i.test(methodName);
  const liquidity = /addliquidity|removeliquidity|swap|mint|burn|stake|unstake/i.test(methodName);
  const gasUsed = finiteNumber(tx.gas_used);
  const gasLimit = finiteNumber(tx.gas_limit);
  const gasPct = gasUsed !== null && gasLimit !== null && gasLimit > 0 ? gasUsed / gasLimit * 100 : null;
  const fee = finiteNumber(tx.fee?.value);
  const value = finiteNumber(tx.value);
  const from = tx.from?.hash?.toLowerCase();
  const participants = new Set<string>();
  for (const address of [tx.from?.hash, tx.to?.hash, ...transfers.flatMap(t => [t.from?.hash, t.to?.hash])]) {
    if (address) participants.add(address.toLowerCase());
  }
  const assets = new Map<string, { key: string; symbol: string; volume: number; outgoing: number; incoming: number; count: number; known: boolean }>();
  for (const transfer of transfers) {
    const address = transfer.token?.address || transfer.token?.address_hash;
    // Unknown assets stay separate; symbol alone is not a token identity.
    const key = address?.toLowerCase() || `unknown-${assets.size}`;
    const group = assets.get(key) || { key, symbol: transfer.token?.symbol || "Unknown token", volume: 0, outgoing: 0, incoming: 0, count: 0, known: true };
    const raw = finiteNumber(transfer.total?.value);
    const decimals = finiteNumber(transfer.total?.decimals ?? transfer.token?.decimals);
    const amount = raw !== null && decimals !== null && decimals <= 255 ? raw / 10 ** decimals : null;
    group.count += 1;
    if (amount === null || !Number.isFinite(amount)) group.known = false;
    else {
      group.volume += amount;
      if (from && transfer.from?.hash?.toLowerCase() === from) group.outgoing += amount;
      if (from && transfer.to?.hash?.toLowerCase() === from) group.incoming += amount;
    }
    assets.set(key, group);
  }
  const status = tx.status === "ok" ? "Success" : tx.status === "error" ? "Failed" : tx.status == null ? "Pending" : "Unknown";
  const risks: { level: "high" | "review"; text: string }[] = [];
  if (status === "Failed") risks.push({ level: "high", text: "Execution failed; gas may still have been charged. Listed transfers do not prove a completed movement." });
  if (gasPct !== null && gasPct > 95) risks.push({ level: "high", text: "Gas usage exceeds 95% of the submitted limit." });
  const contract = recipient?.is_contract ?? tx.to?.is_contract;
  const verified = recipient?.is_verified ?? tx.to?.is_verified;
  if (contract && verified === false) risks.push({ level: "review", text: "Recipient contract source is unverified on the explorer." });
  if (/liquidat/i.test(methodName)) risks.push({ level: "review", text: "The method name suggests liquidation; position details require protocol events." });
  if (fee !== null && value !== null && value > 0 && fee / value > 0.05) risks.push({ level: "review", text: "Network fee exceeds 5% of the native BTC value sent; token value is excluded." });
  const inputBytes = tx.raw_input && /^0x(?:[0-9a-f]{2})*$/i.test(tx.raw_input) ? (tx.raw_input.length - 2) / 2 : null;
  return { method, lending, liquidity, gasUsed, gasLimit, gasPct, fee, value, assets: [...assets.values()], participants: participants.size, status, risks, inputBytes,
    gasHeadroom: gasLimit !== null && gasUsed !== null ? Math.max(0, gasLimit - gasUsed) : null,
    feeRatio: fee !== null && value !== null && value > 0 ? fee / value * 100 : null,
    effectiveGasPrice: fee !== null && gasUsed !== null && gasUsed > 0 ? fee / gasUsed / 1e9 : null,
    interaction: !tx.to ? "Contract creation" : contract ? "Contract call" : tx.raw_input === "0x" ? "Native transfer" : "Unclassified interaction",
  };
}