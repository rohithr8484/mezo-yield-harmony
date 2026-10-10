import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ServiceImage, type ServiceImageKind } from "./ServiceImage";

const services: { title: string; kind: ServiceImageKind; description: string; anchor: string }[] = [
  { title: "AI Text Summarization", kind: "summarization", description: "Turn long articles, documentation and discussions into concise summaries and key points.", anchor: "service-ai-summarize" },
  { title: "On-chain Analytics API", kind: "analytics", description: "Inspect a transaction’s token movements, participants, decoded input and gas usage, with evidence-backed risk signals.", anchor: "service-analytics" },
  { title: "AML Screening API", kind: "aml", description: "Examine observed payment patterns and transaction flows, including exploratory ML structuring analysis—not compliance clearance.", anchor: "service-identity" },
  { title: "Smart Contract Analysis", kind: "contracts", description: "Review uploaded Solidity code with AI-assisted analysis of potential risks and attack vectors.", anchor: "service-run" },
  { title: "Data Feeds / Oracles", kind: "oracles", description: "View MUSD, BTC and cbBTC price feeds and their charts, with free-entry and pay-per-use access.", anchor: "data-feeds" },
  { title: "veMEZO Marketplace", kind: "vemezo", description: "Access vote-escrowed positions, create MEZO locks and manage eligible withdrawals through your connected wallet.", anchor: "venft-marketplace" },
  { title: "Governance", kind: "governance", description: "Browse proposals, follow voting deadlines and view the recorded results for each proposal.", anchor: "governance-analytics" },
];

export default function ServicesOverview() {
  return <section className="border-y border-border bg-secondary/25 py-16 md:py-20" aria-labelledby="services-overview-title">
    <div className="container">
      <header className="mb-10 max-w-2xl">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-accent">Mezo service directory</p>
        <h2 id="services-overview-title" className="font-display text-3xl font-bold text-foreground sm:text-4xl">Services at a glance</h2>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">From document summaries to on-chain observations and protocol participation.</p>
      </header>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {services.map(service => <article key={service.kind} className="flex min-w-0 flex-col overflow-hidden rounded-lg border border-border bg-card">
          <ServiceImage kind={service.kind} alt={`${service.title} illustration`} className="aspect-[2/1] rounded-none" />
          <div className="flex flex-1 flex-col p-6">
            <h3 className="font-display text-lg font-semibold text-foreground">{service.title}</h3>
            <p className="mb-5 mt-3 text-sm leading-relaxed text-muted-foreground">{service.description}</p>
            <Button asChild variant="link" className="mt-auto h-auto justify-start p-0 text-primary"><Link to={`/developer-services#${service.anchor}`}>Open service <ArrowUpRight className="ml-2 h-4 w-4" /></Link></Button>
          </div>
        </article>)}
      </div>
    </div>
  </section>;
}