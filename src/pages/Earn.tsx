import PageLayout from "@/components/PageLayout";
import { ArrowRight, Vault, PiggyBank, ShieldCheck, TrendingUp, BarChart3, Wallet } from "lucide-react";
import { useAccount, useBalance, useReadContract } from "wagmi";
import { formatUnits } from "viem";
import { CONTRACTS, ERC20_ABI } from "@/lib/mezo";
import { useState } from "react";

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
  const { isConnected, address } = useAccount();
  const [borrowAmount, setBorrowAmount] = useState("");
  const [collateralAmount, setCollateralAmount] = useState("");

  const { data: btcBalance } = useBalance({ address, chainId: 31611 });
  const { data: musdBalance } = useReadContract({
    address: CONTRACTS.testnet.MUSD,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: 31611,
    query: { enabled: !!address },
  });
  const { data: musdSupply } = useReadContract({
    address: CONTRACTS.testnet.MUSD,
    abi: ERC20_ABI,
    functionName: "totalSupply",
    chainId: 31611,
  });

  return (
    <PageLayout>
      {/* Hero */}
      <section className="py-20 md:py-28">
        <div className="container text-center">
          <span className="inline-block px-4 py-1.5 rounded-full border border-border bg-card text-sm font-medium text-muted-foreground mb-6">
            🔗 Mezo Testnet · Earn & Borrow
          </span>
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-display font-bold leading-tight">
            <span className="text-foreground">Borrow </span>
            <span className="text-gradient italic">MUSD</span>
            <span className="text-foreground"> with BTC</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            MUSD is 100% backed by Bitcoin reserves. Borrow MUSD against your BTC collateral — live on Mezo testnet.
          </p>

          {isConnected && (
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <div className="rounded-xl bg-card border border-border px-6 py-3 shadow-card">
                <div className="text-xs text-muted-foreground">BTC Balance</div>
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
              <div className="rounded-xl bg-card border border-border px-6 py-3 shadow-card">
                <div className="text-xs text-muted-foreground">MUSD Total Supply</div>
                <div className="text-lg font-display font-bold text-foreground">
                  {musdSupply ? parseFloat(formatUnits(musdSupply as bigint, 18)).toLocaleString(undefined, { maximumFractionDigits: 0 }) : "—"}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Borrow Form */}
      <section className="py-20 bg-secondary/50">
        <div className="container">
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-center text-foreground mb-4">Borrow MUSD</h2>
          <p className="text-center text-muted-foreground text-lg max-w-2xl mx-auto mb-12">
            Deposit BTC as collateral and borrow MUSD stablecoin. 1 MUSD = $1 USD, backed by Bitcoin.
          </p>

          {isConnected ? (
            <div className="max-w-lg mx-auto rounded-2xl bg-card border border-border p-8 shadow-card">
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Collateral (BTC)</label>
                  <input
                    type="number"
                    step="0.001"
                    placeholder="0.1"
                    value={collateralAmount}
                    onChange={(e) => setCollateralAmount(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  />
                  {btcBalance && (
                    <button
                      onClick={() => setCollateralAmount(formatUnits(btcBalance.value, 18))}
                      className="text-xs text-primary mt-1 hover:underline"
                    >
                      Max: {parseFloat(formatUnits(btcBalance.value, 18)).toFixed(6)} BTC
                    </button>
                  )}
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Borrow (MUSD)</label>
                  <input
                    type="number"
                    step="100"
                    placeholder="5000"
                    value={borrowAmount}
                    onChange={(e) => setBorrowAmount(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  />
                </div>
                <div className="rounded-xl bg-secondary/50 p-4 text-sm">
                  <div className="flex justify-between mb-1">
                    <span className="text-muted-foreground">Collateral Ratio</span>
                    <span className="text-foreground font-semibold">
                      {collateralAmount && borrowAmount
                        ? `${((parseFloat(collateralAmount) * 65000 / parseFloat(borrowAmount)) * 100).toFixed(0)}%`
                        : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span className="text-muted-foreground">Min. Ratio Required</span>
                    <span className="text-foreground">110%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Interest Rate</span>
                    <span className="text-bitcoin font-semibold">0.5% APR</span>
                  </div>
                </div>
                <button className="w-full px-6 py-3.5 rounded-full bg-gradient-hero text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity">
                  Borrow MUSD (Testnet)
                </button>
                <p className="text-xs text-center text-muted-foreground">
                  Contract: {CONTRACTS.testnet.MUSD.slice(0, 10)}...{CONTRACTS.testnet.MUSD.slice(-6)} · Chain ID 31611
                </p>
              </div>
            </div>
          ) : (
            <p className="text-center text-sm text-muted-foreground">Connect your wallet to borrow MUSD on testnet.</p>
          )}
        </div>
      </section>

      {/* Vaults */}
      <section className="py-20">
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
      <section className="py-20 bg-secondary/50">
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
