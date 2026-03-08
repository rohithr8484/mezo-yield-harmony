import PageLayout from "@/components/PageLayout";
import { Vote, Users, BarChart3, Shield, Scale, Globe, ArrowDown, ArrowRight, CheckCircle, XCircle, MinusCircle, Lock, Coins, Gauge, FileText, Timer, Zap, Wallet } from "lucide-react";
import { useAccount, useReadContract } from "wagmi";
import { formatUnits } from "viem";
import { CONTRACTS, ERC20_ABI } from "@/lib/mezo";

const Governance = () => {
  const { isConnected, address } = useAccount();

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
            <span className="text-gradient italic">Governance</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            Vote on MUSD, Mezo, veMezo gauges. Formal proposal and voting mechanisms powered by Governor Bravo.
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

      {/* veMEZO Gauges */}
      <section className="py-20">
        <div className="container">
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-center text-foreground mb-4">veMEZO Gauges</h2>
          <p className="text-center text-muted-foreground text-lg max-w-2xl mx-auto mb-12">
            Allocate gauge weights to direct protocol emissions and reward distribution.
          </p>
          <div className="max-w-3xl mx-auto">
            <div className="rounded-2xl bg-card border-2 border-bitcoin/30 p-8 shadow-card">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-12 w-12 rounded-xl bg-bitcoin/10 flex items-center justify-center">
                  <Gauge className="h-6 w-6 text-bitcoin" />
                </div>
                <div>
                  <h3 className="text-xl font-display font-bold text-foreground">veMEZO Gauges</h3>
                  <p className="text-sm text-muted-foreground">Gauge Weight Voting</p>
                </div>
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                {["MUSD/BTC Pool", "MUSD Stability", "Protocol Treasury"].map((gauge) => (
                  <div key={gauge} className="rounded-xl bg-secondary/80 border border-border p-4 text-center">
                    <div className="text-sm font-semibold text-foreground mb-1">{gauge}</div>
                    <div className="text-xs text-muted-foreground">Gauge Weight</div>
                    <div className="mt-2 h-2 rounded-full bg-border overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-primary to-magenta" style={{ width: `${Math.random() * 40 + 30}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-center mt-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ArrowDown className="h-4 w-4 text-bitcoin" />
                  <span>Gauge Weight Voting directs emissions</span>
                </div>
              </div>
            </div>
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
            Every token holder can cast their vote on active proposals.
          </p>
          <div className="max-w-md mx-auto">
            <div className="rounded-2xl bg-card border border-border p-8 shadow-card">
              <div className="flex justify-center mb-6">
                <div className="flex -space-x-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-12 w-12 rounded-full bg-secondary border-2 border-card flex items-center justify-center">
                      <Wallet className="h-5 w-5 text-muted-foreground" />
                    </div>
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

      {/* Execution */}
      <section className="py-20">
        <div className="container">
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-center text-foreground mb-4">Execution</h2>
          <p className="text-center text-muted-foreground text-lg max-w-2xl mx-auto mb-12">
            Passed proposals are queued through a timelock before on-chain execution.
          </p>
          <div className="max-w-2xl mx-auto flex flex-col items-center gap-4">
            <div className="w-full rounded-2xl bg-card border border-border p-6 shadow-card text-center">
              <div className="h-12 w-12 rounded-xl bg-bitcoin/10 flex items-center justify-center mx-auto mb-4">
                <Timer className="h-6 w-6 text-bitcoin" />
              </div>
              <h3 className="text-lg font-display font-bold text-foreground">Timelock + Execution</h3>
              <p className="text-sm text-muted-foreground mt-2">48-hour security delay before any protocol changes take effect.</p>
            </div>
            <ArrowDown className="h-6 w-6 text-bitcoin" />
            <div className="w-full rounded-2xl bg-gradient-to-r from-primary/10 to-bitcoin/10 border-2 border-bitcoin/30 p-6 shadow-card text-center">
              <div className="h-12 w-12 rounded-xl bg-bitcoin/10 flex items-center justify-center mx-auto mb-4">
                <Zap className="h-6 w-6 text-bitcoin" />
              </div>
              <h3 className="text-lg font-display font-bold text-gradient">Protocol State Updated</h3>
              <p className="text-sm text-muted-foreground mt-2">Changes are applied on-chain and the protocol state is updated.</p>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default Governance;
