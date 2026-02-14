import PageLayout from "@/components/PageLayout";
import { Code2, Layers, Zap, GitBranch, Terminal, BookOpen, Cpu, Network, ArrowRight } from "lucide-react";
import { useAccount, useReadContract } from "wagmi";
import { formatUnits } from "viem";
import { CONTRACTS, ERC20_ABI } from "@/lib/mezo";

const infra = [
  { icon: Code2, title: "Smart Contract SDK", description: "Comprehensive SDK for building and deploying Bitcoin-native smart contracts. Supports Rust, TypeScript, and Solidity." },
  { icon: Layers, title: "Modular Architecture", description: "Composable infrastructure modules — plug in lending, swaps, oracles, and more to build custom DeFi apps." },
  { icon: Zap, title: "Sub-second Finality", description: "Optimistic rollup technology delivers near-instant transaction finality for a seamless user experience." },
  { icon: GitBranch, title: "Open Source", description: "Fully open-source codebase. Audit, fork, contribute — build with complete transparency." },
  { icon: Cpu, title: "Bitcoin VM", description: "Purpose-built virtual machine optimized for Bitcoin DeFi operations with native BTC support." },
  { icon: Network, title: "Cross-chain Interop", description: "Built-in bridges and messaging via Wormhole NTT for seamless MUSD transfers to Ethereum." },
];

const resources = [
  { icon: Terminal, title: "CLI Tools", description: "mezo-cli for project scaffolding, deployment, testing, and network interaction.", link: "Install CLI" },
  { icon: BookOpen, title: "Documentation", description: "Comprehensive guides, API references, tutorials, and architecture deep-dives.", link: "Read Docs", url: "https://mezo.org/docs" },
  { icon: GitBranch, title: "NPM Package", description: "@mezo-org/contracts — official contract ABIs and addresses for mainnet and testnet.", link: "View Package", url: "https://www.npmjs.com/package/@mezo-org/contracts" },
];

const codeExample = `// Deploy on Mezo Testnet (Chain ID: 31611)
import { createPublicClient, http } from 'viem';

const mezoTestnet = {
  id: 31611,
  name: 'Mezo Testnet',
  rpcUrls: { default: { http: ['https://rpc.test.mezo.org'] } },
  nativeCurrency: { name: 'Bitcoin', symbol: 'BTC', decimals: 18 },
};

const client = createPublicClient({
  chain: mezoTestnet,
  transport: http(),
});

// Read MUSD total supply
const supply = await client.readContract({
  address: '0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503',
  abi: [{ name: 'totalSupply', type: 'function', stateMutability: 'view',
    inputs: [], outputs: [{ type: 'uint256' }] }],
  functionName: 'totalSupply',
});`;

const Developer = () => {
  const { isConnected, address } = useAccount();

  const { data: musdSupply } = useReadContract({
    address: CONTRACTS.testnet.MUSD,
    abi: ERC20_ABI,
    functionName: "totalSupply",
    chainId: 31611,
  });

  const { data: musdName } = useReadContract({
    address: CONTRACTS.testnet.MUSD,
    abi: ERC20_ABI,
    functionName: "name",
    chainId: 31611,
  });

  const { data: musdSymbol } = useReadContract({
    address: CONTRACTS.testnet.MUSD,
    abi: ERC20_ABI,
    functionName: "symbol",
    chainId: 31611,
  });

  return (
    <PageLayout>
      {/* Hero */}
      <section className="py-20 md:py-28">
        <div className="container text-center">
          <span className="inline-block px-4 py-1.5 rounded-full border border-border bg-card text-sm font-medium text-muted-foreground mb-6">
            🔗 Mezo Testnet · Developer Infrastructure
          </span>
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-display font-bold leading-tight">
            <span className="text-foreground">Build on </span>
            <span className="text-gradient italic">Bitcoin</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            Mezo provides the infrastructure mechanisms powering the next generation of Bitcoin applications. Deploy on testnet now.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <a
              href="https://mezo.org/docs/developers/getting-started/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-3.5 rounded-full bg-foreground text-background text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Read Docs ↗
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

      {/* Live Testnet Data */}
      <section className="py-20 bg-secondary/50">
        <div className="container">
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-center text-foreground mb-4">Live Testnet Data</h2>
          <p className="text-center text-muted-foreground text-lg max-w-2xl mx-auto mb-12">
            Real-time contract reads from Mezo Testnet (Chain ID 31611).
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            <div className="text-center rounded-2xl bg-card border border-border p-6 shadow-card">
              <div className="text-lg font-display font-bold text-gradient mb-1">
                {musdName ? String(musdName) : "Loading..."}
              </div>
              <div className="text-xs text-muted-foreground">Token Name</div>
            </div>
            <div className="text-center rounded-2xl bg-card border border-border p-6 shadow-card">
              <div className="text-lg font-display font-bold text-gradient mb-1">
                {musdSymbol ? String(musdSymbol) : "Loading..."}
              </div>
              <div className="text-xs text-muted-foreground">Symbol</div>
            </div>
            <div className="text-center rounded-2xl bg-card border border-border p-6 shadow-card">
              <div className="text-lg font-display font-bold text-gradient mb-1">
                {musdSupply ? parseFloat(formatUnits(musdSupply as bigint, 18)).toLocaleString(undefined, { maximumFractionDigits: 0 }) : "—"}
              </div>
              <div className="text-xs text-muted-foreground">Total Supply</div>
            </div>
            <div className="text-center rounded-2xl bg-card border border-border p-6 shadow-card">
              <div className="text-lg font-display font-bold text-gradient mb-1">31611</div>
              <div className="text-xs text-muted-foreground">Chain ID</div>
            </div>
          </div>

          {/* Contract addresses */}
          <div className="mt-8 max-w-2xl mx-auto rounded-2xl bg-card border border-border p-6 shadow-card">
            <h3 className="text-sm font-semibold text-foreground mb-3">Testnet Contract Addresses</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">MUSD Token</span>
                <a
                  href={`https://explorer.test.mezo.org/token/${CONTRACTS.testnet.MUSD}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-xs text-primary hover:underline"
                >
                  {CONTRACTS.testnet.MUSD.slice(0, 10)}...{CONTRACTS.testnet.MUSD.slice(-8)}
                </a>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Native BTC</span>
                <span className="font-mono text-xs text-foreground">
                  {CONTRACTS.testnet.BTC.slice(0, 10)}...{CONTRACTS.testnet.BTC.slice(-8)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">RPC Endpoint</span>
                <span className="font-mono text-xs text-foreground">https://rpc.test.mezo.org</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Infrastructure */}
      <section className="py-20">
        <div className="container">
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-center text-foreground mb-4">Infrastructure Mechanisms</h2>
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
      <section className="py-20 bg-secondary/50">
        <div className="container">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-center text-foreground mb-4">Ship in Minutes</h2>
            <p className="text-center text-muted-foreground text-lg mb-10">
              Read MUSD supply from Mezo Testnet with viem — the same code powering this page.
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
      <section className="py-20">
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
                <a
                  href={item.url || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm font-semibold text-primary group-hover:gap-2 transition-all"
                >
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
