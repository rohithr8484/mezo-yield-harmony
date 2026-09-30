import { useState } from "react";
import { Search, ExternalLink, Loader2, CheckCircle, XCircle, Clock, Fuel, Gauge, Layers, ArrowRightLeft, User, FileCode, Droplets, Landmark, Wallet, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";

const API = "https://api.explorer.test.mezo.org/api/v2";
const EXPLORER = "https://explorer.test.mezo.org";
const MUSD = "0x94ff830f078eb9c6e77bade29fb46b1a249a5fd3";
const MEZO = "0x7b7c000000000000000000000000000000000001";

type Any = Record<string, any>;

const fmt = (val?: string | number | null, decimals = 18) => {
  if (val === undefined || val === null || val === "") return "—";
  const num = Number(val) / Math.pow(10, decimals);
  if (num === 0) return "0";
  return num < 0.0001 ? num.toExponential(3) : num.toLocaleString(undefined, { maximumFractionDigits: 6 });
};
const gwei = (v?: string | null) => (v ? `${(Number(v) / 1e9).toLocaleString(undefined, { maximumFractionDigits: 4 })} gwei` : "—");
const short = (a?: string) => (a ? `${a.slice(0, 8)}…${a.slice(-6)}` : "—");

const LENDING_METHODS = ["borrow", "repay", "supply", "deposit", "withdraw", "liquidat", "collateral", "openTrove", "closeTrove", "adjustTrove", "redeem"];
const LIQUIDITY_METHODS = ["addLiquidity", "removeLiquidity", "swap", "mint", "burn", "stake", "unstake"];

const Stat = ({ label, value, mono = true }: { label: string; value: React.ReactNode; mono?: boolean }) => (
  <div className="rounded-lg border border-border bg-card p-3">
    <p className="mb-1 text-[10px] font-bold uppercase text-muted-foreground">{label}</p>
    <p className={`break-all text-xs text-foreground ${mono ? "font-mono" : ""}`}>{value}</p>
  </div>
);

const SectionTitle = ({ icon: Icon, children }: { icon: any; children: React.ReactNode }) => (
  <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground"><Icon className="h-3.5 w-3.5" /> {children}</p>
);

export const OnchainAnalytics = () => {
  const [hash, setHash] = useState("");
  const [tx, setTx] = useState<Any | null>(null);
  const [fromInfo, setFromInfo] = useState<Any | null>(null);
  const [toInfo, setToInfo] = useState<Any | null>(null);
  const [fromCounters, setFromCounters] = useState<Any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const getJson = async (url: string) => {
    try {
      const r = await fetch(url);
      return r.ok ? await r.json() : null;
    } catch {
      return null;
    }
  };

  const lookup = async () => {
    const h = hash.trim();
    if (!h) return;
    setLoading(true);
    setError("");
    setTx(null);
    setFromInfo(null);
    setToInfo(null);
    setFromCounters(null);
    const data = await getJson(`${API}/transactions/${h}`);
    if (!data) {
      setError("Transaction not found or API unavailable.");
      setLoading(false);
      return;
    }
    setTx(data);
    const [f, t, fc] = await Promise.all([
      data.from?.hash ? getJson(`${API}/addresses/${data.from.hash}`) : null,
      data.to?.hash ? getJson(`${API}/addresses/${data.to.hash}`) : null,
      data.from?.hash ? getJson(`${API}/addresses/${data.from.hash}/counters`) : null,
    ]);
    setFromInfo(f);
    setToInfo(t);
    setFromCounters(fc);
    setLoading(false);
  };

  const gasUsed = Number(tx?.gas_used ?? 0);
  const gasLimit = Number(tx?.gas_limit ?? 0);
  const gasPct = gasLimit ? Math.min(100, (gasUsed / gasLimit) * 100) : 0;
  const fee = Number(tx?.fee?.value ?? 0);
  const value = Number(tx?.value ?? 0);
  const transfers: Any[] = tx?.token_transfers ?? [];
  const tokenSymbols = Array.from(new Set(transfers.map((t) => t.token?.symbol).filter(Boolean)));

  // ---- Liquidity / Lending / Behavior / Risk derivation ----
  const method = (tx?.method || tx?.decoded_input?.method_call || "").toString();
  const methodLower = method.toLowerCase();
  const lendingHit = LENDING_METHODS.find((m) => methodLower.includes(m.toLowerCase()));
  const liquidityHit = LIQUIDITY_METHODS.find((m) => methodLower.includes(m.toLowerCase()));

  const transferValue = (t: Any) => Number(t.total?.value ?? 0) / Math.pow(10, Number(t.total?.decimals ?? 18));
  const isToken = (t: Any, addr: string) => (t.token?.address || t.token?.address_hash || "").toLowerCase() === addr;
  const musdTransfers = transfers.filter((t) => isToken(t, MUSD));
  const mezoTransfers = transfers.filter((t) => isToken(t, MEZO));
  const musdVolume = musdTransfers.reduce((s, t) => s + transferValue(t), 0);
  const mezoVolume = mezoTransfers.reduce((s, t) => s + transferValue(t), 0);
  const largestTransfer = transfers.length ? transfers.reduce((a, b) => (transferValue(a) >= transferValue(b) ? a : b)) : null;
  const nativeBtc = value / 1e18;
  const isLargeMovement = nativeBtc >= 0.01 || musdVolume >= 100 || mezoVolume >= 100;

  const risks: { level: "high" | "medium" | "low"; text: string }[] = [];
  if (tx) {
    if (tx.status && tx.status !== "ok") risks.push({ level: "high", text: `Transaction reverted (${tx.result || "failed"}) — funds not moved, gas still consumed.` });
    if (gasPct > 95) risks.push({ level: "high", text: "Gas used near the limit — a slightly more complex path would run out of gas." });
    if (tx.to?.is_contract && !tx.to?.is_verified) risks.push({ level: "medium", text: "Interacting contract is not source-verified on the explorer — code cannot be audited publicly." });
    if (methodLower.includes("liquidat")) risks.push({ level: "high", text: "Liquidation call — a collateralized position was forcibly closed." });
    if (value > 0 && fee / value > 0.05) risks.push({ level: "medium", text: "Fee is over 5% of the transferred value — inefficient transfer size." });
    if (isLargeMovement) risks.push({ level: "low", text: "Large-holder sized movement — worth watching for market impact." });
    if (!risks.length) risks.push({ level: "low", text: "No elevated risk signals detected for this transaction." });
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Enter transaction hash (0x...)"
          value={hash}
          onChange={(e) => setHash(e.target.value)}
          className="border-border bg-secondary/60 font-mono text-xs"
          onKeyDown={(e) => e.key === "Enter" && lookup()}
        />
        <button
          onClick={lookup}
          disabled={loading || !hash.trim()}
          className="flex shrink-0 items-center gap-2 rounded-lg bg-gradient-to-r from-primary to-accent px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          Analyze
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          <XCircle className="h-4 w-4" /> {error}
        </div>
      )}

      {tx && (
        <div className="space-y-4 rounded-xl border border-border bg-secondary/40 p-4 animate-in fade-in duration-300">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {tx.status === "ok" ? <CheckCircle className="h-5 w-5 text-accent" /> : <XCircle className="h-5 w-5 text-destructive" />}
              <span className={`text-sm font-bold ${tx.status === "ok" ? "text-accent" : "text-destructive"}`}>
                {tx.status === "ok" ? "Success" : tx.status === null ? "Pending" : "Failed"}
              </span>
              {tx.result && tx.result !== "success" && <span className="text-xs text-muted-foreground">({tx.result})</span>}
            </div>
            <a href={`${EXPLORER}/tx/${tx.hash}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-primary hover:underline">
              Explorer <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          {/* Overview */}
          <div>
            <SectionTitle icon={Layers}>Overview</SectionTitle>
            <div className="grid grid-cols-2 gap-2">
              <Stat label="Block" value={tx.block ?? tx.block_number ?? "—"} />
              <Stat label="Confirmations" value={tx.confirmations?.toLocaleString() ?? "—"} />
              <Stat label="Timestamp" value={<span className="flex items-center gap-1"><Clock className="h-3 w-3" />{tx.timestamp ? new Date(tx.timestamp).toLocaleString() : "—"}</span>} mono={false} />
              <Stat label="Confirmation time" value={tx.confirmation_duration?.length ? `${(tx.confirmation_duration[tx.confirmation_duration.length - 1] / 1000).toFixed(1)}s` : "—"} />
              <Stat label="Tx type" value={`${tx.type ?? "—"}${tx.tx_types?.length ? ` · ${tx.tx_types.join(", ")}` : ""}`} />
              <Stat label="Nonce / Position" value={`${tx.nonce ?? "—"} / ${tx.position ?? "—"}`} />
              <Stat label="Method" value={method || (tx.raw_input === "0x" ? "Native transfer" : "—")} />
              <Stat label="Value" value={`${fmt(tx.value)} BTC`} />
            </div>
          </div>

          {/* Gas analytics */}
          <div>
            <SectionTitle icon={Fuel}>Gas & fee analytics</SectionTitle>
            <div className="mb-2 rounded-lg border border-border bg-card p-3">
              <div className="mb-1.5 flex justify-between text-xs">
                <span className="text-muted-foreground">Gas efficiency</span>
                <span className="font-mono text-foreground">{gasUsed.toLocaleString()} / {gasLimit.toLocaleString()} ({gasPct.toFixed(1)}%)</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-secondary">
                <div className="h-full rounded-full bg-gradient-to-r from-primary to-accent" style={{ width: `${gasPct}%` }} />
              </div>
              <p className="mt-1.5 text-[11px] text-muted-foreground">
                {gasPct > 95 ? "Near limit — risk of out-of-gas." : gasPct < 40 ? "Gas limit much higher than needed." : "Well-sized gas limit."} Unused: {(gasLimit - gasUsed).toLocaleString()}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Stat label="Fee paid" value={`${fmt(tx.fee?.value)} BTC`} />
              <Stat label="Gas price" value={gwei(tx.gas_price)} />
              <Stat label="Base fee" value={gwei(tx.base_fee_per_gas)} />
              <Stat label="Priority fee" value={tx.priority_fee ? `${fmt(tx.priority_fee)} BTC` : "—"} />
              <Stat label="Max fee / gas" value={gwei(tx.max_fee_per_gas)} />
              <Stat label="Fee / value ratio" value={value > 0 ? `${((fee / value) * 100).toFixed(4)}%` : "n/a"} />
            </div>
          </div>

          {/* Liquidity */}
          <div>
            <SectionTitle icon={Droplets}>Liquidity</SectionTitle>
            <div className="grid grid-cols-2 gap-2">
              <Stat label="MUSD moved" value={`${musdVolume.toLocaleString(undefined, { maximumFractionDigits: 4 })} MUSD`} />
              <Stat label="MEZO moved" value={`${mezoVolume.toLocaleString(undefined, { maximumFractionDigits: 4 })} MEZO`} />
              <Stat label="Native BTC moved" value={`${fmt(tx.value)} BTC`} />
              <Stat label="Pool / swap action" value={liquidityHit ? `${liquidityHit} detected` : "None detected"} />
            </div>
            <p className="mt-2 rounded-lg border border-border bg-card p-3 text-[11px] text-muted-foreground">
              {transfers.length
                ? `This transaction moved ${transfers.length} token transfer${transfers.length === 1 ? "" : "s"} across ${tokenSymbols.join(", ") || "unknown tokens"}. ${liquidityHit ? "The method call matches a liquidity action (swap / add / remove / stake), so it likely changed pool balances." : "No pool interaction detected — this looks like a plain transfer rather than a liquidity event."}`
                : "No token transfers — no liquidity impact from this transaction."}
            </p>
          </div>

          {/* Lending */}
          <div>
            <SectionTitle icon={Landmark}>Lending</SectionTitle>
            <div className="grid grid-cols-2 gap-2">
              <Stat label="Borrowing demand signal" value={lendingHit ? `Method: ${lendingHit}` : "No lending method detected"} />
              <Stat label="Collateral asset" value={value > 0 ? `${fmt(tx.value)} BTC posted/moved` : musdVolume > 0 ? "MUSD flow" : "—"} />
              <Stat label="Liquidation event" value={methodLower.includes("liquidat") ? "Yes — position liquidated" : "No"} />
              <Stat label="Utilization signal" value={lendingHit ? "Active lending interaction" : "n/a (single-tx view)"} />
            </div>
            <p className="mt-2 rounded-lg border border-border bg-card p-3 text-[11px] text-muted-foreground">
              {lendingHit
                ? `The method "${method}" matches a lending action (${lendingHit}). On Mezo, borrowing demand is expressed through MUSD troves backed by BTC collateral — check the MUSD and BTC amounts above for the size of the position touched.`
                : "No borrow / repay / supply / liquidation method in this transaction. Utilization and liquidation data require pool-level views — this panel reports what a single transaction reveals."}
            </p>
          </div>

          {/* Wallet behavior */}
          <div>
            <SectionTitle icon={Wallet}>Wallet behavior</SectionTitle>
            <div className="grid grid-cols-2 gap-2">
              <Stat label="Movement size" value={isLargeMovement ? "Large-holder sized" : "Standard"} />
              <Stat label="Sender lifetime txs" value={fromCounters ? Number(fromCounters.transactions_count ?? 0).toLocaleString() : "—"} />
              <Stat label="Sender token transfers" value={fromCounters ? Number(fromCounters.token_transfers_count ?? 0).toLocaleString() : "—"} />
              <Stat label="Sender BTC balance" value={`${fmt(fromInfo?.coin_balance)} BTC`} />
            </div>
            {largestTransfer && (
              <p className="mt-2 rounded-lg border border-border bg-card p-3 text-[11px] text-muted-foreground">
                Largest movement: <span className="font-semibold text-primary">{largestTransfer.token?.symbol ?? "?"}</span>{" "}
                <span className="font-mono text-foreground">{transferValue(largestTransfer).toLocaleString(undefined, { maximumFractionDigits: 4 })}</span>{" "}
                from <span className="font-mono">{short(largestTransfer.from?.hash)}</span> to <span className="font-mono">{short(largestTransfer.to?.hash)}</span>.
                {isLargeMovement ? " Movements of this size from a single wallet can signal accumulation, distribution, or position rebalancing." : ""}
              </p>
            )}
          </div>

          {/* Risks */}
          <div>
            <SectionTitle icon={AlertTriangle}>Risk signals</SectionTitle>
            <div className="space-y-1.5">
              {risks.map((r, i) => (
                <div key={i} className={`flex items-start gap-2 rounded-lg border p-3 text-xs ${
                  r.level === "high" ? "border-destructive/30 bg-destructive/10 text-destructive"
                  : r.level === "medium" ? "border-primary/30 bg-primary/5 text-foreground"
                  : "border-border bg-card text-muted-foreground"
                }`}>
                  <AlertTriangle className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${r.level === "high" ? "text-destructive" : r.level === "medium" ? "text-primary" : "text-muted-foreground"}`} />
                  <span><span className="font-bold uppercase">{r.level}</span> — {r.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Participants */}
          <div>
            <SectionTitle icon={User}>Participants</SectionTitle>
            <div className="grid gap-2 sm:grid-cols-2">
              {[{ label: "From", a: tx.from, info: fromInfo, counters: fromCounters }, { label: "To", a: tx.to, info: toInfo, counters: null }].map((p) => (
                <div key={p.label} className="rounded-lg border border-border bg-card p-3 text-xs">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase text-muted-foreground">{p.label}</span>
                    <span className="flex items-center gap-1 rounded bg-secondary px-1.5 py-0.5 text-[10px] font-semibold text-foreground">
                      {p.a?.is_contract ? <><FileCode className="h-3 w-3" /> Contract</> : "Wallet"}
                    </span>
                  </div>
                  <a href={`${EXPLORER}/address/${p.a?.hash}`} target="_blank" rel="noopener noreferrer" className="font-mono text-primary hover:underline">{short(p.a?.hash)}</a>
                  {p.a?.name && <p className="mt-1 text-muted-foreground">{p.a.name}</p>}
                  <div className="mt-2 space-y-0.5 text-muted-foreground">
                    <p>Balance: <span className="font-mono text-foreground">{fmt(p.info?.coin_balance)} BTC</span></p>
                    {p.counters && <p>Total txs: <span className="font-mono text-foreground">{Number(p.counters.transactions_count ?? 0).toLocaleString()}</span></p>}
                    {p.counters && <p>Token transfers: <span className="font-mono text-foreground">{Number(p.counters.token_transfers_count ?? 0).toLocaleString()}</span></p>}
                    {p.a?.is_contract && <p>Verified: <span className="text-foreground">{p.a?.is_verified ? "Yes" : "No"}</span></p>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Token flow */}
          <div>
            <SectionTitle icon={ArrowRightLeft}>Token flow ({transfers.length} transfer{transfers.length === 1 ? "" : "s"}{tokenSymbols.length ? ` · ${tokenSymbols.join(", ")}` : ""})</SectionTitle>
            {transfers.length === 0 ? (
              <p className="rounded-lg border border-border bg-card p-3 text-xs text-muted-foreground">No token transfers in this transaction.</p>
            ) : (
              <div className="space-y-2">
                {transfers.map((t, i) => (
                  <div key={i} className="rounded-lg border border-border bg-card p-3 text-xs">
                    <span className="font-semibold text-primary">{t.token?.symbol ?? "?"}</span>
                    <span className="text-foreground"> {fmt(t.total?.value, Number(t.total?.decimals ?? 18))}</span>
                    <span className="text-muted-foreground"> · {t.type ?? "transfer"} · </span>
                    <span className="font-mono">{short(t.from?.hash)}</span>
                    <span className="text-muted-foreground"> → </span>
                    <span className="font-mono">{short(t.to?.hash)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {tx.decoded_input && (
            <div>
              <SectionTitle icon={Gauge}>Decoded input</SectionTitle>
              <div className="rounded-lg border border-border bg-card p-3">
                <p className="mb-2 font-mono text-xs text-primary">{tx.decoded_input.method_call}</p>
                {tx.decoded_input.parameters?.map((p: Any, i: number) => (
                  <div key={i} className="mb-1 flex gap-2 text-xs">
                    <span className="text-muted-foreground">{p.name} ({p.type}):</span>
                    <span className="break-all font-mono text-foreground">{typeof p.value === "object" ? JSON.stringify(p.value) : String(p.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
