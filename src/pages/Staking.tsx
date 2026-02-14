import PageLayout from "@/components/PageLayout";
import { Coins, TrendingUp, Lock, Gift, Clock, ShieldCheck } from "lucide-react";
import { useAccount, useBalance, useReadContract } from "wagmi";
import { formatUnits, parseUnits } from "viem";
import { CONTRACTS, ERC20_ABI } from "@/lib/mezo";
import { useState } from "react";

const tiers = [
  { duration: "7 Days", apy: "2.0%", minStake: "0.001 BTC", bonus: "—", days: 7 },
  { duration: "30 Days", apy: "4.5%", minStake: "0.01 BTC", bonus: "1.2x multiplier", days: 30 },
  { duration: "90 Days", apy: "6.0%", minStake: "0.05 BTC", bonus: "1.5x multiplier", days: 90 },
  { duration: "365 Days", apy: "8.5%", minStake: "0.1 BTC", bonus: "2x multiplier + veMEZO boost", days: 365 },
];

const features = [
  { icon: Coins, title: "veBTC Locking", description: "Lock BTC to create a veBTC position. Your veBTC earns passive BTC yield from all chain economic activity." },
  { icon: TrendingUp, title: "veMEZO Boost (up to 5x)", description: "Lock MEZO to boost your veBTC yield up to 5x. MEZO amplifies your BTC earnings without liquidation risk." },
  { icon: Lock, title: "Short Lock Periods", description: "veBTC locks max at 30 days by design. Short enough to stay liquid, long enough to align incentives." },
  { icon: Gift, title: "Matching Market", description: "Offer incentives on your gauge to attract veMEZO votes. Market-driven boost allocation." },
  { icon: Clock, title: "Epoch-based Rewards", description: "Rewards distributed each epoch. veBTC holders vote to direct emissions to specific gauges." },
  { icon: ShieldCheck, title: "Anti-dilution Rebases", description: "veMEZO holders receive proportional emissions to offset dilution. Your share never shrinks." },
];

