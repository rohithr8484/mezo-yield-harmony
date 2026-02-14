import PageLayout from "@/components/PageLayout";
import { ArrowRight, Vault, PiggyBank, ShieldCheck, TrendingUp, BarChart3, Wallet } from "lucide-react";

const vaults = [
  { name: "Conservative BTC Vault", strategy: "Delta-neutral hedging", apy: "3.8%", tvl: "$420M", risk: "Low" },
  { name: "Growth BTC Vault", strategy: "Yield farming + lending", apy: "6.2%", tvl: "$310M", risk: "Medium" },
  { name: "Aggressive BTC Vault", strategy: "Leveraged strategies", apy: "12.5%", tvl: "$85M", risk: "High" },
];

const features = [
  { icon: Vault, title: "Expert-Managed Vaults", description: "Professionally managed vaults optimize yield across DeFi protocols while managing risk." },
  { icon: PiggyBank, title: "MUSD Savings", description: "Deposit MUSD into savings and earn stable yield backed by Bitcoin reserves." },
  { icon: ShieldCheck, title: "Risk Scoring", description: "Each vault has a transparent risk score so you can invest according to your comfort level." },
  { icon: TrendingUp, title: "Auto-Compounding", description: "Yields are automatically reinvested to maximize your long-term Bitcoin growth." },
  { icon: BarChart3, title: "Performance Analytics", description: "Detailed dashboards showing historical performance, fees, and projected earnings." },
  { icon: Wallet, title: "Instant Withdrawals", description: "Access your funds anytime. No lock-ups on standard vaults — withdraw when you need." },
];

const Earn = () => {
  return (
    <PageLayout>
      {/* Hero */}
      <section className="py-20 md:py-28">
        <div className="container text-center">
          <span className="inline-block px-4 py-1.5 rounded-full border border-border bg-card text-sm font-medium text-muted-foreground mb-6">
            Mezo Earn
          </span>
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-display font-bold leading-tight">
            <span className="text-foreground">Grow Your </span>
            <span className="text-gradient italic">Bitcoin</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            Put your BTC to work. Choose from managed vaults, savings products, and yield strategies — all powered by Mezo.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <a href="#" className="px-8 py-3.5 rounded-full bg-foreground text-background text-sm font-semibold hover:opacity-90 transition-opacity">
              Explore Vaults
            </a>
            <a href="#" className="px-8 py-3.5 rounded-full border border-border text-foreground text-sm font-semibold hover:bg-secondary transition-colors">
              MUSD Savings
            </a>
          </div>
        </div>
      </section>

      {/* Vaults */}
      <section className="py-20 bg-secondary/50">
        <div className="container">
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-center text-foreground mb-4">Bitcoin Vaults</h2>
          <p className="text-center text-muted-foreground text-lg max-w-2xl mx-auto mb-12">
            Select a vault that matches your risk appetite and earning goals.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {vaults.map((vault) => (
              <div key={vault.name} className="group rounded-2xl bg-card border border-border p-8 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    vault.risk === "Low" ? "bg-secondary text-secondary-foreground" :
                    vault.risk === "Medium" ? "bg-bitcoin/10 text-bitcoin" :
                    "bg-primary/10 text-primary"
                  }`}>{vault.risk} Risk</span>
                </div>
                <h3 className="text-xl font-display font-semibold text-foreground mb-2">{vault.name}</h3>
                <p className="text-sm text-muted-foreground mb-6">{vault.strategy}</p>
                <div className="flex justify-between items-end">
                  <div>
                    <div className="text-3xl font-display font-bold text-gradient">{vault.apy}</div>
                    <div className="text-xs text-muted-foreground">APY</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-foreground">{vault.tvl}</div>
                    <div className="text-xs text-muted-foreground">TVL</div>
                  </div>
                </div>
                <a href="#" className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-primary group-hover:gap-2 transition-all">
                  Deposit <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="container">
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-center text-foreground mb-4">Why Earn with Mezo?</h2>
          <p className="text-center text-muted-foreground text-lg max-w-2xl mx-auto mb-16">
            Built-in yield infrastructure designed for Bitcoin holders.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((item) => (
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
    </PageLayout>
  );
};

export default Earn;
