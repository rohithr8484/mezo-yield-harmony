import { ArrowRight, ArrowUpRight, CircleHelp, ExternalLink, FileSearch, Globe2, ScanLine, ShieldAlert, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { assessAMLBehavior, assessStructuringRisk, deriveAMLPayments } from "@/lib/amlScreening";
import type { AMLResult } from "@/lib/amlExplorer";
import { formatNumber, shortAddress } from "@/lib/onchainAnalytics";

const EXPLORER = "https://explorer.test.mezo.org";
const watchlists = [
  ["OFAC SDN (US Treasury)", "United States"], ["OFAC Crypto Addresses", "United States"],
  ["EU Consolidated List", "European Union"], ["UK HMT Financial Sanctions", "United Kingdom"],
  ["UN Security Council 1267", "United Nations"], ["Chainalysis Sanctions Oracle", "On-chain oracle"],
];
const mediaCategories = ["Money Laundering", "Terrorist Financing", "Fraud / Ponzi Scheme", "Bribery & Corruption", "Cybercrime / Ransomware", "Tax Evasion", "Regulatory Action"];

function Section({ index, icon: Icon, title, subtitle, status, children, hidden = false }: { index: string; icon: LucideIcon; title: string; subtitle: string; status: string; children: ReactNode; hidden?: boolean }) {
  if (hidden) return null;
  return <section aria-label={title} className="min-w-0 border-b border-border py-6 last:border-b-0">
    <header className="mb-5 flex flex-wrap items-start justify-between gap-4 border-b border-border bg-secondary/25 p-4 sm:p-5">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-accent/20 bg-accent/10 text-accent"><Icon className="h-5 w-5" /></div>
        <div className="min-w-0"><p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Check {index}</p><h4 className="text-base font-semibold text-foreground sm:text-lg">{title}</h4><p className="mt-2 text-xs leading-relaxed text-muted-foreground">{subtitle}</p></div>
      </div>
      <span className="max-w-full rounded-md border border-border bg-background px-3 py-1.5 text-[10px] font-semibold uppercase text-muted-foreground">{status}</span>
    </header>
    <div className="min-w-0 space-y-4 px-1 sm:px-4">{children}</div>
  </section>;
}
function Metric({ label, value, detail }: { label: string; value: string | number; detail?: string }) {
  return <div className="min-w-0 rounded-lg border border-border bg-secondary/20 p-4"><dt className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</dt><dd className="mt-2 break-words font-mono text-xl font-semibold text-foreground">{value}</dd>{detail && <p className="mt-1 break-words text-[10px] text-muted-foreground">{detail}</p>}</div>;
}
function AddressLink({ address }: { address: string }) {
  return <a href={`${EXPLORER}/address/${address}`} target="_blank" rel="noopener noreferrer" title={address} className="inline-flex min-w-0 items-center gap-1 font-mono text-xs text-primary hover:underline">{shortAddress(address)}<ArrowUpRight className="h-3 w-3 shrink-0" /></a>;
}

export function AMLScreeningPanel({ result }: { result: AMLResult }) {
  const observation = deriveAMLPayments(result.address, result.transactions, result.transfers);
  const behaviors = assessAMLBehavior(observation, result.address);
  const structuring = assessStructuringRisk(observation, result.address);
  const selected = result.scope === "transaction" ? result.transactions[0] : undefined;
  const dominant = observation.assets.length === 1 ? observation.assets[0] : undefined;
  const total = dominant ? dominant.known ? formatNumber(dominant.total) : "Unknown" : observation.assets.length > 1 ? "Per asset" : "No movements";
  const average = dominant?.known ? formatNumber(dominant.total / dominant.count) : "—";
  return <div aria-live="polite" className="min-w-0">
    <div className="border-l-2 border-accent bg-accent/5 p-4">
      <h3 className="text-base font-semibold">AML Screening Results</h3>
      <p className="mt-1 text-xs text-muted-foreground">Mezo Testnet · {result.scope === "transaction" ? "Selected transaction only" : "Loaded wallet activity"} · {observation.transactionCount} transaction record(s)</p>
      <div className="mt-2"><AddressLink address={result.address} /></div>
      {selected && <a href={`${EXPLORER}/tx/${selected.hash}`} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 font-mono text-xs text-primary hover:underline">{shortAddress(selected.hash)}<ExternalLink className="h-3 w-3" /></a>}
    </div>
    {(!result.complete || !result.nativeLoaded || !result.tokensLoaded) && <p role="status" className="mt-3 text-xs leading-relaxed text-muted-foreground">Partial observation: {result.scope === "wallet" ? "recent explorer pages only; not the complete wallet history. " : "some transfer records may be missing. "}{!result.nativeLoaded && "Native transaction records could not be loaded. "}{!result.tokensLoaded && "Token transfer records could not be loaded."}</p>}
    <Section hidden index="01" icon={ShieldAlert} title="Sanctions Checks" status="Not screened" subtitle="Requested coverage: 6 global watchlists · provider not connected">
      <div className="grid gap-3 md:grid-cols-2">{watchlists.map(([name, region]) => <div key={name} className="rounded-lg border border-border bg-secondary/15 p-4"><div className="flex items-start justify-between gap-2"><h5 className="flex items-start gap-2 text-sm font-semibold"><CircleHelp className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />{name}</h5><span className="shrink-0 text-[10px] text-muted-foreground">Not screened</span></div><p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground"><Globe2 className="h-3 w-3" />{region}</p><p className="mt-2 text-xs text-muted-foreground">No list lookup performed; matches are unknown.</p></div>)}</div>
      <p className="text-xs leading-relaxed text-muted-foreground">No sanctions clearance, PEP check or darknet-exposure check has been performed. Public transaction records cannot establish these results.</p>
    </Section>
    <Section index="02" icon={ScanLine} title="Payment Screening" status="Observed activity" subtitle="Transaction behavior observations · FATF typologies are not validated compliance determinations">
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4"><Metric label="Total value" value={total} detail={dominant?.symbol ?? "Assets are never combined"} /><Metric label="Avg / transfer" value={average} detail={dominant?.symbol ?? "See per-asset totals below"} /><Metric label="Velocity" value={observation.hourlyRate === null ? "0.00 / h · limited sample" : `${formatNumber(observation.hourlyRate, 2)} / h`} detail="Successful native transaction records" /><Metric label="Structuring risk" value={structuring.status} detail="ML-assisted · observed patterns only" /></dl>
      <div className="space-y-2 text-xs"><p className="leading-relaxed text-foreground">{structuring.evidence}</p><p className="leading-relaxed text-muted-foreground">{structuring.limits}</p>{structuring.hashes.length > 0 && <div className="flex flex-wrap gap-3">{structuring.hashes.map(hash => <a key={hash} href={`${EXPLORER}/tx/${hash}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-mono text-primary hover:underline">{shortAddress(hash)}<ExternalLink className="h-3 w-3" /></a>)}</div>}</div>
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4"><Metric label="Payment legs" value={observation.flows.length} /><Metric label="Token events" value={observation.tokenCount} /><Metric label="Flow counterparties" value={observation.flowCounterparties} /><Metric label="Failed transactions" value={result.nativeLoaded ? observation.failed : "Unknown"} /></dl>
      {observation.assets.length > 0 && <div className="divide-y divide-border">{observation.assets.map(asset => <div key={asset.asset} className="flex flex-wrap justify-between gap-2 py-3 text-xs"><span className="font-semibold">{asset.symbol} <span className="font-normal text-muted-foreground">· {asset.count} payment leg(s)</span></span><span className="font-mono">{asset.known ? formatNumber(asset.total) : "Unknown amount"} {asset.symbol} total · avg {asset.known ? formatNumber(asset.total / asset.count) : "—"}</span></div>)}</div>}
      <div className="space-y-2">{behaviors.map(item => <div key={item.name} className="rounded-md bg-secondary/30 px-3 py-3 text-xs"><div className="flex flex-wrap items-start justify-between gap-2"><span className="flex min-w-0 flex-1 items-start gap-2"><CircleHelp className="h-4 w-4 shrink-0 text-muted-foreground" />{item.name}</span><span className={item.status === "Pattern observed" ? "font-medium text-bitcoin" : "font-medium text-muted-foreground"}>{item.status}</span></div><p className="mt-2 leading-relaxed text-muted-foreground">{item.evidence}</p></div>)}</div>
      <p className="text-xs leading-relaxed text-muted-foreground">Sample-based pattern checks only · separate assets · distinct transactions · 60-minute observation window. Missing timestamps or unloaded records limit detection; no matching pattern is not a clean AML result.</p>
      <p className="text-xs leading-relaxed text-muted-foreground">Amounts count observed payment legs, not net wealth or traced funds. Native BTC movements and token transfer events are separate assets. Activity frequency or transfers alone do not prove laundering.</p>
      <div><h5 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Top payment legs · loaded records</h5>{observation.flows.slice(0, 6).map(flow => <div key={flow.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-border py-3 text-xs"><div className="flex items-center gap-2"><AddressLink address={flow.from} /><ArrowRight className="h-3 w-3 text-muted-foreground" /><AddressLink address={flow.to} /></div><span className="font-mono">{formatNumber(flow.amount)} {flow.symbol}</span></div>)}{observation.flows.length === 0 && <p className="text-xs text-muted-foreground">No supported payment legs in the loaded records; this is not an AML clearance.</p>}</div>
    </Section>
    <Section hidden index="03" icon={FileSearch} title="Adverse Media Screening" status="Not screened" subtitle="Requested coverage: NLP scan across 40,000+ news, regulatory and enforcement sources">
      <div className="space-y-2">{mediaCategories.map(category => <div key={category} className="flex items-start justify-between gap-3 rounded-lg border border-border bg-secondary/15 p-4"><div className="min-w-0"><h5 className="flex items-start gap-2 text-sm font-semibold"><CircleHelp className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />{category}</h5><p className="mt-2 text-xs text-muted-foreground">No source search performed; mentions are unknown.</p></div><span className="shrink-0 text-[10px] text-muted-foreground">Not screened</span></div>)}</div>
      <p className="text-xs leading-relaxed text-muted-foreground">No media provider is connected. A wallet address alone does not resolve a person or entity; there is no verified source coverage or NLP result.</p>
    </Section>
  </div>;
}
