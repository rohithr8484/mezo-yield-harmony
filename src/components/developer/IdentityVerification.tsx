import { useState } from "react";
import { Search, ExternalLink, Loader2, XCircle, CheckCircle2, Circle, ShieldCheck, Coins, History, FileCode, Droplets, Landmark, Wallet, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AMLScreeningPanel } from "./AMLScreeningPanel";
import { type ExplorerTransaction } from "@/lib/onchainAnalytics";

const API = "https://api.explorer.test.mezo.org/api/v2";
const EXPLORER = "https://explorer.test.mezo.org";
const MUSD = "0x94ff830f078eb9c6e77bade29fb46b1a249a5fd3";
const MEZO = "0x7b7c000000000000000000000000000000000001";

type Any = Record<string, any>;

const getJson = async (url: string) => {
  try {
    const r = await fetch(url);
    return r.ok ? await r.json() : null;
  } catch {
    return null;
  }
};
const fmt = (val?: string | number | null, decimals = 18) => {
  if (val === undefined || val === null) return "0";
  const n = Number(val) / Math.pow(10, decimals);
  return n === 0 ? "0" : n < 0.0001 ? n.toExponential(3) : n.toLocaleString(undefined, { maximumFractionDigits: 4 });
};
const short = (a?: string) => (a ? `${a.slice(0, 8)}…${a.slice(-6)}` : "—");

const LENDING_METHODS = ["borrow", "repay", "supply", "deposit", "withdraw", "liquidat", "collateral", "opentrove", "closetrove", "adjusttrove", "redeem"];
const LIQUIDITY_METHODS = ["addliquidity", "removeliquidity", "swap", "mint", "burn", "stake", "unstake"];

interface Result {
  address: string;
  info: Any | null;
  counters: Any | null;
  tokens: Any[];
  txs: ExplorerTransaction[];
  sourceTx?: Any | null;
}

const SectionTitle = ({ icon: Icon, children }: { icon: any; children: React.ReactNode }) => (
  <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground"><Icon className="h-3.5 w-3.5" /> {children}</p>
);

