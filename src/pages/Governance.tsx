import { useState, useMemo, useEffect } from "react";
import PageLayout from "@/components/PageLayout";
import { Vote, Users, BarChart3, Shield, Scale, Globe, ArrowDown, ArrowRight, CheckCircle, XCircle, MinusCircle, Coins, Gauge, FileText, Timer, Zap, Wallet, Search, ChevronDown, Plus } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useAccount, useReadContract } from "wagmi";
import { formatUnits } from "viem";
import { CONTRACTS, ERC20_ABI } from "@/lib/mezo";
import { Link } from "react-router-dom";
import { statusStyles, type Proposal } from "@/lib/proposals";
import { getAllProposals, getUserProposals, saveUserProposal } from "@/lib/proposalStore";

import { useConnectModal } from "@rainbow-me/rainbowkit";
import { toast } from "sonner";

const filterOptions: Array<{ label: string; value: string }> = [
  { label: "All proposals", value: "all" },
  { label: "Active", value: "Active" },
  { label: "Finished", value: "Finished" },
];

const Governance = () => {
  const { isConnected, address } = useAccount();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [proposalForm, setProposalForm] = useState({ title: "", category: "Parameter Change", summary: "", motivation: "", specification: "" });
  const { openConnectModal } = useConnectModal();
  const [userProposals, setUserProposals] = useState<Proposal[]>(() => getUserProposals());
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const refresh = () => setUserProposals(getUserProposals());
    refresh();
    const onStorage = (e: StorageEvent) => {
      if (e.key === "mezo.userProposals.v1") refresh();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", refresh);
    window.addEventListener("mezo:proposals-updated", refresh);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("mezo:proposals-updated", refresh);
    };
  }, []);

  const allProposals = useMemo(() => getAllProposals(), [userProposals, now]);


  const filteredProposals = useMemo(() => {
    return allProposals.filter((p) => {
      const matchesSearch =
        !searchQuery ||
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.author.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = statusFilter === "all" || p.status === statusFilter;
      return matchesSearch && matchesFilter;
    });
  }, [searchQuery, statusFilter, allProposals]);

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
      <div className="ops-page">
      {/* Hero */}
      <section className="py-10 md:py-14">
        <div className="container">
          <div className="ops-shell rounded-lg px-6 py-10 text-center md:px-10 md:py-14">
          <span className="mb-5 inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground">
            🔗 Mezo Testnet · Chain ID 31611
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-display font-bold leading-tight">
            <span className="text-gradient">Governance proposals</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            Vote on MUSD, Mezo, veMezo gauges. Each user gets 8 free Governance entries before paid voting.
          </p>

          {isConnected && (
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <div className="rounded-lg bg-card border border-border px-6 py-3 shadow-card">
                <div className="text-xs text-muted-foreground">Your MUSD Balance</div>
                <div className="text-lg font-display font-bold text-foreground">
                  {musdBalance ? parseFloat(formatUnits(musdBalance as bigint, 18)).toFixed(2) : "0.00"} MUSD
                </div>
              </div>
              <div className="rounded-lg bg-card border border-border px-6 py-3 shadow-card">
                <div className="text-xs text-muted-foreground">MUSD Total Supply</div>
                <div className="text-lg font-display font-bold text-gradient">
                  {musdSupply ? parseFloat(formatUnits(musdSupply as bigint, 18)).toLocaleString(undefined, { maximumFractionDigits: 0 }) : "—"}
                </div>
              </div>
            </div>
          )}
          </div>
        </div>
      </section>

      {/* Proposals */}
      <section className="border-y border-border/60 bg-secondary/35 py-14 md:py-16">
        <div className="container">
          <div className="max-w-5xl mx-auto">
            {/* Header with filter & search */}
            <div className="ops-section-heading relative z-20 mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="mb-1 text-xs font-bold uppercase text-accent">Proposal registry</p>
                <h2 className="text-3xl font-display font-bold text-foreground">All Proposals</h2>
              </div>
              <div className="ops-toolbar w-full sm:w-auto">
                <span className="text-sm text-muted-foreground hidden sm:block">Filter</span>
                <div className="relative">
                  <button
                    onClick={() => setFilterOpen(!filterOpen)}
                    className="flex min-h-10 items-center gap-2 rounded-md border border-border bg-card px-4 py-2 text-sm text-foreground transition-colors hover:bg-secondary"
                  >
                    {filterOptions.find((f) => f.value === statusFilter)?.label}
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </button>
                  {filterOpen && (
                    <div className="absolute left-0 top-full z-10 mt-1 w-48 overflow-hidden rounded-md border border-border bg-card shadow-lg">
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
                  className="min-h-10 w-full rounded-md border border-border bg-card py-2 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring sm:w-56"
                  />
                </div>
              </div>
            </div>

            {/* Proposal List */}
            <div className="overflow-hidden rounded-lg border border-border bg-card/85 shadow-card backdrop-blur-sm">
              {filteredProposals.length === 0 && (
                <div className="p-12 text-center text-muted-foreground text-sm">No proposals found.</div>
              )}
              {filteredProposals.map((p, idx) => (
                <Link
                  to={`/governance/${p.id}`}
                  key={p.id}
                  className={`ops-row group flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:gap-8 md:p-6 ${idx === filteredProposals.length - 1 ? "border-b-0" : ""}`}
                >
                  {/* Left: content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <img src={p.authorAvatar} alt="" className="h-5 w-5 rounded-full ring-1 ring-border" />
                      <span className={`inline-block rounded-md px-2.5 py-0.5 text-[11px] font-semibold uppercase ${statusStyles[p.status]}`}>
                        {p.status}
                      </span>
                      <span className="text-[11px] text-muted-foreground font-mono">{p.id}</span>
                    </div>
                    <h3 className="mb-1 text-lg font-display font-bold leading-snug text-foreground transition-colors group-hover:text-primary">{p.title}</h3>
                    <p className="text-xs text-muted-foreground mb-2">by {p.author}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">{p.summary}</p>
                  </div>

                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Submit Proposal */}
      <section className="py-16">
        <div className="container">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-display font-bold text-foreground">Submit a Proposal</h2>
                <p className="text-muted-foreground text-sm mt-1">Any token holder can submit a governance proposal</p>
              </div>
              <button
                onClick={() => {
                  if (!isConnected) {
                    openConnectModal?.();
                    return;
                  }
                  setShowSubmitForm(!showSubmitForm);
                }}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <Plus className="h-4 w-4" />
                {showSubmitForm ? "Cancel" : "New Proposal"}
              </button>
            </div>

            {showSubmitForm && (
              <div className="space-y-5 rounded-lg border border-border bg-card p-6 shadow-card md:p-8">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Increase BTC collateral ratio to 160%"
                    value={proposalForm.title}
                    onChange={(e) => setProposalForm({ ...proposalForm, title: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-border bg-secondary/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">Category</label>
                  <select
                    value={proposalForm.category}
                    onChange={(e) => setProposalForm({ ...proposalForm, category: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-border bg-secondary/50 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option>Parameter Change</option>
                    <option>Gauge Allocation</option>
                    <option>Protocol Upgrade</option>
                    <option>Treasury Allocation</option>
                    <option>Security</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">Summary</label>
                  <Textarea
                    placeholder="Brief description of your proposal"
                    value={proposalForm.summary}
                    onChange={(e) => setProposalForm({ ...proposalForm, summary: e.target.value })}
                    className="bg-secondary/50"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">Motivation</label>
                  <Textarea
                    placeholder="Why is this proposal needed?"
                    value={proposalForm.motivation}
                    onChange={(e) => setProposalForm({ ...proposalForm, motivation: e.target.value })}
                    className="bg-secondary/50"
                    rows={4}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">Specification</label>
                  <Textarea
                    placeholder="Technical details of the proposed changes"
                    value={proposalForm.specification}
                    onChange={(e) => setProposalForm({ ...proposalForm, specification: e.target.value })}
                    className="bg-secondary/50"
                    rows={4}
                  />
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => {
                      if (!proposalForm.title.trim() || !proposalForm.summary.trim()) {
                        toast.error("Title and summary are required");
                        return;
                      }
                      const nextId = `MIP-${String(1000 + userProposals.length + 1)}`;
                      const newProposal: Proposal = {
                        id: nextId,
                        title: proposalForm.title.trim(),
                        author: address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "anonymous",
                        authorAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${address ?? "anon"}`,
                        summary: proposalForm.summary.trim(),
                        motivation: proposalForm.motivation.trim(),
                        specification: proposalForm.specification.trim(),
                        status: "Active",
                        forVotes: 0, forPct: 0,
                        againstVotes: 0, againstPct: 0,
                        abstainVotes: 0, abstainPct: 0,
                        token: "MEZO",
                        quorum: 0, quorumRequired: 200000,
                        differential: 0, differentialRequired: 80000,
                        topVoters: [],
                        discussions: [],
                      };
                      const next = saveUserProposal(newProposal);
                      setUserProposals(next);

                      toast.success(`Proposal "${newProposal.title}" submitted!`);
                      setProposalForm({ title: "", category: "Parameter Change", summary: "", motivation: "", specification: "" });
                      setShowSubmitForm(false);
                    }}
                    className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
                  >
                    Submit Proposal
                  </button>
                  <button
                    onClick={() => setShowSubmitForm(false)}
                    className="px-6 py-2.5 rounded-xl bg-secondary border border-border text-sm font-semibold text-muted-foreground hover:bg-secondary/80 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Token Holders Layer */}
      <section className="border-y border-border/60 bg-secondary/35 py-16">
        <div className="container">
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-center text-foreground mb-4">Token Holders Layer</h2>
          <p className="text-center text-muted-foreground text-lg max-w-2xl mx-auto mb-12">
            Governance power flows from token holders who participate in the protocol.
          </p>
          <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {[
              { icon: Coins, title: "MUSD Holders", desc: "Holders of Mezo's native stablecoin participate in protocol decisions and fee governance." },
              { icon: Gauge, title: "Gauge System", desc: "Direct protocol emissions and rewards through gauge weight voting with veMEZO." },
            ].map((item) => (
              <div key={item.title} className="ops-card p-8 text-center">
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
      <section className="bg-secondary/35 py-16">
        <div className="container">
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-center text-foreground mb-4">Proposal Creation</h2>
          <p className="text-center text-muted-foreground text-lg max-w-2xl mx-auto mb-12">
            Any eligible token holder can create a governance proposal.
          </p>
          <div className="max-w-2xl mx-auto">
            <div className="rounded-lg bg-card border border-border p-8 shadow-card">
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
      <section className="py-16">
        <div className="container">
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-center text-foreground mb-4">Governance Contract</h2>
          <p className="text-center text-muted-foreground text-lg max-w-2xl mx-auto mb-12">
            Powered by Governor Bravo — battle-tested on-chain governance.
          </p>
          <div className="max-w-2xl mx-auto">
            <div className="rounded-lg bg-card border border-primary/30 p-8 shadow-card">
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
      <section className="border-t border-border/60 bg-secondary/35 py-16">
        <div className="container">
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-center text-foreground mb-4">Community Voting</h2>
          <p className="text-center text-muted-foreground text-lg max-w-2xl mx-auto mb-12">
            Every token holder can cast votes on active proposals with 8 free entries per user.
          </p>
          <div className="max-w-md mx-auto">
            <div className="rounded-lg bg-card border border-border p-8 shadow-card">
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

      </div>
    </PageLayout>
  );
};

export default Governance;
