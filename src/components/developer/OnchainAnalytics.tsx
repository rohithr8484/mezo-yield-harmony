import { useEffect, useRef, useState, type ReactNode } from "react";
import { Search, ExternalLink, Loader2, CheckCircle, XCircle, Clock, Fuel, Gauge, Layers, User, FileCode, Droplets, Landmark, Wallet, AlertTriangle, ArrowRight, Activity, Copy, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AnalysisAccessGate } from "./AnalysisAccessGate";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { deriveAnalytics, finiteNumber, formatNumber, formatUnits, shortAddress, type ExplorerTransaction, type TokenTransfer, type AddressInfo, type AddressCounters } from "@/lib/onchainAnalytics";

const API = "https://api.explorer.test.mezo.org/api/v2";
const EXPLORER = "https://explorer.test.mezo.org";

const Metric = ({ label, value, detail }: { label: string; value: ReactNode; detail?: string }) => (
  <div className="min-w-0 border-l-2 border-border px-3 py-1">
    <dt className="text-[11px] font-medium text-muted-foreground">{label}</dt>
    <dd className="mt-1 break-words font-mono text-sm font-semibold text-foreground">{value}</dd>
    {detail && <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{detail}</p>}
  </div>
);
const Metrics = ({ children }: { children: ReactNode }) => <dl className="grid grid-cols-2 gap-x-4 gap-y-5 lg:grid-cols-4">{children}</dl>;
const Section = ({ icon: Icon, title, index, children, badge }: { icon: typeof Layers; title: string; index: string; children: ReactNode; badge?: string }) => (
  <section aria-label={title} className="min-w-0 border-t border-border py-6">
    <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
      <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground"><span className="mr-1 font-mono text-[10px] text-muted-foreground">{index}</span><Icon className="h-4 w-4 text-accent" />{title}</h4>
      {badge && <span className="text-[10px] font-medium uppercase text-muted-foreground">{badge}</span>}
    </div>
    {children}
  </section>
);
const AddressLink = ({ address }: { address?: string }) => address ? <a title={address} href={`${EXPLORER}/address/${address}`} target="_blank" rel="noopener noreferrer" className="inline-flex max-w-full items-center gap-1 break-all font-mono text-xs text-primary hover:underline">{shortAddress(address)}<ExternalLink className="h-3 w-3 shrink-0" /></a> : <span>—</span>;
const Note = ({ children }: { children: ReactNode }) => <p className="mt-4 text-xs leading-relaxed text-muted-foreground">{children}</p>;

async function getJson<T>(path: string, signal: AbortSignal): Promise<T> {
  const response = await fetch(`${API}${path}`, { signal });
  if (!response.ok) throw new Error(response.status === 404 ? "Transaction not found on Mezo Testnet." : "Explorer is unavailable. Please try again.");
  return response.json();
}

type Result = { tx: ExplorerTransaction; transfers: TokenTransfer[]; fromInfo: AddressInfo | null; toInfo: AddressInfo | null; counters: AddressCounters | null; transferComplete: boolean; addressComplete: boolean };

