import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Activity, Database, Lock, Play, Wallet, Bitcoin, FileText, ShieldCheck, Radio, Layers3, Network, CheckCircle2, ExternalLink } from "lucide-react";
import { useAccount, useSwitchChain } from "wagmi";
import { parseUnits, parseEther } from "viem";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { toast } from "sonner";
import { payWithMUSD } from "@/lib/musdPayment";
import { payWithMEZO } from "@/lib/mezoPayment";
import { payWithBTC } from "@/lib/btcPayment";
import PageLayout from "@/components/PageLayout";
import { Button } from "@/components/ui/button";
import { ServiceImage, type ServiceImageKind } from "@/components/ServiceImage";

const GOV_CHAIN_ID = 31611;
const GOV_RECIPIENT = "0x000000000000000000000000000000000000dEaD" as `0x${string}`;
const GOV_MUSD = "0x94FF830F078eb9c6e77bADe29FB46B1a249A5fd3" as `0x${string}`;
const GOV_MEZO = "0x7B7c000000000000000000000000000000000001" as `0x${string}`;
const FREE_GOVERNANCE_ENTRIES = 4;
const X402_EXPLORER = "https://explorer.test.mezo.org/tx";
import { PaymentGate } from "@/components/developer/PaymentGate";
import { OnchainAnalytics } from "@/components/developer/OnchainAnalytics";
import { IdentityVerification } from "@/components/developer/IdentityVerification";
import { RunSection } from "@/components/developer/RunSection";

