import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ExternalLink, CheckCircle2, MessageSquare, Send } from "lucide-react";
import { useAccount } from "wagmi";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import PageLayout from "@/components/PageLayout";
import WalletButton from "@/components/WalletButton";
import { proposals, statusStyles, formatVotes, VOTING_FEE, MEZO_TOKEN, MUSD_TOKEN } from "@/lib/proposals";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { toast } from "sonner";

const CHART_COLORS = {
  for: "hsl(142, 71%, 45%)",
  against: "hsl(0, 84%, 60%)",
  abstain: "hsl(215, 14%, 54%)",
};

const ProposalDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { isConnected, address } = useAccount();
  const { openConnectModal } = useConnectModal();
  const [newComment, setNewComment] = useState("");
  const [localDiscussions, setLocalDiscussions] = useState<Array<{ id: string; author: string; avatar: string; message: string; timestamp: string }>>([]);
  const [voted, setVoted] = useState<"FOR" | "AGAINST" | "ABSTAIN" | null>(null);
  const [selectedVote, setSelectedVote] = useState<"FOR" | "AGAINST" | "ABSTAIN" | null>(null);

  const handleSelectVote = (voteType: "FOR" | "AGAINST" | "ABSTAIN") => {
    setSelectedVote(voteType === selectedVote ? null : voteType);
  };

  const handlePayAndVote = (payToken: "MEZO" | "MUSD") => {
    if (!isConnected) {
      openConnectModal?.();
      return;
    }
    if (!selectedVote) return;
    const tokenAddr = payToken === "MEZO" ? MEZO_TOKEN : MUSD_TOKEN;
    setVoted(selectedVote);
    setSelectedVote(null);
    toast.success(
      `Vote cast: ${selectedVote}. Fee: ${VOTING_FEE} ${payToken} paid (${tokenAddr.slice(0, 6)}...${tokenAddr.slice(-4)})`,
      { duration: 5000 }
    );
  };

  const proposal = proposals.find((p) => p.id.toLowerCase() === id?.toLowerCase());

  if (!proposal) {
    return (
      <PageLayout>
        <div className="container py-20 text-center">
          <h1 className="text-3xl font-display font-bold text-foreground mb-4">Proposal not found</h1>
          <Link to="/governance" className="text-primary hover:underline">← Back to Proposals</Link>
        </div>
      </PageLayout>
    );
  }

  const allDiscussions = [...proposal.discussions, ...localDiscussions];
  const quorumReached = proposal.quorum >= proposal.quorumRequired;
  const diffReached = proposal.differential >= proposal.differentialRequired;

  const chartData = [
    { name: "For", value: proposal.forVotes, color: CHART_COLORS.for },
    { name: "Against", value: proposal.againstVotes, color: CHART_COLORS.against },
    { name: "Abstain", value: proposal.abstainVotes, color: CHART_COLORS.abstain },
  ].filter((d) => d.value > 0);

  const handleComment = () => {
    if (!newComment.trim()) return;
    if (!isConnected) {
      openConnectModal?.();
      return;
    }
    setLocalDiscussions((prev) => [
      ...prev,
      {
        id: `local-${Date.now()}`,
        author: address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "anon",
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${address}`,
        message: newComment,
        timestamp: "Just now",
      },
    ]);
    setNewComment("");
    toast.success("Comment posted!");
  };

  return (
    <PageLayout>
      <section className="py-12 md:py-16">
        <div className="container">
          <Link to="/governance" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
            <ArrowLeft className="h-4 w-4" /> Back to Proposals
          </Link>

          <div className="grid lg:grid-cols-[1fr_340px] gap-8">
            {/* Left — Proposal Overview */}
            <div className="space-y-6">
              <div className="rounded-2xl bg-card border border-border shadow-card overflow-hidden">
                <div className="bg-secondary/50 border-b border-border px-6 py-4">
                  <h3 className="text-sm font-semibold text-foreground">Proposal overview</h3>
                </div>
                <div className="p-6 md:p-8">
                  <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground leading-tight mb-4">
                    {proposal.title}
                  </h1>

                  <div className="flex items-center gap-3 mb-8">
                    <img src={proposal.authorAvatar} alt="" className="h-6 w-6 rounded-full" />
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

              {/* Discussion Section */}
              <div className="rounded-2xl bg-card border border-border shadow-card overflow-hidden">
                <div className="bg-secondary/50 border-b border-border px-6 py-4 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold text-foreground">Discussion ({allDiscussions.length})</h3>
                </div>
                <div className="p-6 space-y-4">
                  {allDiscussions.map((d) => (
                    <div key={d.id} className="flex gap-3">
                      <img src={d.avatar} alt="" className="h-8 w-8 rounded-full shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-foreground">{d.author}</span>
                          <span className="text-xs text-muted-foreground">{d.timestamp}</span>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">{d.message}</p>
                      </div>
                    </div>
                  ))}
                  {allDiscussions.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">No discussion yet. Be the first to comment!</p>
                  )}
                  <div className="flex gap-3 pt-4 border-t border-border">
                    <div className="h-8 w-8 rounded-full bg-secondary shrink-0 flex items-center justify-center overflow-hidden">
                      {isConnected && address ? (
                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${address}`} alt="" className="h-8 w-8" />
                      ) : (
                        <span className="text-xs text-muted-foreground">?</span>
                      )}
                    </div>
                    <div className="flex-1 flex gap-2">
                      <input
                        type="text"
                        placeholder={isConnected ? "Add a comment..." : "Connect wallet to comment"}
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleComment()}
                        className="flex-1 px-3 py-2 rounded-lg border border-border bg-secondary/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                      <button
                        onClick={handleComment}
                        className="px-3 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                      >
                        <Send className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right — Sidebar */}
            <div className="space-y-6">
              {/* Your Voting Info */}
              <div className="rounded-2xl bg-card border border-border shadow-card p-6">
                <h3 className="text-lg font-display font-bold text-foreground mb-1">Your voting info</h3>
                <p className="text-xs text-muted-foreground mb-2">
                  {proposal.status === "Active" ? "Voting is live 🟢" : "Voting is closed 🔴"}
                </p>
                <p className="text-xs text-muted-foreground mb-4">
                  Fee: {VOTING_FEE} MEZO or MUSD per vote
                </p>
                <div className="space-y-3">
                  {!isConnected && !voted && proposal.status === "Active" && (
                    <div className="space-y-3 rounded-xl border border-border bg-secondary/40 p-3">
                      <p className="text-xs text-muted-foreground">
                        Wallet connection is required when you click <span className="text-foreground font-medium">Pay with MUSD</span> or <span className="text-foreground font-medium">Pay with MEZO</span>.
                      </p>
                      <WalletButton />
                    </div>
                  )}

                  {voted ? (
                    <div className="text-center py-3">
                      <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-foreground">You voted: {voted}</p>
                    </div>
                  ) : proposal.status === "Active" ? (
                    <>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          onClick={() => handleSelectVote("FOR")}
                          className={`px-3 py-2.5 rounded-xl border text-sm font-semibold transition-colors ${selectedVote === "FOR" ? "bg-emerald-500 text-white border-emerald-500" : "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/20"}`}
                        >
                          For
                        </button>
                        <button
                          onClick={() => handleSelectVote("AGAINST")}
                          className={`px-3 py-2.5 rounded-xl border text-sm font-semibold transition-colors ${selectedVote === "AGAINST" ? "bg-destructive text-white border-destructive" : "bg-destructive/10 border-destructive/30 text-destructive hover:bg-destructive/20"}`}
                        >
                          Against
                        </button>
                        <button
                          onClick={() => handleSelectVote("ABSTAIN")}
                          className={`px-3 py-2.5 rounded-xl border text-sm font-semibold transition-colors ${selectedVote === "ABSTAIN" ? "bg-muted-foreground text-white border-muted-foreground" : "bg-secondary border-border text-muted-foreground hover:bg-secondary/80"}`}
                        >
                          Abstain
                        </button>
                      </div>
                      {selectedVote && (
                        <div className="space-y-2 pt-2">
                          <p className="text-xs text-muted-foreground text-center">
                            Pay {VOTING_FEE} token fee to cast your vote{!isConnected ? " — wallet connection required" : ""}
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => handlePayAndVote("MUSD")}
                              className="px-3 py-2.5 rounded-xl bg-primary/10 border border-primary/30 text-sm font-semibold text-primary hover:bg-primary/20 transition-colors"
                            >
                              Pay with MUSD
                            </button>
                            <button
                              onClick={() => handlePayAndVote("MEZO")}
                              className="px-3 py-2.5 rounded-xl bg-bitcoin/10 border border-bitcoin/30 text-sm font-semibold text-bitcoin hover:bg-bitcoin/20 transition-colors"
                            >
                              Pay with MEZO
                            </button>
                          </div>
                          <div className="text-[10px] text-muted-foreground text-center space-y-0.5">
                            <div>MUSD: {MUSD_TOKEN}</div>
                            <div>MEZO: {MEZO_TOKEN}</div>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-xs text-muted-foreground">Voting has ended for this proposal.</p>
                  )}
                </div>
              </div>

              {/* Voting Results with Chart */}
              <div className="rounded-2xl bg-card border border-border shadow-card p-6">
                <h3 className="text-lg font-display font-bold text-foreground mb-5">Voting results</h3>

                {/* Donut chart */}
                <div className="h-40 mb-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={65}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={index} fill={entry.color} stroke="transparent" />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number, name: string) => [`${formatVotes(value)} MEZO`, name]}
                        contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Legend */}
                <div className="flex justify-center gap-4 mb-4 text-xs">
                  <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> For</span>
                  <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-destructive" /> Against</span>
                  <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/40" /> Abstain</span>
                </div>

                {/* For bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="font-semibold text-foreground">For&nbsp;&nbsp;{formatVotes(proposal.forVotes)}&nbsp;MEZO</span>
                    <span className="text-muted-foreground">{proposal.forPct.toFixed(2)}&nbsp;%</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-border overflow-hidden">
                    <div className="h-full rounded-full bg-emerald-500 transition-all duration-500" style={{ width: `${proposal.forPct}%` }} />
                  </div>
                </div>

                {/* Against bar */}
                <div className="mb-6">
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="font-semibold text-foreground">Against&nbsp;&nbsp;{formatVotes(proposal.againstVotes)}&nbsp;MEZO</span>
                    <span className="text-muted-foreground">{proposal.againstPct.toFixed(2)}&nbsp;%</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-border overflow-hidden">
                    <div className="h-full rounded-full bg-destructive/60 transition-all duration-500" style={{ width: `${Math.max(proposal.againstPct, 1)}%` }} />
                  </div>
                </div>

                {/* Top voters */}
                <div className="border-t border-border pt-4">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                    <span>Top voters</span>
                    <span>Votes</span>
                  </div>
                  <div className="space-y-2.5">
                    {proposal.topVoters.map((voter) => (
                      <div key={voter.address} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <img src={voter.avatar} alt="" className="h-6 w-6 rounded-full" />
                          <a href="#" className="text-sm text-foreground hover:text-primary transition-colors flex items-center gap-1">
                            {voter.displayName}
                            <ExternalLink className="h-3 w-3 text-muted-foreground" />
                          </a>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <span className={voter.vote === "FOR" ? "text-emerald-600 font-medium" : "text-destructive font-medium"}>
                            {voter.vote === "FOR" ? "For" : "Against"}
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

                {/* Contract addresses */}
                <div className="border-t border-border pt-3 mt-3">
                  <p className="text-xs text-muted-foreground mb-1">Voting fee contracts:</p>
                  <div className="text-[10px] text-muted-foreground space-y-0.5">
                    <div>MEZO: {MEZO_TOKEN.slice(0, 10)}...{MEZO_TOKEN.slice(-6)}</div>
                    <div>MUSD: {MUSD_TOKEN.slice(0, 10)}...{MUSD_TOKEN.slice(-6)}</div>
                  </div>
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
