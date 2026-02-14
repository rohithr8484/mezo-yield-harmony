import PageLayout from "@/components/PageLayout";
import { Coins, TrendingUp, Lock, Gift, Clock, ShieldCheck } from "lucide-react";

const tiers = [
  { duration: "30 Days", apy: "3.2%", minStake: "0.01 BTC", bonus: "—" },
  { duration: "90 Days", apy: "4.5%", minStake: "0.01 BTC", bonus: "1.2x multiplier" },
  { duration: "180 Days", apy: "6.0%", minStake: "0.05 BTC", bonus: "1.5x multiplier" },
  { duration: "365 Days", apy: "8.5%", minStake: "0.1 BTC", bonus: "2x multiplier" },
];

const features = [
  { icon: Coins, title: "BTC Staking", description: "Stake your Bitcoin directly on Mezo and earn yield without leaving the Bitcoin ecosystem." },
  { icon: TrendingUp, title: "Compounding Rewards", description: "Rewards auto-compound, growing your stack exponentially over time." },
  { icon: Lock, title: "Flexible Lock Periods", description: "Choose from 30 to 365-day lock periods. Longer locks earn higher rewards." },
  { icon: Gift, title: "Bonus Multipliers", description: "Early adopters and long-term stakers earn bonus MEZO token rewards." },
  { icon: Clock, title: "Real-time Tracking", description: "Monitor your staking positions, rewards accrued, and unlock timelines in real time." },
  { icon: ShieldCheck, title: "Insured Deposits", description: "Staked assets are protected by Mezo's multi-sig security and insurance fund." },
];

const Staking = () => {
  return (
    <PageLayout>
      {/* Hero */}
      <section className="py-20 md:py-28">
        <div className="container text-center">
          <span className="inline-block px-4 py-1.5 rounded-full border border-border bg-card text-sm font-medium text-muted-foreground mb-6">
            Staking & Rewards
          </span>
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-display font-bold leading-tight">
            <span className="text-foreground">Earn </span>
            <span className="text-gradient italic">More</span>{" "}
            <span className="text-foreground">Bitcoin</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            Stake BTC on Mezo and earn competitive yields. The longer you commit, the more you earn.
          </p>
          <div className="mt-8">
            <a href="#" className="inline-flex px-8 py-3.5 rounded-full bg-foreground text-background text-sm font-semibold hover:opacity-90 transition-opacity">
              Start Staking
            </a>
          </div>
        </div>
      </section>

      {/* Staking Tiers */}
      <section className="py-20 bg-secondary/50">
        <div className="container">
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-center text-foreground mb-4">Staking Tiers</h2>
          <p className="text-center text-muted-foreground text-lg max-w-2xl mx-auto mb-12">
            Choose the tier that fits your strategy. Higher commitment, higher rewards.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {tiers.map((tier) => (
              <div key={tier.duration} className="rounded-2xl bg-card border border-border p-8 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 text-center">
                <div className="text-sm text-muted-foreground font-medium mb-2">{tier.duration}</div>
                <div className="text-4xl font-display font-bold text-gradient mb-4">{tier.apy}</div>
                <div className="text-sm text-muted-foreground mb-1">Min: {tier.minStake}</div>
                <div className="text-sm font-medium text-bitcoin">{tier.bonus}</div>
                <a href="#" className="mt-6 inline-flex px-6 py-2.5 rounded-full bg-foreground text-background text-sm font-semibold hover:opacity-90 transition-opacity">
                  Stake Now
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="container">
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-center text-foreground mb-4">Why Stake on Mezo?</h2>
          <p className="text-center text-muted-foreground text-lg max-w-2xl mx-auto mb-16">
            Industry-leading staking infrastructure built for Bitcoin holders.
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

      {/* Stats */}
      <section className="py-20 bg-secondary/50">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: "Total BTC Staked", value: "18.5K" },
              { label: "Avg. APY", value: "5.4%" },
              { label: "Rewards Distributed", value: "$42M" },
              { label: "Active Stakers", value: "32K+" },
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

export default Staking;
