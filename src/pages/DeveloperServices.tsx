import { useState, useEffect } from "react";
import { Database, Activity, Server, Wallet, Zap, HardDrive, Cloud, Cpu, ExternalLink } from "lucide-react";
import { useAccount, useSwitchChain, useWriteContract } from "wagmi";
import { parseUnits } from "viem";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { toast } from "sonner";
import PageLayout from "@/components/PageLayout";
import { ERC20_ABI } from "@/lib/mezo";

const MEZO_TESTNET_CHAIN_ID = 31611;
const FEE_RECIPIENT = "0x000000000000000000000000000000000000dEaD" as `0x${string}`;
const MUSD_TOKEN = "0x94FF830F078eb9c6e77bADe29FB46B1a249A5fd3" as `0x${string}`;
const MEZO_TOKEN = "0x7B7c000000000000000000000000000000000001" as `0x${string}`;

// --- Data ---
const apiServices = [
  { name: "AI Inference API", description: "GPT-class language models, image generation, embeddings — pay per request in MEZO.", price: "0.01 MEZO / call", icon: Cpu },
  { name: "On-chain Analytics API", description: "Indexed Mezo blockchain data — balances, tx history, token transfers, contract events.", price: "0.005 MEZO / call", icon: Activity },
  { name: "IPFS Pinning API", description: "Pin and retrieve files on IPFS with guaranteed availability, billed per GB-month.", price: "0.1 MEZO / GB", icon: Cloud },
  { name: "Identity Verification API", description: "KYC/AML verification for DeFi protocols — on-chain attestation included.", price: "0.5 MEZO / check", icon: Database },
];

const dataFeeds = [
  { name: "MUSD / USD", feedId: "0x0617a9b725011a126a2b9fd53563f4236501f32cf76d877644b943394606c6de" },
  { name: "BTC / USD", feedId: "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43" },
  { name: "cbBTC / USD", feedId: "0x2817d7bfe5c64b8ea956e9a26f573ef64e72e4d7891f2d6af9bcc93f7aff9a97" },
];

const infraServices = [
  { name: "Mezo Full Node", description: "Dedicated RPC node with 99.9% uptime SLA. Private endpoint, no rate limits.", price: "5 MEZO / month", icon: Server },
  { name: "Decentralised Storage", description: "Encrypted, redundant file storage across the Mezo network. S3-compatible API.", price: "0.05 MEZO / GB", icon: HardDrive },
  { name: "Serverless Compute", description: "Run WASM or EVM functions triggered by on-chain events. Like AWS Lambda for Web3.", price: "0.002 MEZO / exec", icon: Zap },
];

// --- Payment Button Component ---
const PaymentButtons = ({ serviceName, fee }: { serviceName: string; fee: string }) => {
  const { isConnected, chainId, connector } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { switchChainAsync, isPending: isSwitching } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  const [pending, setPending] = useState<"MUSD" | "MEZO" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const connectedWalletName = connector?.name ?? "Wallet";

  const handlePay = async (token: "MUSD" | "MEZO") => {
    if (isSubmitting) return;

    if (!isConnected) {
      setPending(token);
      openConnectModal?.();
      return;
    }

    setPending(token);
    setIsSubmitting(true);
    try {
      if (chainId !== MEZO_TESTNET_CHAIN_ID) {
        await switchChainAsync({ chainId: MEZO_TESTNET_CHAIN_ID });
      }
      const tokenAddr = token === "MUSD" ? MUSD_TOKEN : MEZO_TOKEN;
      const txHash = await writeContractAsync({
        address: tokenAddr,
        abi: ERC20_ABI,
        functionName: "transfer",
        args: [FEE_RECIPIENT, parseUnits("0.2", 18)],
        chainId: MEZO_TESTNET_CHAIN_ID,
      });
      toast.success(`Payment for ${serviceName} confirmed via ${connectedWalletName}. Tx: ${txHash.slice(0, 10)}...`);
    } catch (error) {
      const msg = error instanceof Error ? error.message.toLowerCase() : "";
      const rejected = msg.includes("rejected") || msg.includes("denied") || msg.includes("cancelled");
      toast.error(rejected ? `Transfer cancelled in ${connectedWalletName}.` : `Payment failed. Please try again.`);
    } finally {
      setIsSubmitting(false);
      setPending(null);
    }
  };

  useEffect(() => {
    if (isConnected && pending && !isSubmitting) {
      toast.info(`Connected. Click "Pay with ${pending}" again to complete.`);
      setPending(null);
    }
  }, [isConnected, pending, isSubmitting]);

  const isProcessing = isSubmitting || isSwitching;

  return (
    <div className="mt-4 space-y-3">
      <p className="text-xs text-muted-foreground text-center">
        Open a wallet transfer request on Mezo Testnet to pay 0.2 and activate service.
      </p>
      <div className="flex gap-3 justify-center">
        <button
          onClick={() => handlePay("MUSD")}
          disabled={isProcessing}
          className="px-5 py-2.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
        >
          <Wallet className="h-4 w-4" />
          {pending === "MUSD" && isProcessing ? "Confirming..." : "Pay with MUSD"}
        </button>
        <button
          onClick={() => handlePay("MEZO")}
          disabled={isProcessing}
          className="px-5 py-2.5 rounded-full bg-gradient-to-r from-primary to-accent text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
        >
          <Wallet className="h-4 w-4" />
          {pending === "MEZO" && isProcessing ? "Confirming..." : "Pay with MEZO"}
        </button>
      </div>
      <div className="text-center space-y-1">
        <p className="text-[10px] font-mono text-muted-foreground">MUSD contract: {MUSD_TOKEN}</p>
        <p className="text-[10px] font-mono text-muted-foreground">MEZO contract: {MEZO_TOKEN}</p>
        <p className="text-[10px] text-muted-foreground">Required network: Mezo Testnet (Chain ID: {MEZO_TESTNET_CHAIN_ID})</p>
      </div>
    </div>
  );
};

