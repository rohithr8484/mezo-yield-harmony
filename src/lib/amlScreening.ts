import { finiteNumber, type ExplorerTransaction } from "./onchainAnalytics";
import type { AMLTransfer } from "./amlExplorer";

export function derivePaymentScreening(address: string, transactions: ExplorerTransaction[]) {
  const wallet = address.toLowerCase();
  const successful = transactions.filter(tx => tx.status === "ok");
  const outgoing = successful.filter(tx => tx.from?.hash?.toLowerCase() === wallet);
  const incoming = successful.filter(tx => tx.to?.hash?.toLowerCase() === wallet && tx.from?.hash?.toLowerCase() !== wallet);
  const peers = new Set<string>();
  for (const tx of successful) {
    const peer = tx.from?.hash?.toLowerCase() === wallet ? tx.to?.hash : tx.from?.hash;
    if (peer && peer.toLowerCase() !== wallet) peers.add(peer.toLowerCase());
  }
  const flows = successful.filter(tx => {
    const value = finiteNumber(tx.value);
    return value !== null && value > 0 && tx.from?.hash && tx.to?.hash && (tx.from.hash.toLowerCase() === wallet || tx.to.hash.toLowerCase() === wallet);
  }).map(tx => ({ hash: tx.hash, from: tx.from?.hash ?? "", to: tx.to?.hash ?? "", value: tx.value, timestamp: tx.timestamp }));
  const totalNative = (list: ExplorerTransaction[]) => {
    if (list.some(tx => finiteNumber(tx.value) === null)) return null;
    return list.reduce((sum, tx) => sum + Number(tx.value) / 1e18, 0);
  };
  return {
    sampled: transactions.length,
    successful: successful.length,
    failed: transactions.filter(tx => tx.status === "error").length,
    pending: transactions.filter(tx => tx.status == null).length,
    outgoing: outgoing.length,
    incoming: incoming.length,
    counterparties: peers.size,
    nativeOut: totalNative(outgoing),
    nativeIn: totalNative(incoming),
    bidirectional: outgoing.length > 0 && incoming.length > 0,
    flows,
  };
}

export function assessAMLBehavior(observation: ReturnType<typeof deriveAMLPayments>, address: string) {
  const wallet = address.toLowerCase();
  const timed = observation.flows.filter(f => f.amount !== null && f.amount > 0 && Number.isFinite(Date.parse(f.timestamp ?? "")));
  const time = (f: typeof timed[number]) => Date.parse(f.timestamp ?? "");
  const paired = (a: typeof timed[number], b: typeof timed[number]) => a.asset === b.asset && a.hash !== b.hash && time(b) >= time(a) && time(b) - time(a) <= 3600000;
  const incoming = timed.filter(f => f.to.toLowerCase() === wallet && f.from.toLowerCase() !== wallet);
  const outgoing = timed.filter(f => f.from.toLowerCase() === wallet && f.to.toLowerCase() !== wallet);
  const passThrough = incoming.filter(a => outgoing.some(b => paired(a, b) && a.amount === b.amount)).length;
  const roundTrips = outgoing.filter(a => incoming.some(b => paired(a, b) && a.to.toLowerCase() === b.from.toLowerCase() && a.amount === b.amount)).length;
  const zero = "0x0000000000000000000000000000000000000000";
  const mints = incoming.filter(f => f.kind === "token" && f.from.toLowerCase() === zero);
  const dispersals = mints.filter(a => outgoing.some(b => paired(a, b))).length;
  const outcome = (count: number) => count > 0 ? "Pattern observed" : timed.length > 1 ? "No matching pattern in sample" : "Insufficient timed activity";
  return [
    { name: "Structuring (smurfing) below reporting threshold", status: "Cannot determine", evidence: "No fiat valuation, reporting jurisdiction or calibrated threshold; small amounts alone are not structuring." },
    { name: "Rapid pass-through / peeling chain", status: outcome(passThrough), evidence: `${passThrough} incoming leg(s) followed by an equal-amount outgoing leg of the same asset within 60 minutes. A peeling chain is not established.` },
    { name: "Mixer / tumbler exposure", status: "Cannot determine", evidence: "No verified mixer-address labels or downstream tracing available." },
    { name: "Cross-chain bridge layering", status: "Cannot determine", evidence: "No verified bridge labels or cross-chain records; contract interaction alone does not establish layering." },
    { name: "High-velocity round-trip transfers", status: outcome(roundTrips), evidence: `${roundTrips} outgoing leg(s) followed by an equal-amount return from the same counterparty in the same asset within 60 minutes; not proof of laundering.` },
    { name: "Token minting → instant dispersal", status: outcome(dispersals), evidence: `${dispersals} zero-address token receipt(s) followed by an outgoing leg of that asset within 60 minutes; not traced provenance or proof of abuse.` },
  ];
}

export function deriveAMLPayments(address: string, transactions: ExplorerTransaction[], transfers: AMLTransfer[]) {
  const native = derivePaymentScreening(address, transactions);
  const failedHashes = new Set(transactions.filter(t => t.status !== "ok").map(t => t.hash.toLowerCase()));
  const tokenFlows = transfers.filter(t => t.from?.hash && t.to?.hash && t.transaction_hash && !failedHashes.has(t.transaction_hash.toLowerCase())).map((t, index) => {
    const raw = finiteNumber(t.total?.value);
    const decimals = finiteNumber(t.total?.decimals ?? t.token?.decimals);
    return { id: `${t.transaction_hash}-${t.log_index ?? index}`, hash: t.transaction_hash ?? "", from: t.from?.hash ?? "", to: t.to?.hash ?? "", fromContract: Boolean(t.from?.is_contract), toContract: Boolean(t.to?.is_contract), asset: t.token?.address_hash ?? t.token?.address ?? `unknown-${index}`, symbol: t.token?.symbol ?? "Unknown token", amount: raw !== null && decimals !== null && decimals <= 255 ? raw / 10 ** decimals : null, timestamp: t.timestamp, kind: "token" as const };
  });
  const flows = [...native.flows.map(t => ({ ...t, id: t.hash, fromContract: Boolean(transactions.find(tx => tx.hash === t.hash)?.from?.is_contract), toContract: Boolean(transactions.find(tx => tx.hash === t.hash)?.to?.is_contract), asset: "native-btc", symbol: "BTC", amount: Number(t.value) / 1e18, kind: "native" as const })), ...tokenFlows];
  const assets = new Map<string, { asset: string; symbol: string; total: number; count: number; known: boolean }>();
  for (const flow of flows) {
    const asset = assets.get(flow.asset) ?? { asset: flow.asset, symbol: flow.symbol, total: 0, count: 0, known: true };
    asset.count++;
    if (flow.amount === null) asset.known = false;
    else asset.total += flow.amount;
    assets.set(flow.asset, asset);
  }
  const times = transactions.filter(t => t.status === "ok" && t.timestamp).map(t => Date.parse(t.timestamp ?? "")).filter(Number.isFinite);
  const spanHours = times.length > 1 ? (Math.max(...times) - Math.min(...times)) / 3600000 : 0;
  const uniqueTransactions = new Set([...transactions.map(t => t.hash), ...tokenFlows.map(t => t.hash)]);
  const counterparties = new Set(flows.flatMap(t => [t.from.toLowerCase(), t.to.toLowerCase()]).filter(a => a !== address.toLowerCase()));
  return { ...native, flows, assets: [...assets.values()], tokenCount: tokenFlows.length, transactionCount: uniqueTransactions.size, flowCounterparties: counterparties.size, hourlyRate: spanHours > 0 ? times.length / spanHours : null };
}