export const OnchainAnalytics = ({ isPaid = false, onPaymentSuccess = () => {} }: { isPaid?: boolean; onPaymentSuccess?: () => void }) => {
  const [requested, setRequested] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [hash, setHash] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const activeRequest = useRef<AbortController | null>(null);
  useEffect(() => () => activeRequest.current?.abort(), []);

  const lookup = async () => {
    const h = hash.trim();
    if (!/^0x[0-9a-f]{64}$/i.test(h)) { setError("Enter a valid transaction hash: 0x followed by 64 hexadecimal characters."); return; }
    if (!authorized) { setError(""); setRequested(true); return; }
    activeRequest.current?.abort();
    const controller = new AbortController();
    activeRequest.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), 30000);
    setLoading(true); setError(""); setResult(null); setCopied(false);
    try {
      const tx = await getJson<ExplorerTransaction & { token_transfers_overflow?: boolean }>(`/transactions/${h}`, controller.signal);
      const optional = async <T,>(path: string): Promise<T | null> => {
        try { return await getJson<T>(path, controller.signal); } catch { return null; }
      };
      const [fromInfo, toInfo, counters] = await Promise.all([
        tx.from?.hash ? optional<AddressInfo>(`/addresses/${tx.from.hash}`) : null,
        tx.to?.hash ? optional<AddressInfo>(`/addresses/${tx.to.hash}`) : null,
        tx.from?.hash ? optional<AddressCounters>(`/addresses/${tx.from.hash}/counters`) : null,
      ]);
      let transfers = tx.token_transfers ?? [];
      let transferComplete = !tx.token_transfers_overflow && Array.isArray(tx.token_transfers);
      if (!transferComplete) {
        const collected: TokenTransfer[] = [];
        let query = "";
        for (let page = 0; page < 10; page++) {
          const batch = await optional<{ items: TokenTransfer[]; next_page_params?: Record<string, string | number> | null }>(`/transactions/${h}/token-transfers${query}`);
          if (!batch || !Array.isArray(batch.items)) break;
          collected.push(...batch.items);
          if (!batch.next_page_params) { transferComplete = true; break; }
          query = `?${new URLSearchParams(Object.entries(batch.next_page_params).map(([key, value]) => [key, String(value)]))}`;
        }
        if (collected.length || transferComplete) transfers = collected;
      }
      if (activeRequest.current !== controller) return;
      if (controller.signal.aborted) throw new Error("The explorer request timed out. Please try again.");
      setResult({ tx, transfers, fromInfo, toInfo, counters, transferComplete, addressComplete: Boolean(fromInfo && counters && (!tx.to?.hash || toInfo)) });
    } catch (err) {
      if (activeRequest.current === controller) setError(controller.signal.aborted ? "The explorer request timed out. Please try again." : err instanceof Error ? err.message : "Unable to retrieve transaction data.");
    } finally {
      window.clearTimeout(timeout);
      if (activeRequest.current === controller) setLoading(false);
    }
  };

  useEffect(() => {
    if (authorized) void lookup();
  }, [authorized]);

  const data = result ? deriveAnalytics(result.tx, result.transfers, result.toInfo) : null;
  const copyHash = async () => {
    if (!result) return;
    try { await navigator.clipboard.writeText(result.tx.hash); setCopied(true); } catch { setCopied(false); }
  };
  const native = (value: unknown) => finiteNumber(value) === null ? "—" : `${formatUnits(value)} BTC`;
  const gwei = (value: unknown) => finiteNumber(value) === null ? "—" : `${formatUnits(value, 9)} gwei`;

  return (
    <div className="min-w-0 space-y-5">
      <form onSubmit={e => { e.preventDefault(); void lookup(); }} className="flex flex-col gap-2 sm:flex-row">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Transaction hash</span>
          <Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Transaction hash · 0x…" value={hash} onChange={e => setHash(e.target.value)} className="h-11 bg-background pl-9 font-mono text-xs" />
        </label>
        <Button type="submit" disabled={loading || !hash.trim()} className="h-11 shrink-0 px-5">{loading ? <Loader2 className="animate-spin" /> : <Activity />} {loading ? "Analyzing…" : "Analyze"}</Button>
      </form>
      {error && <div role="alert" className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"><XCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}
      {loading && <div role="status" className="flex items-center gap-2 py-8 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Retrieving explorer records…</div>}
      {requested && <AnalysisAccessGate serviceName="On-chain Analytics" displayName="On-chain Analytics API" isPaid={isPaid} onPaymentSuccess={onPaymentSuccess} onUnlock={() => setAuthorized(true)}>
      {result && data && authorized && (
        <div aria-live="polite" className="min-w-0">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-l-2 border-accent bg-accent/5 px-4 py-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-sm font-semibold">
                {data.status === "Success" ? <CheckCircle className="h-4 w-4 text-accent" /> : data.status === "Failed" ? <XCircle className="h-4 w-4 text-destructive" /> : <Clock className="h-4 w-4 text-muted-foreground" />}
                <span className={data.status === "Failed" ? "text-destructive" : "text-foreground"}>{data.status}</span><span className="text-xs font-normal text-muted-foreground">· Mezo Testnet</span>
              </div>
              <p className="mt-1 break-all font-mono text-[11px] text-muted-foreground">{result.tx.hash}</p>
            </div>
            <div className="flex items-center gap-2">
              <Tooltip><TooltipTrigger asChild><Button type="button" size="icon" variant="ghost" onClick={copyHash} aria-label={copied ? "Hash copied" : "Copy transaction hash"}>{copied ? <Check /> : <Copy />}</Button></TooltipTrigger><TooltipContent>{copied ? "Copied" : "Copy hash"}</TooltipContent></Tooltip>
              <Button variant="outline" size="sm" asChild><a href={`${EXPLORER}/tx/${result.tx.hash}`} target="_blank" rel="noopener noreferrer">Explorer<ExternalLink /></a></Button>
            </div>
          </div>
          {(!result.transferComplete || !result.addressComplete) && <div role="status" className="mb-5 flex items-start gap-2 text-xs text-muted-foreground"><AlertTriangle className="h-4 w-4 shrink-0 text-bitcoin" /><span>{!result.transferComplete ? "Transfer data is incomplete; all transfer-derived metrics use only the loaded records. " : ""}{!result.addressComplete ? "Some wallet records are unavailable." : ""}</span></div>}

          <Section index="01" icon={Layers} title="Overview" badge="Transaction record">
            <Metrics>
              <Metric label="Interaction" value={data.interaction} />
              <Metric label="Confirmations" value={formatNumber(finiteNumber(result.tx.confirmations), 0)} detail={`Block ${result.tx.block ?? result.tx.block_number ?? "—"}`} />
              <Metric label="Native value sent" value={native(result.tx.value)} />
              <Metric label="Unique addresses" value={data.participants} detail="Sender, recipient and loaded transfer endpoints" />
            </Metrics>
            <Note>{result.tx.timestamp ? new Date(result.tx.timestamp).toLocaleString() : "Timestamp unavailable"} · Nonce {result.tx.nonce ?? "—"} · Position {result.tx.position ?? "—"}{result.tx.result ? ` · ${result.tx.result}` : ""}</Note>
          </Section>
          <Section index="02" icon={Fuel} title="Gas & fee analytics" badge="Observed usage">
            <Metrics>
              <Metric label="Gas utilization" value={data.gasPct === null ? "—" : `${formatNumber(data.gasPct, 1)}%`} detail={data.gasPct === null ? "Usage unavailable" : data.gasPct > 95 ? "Near submitted limit" : "Within submitted limit"} />
              <Metric label="Unused gas allowance" value={formatNumber(data.gasHeadroom, 0)} detail={`${formatNumber(data.gasUsed, 0)} used / ${formatNumber(data.gasLimit, 0)} limit`} />
              <Metric label={result.tx.fee?.type === "maximum" ? "Maximum network fee" : "Network fee"} value={native(result.tx.fee?.value)} detail={`Gas price ${gwei(result.tx.gas_price)}`} />
              <Metric label="Fee / native value" value={data.feeRatio === null ? "N/A" : `${formatNumber(data.feeRatio, 4)}%`} detail="Excludes token valuations" />
            </Metrics>
            {data.gasPct !== null && <progress aria-label="Gas utilization" value={Math.min(100, data.gasPct)} max={100} className="mt-5 h-1.5 w-full overflow-hidden rounded-full [&::-webkit-progress-bar]:bg-secondary [&::-webkit-progress-value]:bg-accent [&::-moz-progress-bar]:bg-accent" />}
            <Note>Base fee {gwei(result.tx.base_fee_per_gas)} · {result.tx.fee?.type === "maximum" ? "Estimated" : "Effective"} gas price {data.effectiveGasPrice === null ? "—" : `${formatNumber(data.effectiveGasPrice)} gwei`}</Note>
          </Section>
          <Section index="03" icon={Droplets} title="Liquidity" badge="Method-based inference">
            <Metrics>
              <Metric label="Liquidity method hint" value={data.liquidity ? "Match detected" : "No match"} />
              <Metric label="Assets observed" value={data.assets.length} detail="Distinct token addresses" />
              <Metric label="Transfer events" value={result.transfers.length} />
              <Metric label="Native BTC sent" value={native(result.tx.value)} />
            </Metrics>
            <Note>{data.liquidity ? `“${data.method}” matches a liquidity-related name; mint, burn and stake can also be unrelated to pools.` : "No liquidity-related method name was identified."} Pool reserves, depth and price impact are unavailable from this transaction record.</Note>
          </Section>
          <Section index="04" icon={Landmark} title="Lending" badge="Method-based inference">
            <Metrics>
              <Metric label="Lending method hint" value={data.lending ? "Match detected" : "No match"} />
              <Metric label="Liquidation hint" value={/liquidat/i.test(data.method) ? "Method match" : "No match"} />
              <Metric label="Collateral ratio" value="Unavailable" detail="Requires position-level reads" />
              <Metric label="Pool utilization" value="Unavailable" detail="Requires pool-level reads" />
            </Metrics>
            <Note>{data.lending ? `“${data.method}” matches a lending-related name, not proof of borrowing or collateral changes.` : "No lending-related method name was identified."} Transfers alone do not establish collateral, debt or repayment amounts.</Note>
          </Section>
          <Section index="05" icon={Wallet} title="Wallet behavior" badge="Sender activity">
            <Metrics>
              <Metric label="Lifetime transactions" value={formatNumber(finiteNumber(result.counters?.transactions_count), 0)} />
              <Metric label="Lifetime token transfers" value={formatNumber(finiteNumber(result.counters?.token_transfers_count), 0)} />
              <Metric label="Current BTC balance" value={native(result.fromInfo?.coin_balance)} detail="Current balance, not at transaction time" />
              <Metric label="Observed flow direction" value={data.assets.some(a => a.outgoing > 0) && data.assets.some(a => a.incoming > 0) ? "Two-way" : data.assets.some(a => a.outgoing > 0) ? "Outgoing" : data.assets.some(a => a.incoming > 0) ? "Incoming" : "No quantified token flow"} />
            </Metrics>
            <Note>Sender {shortAddress(result.tx.from?.hash)} · Activity totals are current explorer counters; a single transaction does not establish accumulation or distribution trends.</Note>
          </Section>
          <Section index="06" icon={AlertTriangle} title="Risk signals" badge="Heuristic checks · not a safety rating">
            <Metrics>
              <Metric label="Triggered signals" value={data.risks.length} />
              <Metric label="High-priority signals" value={data.risks.filter(r => r.level === "high").length} />
              <Metric label="Review signals" value={data.risks.filter(r => r.level === "review").length} />
              <Metric label="Recipient verification" value={(result.toInfo?.is_contract ?? result.tx.to?.is_contract) ? (result.toInfo?.is_verified ?? result.tx.to?.is_verified) === true ? "Verified" : (result.toInfo?.is_verified ?? result.tx.to?.is_verified) === false ? "Unverified" : "Unknown" : result.tx.to ? "Not a contract / unknown" : "Creation"} />
            </Metrics>
            <div className="mt-4 space-y-2">{data.risks.map((risk, i) => <div key={i} className={`flex items-start gap-2 border-l-2 px-3 py-2 text-xs leading-relaxed ${risk.level === "high" ? "border-destructive bg-destructive/5 text-destructive" : "border-bitcoin bg-bitcoin/5 text-foreground"}`}><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span><strong>{risk.level === "high" ? "High" : "Review"}</strong> · {risk.text}</span></div>)}</div>
            <Note>{data.risks.length === 0 ? "No signals triggered in the available records. " : ""}Missing data is not a passed check; verified source and low gas usage do not establish contract safety.</Note>
          </Section>
          <Section index="07" icon={User} title="Participants" badge="Addresses observed">
            <Metrics>
              <Metric label="Unique addresses" value={data.participants} />
              <Metric label="Sender type" value={result.fromInfo?.is_contract ?? result.tx.from?.is_contract ? "Contract" : "Wallet / unknown"} />
              <Metric label="Recipient type" value={data.interaction === "Contract creation" ? "New contract" : (result.toInfo?.is_contract ?? result.tx.to?.is_contract) ? "Contract" : "Wallet / unknown"} />
              <Metric label="Additional endpoints" value={Math.max(0, data.participants - new Set([result.tx.from?.hash, result.tx.to?.hash].filter(Boolean).map(a => a?.toLowerCase())).size)} detail="Beyond transaction sender and recipient" />
            </Metrics>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">{[{ label: "Sender", address: result.tx.from, info: result.fromInfo }, { label: "Recipient", address: result.tx.to, info: result.toInfo }].map(p => <div key={p.label} className="min-w-0 border-l border-border pl-3"><p className="mb-1 text-[11px] text-muted-foreground">{p.label}</p><AddressLink address={p.address?.hash} />{p.address?.name && <p className="mt-1 break-words text-xs text-foreground">{p.address.name}</p>}<p className="mt-1 text-xs text-muted-foreground">Current balance {native(p.info?.coin_balance)}</p></div>)}</div>
          </Section>
          <Section index="08" icon={Activity} title="Token flow" badge={result.transferComplete ? "Loaded transfer records" : "Partial transfer records"}>
            <Metrics>
              <Metric label="Transfer events" value={result.transfers.length} />
              <Metric label="Distinct assets" value={data.assets.length} />
              <Metric label="Sender outgoing events" value={result.transfers.filter(t => result.tx.from?.hash && t.from?.hash?.toLowerCase() === result.tx.from.hash.toLowerCase()).length} />
              <Metric label="Sender incoming events" value={result.transfers.filter(t => result.tx.from?.hash && t.to?.hash?.toLowerCase() === result.tx.from.hash.toLowerCase()).length} />
            </Metrics>
            {data.assets.length > 0 && <div className="mt-5 divide-y divide-border border-y border-border">{data.assets.map(asset => <div key={asset.key} className="grid min-w-0 gap-2 py-3 sm:grid-cols-3"><div><p className="text-xs font-semibold text-foreground">{asset.symbol}</p><p className="break-all font-mono text-[10px] text-muted-foreground">{asset.key.startsWith("unknown-") ? "Token address unavailable" : shortAddress(asset.key)}</p></div><div className="text-xs"><p className="text-muted-foreground">Gross event volume</p><p className="mt-1 font-mono text-foreground">{asset.known ? formatNumber(asset.volume) : "Unavailable"}</p></div><div className="text-xs"><p className="text-muted-foreground">Sender out / in</p><p className="mt-1 font-mono text-foreground">{asset.known ? `${formatNumber(asset.outgoing)} / ${formatNumber(asset.incoming)}` : "Unavailable"}</p></div></div>)}</div>}
            <div className="mt-4 max-h-72 space-y-2 overflow-y-auto">{result.transfers.map((t, i) => <div key={i} className="flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-border/50 py-2 text-xs"><span className="font-mono font-semibold text-foreground">{finiteNumber(t.total?.decimals ?? t.token?.decimals) === null ? "—" : formatUnits(t.total?.value, Number(t.total?.decimals ?? t.token?.decimals))} {t.token?.symbol || "Unknown"}</span><AddressLink address={t.from?.hash} /><ArrowRight className="h-3 w-3 text-muted-foreground" /><AddressLink address={t.to?.hash} /><span className="text-muted-foreground">{t.type || "Transfer"}</span></div>)}</div>
            <Note>{result.transfers.length === 0 ? result.transferComplete ? "No token transfer events recorded. " : "Token transfer records unavailable. " : ""}Volumes stay separate per asset and sum transfer events, not net economic value; repeated movements can count more than once.{data.status !== "Success" ? " Execution is not confirmed successful; these records do not establish settled movement." : ""}</Note>
          </Section>
          <Section index="09" icon={Gauge} title="Decoded input" badge="Explorer decoding">
            <Metrics>
              <Metric label="Decode status" value={result.tx.decoded_input?.method_call ? "Decoded" : result.tx.raw_input === "0x" ? "No call data" : "Not decoded"} />
              <Metric label="Input size" value={data.inputBytes === null ? "—" : `${data.inputBytes} bytes`} />
              <Metric label="Function selector" value={result.tx.raw_input && result.tx.raw_input.length >= 10 ? result.tx.raw_input.slice(0, 10) : "N/A"} />
              <Metric label="Decoded parameters" value={result.tx.decoded_input?.parameters?.length ?? "—"} />
            </Metrics>
            {data.method && <p className="mt-5 flex items-start gap-2 break-all font-mono text-xs text-primary"><FileCode className="h-4 w-4 shrink-0" />{data.method}</p>}
            <div className="mt-3 divide-y divide-border">{result.tx.decoded_input?.parameters?.map((parameter, i) => <div key={i} className="grid min-w-0 gap-1 py-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]"><p className="break-words text-xs text-muted-foreground">{parameter.name || `Parameter ${i + 1}`} <span className="font-mono">({parameter.type})</span></p><p className="break-all font-mono text-xs text-foreground">{typeof parameter.value === "object" ? JSON.stringify(parameter.value) : String(parameter.value)}</p></div>)}</div>
            {!result.tx.decoded_input && <Note>{result.tx.raw_input === "0x" ? "No encoded function call in this transaction." : "The explorer has not decoded this input; function behavior cannot be confirmed."}</Note>}
          </Section>
        </div>
      )}
      </AnalysisAccessGate>}
    </div>
  );
};
