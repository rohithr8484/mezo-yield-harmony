import { ArrowUpRight, Store } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ServiceImage, type ServiceImageKind } from "./ServiceImage";

const services: { title: string; kind: ServiceImageKind; description: string; anchor: string; charge: string }[] = [
  { title: "AI Text Summarization", kind: "summarization", description: "Turn long articles, documentation and discussions into concise summaries and key points.", anchor: "service-ai-summarize", charge: "0.2 MUSD or 0.2 MEZO per entry · first 4 free" },
  { title: "On Chain Analytics", kind: "analytics", description: "Inspect a transaction’s token movements, participants, decoded input and gas usage, with evidence-backed risk signals.", anchor: "service-analytics", charge: "0.2 MUSD or 0.2 MEZO per entry · first 4 free" },
  { title: "AML Screening", kind: "aml", description: "Examine observed payment patterns and transaction flows, including exploratory ML structuring analysis—not compliance clearance.", anchor: "service-identity", charge: "0.2 MUSD or 0.2 MEZO per entry · first 4 free" },
  { title: "Smart Contract Analysis", kind: "contracts", description: "Review uploaded Solidity code with AI-assisted analysis of potential risks and attack vectors.", anchor: "service-run", charge: "0.2 MUSD or 0.2 MEZO per entry · first 4 free" },
  { title: "Data Feeds / Oracles", kind: "oracles", description: "View live price feeds and their charts, with free-entry and pay-per-use access.", anchor: "data-feeds", charge: "0.2 MUSD or 0.2 MEZO per unlock · or 0.001 test mUSD per call · first 4 free" },
  { title: "veMEZO Marketplace", kind: "vemezo", description: "Access vote-escrowed positions, create MEZO locks and manage eligible withdrawals through your connected wallet.", anchor: "venft-marketplace", charge: "0.2 MUSD or 0.2 MEZO entry · positions priced 0.2 MUSD" },
  { title: "Governance", kind: "governance", description: "Browse proposals, follow voting deadlines and view the recorded results for each proposal.", anchor: "governance-analytics", charge: "0.01 MUSD or 0.01 MEZO per entry · first 4 free" },
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
      <div className="mt-8 flex flex-col gap-5 border-l-2 border-accent bg-card px-6 py-7 shadow-card sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent"><Store className="h-5 w-5" /></div>
          <div>
            <p className="text-xs font-semibold uppercase text-accent">For service sellers</p>
            <h3 className="mt-1 font-display text-xl font-semibold text-foreground">Provide your own service</h3>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">Start with an existing service template, customize it, and publish it under your connected wallet address.</p>
          </div>
        </div>
        <Button asChild className="shrink-0"><Link to="/developer-services#seller-studio">Create a service <ArrowUpRight className="h-4 w-4" /></Link></Button>
      </div>
    </div>
  </section>;
}