// --- Page ---
const DeveloperServices = () => {
  return (
    <PageLayout>
      {/* Hero */}
      <section className="py-20 md:py-28">
        <div className="container text-center">
          <span className="inline-block px-4 py-1.5 rounded-full border border-border bg-card text-sm font-medium text-muted-foreground mb-6">
            ⚡ Mezo Developer Infrastructure Services
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-display font-bold leading-tight">
            <span className="text-foreground">Infrastructure for </span>
            <span className="text-gradient italic">Bitcoin DeFi</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            APIs, oracles, nodes, storage, and compute — all priced in MEZO. Like AWS for Web3, powered by Bitcoin.
          </p>
        </div>
      </section>

      {/* API Marketplace */}
      <section className="py-20 bg-secondary/50" id="api-marketplace">
        <div className="container">
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-center text-foreground mb-4">
            API Marketplace
          </h2>
          <p className="text-center text-muted-foreground text-lg max-w-2xl mx-auto mb-12">
            Pay-per-use APIs — AI, data tools, identity — all priced in MEZO.
          </p>
          <div className="grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {apiServices.map((svc) => (
              <div key={svc.name} className="rounded-2xl bg-card border border-border p-8 shadow-card hover:shadow-card-hover transition-all duration-300">
                <div className="flex items-start gap-4 mb-4">
                  <div className="h-12 w-12 rounded-xl bg-gradient-hero flex items-center justify-center shrink-0">
                    <svc.icon className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="text-lg font-display font-semibold text-foreground">{svc.name}</h3>
                    <p className="text-muted-foreground text-sm mt-1 leading-relaxed">{svc.description}</p>
                    <span className="inline-block mt-2 px-3 py-1 rounded-full bg-bitcoin/10 text-bitcoin text-xs font-bold">
                      {svc.price}
                    </span>
                  </div>
                </div>
                <PaymentButtons serviceName={svc.name} fee="0.2" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Data Feeds / Oracles */}
      <section className="py-20" id="data-feeds">
        <div className="container">
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-center text-foreground mb-4">
            Data Feeds / Oracles
          </h2>
          <p className="text-center text-muted-foreground text-lg max-w-2xl mx-auto mb-12">
            Real-time price feeds for Mezo DeFi applications. Subscribe with MEZO.
          </p>
          <div className="max-w-3xl mx-auto space-y-6">
            {dataFeeds.map((feed) => (
              <div key={feed.name} className="rounded-2xl bg-card border border-border p-8 shadow-card hover:shadow-card-hover transition-all duration-300">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-lg bg-gradient-hero flex items-center justify-center">
                    <Activity className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <h3 className="text-xl font-display font-semibold text-foreground">{feed.name}</h3>
                </div>
                <div className="bg-secondary/60 rounded-lg p-3 mb-2">
                  <p className="text-xs text-muted-foreground mb-1">Feed ID</p>
                  <p className="font-mono text-xs text-foreground break-all select-all">{feed.feedId}</p>
                </div>
                <PaymentButtons serviceName={`${feed.name} Oracle`} fee="0.2" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Infrastructure Services */}
      <section className="py-20 bg-secondary/50" id="infrastructure">
        <div className="container">
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-center text-foreground mb-4">
            Infrastructure Services
          </h2>
          <p className="text-center text-muted-foreground text-lg max-w-2xl mx-auto mb-12">
            Nodes, storage, compute → all billed in MEZO. Like AWS for Web3.
          </p>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {infraServices.map((svc) => (
              <div key={svc.name} className="rounded-2xl bg-card border border-border p-8 shadow-card hover:shadow-card-hover transition-all duration-300">
                <div className="h-12 w-12 rounded-xl bg-gradient-hero flex items-center justify-center mb-5">
                  <svc.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="text-lg font-display font-semibold text-foreground mb-2">{svc.name}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed mb-3">{svc.description}</p>
                <span className="inline-block px-3 py-1 rounded-full bg-bitcoin/10 text-bitcoin text-xs font-bold mb-2">
                  {svc.price}
                </span>
                <PaymentButtons serviceName={svc.name} fee="0.2" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default DeveloperServices;
