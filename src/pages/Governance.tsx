import PageLayout from "@/components/PageLayout";
import { Vote, Users, BarChart3, Shield, Scale, FileText, Globe, CheckCircle2 } from "lucide-react";

const proposals = [
  { id: "MIP-042", title: "Increase BTC collateral ratio to 150%", status: "Active", votes: "89.2K MEZO", endsIn: "3 days" },
  { id: "MIP-041", title: "Add wstETH as collateral asset", status: "Passed", votes: "142K MEZO", endsIn: "Ended" },
  { id: "MIP-040", title: "Treasury allocation for Q2 grants", status: "Passed", votes: "98.5K MEZO", endsIn: "Ended" },
  { id: "MIP-039", title: "Reduce protocol fees by 0.05%", status: "Active", votes: "67.1K MEZO", endsIn: "5 days" },
];

const pillars = [
  { icon: Vote, title: "On-chain Voting", description: "Every MEZO holder can vote on protocol proposals. One token, one vote — fully transparent and verifiable on-chain." },
  { icon: Users, title: "Community Driven", description: "No central authority. The community decides on upgrades, fee structures, treasury allocation, and strategic direction." },
  { icon: BarChart3, title: "Treasury Management", description: "A community-governed treasury funds development, audits, grants, and ecosystem growth initiatives." },
  { icon: Scale, title: "Proposal Framework", description: "Structured MIP (Mezo Improvement Proposal) system ensures thorough discussion and review before voting." },
  { icon: Shield, title: "Timelock Security", description: "All passed proposals go through a 48-hour timelock, giving the community time to review before execution." },
  { icon: Globe, title: "Global Participation", description: "Governance is borderless. Anyone holding MEZO tokens can participate regardless of location." },
];

const Governance = () => {
  return (
    <PageLayout>
      {/* Hero */}
      <section className="py-20 md:py-28">
        <div className="container text-center">
          <span className="inline-block px-4 py-1.5 rounded-full border border-border bg-card text-sm font-medium text-muted-foreground mb-6">
            Decentralized Governance
          </span>
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-display font-bold leading-tight">
            <span className="text-gradient italic">Shape</span>{" "}
            <span className="text-foreground">the Future</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            Mezo is governed by its community. MEZO token holders propose, discuss, and vote on every protocol decision.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <a href="#" className="px-8 py-3.5 rounded-full bg-foreground text-background text-sm font-semibold hover:opacity-90 transition-opacity">
              View Proposals
            </a>
            <a href="#" className="px-8 py-3.5 rounded-full border border-border text-foreground text-sm font-semibold hover:bg-secondary transition-colors">
              Delegate Votes
            </a>
          </div>
        </div>
      </section>

      {/* Governance Pillars */}
      <section className="py-20 bg-secondary/50">
        <div className="container">
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-center text-foreground mb-4">
            Governance Pillars
          </h2>
          <p className="text-center text-muted-foreground text-lg max-w-2xl mx-auto mb-16">
            A robust framework ensuring transparent, fair, and effective decentralized governance.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {pillars.map((item) => (
              <div key={item.title} className="rounded-2xl bg-card border border-border p-8 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1">
                <div className="h-12 w-12 rounded-xl bg-bitcoin/10 flex items-center justify-center mb-6">
                  <item.icon className="h-6 w-6 text-bitcoin" />
                </div>
                <h3 className="text-xl font-display font-semibold text-foreground mb-3">{item.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Active Proposals */}
      <section className="py-20">
        <div className="container">
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-center text-foreground mb-4">
            Recent Proposals
          </h2>
          <p className="text-center text-muted-foreground text-lg max-w-2xl mx-auto mb-12">
            Review and vote on active governance proposals.
          </p>
          <div className="max-w-3xl mx-auto space-y-4">
            {proposals.map((p) => (
              <div key={p.id} className="rounded-2xl bg-card border border-border p-6 shadow-card flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-muted-foreground">{p.id}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${p.status === "Active" ? "bg-bitcoin/10 text-bitcoin" : "bg-secondary text-muted-foreground"}`}>
                      {p.status}
                    </span>
                  </div>
                  <h3 className="text-foreground font-semibold">{p.title}</h3>
                </div>
                <div className="text-right text-sm text-muted-foreground">
                  <div className="font-medium text-foreground">{p.votes}</div>
                  <div>{p.endsIn}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 bg-secondary/50">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: "Total Proposals", value: "42" },
              { label: "Voter Participation", value: "78%" },
              { label: "MEZO Staked for Gov", value: "24M" },
              { label: "Avg. Voting Period", value: "7 days" },
            ].map((s) => (
              <div key={s.label} className="text-center rounded-2xl bg-card border border-border p-8 shadow-card">
                <div className="text-3xl sm:text-4xl font-display font-bold text-gradient mb-2">{s.value}</div>
                <div className="text-sm text-muted-foreground font-medium">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default Governance;
