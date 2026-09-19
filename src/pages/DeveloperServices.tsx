import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Activity, Database, Lock, Play, Wallet, Bitcoin, Sparkles, FileText, ShieldCheck, Radio, Layers3, Network } from "lucide-react";
import { useAccount, useSwitchChain } from "wagmi";
import { parseUnits, parseEther } from "viem";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { toast } from "sonner";
import { payWithMUSD } from "@/lib/musdPayment";
import { payWithMEZO } from "@/lib/mezoPayment";
import { payWithBTC } from "@/lib/btcPayment";
import PageLayout from "@/components/PageLayout";
import { Button } from "@/components/ui/button";

const GOV_CHAIN_ID = 31611;
const GOV_RECIPIENT = "0x000000000000000000000000000000000000dEaD" as `0x${string}`;
const GOV_MUSD = "0x94FF830F078eb9c6e77bADe29FB46B1a249A5fd3" as `0x${string}`;
const GOV_MEZO = "0x7B7c000000000000000000000000000000000001" as `0x${string}`;
const FREE_GOVERNANCE_ENTRIES = 4;
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

  const { isConnected, chainId, connector, address } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { switchChainAsync } = useSwitchChain();
  const [govPending, setGovPending] = useState<"MUSD" | "MEZO" | "BTC" | null>(null);
  const [freeGovEntriesUsed, setFreeGovEntriesUsed] = useState(0);
  const paymentButtonClass =
    "rounded-full bg-gradient-to-r from-primary via-magenta to-accent text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 shadow-card";
  const governanceFreeKey = `developer_free_entries_v1:${address?.toLowerCase() ?? "guest"}:Governance`;
  const freeGovEntriesRemaining = Math.max(0, FREE_GOVERNANCE_ENTRIES - freeGovEntriesUsed);

  const handleFreeGovernanceEntry = () => {
    if (!isConnected) {
      openConnectModal?.();
      return;
    }
    if (freeGovEntriesRemaining <= 0) {
      toast.error("Free Governance entries used. Please pay to continue.");
      return;
    }
    const nextUsed = freeGovEntriesUsed + 1;
    setFreeGovEntriesUsed(nextUsed);
    try {
      window.localStorage.setItem(governanceFreeKey, String(nextUsed));
    } catch {
      // Keep the UI responsive even if browser storage is unavailable.
    }
    toast.success(`Free Governance entry activated. ${FREE_GOVERNANCE_ENTRIES - nextUsed} left.`);
    setTimeout(() => navigate("/governance"), 300);
  };

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
    try {
      const stored = window.localStorage.getItem(governanceFreeKey);
      setFreeGovEntriesUsed(stored ? Math.min(Number(stored) || 0, FREE_GOVERNANCE_ENTRIES) : 0);
    } catch {
      setFreeGovEntriesUsed(0);
    }
  }, [governanceFreeKey]);

  useEffect(() => {
    if (location.hash) {
      const el = document.querySelector(location.hash);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  }, [location]);

  return (
    <PageLayout>
      <div className="ops-page">
      {/* Hero */}
      <section className="relative overflow-hidden py-10 md:py-14">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px ops-scan" />
        <div className="container">
          <div className="ops-shell overflow-hidden rounded-lg">
            <div className="grid lg:grid-cols-[1fr_auto]">
              <div className="p-6 md:p-10">
                <div className="mb-5 flex items-center gap-3 text-xs font-bold uppercase text-accent">
                  <span className="ops-status-dot" />
                  Mezo Testnet operations online
                </div>
                <h1 className="max-w-4xl text-4xl font-display font-bold leading-tight md:text-6xl animate-fade-in-up">
                  Developer infrastructure <span className="text-gradient">control room</span>
                </h1>
                <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg animate-fade-in-up">
                  APIs, oracles, compute, analytics, and governance access from one live workspace.
                </p>
              </div>
              <div className="grid min-w-[290px] grid-cols-2 border-t border-border/70 bg-secondary/30 lg:grid-cols-1 lg:border-l lg:border-t-0">
                <div className="flex items-center gap-3 border-b border-r border-border/70 p-5 lg:border-r-0">
                  <Network className="h-5 w-5 text-accent" />
                  <div><p className="text-[10px] font-bold uppercase text-muted-foreground">Network</p><p className="font-display font-semibold">Chain 31611</p></div>
                </div>
                <div className="flex items-center gap-3 border-b border-border/70 p-5">
                  <Layers3 className="h-5 w-5 text-primary" />
                  <div><p className="text-[10px] font-bold uppercase text-muted-foreground">Access</p><p className="font-display font-semibold">4 free entries</p></div>
                </div>
                <div className="col-span-2 flex items-center gap-3 p-5 lg:col-span-1">
                  <Radio className="h-5 w-5 text-bitcoin" />
                  <div><p className="text-[10px] font-bold uppercase text-muted-foreground">Settlement</p><p className="font-display font-semibold">MUSD · MEZO · BTC</p></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* API Marketplace */}
      <section className="py-16" id="api-marketplace">
        <div className="container">
          <div className="mb-10 flex flex-col gap-3 border-l-2 border-accent pl-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-2 text-xs font-bold uppercase text-accent">01 / Service registry</p>
              <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground">API Marketplace</h2>
            </div>
            <p className="max-w-xl text-muted-foreground md:text-right">
              Pay-per-use APIs — analytics, identity, and governance data with 4 free entries per user.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
            {/* AI Sentiment + Review Analyzer */}
            <div className="ops-card p-7">
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
                4 free entries per user · pay per analysis after
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
            <div className="ops-card p-7">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-bitcoin to-primary flex items-center justify-center mb-5">
                <FileText className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="text-lg font-display font-semibold text-foreground mb-2">AI Text Summarization</h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-3">
                Condense long articles, docs, and threads into a concise summary with key bullet points.
              </p>
              <span className="inline-block px-3 py-1 rounded-full bg-bitcoin/10 text-bitcoin text-xs font-bold mb-4">
                4 free entries per user · pay per summary after
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
            <div className="ops-card p-7">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-5">
                <Activity className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="text-lg font-display font-semibold text-foreground mb-2">On-chain Analytics API</h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-3">
                Enter any transaction hash to fetch full details — status, gas, token transfers, decoded input.
              </p>
              <span className="inline-block px-3 py-1 rounded-full bg-bitcoin/10 text-bitcoin text-xs font-bold mb-4">
                4 free entries per user · pay per call after
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
            <div className="ops-card p-7">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-bitcoin flex items-center justify-center mb-5">
                <Database className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="text-lg font-display font-semibold text-foreground mb-2">Identity Verification API</h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-3">
                Verify wallet identity via on-chain attestations. Enter transaction hash to inspect verification
                records.
              </p>
              <span className="inline-block px-3 py-1 rounded-full bg-bitcoin/10 text-bitcoin text-xs font-bold mb-4">
                4 free entries per user · pay per check after
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
            <div className="ops-card p-7">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-bitcoin to-accent flex items-center justify-center mb-5">
                <Play className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="text-lg font-display font-semibold text-foreground mb-2">Run</h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-3">
                Upload contracts, run simulations, deploy AI models, and index data — AI explains risks and attack
                vectors.
              </p>
              <span className="inline-block px-3 py-1 rounded-full bg-bitcoin/10 text-bitcoin text-xs font-bold mb-4">
                4 free entries per user · pay per run after
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
          <div className="mb-10 flex flex-col gap-3 border-l-2 border-primary pl-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-2 text-xs font-bold uppercase text-primary">02 / Oracle network</p>
              <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground">Data Feeds / Oracles</h2>
            </div>
            <p className="max-w-xl text-muted-foreground md:text-right">
              Real-time price feeds with charts. Each user gets 4 free feed unlocks before paid access.
            </p>
          </div>
          <div className="max-w-3xl mx-auto space-y-6">
            {dataFeeds.map((feed) => (
               <div
                key={feed.name}
                 className="ops-card p-7"
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
      <section className="py-20 border-y border-border/50 bg-secondary/20" id="venft-marketplace">
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
            settlement with free starter access per user.
          </p>
          <div className="max-w-6xl mx-auto ops-card p-8">
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
      <section className="py-16" id="governance-analytics">
        <div className="container">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-center text-foreground mb-4">
            Governance
          </h2>
          <p className="text-center text-muted-foreground text-lg max-w-2xl mx-auto mb-10">
            Shape the future of Bitcoin finance through decentralized governance. Each user gets 4 free entries.
          </p>
          <div className="flex justify-center mb-4">
            <Button
              onClick={handleFreeGovernanceEntry}
              className="rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 text-sm font-semibold shadow-card"
            >
              Use free Governance entry ({freeGovEntriesRemaining} left)
            </Button>
          </div>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button
              onClick={() => handleGovPay("MUSD")}
              disabled={!!govPending}
              className={paymentButtonClass}
            >
              <Wallet className="h-4 w-4" />
              {govPending === "MUSD" ? "Confirming..." : "Pay with MUSD"}
            </Button>
            <Button
              onClick={() => handleGovPay("MEZO")}
              disabled={!!govPending}
              className={paymentButtonClass}
            >
              <Wallet className="h-4 w-4" />
              {govPending === "MEZO" ? "Confirming..." : "Pay with MEZO"}
            </Button>
            <Button
              onClick={() => handleGovPay("BTC")}
              disabled={!!govPending}
              className={paymentButtonClass}
            >
              <Bitcoin className="h-4 w-4" />
              {govPending === "BTC" ? "Confirming..." : "Pay with BTC"}
            </Button>
          </div>
          <p className="text-center text-xs text-muted-foreground mt-4">
            Settles on Mezo Testnet (Chain ID 31611), then opens Governance.
          </p>
        </div>
      </section>
      </div>
    </PageLayout>
  );
};

export default DeveloperServices;
