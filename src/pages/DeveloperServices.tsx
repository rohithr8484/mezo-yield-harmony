import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Activity, Database, Lock, Play, Wallet, Bitcoin, Sparkles, FileText, ShieldCheck } from "lucide-react";
import { useAccount, useSwitchChain } from "wagmi";
import { parseUnits, parseEther } from "viem";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { toast } from "sonner";
import { payWithMUSD } from "@/lib/musdPayment";
import { payWithMEZO } from "@/lib/mezoPayment";
import { payWithBTC } from "@/lib/btcPayment";
import PageLayout from "@/components/PageLayout";

const GOV_CHAIN_ID = 31611;
const GOV_RECIPIENT = "0x000000000000000000000000000000000000dEaD" as `0x${string}`;
const GOV_MUSD = "0x94FF830F078eb9c6e77bADe29FB46B1a249A5fd3" as `0x${string}`;
const GOV_MEZO = "0x7B7c000000000000000000000000000000000001" as `0x${string}`;
import { PaymentGate } from "@/components/developer/PaymentGate";
import { TransactionLookup } from "@/components/developer/TransactionLookup";
import { RunSection } from "@/components/developer/RunSection";

import { PriceFeedChart } from "@/components/developer/PriceFeedChart";
import { VeNFTMarketplace } from "@/components/developer/VeNFTMarketplace";
import { AIReviewAnalyzer } from "@/components/developer/AIReviewAnalyzer";
import { AITextSummarizer } from "@/components/developer/AITextSummarizer";
import { X402Banner } from "@/components/developer/X402Banner";

const dataFeeds = [
  { name: "MUSD / USD", feedId: "0x0617a9b725011a126a2b9fd53563f4236501f32cf76d877644b943394606c6de" },
  { name: "BTC / USD", feedId: "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43" },
  { name: "cbBTC / USD", feedId: "0x2817d7bfe5c64b8ea956e9a26f573ef64e72e4d7891f2d6af9bcc93f7aff9a97" },
];

