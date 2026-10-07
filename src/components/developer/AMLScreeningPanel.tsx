import { ArrowRight, ExternalLink, FileSearch, GitFork, ScanLine, ShieldAlert, type LucideIcon } from "lucide-react";
import { derivePaymentScreening } from "@/lib/amlScreening";
import { formatNumber, formatUnits, shortAddress, type ExplorerTransaction } from "@/lib/onchainAnalytics";

const EXPLORER = "https://explorer.test.mezo.org";

function Heading({ icon: Icon, title, status }: { icon: LucideIcon; title: string; status: string }) {
  return <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h4 className="flex items-center gap-2 text-sm font-semibold text-foreground"><Icon className="h-4 w-4 text-accent" />{title}</h4><span className="rounded-md border border-border bg-muted px-2 py-1 text-[10px] font-medium text-muted-foreground">{status}</span></div>;
}
function Metric({ label, value }: { label: string; value: string | number }) {
  return <div className="min-w-0 border-l-2 border-border pl-3"><dt className="text-[11px] text-muted-foreground">{label}</dt><dd className="mt-1 break-words font-mono text-sm font-semibold text-foreground">{value}</dd></div>;
}
function Address({ address, selected }: { address: string; selected: boolean }) {
  return <a href={`${EXPLORER}/address/${address}`} target="_blank" rel="noopener noreferrer" title={address} className={`min-w-0 break-all font-mono text-[11px] hover:underline ${selected ? "font-semibold text-accent" : "text-primary"}`}>{shortAddress(address)}{selected && <span className="mt-1 block font-sans text-[10px] font-normal text-muted-foreground">Selected wallet</span>}</a>;
}

export function AMLScreeningPanel({ address, transactions }: { address?: string; transactions?: ExplorerTransaction[] }) {
  const observation = address && transactions ? derivePaymentScreening(address, transactions) : null;
  return <div className="min-w-0 divide-y divide-border border-y border-border">
    <section aria-label="Sanctions Checks" className="py-5">
      <Heading icon={ShieldAlert} title="Sanctions Checks" status="Not screened" />
      <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4"><Metric label="Target watchlist coverage" value="6 global watchlists" /><Metric label="Connected watchlists" value="0" /><Metric label="Sanctions matches" value="Unavailable" /><Metric label="Last screening" value="Not run" /></dl>
      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">Real-time screening against six global watchlists requires a connected sanctions provider. No list checks have been performed; this is not sanctions clearance.</p>
    </section>
    <section aria-label="Payment Screening" className="py-5">
      <Heading icon={ScanLine} title="Payment Screening" status={observation ? "On-chain observations only" : "Awaiting wallet lookup"} />
      <p className="mb-4 text-xs leading-relaxed text-muted-foreground">Laundering typologies and FATF red-flag indicators: not assessed. Loaded transaction behavior below is observational, not a validated AML rules-engine result.</p>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-4">
        <Metric label="Transactions sampled" value={observation?.sampled ?? "—"} />
        <Metric label="Unique counterparties" value={observation?.counterparties ?? "—"} />
        <Metric label="Successful out / in" value={observation ? `${observation.outgoing} / ${observation.incoming}` : "—"} />
        <Metric label="Failed / pending" value={observation ? `${observation.failed} / ${observation.pending}` : "—"} />
        <Metric label="Native BTC sent" value={observation ? formatNumber(observation.nativeOut) : "—"} />
        <Metric label="Native BTC received" value={observation ? formatNumber(observation.nativeIn) : "—"} />
        <Metric label="Two-way activity" value={observation ? observation.bidirectional ? "Observed" : "Not observed" : "—"} />
        <Metric label="AML determination" value="Not assessed" />
      </dl>
      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">Only the explorer’s loaded recent page is included. Two-way transfers, high activity and failed transactions alone do not prove laundering or a FATF red flag.</p>
    </section>
    <section aria-label="Adverse Media Screening" className="py-5">
      <Heading icon={FileSearch} title="Adverse Media Screening" status="Not screened" />
      <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4"><Metric label="Target source coverage" value="40,000+ sources" /><Metric label="Connected sources" value="0" /><Metric label="Media matches" value="Unavailable" /><Metric label="NLP scan status" value="Not run" /></dl>
      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">An NLP-based scan across news, regulatory and enforcement sources requires a connected media provider and a resolved person or entity. A wallet address alone does not establish identity; no media scan has been performed.</p>
    </section>
    <section aria-label="AML Transaction Flow Graph" className="py-5">
      <Heading icon={GitFork} title="AML Transaction Flow Graph" status="One-hop native BTC movements" />
      <p className="mb-4 text-xs text-muted-foreground">Successful native-value transactions only · No token-event, internal-transfer or multi-hop tracing · Loaded recent records</p>
      {observation && address ? <>
        <dl className="mb-5 grid grid-cols-2 gap-4"><Metric label="Observed flow edges" value={observation.flows.length} /><Metric label="Visible edges" value={Math.min(12, observation.flows.length)} /></dl>
        <div className="max-h-96 overflow-y-auto divide-y divide-border">{observation.flows.slice(0, 12).map(flow => <div key={flow.hash} className="min-w-0 py-4">
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] items-center gap-2">
            <Address address={flow.from} selected={flow.from.toLowerCase() === address.toLowerCase()} />
            <div className="min-w-0 text-center"><p className="break-words font-mono text-[11px] text-foreground">{formatUnits(flow.value)} BTC</p><div className="mt-1 flex items-center text-accent"><span className="h-px flex-1 bg-border" /><ArrowRight className="h-4 w-4 shrink-0" /></div></div>
            <Address address={flow.to} selected={flow.to.toLowerCase() === address.toLowerCase()} />
          </div>
          <a href={`${EXPLORER}/tx/${flow.hash}`} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-[10px] text-primary hover:underline">{shortAddress(flow.hash)}<ExternalLink className="h-3 w-3" /></a>
        </div>)}</div>
        {observation.flows.length === 0 && <p className="py-3 text-xs text-muted-foreground">No successful native BTC transfers with both endpoints in the loaded records. Token and internal movements are not included.</p>}
      </> : <p className="py-3 text-xs text-muted-foreground">No wallet records loaded.</p>}
    </section>
  </div>;
}