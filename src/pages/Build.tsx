import PageLayout from "@/components/PageLayout";
import { Rocket, Lightbulb, Handshake, GraduationCap, ArrowRight } from "lucide-react";
import { useAccount, useBalance, useReadContract } from "wagmi";
import { formatUnits } from "viem";
import { CONTRACTS, ERC20_ABI } from "@/lib/mezo";

const ecosystem = [
  { name: "MezoSwap", category: "DEX", description: "Decentralized exchange for BTC-native token swaps with deep liquidity." },
  { name: "MezoLend", category: "Lending", description: "Peer-to-peer lending platform using BTC as collateral." },
  { name: "MatsMats NFTs", category: "NFTs", description: "Bitcoin-native NFT marketplace built on Mezo infrastructure." },
  { name: "BTC Bridge", category: "Bridge", description: "Trustless bridge connecting Bitcoin mainnet to the Mezo network." },
  { name: "Mezo Analytics", category: "Analytics", description: "On-chain analytics and portfolio tracking for the Mezo ecosystem." },
  { name: "MUSD Pay", category: "Payments", description: "Merchant payment gateway accepting MUSD stablecoin." },
];

const programs = [
  { icon: Rocket, title: "Grants Program", description: "Up to $500K in funding for teams building innovative applications on Mezo." },
  { icon: Lightbulb, title: "Incubator", description: "12-week program with mentorship, technical support, and go-to-market strategy." },
  { icon: Handshake, title: "Partnerships", description: "Collaborate with the Mezo Foundation on ecosystem-wide initiatives and integrations." },
  { icon: GraduationCap, title: "Developer Academy", description: "Free courses and certifications for building on Mezo's Bitcoin DeFi stack." },
];

const Build = () => {
  const { isConnected, address } = useAccount();
  const { data: btcBalance } = useBalance({ address, chainId: 31611 });
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
            🔗 Mezo Testnet · Build
          </span>
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-display font-bold leading-tight">
            <span className="text-gradient italic">Build</span>{" "}
            <span className="text-foreground">the Future of Bitcoin</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            Join the growing ecosystem of dApps, protocols, and tools built on Mezo. Deploy on testnet today.
          </p>

          {isConnected && (
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <div className="rounded-xl bg-card border border-border px-6 py-3 shadow-card">
                <div className="text-xs text-muted-foreground">Your Testnet BTC</div>
                <div className="text-lg font-display font-bold text-foreground">
                  {btcBalance ? parseFloat(formatUnits(btcBalance.value, 18)).toFixed(6) : "0.000000"} BTC
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

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <a href="#" className="px-8 py-3.5 rounded-full bg-foreground text-background text-sm font-semibold hover:opacity-90 transition-opacity">
              Apply for Grants
            </a>
            <a
              href="https://explorer.test.mezo.org"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-3.5 rounded-full border border-border text-foreground text-sm font-semibold hover:bg-secondary transition-colors"
            >
              Testnet Explorer ↗
            </a>
          </div>
        </div>
      </section>

      {/* Network Info */}
      <section className="py-20 bg-secondary/50">
        <div className="container">
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-center text-foreground mb-12">Testnet Network Info</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {[
              { label: "Chain ID", value: "31611" },
              { label: "Currency", value: "BTC" },
              { label: "RPC", value: "rpc.test.mezo.org" },
              { label: "Explorer", value: "explorer.test.mezo.org" },
            ].map((s) => (
              <div key={s.label} className="text-center rounded-2xl bg-card border border-border p-6 shadow-card">
                <div className="text-lg font-display font-bold text-gradient mb-1 break-all">{s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Ecosystem */}
      <section className="py-20">
        <div className="container">
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-center text-foreground mb-4">Ecosystem</h2>
          <p className="text-center text-muted-foreground text-lg max-w-2xl mx-auto mb-12">
            Discover projects already building on Mezo.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {ecosystem.map((project) => (
              <div key={project.name} className="group rounded-2xl bg-card border border-border p-6 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-lg bg-gradient-hero flex items-center justify-center">
                    <span className="text-primary-foreground font-bold text-sm font-display">{project.name[0]}</span>
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-foreground">{project.name}</h3>
                    <span className="text-xs text-muted-foreground">{project.category}</span>
                  </div>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">{project.description}</p>
                <a href="#" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary group-hover:gap-2 transition-all">
                  Explore <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Programs */}
      <section className="py-20 bg-secondary/50">
        <div className="container">
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-center text-foreground mb-4">Builder Programs</h2>
          <p className="text-center text-muted-foreground text-lg max-w-2xl mx-auto mb-16">
            Resources and support to help you succeed on Mezo.
          </p>
          <div className="grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {programs.map((item) => (
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

export default Build;
