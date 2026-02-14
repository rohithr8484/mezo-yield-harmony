import PageLayout from "@/components/PageLayout";
import { Rocket, Globe, Sparkles, Users, ArrowRight, Lightbulb, Handshake, GraduationCap } from "lucide-react";

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
  return (
    <PageLayout>
      {/* Hero */}
      <section className="py-20 md:py-28">
        <div className="container text-center">
          <span className="inline-block px-4 py-1.5 rounded-full border border-border bg-card text-sm font-medium text-muted-foreground mb-6">
            Build on Mezo
          </span>
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-display font-bold leading-tight">
            <span className="text-gradient italic">Build</span>{" "}
            <span className="text-foreground">the Future of Bitcoin</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            Join the growing ecosystem of dApps, protocols, and tools built on Mezo. Grants, resources, and community await.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <a href="#" className="px-8 py-3.5 rounded-full bg-foreground text-background text-sm font-semibold hover:opacity-90 transition-opacity">
              Apply for Grants
            </a>
            <a href="#" className="px-8 py-3.5 rounded-full border border-border text-foreground text-sm font-semibold hover:bg-secondary transition-colors">
              View Ecosystem
            </a>
          </div>
        </div>
      </section>

      {/* Ecosystem */}
      <section className="py-20 bg-secondary/50">
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
      <section className="py-20">
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
