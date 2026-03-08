import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ExternalLink, CheckCircle2 } from "lucide-react";
import { useAccount } from "wagmi";
import PageLayout from "@/components/PageLayout";
import WalletButton from "@/components/WalletButton";
import { proposals, statusStyles, formatVotes } from "@/lib/proposals";

const ProposalDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { isConnected } = useAccount();

  const proposal = proposals.find((p) => p.id.toLowerCase() === id?.toLowerCase());

  if (!proposal) {
    return (
      <PageLayout>
        <div className="container py-20 text-center">
          <h1 className="text-3xl font-display font-bold text-foreground mb-4">Proposal not found</h1>
          <Link to="/governance" className="text-primary hover:underline">← Back to Governance</Link>
        </div>
      </PageLayout>
    );
  }

  const quorumReached = proposal.quorum >= proposal.quorumRequired;
  const diffReached = proposal.differential >= proposal.differentialRequired;

  return (
    <PageLayout>
      <section className="py-12 md:py-16">
        <div className="container">
          <Link to="/governance" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
            <ArrowLeft className="h-4 w-4" /> Back to Governance
          </Link>

          <div className="grid lg:grid-cols-[1fr_340px] gap-8">
            {/* Left — Proposal Overview */}
            <div className="rounded-2xl bg-card border border-border shadow-card overflow-hidden">
              <div className="bg-secondary/50 border-b border-border px-6 py-4">
                <h3 className="text-sm font-semibold text-foreground">Proposal overview</h3>
              </div>
              <div className="p-6 md:p-8">
                <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground leading-tight mb-4">
                  {proposal.title}
                </h1>

                <div className="flex items-center gap-3 mb-8">
                  <span className={`inline-block px-2.5 py-0.5 rounded border text-xs font-medium ${statusStyles[proposal.status]}`}>
                    {proposal.status}
                  </span>
                  <span className="text-xs text-muted-foreground">by {proposal.author}</span>
                </div>

                <div className="space-y-8 text-sm text-muted-foreground leading-relaxed">
                  <div>
                    <h4 className="text-base font-bold text-foreground mb-3">Simple Summary</h4>
                    <p>{proposal.summary}</p>
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-foreground mb-3">Motivation</h4>
                    <p>{proposal.motivation}</p>
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-foreground mb-3">Specification</h4>
                    <p>{proposal.specification}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right — Sidebar */}
            <div className="space-y-6">
              {/* Your Voting Info */}
              <div className="rounded-2xl bg-card border border-border shadow-card p-6">
                <h3 className="text-lg font-display font-bold text-foreground mb-1">Your voting info</h3>
                <p className="text-xs text-muted-foreground mb-4">
                  Voting is on 🔴
                </p>
                {!isConnected ? (
                  <div className="w-full">
                    <WalletButton />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {proposal.status === "Open for voting" && (
                      <div className="grid grid-cols-3 gap-2">
                        <button className="px-3 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-sm font-semibold text-emerald-600 hover:bg-emerald-500/20 transition-colors">
                          YAE
                        </button>
                        <button className="px-3 py-2.5 rounded-xl bg-destructive/10 border border-destructive/30 text-sm font-semibold text-destructive hover:bg-destructive/20 transition-colors">
                          NAY
                        </button>
                        <button className="px-3 py-2.5 rounded-xl bg-secondary border border-border text-sm font-semibold text-muted-foreground hover:bg-secondary/80 transition-colors">
                          Abstain
                        </button>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">Connected — ready to vote with MEZO</p>
                  </div>
                )}
              </div>

              {/* Voting Results */}
              <div className="rounded-2xl bg-card border border-border shadow-card p-6">
                <h3 className="text-lg font-display font-bold text-foreground mb-5">Voting results</h3>

                {/* YAE bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="font-semibold text-foreground">YAE&nbsp;&nbsp;{formatVotes(proposal.yae)}&nbsp;MEZO</span>
                    <span className="text-muted-foreground">{proposal.yaePct.toFixed(2)}&nbsp;%</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-border overflow-hidden">
                    <div className="h-full rounded-full bg-emerald-500 transition-all duration-500" style={{ width: `${proposal.yaePct}%` }} />
                  </div>
                </div>

                {/* NAY bar */}
                <div className="mb-6">
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="font-semibold text-foreground">NAY&nbsp;&nbsp;{formatVotes(proposal.nay)}&nbsp;MEZO</span>
                    <span className="text-muted-foreground">{proposal.nayPct.toFixed(2)}&nbsp;%</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-border overflow-hidden">
                    <div className="h-full rounded-full bg-muted-foreground/40 transition-all duration-500" style={{ width: `${Math.max(proposal.nayPct, 1)}%` }} />
                  </div>
                </div>

                {/* Top voters */}
                <div className="border-t border-border pt-4">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                    <span>Top 10 addresses</span>
                    <span>Votes</span>
                  </div>
                  <div className="space-y-2.5">
                    {proposal.topVoters.map((voter) => (
                      <div key={voter.address} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-secondary flex items-center justify-center">
                            <span className="text-[10px] text-muted-foreground">🟢</span>
                          </div>
                          <a href="#" className="text-sm text-foreground hover:text-primary transition-colors flex items-center gap-1">
                            {voter.displayName}
                            <ExternalLink className="h-3 w-3 text-muted-foreground" />
                          </a>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <span className={voter.vote === "YAE" ? "text-emerald-600 font-medium" : "text-destructive font-medium"}>
                            {voter.vote}
                          </span>
                          <span className="text-foreground font-semibold">{formatVotes(voter.amount)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button className="w-full mt-4 py-2 text-center text-sm text-muted-foreground hover:text-foreground border border-border rounded-xl transition-colors">
                    View all votes
                  </button>
                </div>
              </div>

              {/* Proposal Info */}
              <div className="rounded-2xl bg-card border border-border shadow-card p-6 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">State</span>
                  <span className={`inline-block px-2.5 py-0.5 rounded border text-xs font-medium ${statusStyles[proposal.status]}`}>
                    {proposal.status}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Quorum</span>
                  <span className="flex items-center gap-1 text-foreground font-medium">
                    {quorumReached ? "Reached" : "Not reached"}
                    {quorumReached && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                  </span>
                </div>
                <div className="text-xs text-right text-muted-foreground">
                  <div className="font-medium text-foreground">{formatVotes(proposal.quorum)}</div>
                  <div>{formatVotes(proposal.quorumRequired)}</div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Current votes<br /><span className="text-xs">Required</span></span>
                  <span className="text-right">
                    <div className="font-medium text-foreground">{formatVotes(proposal.quorum)}</div>
                    <div className="text-xs text-muted-foreground">{formatVotes(proposal.quorumRequired)}</div>
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Differential</span>
                  <span className="flex items-center gap-1 text-foreground font-medium">
                    {diffReached ? "Reached" : "Not reached"}
                    {diffReached && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                  </span>
                </div>
                <div className="text-xs text-right text-muted-foreground">
                  <div className="font-medium text-foreground">{formatVotes(proposal.differential)}</div>
                  <div>{formatVotes(proposal.differentialRequired)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default ProposalDetail;
