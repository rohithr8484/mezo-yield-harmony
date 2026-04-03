import { useState, useMemo } from "react";
import PageLayout from "@/components/PageLayout";
import { Vote, Users, BarChart3, Shield, Scale, Globe, ArrowDown, ArrowRight, CheckCircle, XCircle, MinusCircle, Lock, Coins, Gauge, FileText, Timer, Zap, Wallet, Search, ChevronDown, Plus } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useAccount, useReadContract } from "wagmi";
import { formatUnits } from "viem";
import { CONTRACTS, ERC20_ABI } from "@/lib/mezo";
import { Link } from "react-router-dom";
import { proposals, statusStyles, formatVotes, type ProposalStatus } from "@/lib/proposals";

const filterOptions: Array<{ label: string; value: string }> = [
  { label: "All proposals", value: "all" },
  { label: "Active", value: "Active" },
  { label: "Accepted", value: "Accepted" },
  { label: "Rejected", value: "Rejected" },
  { label: "Finished", value: "Finished" },
];

const Governance = () => {
  const { isConnected, address } = useAccount();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [filterOpen, setFilterOpen] = useState(false);

  const filteredProposals = useMemo(() => {
    return proposals.filter((p) => {
      const matchesSearch =
        !searchQuery ||
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.author.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = statusFilter === "all" || p.status === statusFilter;
      return matchesSearch && matchesFilter;
    });
  }, [searchQuery, statusFilter]);

  const { data: musdSupply } = useReadContract({
    address: CONTRACTS.testnet.MUSD,
    abi: ERC20_ABI,
    functionName: "totalSupply",
    chainId: 31611,
  });

  const { data: musdBalance } = useReadContract({
    address: CONTRACTS.testnet.MUSD,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: 31611,
    query: { enabled: !!address },
  });

  return (
    <PageLayout>
      {/* Hero */}
      <section className="py-20 md:py-28">
        <div className="container text-center">
          <span className="inline-block px-4 py-1.5 rounded-full border border-border bg-card text-sm font-medium text-muted-foreground mb-6">
            🔗 Mezo Testnet · Chain ID 31611
          </span>
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-display font-bold leading-tight">
            <span className="text-gradient italic">Proposals</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            Vote on MUSD, Mezo, veMezo gauges. Formal proposal and voting mechanisms powered by Governor Bravo. Fee: 0.2 MEZO or MUSD per vote.
          </p>

          {isConnected && (
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <div className="rounded-xl bg-card border border-border px-6 py-3 shadow-card">
                <div className="text-xs text-muted-foreground">Your MUSD Balance</div>
                <div className="text-lg font-display font-bold text-foreground">
                  {musdBalance ? parseFloat(formatUnits(musdBalance as bigint, 18)).toFixed(2) : "0.00"} MUSD
                </div>
              </div>
              <div className="rounded-xl bg-card border border-border px-6 py-3 shadow-card">
                <div className="text-xs text-muted-foreground">MUSD Total Supply</div>
                <div className="text-lg font-display font-bold text-gradient">
                  {musdSupply ? parseFloat(formatUnits(musdSupply as bigint, 18)).toLocaleString(undefined, { maximumFractionDigits: 0 }) : "—"}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Proposals */}
      <section className="py-20 bg-secondary/50">
        <div className="container">
          <div className="max-w-5xl mx-auto">
            {/* Header with filter & search */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
              <h2 className="text-3xl font-display font-bold text-foreground">All Proposals</h2>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <span className="text-sm text-muted-foreground hidden sm:block">Filter</span>
                <div className="relative">
                  <button
                    onClick={() => setFilterOpen(!filterOpen)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card text-sm text-foreground hover:bg-secondary transition-colors"
                  >
                    {filterOptions.find((f) => f.value === statusFilter)?.label}
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </button>
                  {filterOpen && (
                    <div className="absolute top-full left-0 mt-1 w-48 rounded-lg border border-border bg-card shadow-lg z-10">
                      {filterOptions.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => { setStatusFilter(opt.value); setFilterOpen(false); }}
                          className={`block w-full text-left px-4 py-2.5 text-sm hover:bg-secondary transition-colors first:rounded-t-lg last:rounded-b-lg ${statusFilter === opt.value ? "text-primary font-semibold" : "text-foreground"}`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="relative flex-1 sm:flex-initial">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search proposals"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full sm:w-56 pl-9 pr-4 py-2 rounded-lg border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
            </div>

            {/* Proposal List */}
            <div className="space-y-0 rounded-2xl border border-border bg-card overflow-hidden shadow-card">
              {filteredProposals.length === 0 && (
                <div className="p-12 text-center text-muted-foreground text-sm">No proposals found.</div>
              )}
              {filteredProposals.map((p, idx) => (
                <Link
                  to={`/governance/${p.id}`}
                  key={p.id}
                  className={`flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-8 p-6 hover:bg-secondary/50 transition-colors cursor-pointer ${idx < filteredProposals.length - 1 ? "border-b border-border" : ""}`}
                >
                  {/* Left: content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <img src={p.authorAvatar} alt="" className="h-5 w-5 rounded-full" />
                      <span className={`inline-block px-2.5 py-0.5 rounded border text-xs font-medium ${statusStyles[p.status]}`}>
                        {p.status}
                      </span>
                    </div>
                    <h3 className="text-lg font-display font-bold text-foreground mb-1 leading-snug">{p.title}</h3>
                    <p className="text-xs text-muted-foreground mb-2">Author: {p.author}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">{p.summary}</p>
                  </div>

                  {/* Right: vote bars */}
                  <div className="w-full lg:w-64 shrink-0 space-y-2">
                    <div>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="font-semibold text-foreground">For&nbsp;&nbsp;{formatVotes(p.forVotes)}</span>
                        <span className="text-muted-foreground">{p.forPct.toFixed(2)}&nbsp;%</span>
                      </div>
                      <div className="h-2 rounded-full bg-border overflow-hidden">
                        <div
                          className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                          style={{ width: `${p.forPct}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="font-semibold text-foreground">Against&nbsp;&nbsp;{formatVotes(p.againstVotes)}</span>
                        <span className="text-muted-foreground">{p.againstPct.toFixed(2)}&nbsp;%</span>
                      </div>
                      <div className="h-2 rounded-full bg-border overflow-hidden">
                        <div
                          className="h-full rounded-full bg-destructive/60 transition-all duration-500"
                          style={{ width: `${Math.max(p.againstPct, 1)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Token Holders Layer */}
      <section className="py-20 bg-secondary/50">
        <div className="container">
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-center text-foreground mb-4">Token Holders Layer</h2>
          <p className="text-center text-muted-foreground text-lg max-w-2xl mx-auto mb-12">
            Governance power flows from token holders who participate in the protocol.
          </p>
          <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { icon: Coins, title: "MUSD Holders", desc: "Holders of Mezo's native stablecoin participate in protocol decisions and fee governance." },
              { icon: Lock, title: "veMEZO Lockers", desc: "Lock MEZO tokens to receive veMEZO, gaining boosted voting power and gauge influence." },
              { icon: Gauge, title: "Gauge System", desc: "Direct protocol emissions and rewards through gauge weight voting with veMEZO." },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl bg-card border border-border p-8 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 text-center">
                <div className="h-14 w-14 rounded-xl bg-bitcoin/10 flex items-center justify-center mb-5 mx-auto">
                  <item.icon className="h-7 w-7 text-bitcoin" />
                </div>
                <h3 className="text-xl font-display font-semibold text-foreground mb-3">{item.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Proposal Creation */}
      <section className="py-20 bg-secondary/50">
        <div className="container">
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-center text-foreground mb-4">Proposal Creation</h2>
          <p className="text-center text-muted-foreground text-lg max-w-2xl mx-auto mb-12">
            Any eligible token holder can create a governance proposal.
          </p>
          <div className="max-w-2xl mx-auto">
            <div className="rounded-2xl bg-card border border-border p-8 shadow-card">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-display font-bold text-foreground">Governance Proposal</h3>
                </div>
              </div>
              <div className="space-y-3">
                {[
                  { label: "Parameter Change", desc: "Adjust protocol parameters like collateral ratios, fees, or thresholds" },
                  { label: "Gauge Allocation", desc: "Modify gauge weights and emission distribution across pools" },
                  { label: "Protocol Upgrade", desc: "Propose smart contract upgrades or new feature implementations" },
                ].map((type) => (
                  <div key={type.label} className="flex items-start gap-3 rounded-xl bg-secondary/80 border border-border p-4">
                    <ArrowRight className="h-4 w-4 text-bitcoin mt-0.5 shrink-0" />
                    <div>
                      <div className="text-sm font-semibold text-foreground">{type.label}</div>
                      <div className="text-xs text-muted-foreground">{type.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Governor Bravo Contract */}
      <section className="py-20">
        <div className="container">
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-center text-foreground mb-4">Governance Contract</h2>
          <p className="text-center text-muted-foreground text-lg max-w-2xl mx-auto mb-12">
            Powered by Governor Bravo — battle-tested on-chain governance.
          </p>
          <div className="max-w-2xl mx-auto">
            <div className="rounded-2xl bg-card border-2 border-primary/30 p-8 shadow-card">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-display font-bold text-foreground">Governor Bravo</h3>
                  <p className="text-sm text-muted-foreground">On-chain Governance Contract</p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { fn: "Propose", icon: FileText, desc: "Create proposal" },
                  { fn: "Queue", icon: Timer, desc: "Queue for execution" },
                  { fn: "Vote", icon: Vote, desc: "Cast your vote" },
                  { fn: "Execute", icon: Zap, desc: "Execute on-chain" },
                ].map((item) => (
                  <div key={item.fn} className="rounded-xl bg-secondary/80 border border-border p-4 text-center hover:border-primary/40 transition-colors">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-3">
                      <item.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="text-sm font-bold font-display text-foreground">{item.fn}</div>
                    <div className="text-xs text-muted-foreground mt-1">{item.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Community Voting */}
      <section className="py-20 bg-secondary/50">
        <div className="container">
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-center text-foreground mb-4">Community Voting</h2>
          <p className="text-center text-muted-foreground text-lg max-w-2xl mx-auto mb-12">
            Every token holder can cast their vote on active proposals. Fee: 0.2 MEZO or MUSD per vote.
          </p>
          <div className="max-w-md mx-auto">
            <div className="rounded-2xl bg-card border border-border p-8 shadow-card">
              <div className="flex justify-center mb-6">
                <div className="flex -space-x-3">
                  {["voter1", "voter2", "voter3", "voter4", "voter5"].map((seed) => (
                    <img key={seed} src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`} alt="" className="h-12 w-12 rounded-full border-2 border-card" />
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4">
                  <CheckCircle className="h-6 w-6 text-emerald-500 shrink-0" />
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-foreground">For</div>
                    <div className="text-xs text-muted-foreground">Support the proposal</div>
                  </div>
                  <div className="text-sm font-bold text-emerald-500">67%</div>
                </div>
                <div className="flex items-center gap-3 rounded-xl bg-destructive/10 border border-destructive/20 p-4">
                  <XCircle className="h-6 w-6 text-destructive shrink-0" />
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-foreground">Against</div>
                    <div className="text-xs text-muted-foreground">Oppose the proposal</div>
                  </div>
                  <div className="text-sm font-bold text-destructive">21%</div>
                </div>
                <div className="flex items-center gap-3 rounded-xl bg-secondary border border-border p-4">
                  <MinusCircle className="h-6 w-6 text-muted-foreground shrink-0" />
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-foreground">Abstain</div>
                    <div className="text-xs text-muted-foreground">Neutral position</div>
                  </div>
                  <div className="text-sm font-bold text-muted-foreground">12%</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

    </PageLayout>
  );
};

export default Governance;
