import PageLayout from "@/components/PageLayout";
import { Code2, Layers, Zap, GitBranch, Terminal, BookOpen, Cpu, Network, ArrowRight } from "lucide-react";

const infra = [
  { icon: Code2, title: "Smart Contract SDK", description: "Comprehensive SDK for building and deploying Bitcoin-native smart contracts. Supports Rust, TypeScript, and Solidity." },
  { icon: Layers, title: "Modular Architecture", description: "Composable infrastructure modules — plug in lending, swaps, oracles, and more to build custom DeFi apps." },
  { icon: Zap, title: "Sub-second Finality", description: "Optimistic rollup technology delivers near-instant transaction finality for a seamless user experience." },
  { icon: GitBranch, title: "Open Source", description: "Fully open-source codebase. Audit, fork, contribute — build with complete transparency." },
  { icon: Cpu, title: "Bitcoin VM", description: "Purpose-built virtual machine optimized for Bitcoin DeFi operations with native BTC support." },
  { icon: Network, title: "Cross-chain Interop", description: "Built-in bridges and messaging for seamless interaction with Ethereum, Cosmos, and other ecosystems." },
];

const resources = [
  { icon: Terminal, title: "CLI Tools", description: "mezo-cli for project scaffolding, deployment, testing, and network interaction.", link: "Install CLI" },
  { icon: BookOpen, title: "Documentation", description: "Comprehensive guides, API references, tutorials, and architecture deep-dives.", link: "Read Docs" },
  { icon: GitBranch, title: "GitHub", description: "Explore repos, submit PRs, report issues, and contribute to the protocol.", link: "View Repos" },
];

const codeExample = `// Deploy a BTC lending pool on Mezo
import { MezoSDK, LendingPool } from '@mezo/sdk';

const sdk = new MezoSDK({ network: 'mainnet' });

const pool = await LendingPool.create({
  collateral: 'BTC',
  borrowAsset: 'MUSD',
  ltv: 0.75,
  interestModel: 'dynamic',
});

await pool.deploy();
console.log('Pool deployed:', pool.address);`;

const Developer = () => {
  return (
    <PageLayout>
      {/* Hero */}
      <section className="py-20 md:py-28">
        <div className="container text-center">
          <span className="inline-block px-4 py-1.5 rounded-full border border-border bg-card text-sm font-medium text-muted-foreground mb-6">
            Developer Infrastructure
          </span>
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-display font-bold leading-tight">
            <span className="text-foreground">Build on </span>
            <span className="text-gradient italic">Bitcoin</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            Mezo provides the infrastructure mechanisms powering the next generation of Bitcoin applications.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <a href="#" className="px-8 py-3.5 rounded-full bg-foreground text-background text-sm font-semibold hover:opacity-90 transition-opacity">
              Start Building
            </a>
            <a href="#" className="px-8 py-3.5 rounded-full border border-border text-foreground text-sm font-semibold hover:bg-secondary transition-colors">
              Read Docs
            </a>
          </div>
        </div>
      </section>

      {/* Infrastructure */}
      <section className="py-20 bg-secondary/50">
        <div className="container">
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-center text-foreground mb-4">
            Infrastructure Mechanisms
          </h2>
          <p className="text-center text-muted-foreground text-lg max-w-2xl mx-auto mb-16">
            Everything you need to build production-ready Bitcoin DeFi applications.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {infra.map((item) => (
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

      {/* Code Example */}
      <section className="py-20">
        <div className="container">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-center text-foreground mb-4">
              Ship in Minutes
            </h2>
            <p className="text-center text-muted-foreground text-lg mb-10">
              Deploy a BTC lending pool in under 15 lines of code.
            </p>
            <div className="rounded-2xl bg-foreground text-background p-6 overflow-x-auto shadow-card">
              <pre className="text-sm font-mono leading-relaxed">
                <code>{codeExample}</code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Resources */}
      <section className="py-20 bg-secondary/50">
        <div className="container">
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-center text-foreground mb-4">Developer Resources</h2>
          <p className="text-center text-muted-foreground text-lg max-w-2xl mx-auto mb-12">
            Tools, docs, and community to accelerate your development.
          </p>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {resources.map((item) => (
              <div key={item.title} className="group rounded-2xl bg-card border border-border p-8 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 text-center">
                <div className="h-12 w-12 rounded-xl bg-bitcoin/10 flex items-center justify-center mb-6 mx-auto">
                  <item.icon className="h-6 w-6 text-bitcoin" />
                </div>
                <h3 className="text-lg font-display font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm mb-4">{item.description}</p>
                <a href="#" className="inline-flex items-center gap-1 text-sm font-semibold text-primary group-hover:gap-2 transition-all">
                  {item.link} <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default Developer;