import { PriceFeedChart } from "@/components/developer/PriceFeedChart";
import { VeNFTMarketplace } from "@/components/developer/VeNFTMarketplace";
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
      const saved = stored ? JSON.parse(stored) as Record<string, boolean> : {};
      // Feed and marketplace access lasts until refresh; keep API unlocks as before.
      return Object.fromEntries(Object.entries(saved).filter(([key]) => !key.startsWith("feed-v2-") && key !== "venft"));
    } catch {
      return {};
    }
  });
  const [x402Transactions, setX402Transactions] = useState<Record<string, string>>(() => {
    try {
      const stored = window.localStorage.getItem("developer_x402_transactions");
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

  const markX402Paid = (key: string, txHash?: string) => {
    if (txHash) {
      setX402Transactions((prev) => ({ ...prev, [key]: txHash }));
    }
    markPaid(key);
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
        const { stakeHash } = await payWithMUSD(parseUnits("0.01", 18), "0.0005");
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
    const persistentServices = Object.fromEntries(
      Object.entries(paidServices).filter(([key]) => !key.startsWith("feed-v2-") && key !== "venft"),
    );
    window.localStorage.setItem("developer_paid_services", JSON.stringify(persistentServices));
  }, [paidServices]);

  useEffect(() => {
    window.localStorage.setItem("developer_x402_transactions", JSON.stringify(x402Transactions));
  }, [x402Transactions]);

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
                <div className="ops-kicker mb-5">
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
      <section className="relative py-12 md:py-16" id="api-marketplace">
        <div className="container">
          <div className="overflow-hidden rounded-lg border border-border/80 bg-card/80 shadow-card backdrop-blur-xl">
            <div className="flex flex-col gap-6 border-b border-border/70 bg-secondary/20 p-6 md:flex-row md:items-end md:justify-between md:p-8">
              <div>
                <div className="ops-kicker mb-3">
                  <span className="ops-status-dot" />
                  01 / Service registry
                </div>
                <h2 className="text-3xl font-display font-bold text-foreground sm:text-4xl">AI Services Marketplace</h2>
                <p className="mt-3 max-w-2xl text-base text-muted-foreground">
                  Services for intelligence, analytics, AML screening, and contract security.
                </p>
              </div>
              <div className="grid grid-cols-3 overflow-hidden rounded-lg border border-border/70 bg-background/60 text-center">
                <div className="border-r border-border/70 px-4 py-3">
                  <p className="text-lg font-display font-bold text-foreground">4</p>
                  <p className="text-[10px] font-bold uppercase text-muted-foreground">Services</p>
                </div>
                <div className="border-r border-border/70 px-4 py-3">
                  <p className="text-lg font-display font-bold text-accent">04</p>
                  <p className="text-[10px] font-bold uppercase text-muted-foreground">Free uses</p>
                </div>
                <div className="px-4 py-3">
                  <p className="text-lg font-display font-bold text-primary">3</p>
                  <p className="text-[10px] font-bold uppercase text-muted-foreground">Assets</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1">
              {[
                {
                  key: "ai-summarize",
                  serviceName: "AI Text Summarizer",
                  label: "AI / LANGUAGE",
                  title: "AI Text Summarization",
                  description: "Condense long articles, documentation, and threads into concise summaries with key points.",
                  icon: FileText,
                  content: <AITextSummarizer />,
                },
                {
                  key: "analytics",
                  serviceName: "On-chain Analytics",
                  label: "DATA / ON-CHAIN",
                  title: "On Chain Analytics",
                  description: "Inspect transaction status, gas usage, token transfers, and decoded input from one hash.",
                  icon: Activity,
                  content: <OnchainAnalytics />,
                },
                {
                  key: "identity",
                  // Preserve the existing service identity so the rename does not reset allowances.
                  serviceName: "Identity Verification",
                  label: "COMPLIANCE / AML",
                  title: "AML Screening",
                  description: "Inspect wallet activity and payment flows, with sanctions and adverse-media screening status.",
                  icon: Database,
                  content: <IdentityVerification />,
                },
                {
                  key: "run",
                  serviceName: "Run Services",
                  label: "SECURITY / CONTRACTS",
                  title: "Smart Contract Analysis",
                  description: "Upload Solidity contracts for focused AI-assisted risk and attack-vector analysis.",
                  icon: Play,
                  content: <RunSection />,
                },
              ].map((service, index) => (
                <article
                  key={service.key}
                  id={`service-${service.key}`}
                  className={`ops-row group flex min-w-0 flex-col overflow-hidden p-6 md:p-8 ${
                    index === 3 ? "border-b-0" : ""
                  }`}
                >
                  <div className="relative flex h-full flex-col">
                    <ServiceImage kind={({ "ai-summarize": "summarization", analytics: "analytics", identity: "aml", run: "contracts" } as Record<string, ServiceImageKind>)[service.key]} alt={`${service.title} illustration`} className="mb-6 aspect-[2/1] max-w-xl" />
                    <div className="mb-5 flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-primary/25 bg-primary/10 text-primary transition-colors group-hover:border-accent/40 group-hover:bg-accent/10 group-hover:text-accent">
                          <service.icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase text-muted-foreground">{service.label}</p>
                          <h3 className="mt-1 text-xl font-display font-semibold text-foreground">{service.title}</h3>
                        </div>
                      </div>
                      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-accent/20 bg-accent/10 px-2 py-1 text-[10px] font-bold uppercase text-accent">
                        <CheckCircle2 className="h-3 w-3" /> Live
                      </span>
                    </div>
                    <p className="mb-5 max-w-xl text-sm leading-relaxed text-muted-foreground">{service.description}</p>
                    <div className="mt-auto border-t border-border/60 pt-2">
                      {service.key === "analytics" || service.key === "identity" ? service.content : (
                      <PaymentGate
                        serviceName={service.serviceName}
                        displayName={service.key === "identity" ? "AML Screening" : service.serviceName}
                        onPaymentSuccess={() => markPaid(service.key)}
                        isPaid={!!paidServices[service.key]}
                        compact
                      >
                        {service.content}
                      </PaymentGate>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Data Feeds / Oracles */}
      <section className="py-16" id="data-feeds">
        <div className="container">
          <div className="ops-section-heading mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-2 text-xs font-bold uppercase text-primary">02 / Oracle network</p>
              <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground">Data Feeds / Oracles</h2>
            </div>
            <p className="max-w-xl text-muted-foreground md:text-right">
              Real-time price feeds with charts. Each user gets 4 free feed unlocks before paid access.
            </p>
          </div>
          <div className="mx-auto max-w-6xl space-y-6">
            {dataFeeds.map((feed) => {
              const paymentKey = `feed-v2-${feed.name}`;
              const x402Tx = x402Transactions[paymentKey];
              return (
               <div
                key={feed.name}
                 className="ops-card p-5 md:p-7"
              >
                  <ServiceImage kind="oracles" alt={`${feed.name} price oracle illustration`} className="mb-6 aspect-[2/1] max-w-xl" />
                 <div className="mb-4 flex flex-col gap-4 border-b border-border/60 pb-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                   <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-primary/25 bg-primary/10">
                     <Activity className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-xl font-display font-semibold text-foreground">{feed.name}</h3>
                  </div>
                  <span className="inline-flex w-fit items-center gap-2 rounded-md border border-accent/20 bg-accent/10 px-2.5 py-1 text-[10px] font-bold uppercase text-accent">
                    <span className="ops-status-dot" /> Live oracle
                  </span>
                </div>
                 <div className="mb-4 rounded-lg border border-border/60 bg-secondary/40 p-3">
                  <p className="text-xs text-muted-foreground mb-1">Feed ID</p>
                  <p className="font-mono text-xs text-foreground break-all select-all">{feed.feedId}</p>
                </div>
                <PaymentGate
                  serviceName={`${feed.name} Oracle`}
                  onPaymentSuccess={() => markPaid(paymentKey)}
                  isPaid={!!paidServices[paymentKey]}
                  uniform
                  extraButton={<X402Banner uniform onPaymentSuccess={(txHash) => markX402Paid(paymentKey, txHash)} />}
                >
                  <PriceFeedChart feedName={feed.name} />
                </PaymentGate>
                {x402Tx && (
                  <div className="mt-4 border-t border-border/60 pt-4">
                    <a
                      href={`${X402_EXPLORER}/${x402Tx}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-accent hover:underline"
                    >
                      {x402Tx.slice(0, 12)}…{x402Tx.slice(-8)}
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                    <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
                      <p><span className="font-semibold text-foreground">MUSD</span> 0.001 payment</p>
                      <p><span className="font-semibold text-foreground">MEZO</span> 0</p>
                      <p><span className="font-semibold text-foreground">BTC</span> facilitator-paid network gas</p>
                    </div>
                    <div className="mt-2 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                      <p><span className="font-semibold text-foreground">Platform fee</span> not reported by x402</p>
                      <p><span className="font-semibold text-foreground">Reward fee</span> not reported by x402</p>
                    </div>
                  </div>
                )}
              </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* veNFT Marketplace */}
      <section className="py-20 border-y border-border/50 bg-secondary/20" id="venft-marketplace">
        <div className="container">
          <ServiceImage kind="vemezo" alt="Vote-escrowed MEZO positions illustration" className="mx-auto mb-8 aspect-[2/1] max-w-xl" />
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
              compact
            >
              <VeNFTMarketplace />
            </PaymentGate>
          </div>
        </div>
      </section>

      {/* Governance intro */}
      <section className="border-t border-border/60 bg-secondary/25 py-16" id="governance-analytics">
        <div className="container">
          <div className="mx-auto max-w-3xl rounded-lg border border-border/80 bg-card/85 p-6 text-center shadow-card md:p-10">
          <ServiceImage kind="governance" alt="Governance proposals and participation illustration" className="mx-auto mb-8 aspect-[2/1] max-w-xl" />
          <p className="mb-3 text-xs font-bold uppercase text-accent">03 / Protocol participation</p>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-center text-foreground mb-4">
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
              hidden
              onClick={() => handleGovPay("BTC")}
              disabled={!!govPending}
              className={`${paymentButtonClass} hidden`}
            >
              <Bitcoin className="h-4 w-4" />
              {govPending === "BTC" ? "Confirming..." : "Pay with BTC"}
            </Button>
          </div>
          <p className="text-center text-xs text-muted-foreground mt-4">
            Settles on Mezo Testnet (Chain ID 31611), then opens Governance.
          </p>
          </div>
        </div>
      </section>
      </div>
    </PageLayout>
  );
};

export default DeveloperServices;