const DeveloperServices = () => {
  const [paidServices, setPaidServices] = useState<Record<string, boolean>>(() => {
    try {
      const stored = window.localStorage.getItem("developer_paid_services");
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });
  const location = useLocation();
  const navigate = useNavigate();

  const markPaid = (key: string) => {
    setPaidServices((prev) => ({ ...prev, [key]: true }));
    if (key === "governance") {
      setTimeout(() => navigate("/governance"), 600);
    }
  };

  const { isConnected, chainId, connector } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { switchChainAsync } = useSwitchChain();
  const [govPending, setGovPending] = useState<"MUSD" | "MEZO" | "BTC" | null>(null);

  const handleGovPay = async (token: "MUSD" | "MEZO" | "BTC") => {
    if (govPending) return;
    if (!isConnected) {
      openConnectModal?.();
      return;
    }
    setGovPending(token);
    try {
      if (chainId !== GOV_CHAIN_ID) {
        await switchChainAsync({ chainId: GOV_CHAIN_ID });
      }
      let txHash: `0x${string}`;
      if (token === "BTC") {
        const { stakeHash } = await payWithBTC(parseEther("0.01"));
        txHash = stakeHash as `0x${string}`;
      } else if (token === "MUSD") {
        const { stakeHash } = await payWithMUSD(parseUnits("0.01", 18), "0.5");
        txHash = stakeHash as `0x${string}`;
      } else {
        const { stakeHash } = await payWithMEZO(parseUnits("0.01", 18));
        txHash = stakeHash as `0x${string}`;
      }
      toast.success(`Paid via ${connector?.name ?? "wallet"} in ${token}. Tx: ${txHash.slice(0, 10)}...`);
      setTimeout(() => navigate("/governance"), 600);
    } catch (error) {
      const msg = error instanceof Error ? error.message.toLowerCase() : "";
      const rejected = msg.includes("rejected") || msg.includes("denied") || msg.includes("cancelled");
      toast.error(rejected ? "Payment cancelled." : "Payment failed. Please try again.");
    } finally {
      setGovPending(null);
    }
  };

  useEffect(() => {
    window.localStorage.setItem("developer_paid_services", JSON.stringify(paidServices));
  }, [paidServices]);

  useEffect(() => {
    if (location.hash) {
      const el = document.querySelector(location.hash);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  }, [location]);

  return (
    <PageLayout>
      {/* Hero */}
      <section className="relative py-20 md:py-28 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/4 h-72 w-72 rounded-full bg-primary/20 blur-3xl animate-blob" />
          <div
            className="absolute bottom-0 right-1/4 h-80 w-80 rounded-full bg-bitcoin/20 blur-3xl animate-blob"
            style={{ animationDelay: "4s" }}
          />
        </div>
        <div className="container text-center">
          <span className="inline-block px-4 py-1.5 rounded-full glass-card text-sm font-medium text-muted-foreground mb-6 animate-fade-in">
            ⚡ Mezo Developer Infrastructure Services
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-display font-bold leading-tight animate-fade-in-up">
            <span className="text-foreground">Infrastructure for </span>
            <span className="text-gradient-animated italic">Bitcoin DeFi</span>
          </h1>
          <p
            className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto animate-fade-in-up"
            style={{ animationDelay: "0.15s" }}
          >
            APIs, oracles, compute, and analytics — all priced in MEZO. Like AWS for Web3, powered by Bitcoin.
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
            Pay-per-use APIs — analytics, identity, governance data — all priced in MEZO.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {/* AI Sentiment + Review Analyzer */}
            <div className="rounded-2xl bg-primary/5 border border-primary/20 p-8 shadow-card hover:shadow-card-hover transition-all duration-300">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-5">
                <Sparkles className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="text-lg font-display font-semibold text-foreground mb-2">
                AI Sentiment + Review Analyzer
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-3">
                Score sentiment, extract pros/cons, and summarize customer reviews.
              </p>
              <span className="inline-block px-3 py-1 rounded-full bg-bitcoin/10 text-bitcoin text-xs font-bold mb-4">
                pay with 0.2MUSD/0.2MEZO/0.0001BTC / analysis
              </span>
              <PaymentGate
                serviceName="AI Sentiment Analyzer"
                onPaymentSuccess={() => markPaid("ai-sentiment")}
                isPaid={!!paidServices["ai-sentiment"]}
              >
                <AIReviewAnalyzer />
              </PaymentGate>
            </div>

            {/* AI Text Summarization */}
            <div className="rounded-2xl bg-bitcoin/5 border border-bitcoin/20 p-8 shadow-card hover:shadow-card-hover transition-all duration-300">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-bitcoin to-primary flex items-center justify-center mb-5">
                <FileText className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="text-lg font-display font-semibold text-foreground mb-2">AI Text Summarization</h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-3">
                Condense long articles, docs, and threads into a concise summary with key bullet points.
              </p>
              <span className="inline-block px-3 py-1 rounded-full bg-bitcoin/10 text-bitcoin text-xs font-bold mb-4">
                pay with 0.2MUSD/0.2MEZO/0.0001BTC / summary
              </span>
              <PaymentGate
                serviceName="AI Text Summarizer"
                onPaymentSuccess={() => markPaid("ai-summarize")}
                isPaid={!!paidServices["ai-summarize"]}
              >
                <AITextSummarizer />
              </PaymentGate>
            </div>

            {/* On-chain Analytics API */}
            <div className="rounded-2xl bg-secondary border border-border p-8 shadow-card hover:shadow-card-hover transition-all duration-300">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-5">
                <Activity className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="text-lg font-display font-semibold text-foreground mb-2">On-chain Analytics API</h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-3">
                Enter any transaction hash to fetch full details — status, gas, token transfers, decoded input.
              </p>
              <span className="inline-block px-3 py-1 rounded-full bg-bitcoin/10 text-bitcoin text-xs font-bold mb-4">
                pay with MUSD/MEZO/BTC / call
              </span>
              <PaymentGate
                serviceName="On-chain Analytics"
                onPaymentSuccess={() => markPaid("analytics")}
                isPaid={!!paidServices["analytics"]}
              >
                <TransactionLookup title="On-chain Analytics" icon={Activity} />
              </PaymentGate>
            </div>

            {/* Identity Verification API */}
            <div className="rounded-2xl bg-primary/10 border border-primary/30 p-8 shadow-card hover:shadow-card-hover transition-all duration-300">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-bitcoin flex items-center justify-center mb-5">
                <Database className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="text-lg font-display font-semibold text-foreground mb-2">Identity Verification API</h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-3">
                Verify wallet identity via on-chain attestations. Enter transaction hash to inspect verification
                records.
              </p>
              <span className="inline-block px-3 py-1 rounded-full bg-bitcoin/10 text-bitcoin text-xs font-bold mb-4">
                pay with MUSD/MEZO/BTC / check
              </span>
              <PaymentGate
                serviceName="Identity Verification"
                onPaymentSuccess={() => markPaid("identity")}
                isPaid={!!paidServices["identity"]}
              >
                <TransactionLookup title="Identity Verification" icon={Database} />
              </PaymentGate>
            </div>

            {/* Run */}
            <div className="rounded-2xl bg-bitcoin/10 border border-bitcoin/30 p-8 shadow-card hover:shadow-card-hover transition-all duration-300">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-bitcoin to-accent flex items-center justify-center mb-5">
                <Play className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="text-lg font-display font-semibold text-foreground mb-2">Run</h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-3">
                Upload contracts, run simulations, deploy AI models, and index data — AI explains risks and attack
                vectors.
              </p>
              <span className="inline-block px-3 py-1 rounded-full bg-bitcoin/10 text-bitcoin text-xs font-bold mb-4">
                Pay-per-run
              </span>
              <PaymentGate
                serviceName="Run Services"
                onPaymentSuccess={() => markPaid("run")}
                isPaid={!!paidServices["run"]}
              >
                <RunSection />
              </PaymentGate>
            </div>
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
            Real-time price feeds with charts. Pay to unlock live data and graphs.
          </p>
          <div className="max-w-3xl mx-auto space-y-6">
            {dataFeeds.map((feed) => (
              <div
                key={feed.name}
                className="rounded-2xl bg-card border border-border p-8 shadow-card hover:shadow-card-hover transition-all duration-300"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                    <Activity className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <h3 className="text-xl font-display font-semibold text-foreground">{feed.name}</h3>
                </div>
                <div className="bg-secondary/60 rounded-lg p-3 mb-4">
                  <p className="text-xs text-muted-foreground mb-1">Feed ID</p>
                  <p className="font-mono text-xs text-foreground break-all select-all">{feed.feedId}</p>
                </div>
                <div className="mb-4">
                  <X402Banner uniform />
                </div>
                <PaymentGate
                  serviceName={`${feed.name} Oracle`}
                  onPaymentSuccess={() => markPaid(`feed-v2-${feed.name}`)}
                  isPaid={!!paidServices[`feed-v2-${feed.name}`]}
                  uniform
                >
                  <PriceFeedChart feedName={feed.name} />
                </PaymentGate>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* veNFT Marketplace */}
      <section className="py-20 bg-secondary/50" id="venft-marketplace">
        <div className="container">
          <div className="text-center mb-4">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-bitcoin/10 text-bitcoin text-xs font-bold mb-4">
              <Lock className="h-3 w-3" /> Vote-Escrowed Positions
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-center text-foreground mb-4">
            veMEZO Marketplace
          </h2>
          <p className="text-center text-muted-foreground text-lg max-w-2xl mx-auto mb-12">
            Buy already-locked veMEZO positions from the Mezo ecosystem at market rates — escrowless P2P, on-chain
            settlement.
          </p>
          <div className="max-w-6xl mx-auto rounded-2xl bg-card border border-border p-8 shadow-card">
            <PaymentGate
              serviceName="veNFT Marketplace"
              onPaymentSuccess={() => markPaid("venft")}
              isPaid={!!paidServices["venft"]}
            >
              <VeNFTMarketplace />
            </PaymentGate>
          </div>
        </div>
      </section>

      {/* Governance intro */}
      <section className="py-16">
        <div className="container">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-center text-foreground mb-4">
            Governance
          </h2>
          <p className="text-center text-muted-foreground text-lg max-w-2xl mx-auto mb-10">
            Shape the future of Bitcoin finance through decentralized governance.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <button
              onClick={() => handleGovPay("MUSD")}
              disabled={!!govPending}
              className="px-5 py-2.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 shadow-card flex items-center gap-2"
            >
              <Wallet className="h-4 w-4" />
              {govPending === "MUSD" ? "Confirming..." : "Pay with MUSD"}
            </button>
            <button
              onClick={() => handleGovPay("MEZO")}
              disabled={!!govPending}
              className="px-5 py-2.5 rounded-full bg-gradient-to-r from-primary to-accent text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 shadow-card flex items-center gap-2"
            >
              <Wallet className="h-4 w-4" />
              {govPending === "MEZO" ? "Confirming..." : "Pay with MEZO"}
            </button>
            <button
              onClick={() => handleGovPay("BTC")}
              disabled={!!govPending}
              className="px-5 py-2.5 rounded-full bg-gradient-to-r from-bitcoin to-amber-600 text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 shadow-card flex items-center gap-2"
            >
              <Bitcoin className="h-4 w-4" />
              {govPending === "BTC" ? "Confirming..." : "Pay with BTC"}
            </button>
          </div>
          <p className="text-center text-xs text-muted-foreground mt-4">
            Settles on Mezo Testnet (Chain ID 31611), then opens Governance.
          </p>
        </div>
      </section>
    </PageLayout>
  );
};

export default DeveloperServices;