const Staking = () => {
  const { isConnected, address } = useAccount();
  const [selectedTier, setSelectedTier] = useState<number | null>(null);
  const [stakeAmount, setStakeAmount] = useState("");

  const { data: btcBalance } = useBalance({ address, chainId: 31611 });

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
            🔗 Mezo Testnet · Staking & Rewards
          </span>
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-display font-bold leading-tight">
            <span className="text-foreground">Lock BTC. </span>
            <span className="text-gradient italic">Earn BTC.</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            Stake BTC to create veBTC positions. All chain fees flow to BTC lockers. Lock MEZO to amplify your earnings up to 5x.
          </p>

          {isConnected && (
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <div className="rounded-xl bg-card border border-border px-6 py-3 shadow-card">
                <div className="text-xs text-muted-foreground">BTC Balance (Testnet)</div>
                <div className="text-lg font-display font-bold text-foreground">
                  {btcBalance ? parseFloat(formatUnits(btcBalance.value, 18)).toFixed(6) : "0.000000"} BTC
                </div>
              </div>
              <div className="rounded-xl bg-card border border-border px-6 py-3 shadow-card">
                <div className="text-xs text-muted-foreground">MUSD Balance</div>
                <div className="text-lg font-display font-bold text-gradient">
                  {musdBalance ? parseFloat(formatUnits(musdBalance as bigint, 18)).toFixed(2) : "0.00"} MUSD
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Staking Tiers */}
      <section className="py-20 bg-secondary/50">
        <div className="container">
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-center text-foreground mb-4">veBTC Lock Tiers</h2>
          <p className="text-center text-muted-foreground text-lg max-w-2xl mx-auto mb-12">
            Choose your lock duration. BTC fees from all Mezo activity flow to veBTC holders.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {tiers.map((tier, i) => (
              <div
                key={tier.duration}
                onClick={() => isConnected && setSelectedTier(i)}
                className={`rounded-2xl bg-card border p-8 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 text-center cursor-pointer ${
                  selectedTier === i ? "border-primary ring-2 ring-primary/20" : "border-border"
                }`}
              >
                <div className="text-sm text-muted-foreground font-medium mb-2">{tier.duration}</div>
                <div className="text-4xl font-display font-bold text-gradient mb-4">{tier.apy}</div>
                <div className="text-sm text-muted-foreground mb-1">Min: {tier.minStake}</div>
                <div className="text-sm font-medium text-bitcoin">{tier.bonus}</div>
              </div>
            ))}
          </div>

          {/* Staking Form */}
          {isConnected && selectedTier !== null && (
            <div className="mt-10 max-w-md mx-auto rounded-2xl bg-card border border-border p-8 shadow-card">
              <h3 className="text-lg font-display font-semibold text-foreground mb-4">
                Lock BTC for {tiers[selectedTier].duration}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Amount (BTC)</label>
                  <input
                    type="number"
                    step="0.001"
                    placeholder={tiers[selectedTier].minStake}
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  />
                  {btcBalance && (
                    <button
                      onClick={() => setStakeAmount(formatUnits(btcBalance.value, 18))}
                      className="text-xs text-primary mt-1 hover:underline"
                    >
                      Max: {parseFloat(formatUnits(btcBalance.value, 18)).toFixed(6)} BTC
                    </button>
                  )}
                </div>
                <div className="rounded-xl bg-secondary/50 p-4 text-sm">
                  <div className="flex justify-between mb-1">
                    <span className="text-muted-foreground">Est. APY</span>
                    <span className="text-foreground font-semibold">{tiers[selectedTier].apy}</span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span className="text-muted-foreground">Lock Duration</span>
                    <span className="text-foreground">{tiers[selectedTier].days} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Boost</span>
                    <span className="text-bitcoin font-semibold">{tiers[selectedTier].bonus}</span>
                  </div>
                </div>
                <button className="w-full px-6 py-3.5 rounded-full bg-gradient-hero text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity">
                  Lock BTC → veBTC (Testnet)
                </button>
                <p className="text-xs text-center text-muted-foreground">
                  Transactions are on Mezo Testnet (Chain ID 31611)
                </p>
              </div>
            </div>
          )}
          {!isConnected && (
            <p className="text-center text-sm text-muted-foreground mt-8">Connect your wallet to start staking on testnet.</p>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="container">
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-center text-foreground mb-4">Dual-Token Economics</h2>
          <p className="text-center text-muted-foreground text-lg max-w-2xl mx-auto mb-16">
            BTC is the fee-claim asset. MEZO is the incentive-coordination and amplification asset.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((item) => (
              <div key={item.title} className="rounded-2xl bg-card border border-border p-8 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1">
                <div className="h-12 w-12 rounded-xl bg-gradient-hero flex items-center justify-center mb-6">
                  <item.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-display font-semibold text-foreground mb-3">{item.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Emission Schedule */}
      <section className="py-20 bg-secondary/50">
        <div className="container">
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-center text-foreground mb-4">Emission Schedule</h2>
          <p className="text-center text-muted-foreground text-lg max-w-2xl mx-auto mb-12">
            Bitcoin-inspired halving model with predictable, declining inflation.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {[
              { phase: "Bootstrap", timeline: "Years 0–2", rate: "25% → 12.5%" },
              { phase: "Growth", timeline: "Years 2–4", rate: "12.5% → 6.25%" },
              { phase: "Maturity", timeline: "Years 4–8", rate: "6.25% → 2%" },
              { phase: "Perpetuity", timeline: "Years 8+", rate: "2% terminal" },
            ].map((s) => (
              <div key={s.phase} className="text-center rounded-2xl bg-card border border-border p-6 shadow-card">
                <div className="text-lg font-display font-bold text-gradient mb-1">{s.rate}</div>
                <div className="text-sm font-semibold text-foreground mb-1">{s.phase}</div>
                <div className="text-xs text-muted-foreground">{s.timeline}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default Staking;