export const IdentityVerification = () => {
  const [input, setInput] = useState("");
  const [res, setRes] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const verify = async () => {
    const v = input.trim();
    if (!v) return;
    setLoading(true);
    setError("");
    setRes(null);
    let address = v;
    let sourceTx: Any | null = null;
    if (/^0x[0-9a-fA-F]{64}$/.test(v)) {
      sourceTx = await getJson(`${API}/transactions/${v}`);
      if (!sourceTx?.from?.hash) {
        setError("Transaction not found or API unavailable.");
        setLoading(false);
        return;
      }
      address = sourceTx.from.hash;
    } else if (!/^0x[0-9a-fA-F]{40}$/.test(v)) {
      setError("Enter a wallet address (0x… 40 hex) or a transaction hash.");
      setLoading(false);
      return;
    }
    const [info, counters, tokens, txs] = await Promise.all([
      getJson(`${API}/addresses/${address}`),
      getJson(`${API}/addresses/${address}/counters`),
      getJson(`${API}/addresses/${address}/token-balances`),
      getJson(`${API}/addresses/${address}/transactions`),
    ]);
    if (!info && !counters) {
      setError("Address not found or API unavailable.");
      setLoading(false);
      return;
    }
    setRes({ address, info, counters, tokens: Array.isArray(tokens) ? tokens : [], txs: txs?.items ?? [], sourceTx });
    setLoading(false);
  };

  const txCount = Number(res?.counters?.transactions_count ?? 0);
  const transferCount = Number(res?.counters?.token_transfers_count ?? 0);
  const balance = Number(res?.info?.coin_balance ?? 0);
  const tokenOf = (addr: string) => res?.tokens.find((t) => t.token?.address?.toLowerCase() === addr || t.token?.address_hash?.toLowerCase() === addr);
  const musd = res ? tokenOf(MUSD) : null;
  const mezo = res ? tokenOf(MEZO) : null;
  const isContract = !!res?.info?.is_contract;
  const times = (res?.txs ?? []).map((t) => t.timestamp).filter(Boolean).map((t: string) => new Date(t).getTime());
  const lastSeen = times.length ? new Date(Math.max(...times)) : null;
  const oldestSeen = times.length ? new Date(Math.min(...times)) : null;
  const outgoing = (res?.txs ?? []).filter((t) => t.from?.hash?.toLowerCase() === res?.address.toLowerCase()).length;
  const failed = (res?.txs ?? []).filter((t) => t.status === "error").length;
  const counterparties = new Set((res?.txs ?? []).flatMap((t) => [t.from?.hash, t.to?.hash]).filter((a) => a && a.toLowerCase() !== res?.address.toLowerCase()));

  const checks = res
    ? [
        { label: "Address exists on Mezo Testnet", ok: !!res.info },
        { label: "Externally owned wallet (not a contract)", ok: !isContract },
        { label: "Has transaction history", ok: txCount > 0 },
        { label: "Has signed outgoing transactions", ok: outgoing > 0 || !!res.sourceTx },
        { label: "Holds native BTC for gas", ok: balance > 0 },
        { label: "Holds MUSD", ok: !!musd && Number(musd.value) > 0 },
        { label: "Holds MEZO", ok: !!mezo && Number(mezo.value) > 0 },
        { label: "Interacted with 3+ counterparties", ok: counterparties.size >= 3 },
        { label: "Public name / ENS tag", ok: !!(res.info?.name || res.info?.ens_domain_name) },
      ]
    : [];
  const passed = checks.filter((c) => c.ok).length;
  const score = checks.length ? Math.round((passed / checks.length) * 100) : 0;
  const tier = "Wallet activity checks";

  // ---- Wallet behavior: large-holder movements & activity change ----
  const txs = res?.txs ?? [];
  const btcValue = (t: Any) => Number(t.value ?? 0) / 1e18;
  const largestTx = txs.length ? txs.reduce((a, b) => (btcValue(a) >= btcValue(b) ? a : b)) : null;
  const largeMovements = txs.filter((t) => btcValue(t) >= 0.01);
  const now = Date.now();
  const recent7d = txs.filter((t) => t.timestamp && now - new Date(t.timestamp).getTime() < 7 * 864e5).length;
  const prev7d = txs.filter((t) => {
    const d = t.timestamp ? now - new Date(t.timestamp).getTime() : 0;
    return d >= 7 * 864e5 && d < 14 * 864e5;
  }).length;
  const activityTrend = recent7d > prev7d ? "up" : recent7d < prev7d ? "down" : "flat";
  const musdBal = musd ? Number(musd.value) / 1e18 : 0;
  const mezoBal = mezo ? Number(mezo.value) / 1e18 : 0;
  const isLargeHolder = balance / 1e18 >= 0.05 || musdBal >= 500 || mezoBal >= 500;

  // ---- Liquidity & lending signals from recent methods ----
  const methods = txs.map((t) => (t.method || "").toString().toLowerCase()).filter(Boolean);
  const lendingActions = methods.filter((m) => LENDING_METHODS.some((l) => m.includes(l)));
  const liquidityActions = methods.filter((m) => LIQUIDITY_METHODS.some((l) => m.includes(l)));
  const liquidationHits = methods.filter((m) => m.includes("liquidat")).length;

  // ---- Risk signals ----
  const risks: { level: "high" | "medium" | "low"; text: string }[] = [];
  if (res) {
    if (isContract && !res.info?.is_verified) risks.push({ level: "high", text: "Unverified contract — source code cannot be audited on the explorer." });
    if (liquidationHits > 0) risks.push({ level: "medium", text: `${liquidationHits} liquidation-related method name${liquidationHits === 1 ? "" : "s"} in loaded history; protocol events are needed to confirm liquidation.` });
    if (failed > 2) risks.push({ level: "medium", text: `${failed} failed transactions in loaded history; this alone does not establish suspicious activity.` });
    if (isLargeHolder && largeMovements.length > 0) risks.push({ level: "low", text: `${largeMovements.length} native movements at or above 0.01 BTC in loaded history; movement size alone is not an AML red flag.` });
    if (txCount === 0) risks.push({ level: "low", text: "No transaction history reported; identity and AML status remain unassessed." });
    if (activityTrend === "down" && txCount > 0) risks.push({ level: "low", text: "Activity is declining week-over-week — wallet may be going dormant." });
    if (!risks.length) risks.push({ level: "low", text: "No wallet heuristics triggered in loaded records. This is not AML clearance." });
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Wallet address or transaction hash (0x...)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="border-border bg-secondary/60 font-mono text-xs"
          onKeyDown={(e) => e.key === "Enter" && verify()}
        />
        <Button
          onClick={verify}
          disabled={loading || !input.trim()}
          className="flex shrink-0 items-center gap-2 rounded-lg bg-gradient-to-r from-primary to-accent px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          Screen
        </Button>
      </div>

      <AMLScreeningPanel address={res?.address} transactions={res?.txs} />

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          <XCircle className="h-4 w-4" /> {error}
        </div>
      )}

      {res && (
        <div className="space-y-4 rounded-xl border border-border bg-secondary/40 p-4 animate-in fade-in duration-300">
          {/* Identity header */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase text-muted-foreground">Wallet activity profile</p>
              <a href={`${EXPLORER}/address/${res.address}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 break-all font-mono text-xs text-primary hover:underline">
                {res.address} <ExternalLink className="h-3 w-3 shrink-0" />
              </a>
              {(res.info?.name || res.info?.ens_domain_name) && <p className="mt-1 text-xs text-foreground">{res.info?.ens_domain_name || res.info?.name}</p>}
              {res.sourceTx && <p className="mt-1 text-[11px] text-muted-foreground">Resolved from sender of tx {short(res.sourceTx.hash)}</p>}
            </div>
            <div className="text-right">
              <p className={`flex items-center justify-end gap-1 text-sm font-bold ${score >= 75 ? "text-accent" : score >= 45 ? "text-primary" : "text-muted-foreground"}`}>
                <ShieldCheck className="h-4 w-4" /> {tier}
              </p>
              <p className="font-mono text-xs text-muted-foreground">Activity coverage {score}% · {passed}/{checks.length} checks</p>
            </div>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-secondary">
            <div className="h-full rounded-full bg-gradient-to-r from-primary to-accent" style={{ width: `${score}%` }} />
          </div>

          {/* Attestation checks */}
          <div>
            <SectionTitle icon={ShieldCheck}>Observed wallet checks · not identity verification</SectionTitle>
            <div className="grid gap-1.5 sm:grid-cols-2">
              {checks.map((c) => (
                <div key={c.label} className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs">
                  {c.ok ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-accent" /> : <Circle className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
                  <span className={c.ok ? "text-foreground" : "text-muted-foreground"}>{c.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Profile */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            {[
              ["Account type", isContract ? (res.info?.is_verified ? "Verified contract" : "Contract") : "Wallet (EOA)"],
              ["BTC balance", `${fmt(res.info?.coin_balance)} BTC`],
              ["Total transactions", txCount.toLocaleString()],
              ["Token transfers", transferCount.toLocaleString()],
              ["Gas used (lifetime)", Number(res.counters?.gas_usage_count ?? 0).toLocaleString()],
              ["Unique counterparties (recent)", counterparties.size.toString()],
              ["Last activity", lastSeen ? lastSeen.toLocaleString() : "—"],
              ["Oldest recent activity", oldestSeen ? oldestSeen.toLocaleDateString() : "—"],
            ].map(([k, v]) => (
              <div key={k} className="rounded-lg border border-border bg-card p-3">
                <p className="mb-1 text-[10px] font-bold uppercase text-muted-foreground">{k}</p>
                <p className="font-mono text-foreground">{v}</p>
              </div>
            ))}
          </div>

          {/* Liquidity */}
          <div>
            <SectionTitle icon={Droplets}>Liquidity exposure</SectionTitle>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                ["MUSD balance", `${musdBal.toLocaleString(undefined, { maximumFractionDigits: 4 })} MUSD`],
                ["MEZO balance", `${mezoBal.toLocaleString(undefined, { maximumFractionDigits: 4 })} MEZO`],
                ["Pool / swap actions (recent)", liquidityActions.length ? `${liquidityActions.length} detected` : "None detected"],
                ["Holder class", isLargeHolder ? "Large holder" : "Standard holder"],
              ].map(([k, v]) => (
                <div key={k} className="rounded-lg border border-border bg-card p-3">
                  <p className="mb-1 text-[10px] font-bold uppercase text-muted-foreground">{k}</p>
                  <p className="font-mono text-foreground">{v}</p>
                </div>
              ))}
            </div>
            <p className="mt-2 rounded-lg border border-border bg-card p-3 text-[11px] text-muted-foreground">
              {liquidityActions.length
                ? `Recent history includes ${liquidityActions.length} liquidity action${liquidityActions.length === 1 ? "" : "s"} (swap / add / remove / stake), so this wallet actively provides or moves liquidity.`
                : "No swap, add-liquidity, or staking methods in recent history — this wallet does not appear to provide liquidity."}
            </p>
          </div>

          {/* Lending */}
          <div>
            <SectionTitle icon={Landmark}>Lending & collateral</SectionTitle>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                ["Lending actions (recent)", lendingActions.length ? `${lendingActions.length} detected` : "None detected"],
                ["Liquidations (recent)", liquidationHits ? `${liquidationHits} event${liquidationHits === 1 ? "" : "s"}` : "None"],
                ["Borrowing demand signal", lendingActions.some((m) => m.includes("borrow") || m.includes("opentrove")) ? "Active borrower" : "No borrowing detected"],
                ["Collateral base", balance > 0 ? `${fmt(res.info?.coin_balance)} BTC held` : "No BTC collateral held"],
              ].map(([k, v]) => (
                <div key={k} className="rounded-lg border border-border bg-card p-3">
                  <p className="mb-1 text-[10px] font-bold uppercase text-muted-foreground">{k}</p>
                  <p className="font-mono text-foreground">{v}</p>
                </div>
              ))}
            </div>
            <p className="mt-2 rounded-lg border border-border bg-card p-3 text-[11px] text-muted-foreground">
              {lendingActions.length
                ? `Methods like "${lendingActions[0]}" indicate this wallet borrows, repays, or manages collateral. On Mezo, MUSD borrowing is backed by BTC collateral — utilization and liquidation risk scale with the size of the position.`
                : "No borrow / repay / trove methods in recent history — no visible lending positions from this wallet."}
            </p>
          </div>

          {/* Wallet behavior */}
          <div>
            <SectionTitle icon={Wallet}>Wallet behavior</SectionTitle>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-lg border border-border bg-card p-3">
                <p className="mb-1 text-[10px] font-bold uppercase text-muted-foreground">Activity trend (7d vs prior 7d)</p>
                <p className="flex items-center gap-1 font-mono text-foreground">
                  {activityTrend === "up" ? <TrendingUp className="h-3.5 w-3.5 text-accent" /> : activityTrend === "down" ? <TrendingDown className="h-3.5 w-3.5 text-destructive" /> : null}
                  {recent7d} vs {prev7d} txs · {activityTrend}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-card p-3">
                <p className="mb-1 text-[10px] font-bold uppercase text-muted-foreground">Large movements (≥0.01 BTC)</p>
                <p className="font-mono text-foreground">{largeMovements.length} in recent history</p>
              </div>
              <div className="rounded-lg border border-border bg-card p-3">
                <p className="mb-1 text-[10px] font-bold uppercase text-muted-foreground">Out / in ratio (recent)</p>
                <p className="font-mono text-foreground">{outgoing} out / {txs.length - outgoing} in</p>
              </div>
              <div className="rounded-lg border border-border bg-card p-3">
                <p className="mb-1 text-[10px] font-bold uppercase text-muted-foreground">Failed txs (recent)</p>
                <p className="font-mono text-foreground">{failed}</p>
              </div>
            </div>
            {largestTx && btcValue(largestTx) > 0 && (
              <p className="mt-2 rounded-lg border border-border bg-card p-3 text-[11px] text-muted-foreground">
                Largest recent movement: <span className="font-mono text-foreground">{btcValue(largestTx).toLocaleString(undefined, { maximumFractionDigits: 6 })} BTC</span>{" "}
                in tx <a href={`${EXPLORER}/tx/${largestTx.hash}`} target="_blank" rel="noopener noreferrer" className="font-mono text-primary hover:underline">{short(largestTx.hash)}</a>.
                {isLargeHolder ? " This wallet's movements are large enough to signal accumulation or distribution — worth monitoring." : ""}
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

          {/* Token holdings */}
          <div>
            <SectionTitle icon={Coins}>Token holdings ({res.tokens.length})</SectionTitle>
            {res.tokens.length === 0 ? (
              <p className="rounded-lg border border-border bg-card p-3 text-xs text-muted-foreground">No token balances.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {res.tokens.slice(0, 10).map((t, i) => (
                  <span key={i} className="rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs">
                    <span className="font-semibold text-primary">{t.token?.symbol ?? "?"}</span>{" "}
                    <span className="font-mono text-foreground">{fmt(t.value, Number(t.token?.decimals ?? 18))}</span>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Verification records */}
          <div>
            <SectionTitle icon={History}>Recent transaction records (latest {Math.min(5, res.txs.length)}{failed ? ` · ${failed} failed` : ""})</SectionTitle>
            {res.txs.length === 0 ? (
              <p className="rounded-lg border border-border bg-card p-3 text-xs text-muted-foreground">No transaction records found.</p>
            ) : (
              <div className="space-y-1.5">
                {res.txs.slice(0, 5).map((t) => {
                  const out = t.from?.hash?.toLowerCase() === res.address.toLowerCase();
                  return (
                    <a key={t.hash} href={`${EXPLORER}/tx/${t.hash}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs hover:border-primary/40">
                      <span className="flex min-w-0 items-center gap-2">
                        {t.status === "ok" ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-accent" /> : <XCircle className="h-3.5 w-3.5 shrink-0 text-destructive" />}
                        <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-bold">{out ? "OUT" : "IN"}</span>
                        <span className="truncate font-mono text-foreground">{t.method || (t.to?.is_contract ? "Contract call" : "Transfer")}</span>
                        {t.to?.is_contract && <FileCode className="h-3 w-3 shrink-0 text-muted-foreground" />}
                      </span>
                      <span className="shrink-0 text-muted-foreground">{t.timestamp ? new Date(t.timestamp).toLocaleDateString() : ""}</span>
                    </a>
                  );
                })}
              </div>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground">Wallet observations use public Mezo Testnet explorer data. Sanctions, adverse media and FATF screening have not been performed.</p>
        </div>
      )}
    </div>
  );
};
