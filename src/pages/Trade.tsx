import { useState } from "react";
import PageLayout from "@/components/PageLayout";
import { ExternalLink, ArrowDownUp, Copy, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const contracts = {
  router: "0x16A76d3cd3C1e3CE843C6680d6B37E9116b5C706",
  poolFactory: "0x83FE469C636C4081b87bA5b3Ae9991c6Ed104248",
};

const tokens = [
  { symbol: "BTC (tBTC)", address: "0x7b7C000000000000000000000000000000000000", decimals: 18, desc: "Native Bitcoin representation" },
  { symbol: "MUSD", address: "0xdD468A1DDc392dcdbEf6db6e34E89AA338F9F186", decimals: 18, desc: "Mezo USD stablecoin proxy" },
  { symbol: "mUSDC", address: "0x04671C72Aab5AC02A03c1098314b1BB6B560c197", decimals: 6, desc: "Bridged USDC" },
  { symbol: "mUSDT", address: "0xeB5a5d39dE4Ea42C2Aa6A57EcA2894376683bB8E", decimals: 6, desc: "Bridged USDT" },
];

const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        toast.success("Address copied");
        setTimeout(() => setCopied(false), 2000);
      }}
      className="text-muted-foreground hover:text-foreground transition-colors"
    >
      {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
};

const shortenAddr = (addr: string) => `${addr.slice(0, 6)}…${addr.slice(-4)}`;

const Trade = () => {
  return (
    <PageLayout>
      {/* Hero */}
      <section className="py-16 md:py-24">
        <div className="container text-center max-w-3xl mx-auto">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border bg-card text-sm font-medium text-muted-foreground mb-6">
            <ArrowDownUp className="h-4 w-4" /> Mezo Mainnet
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-display font-bold leading-tight">
            <span className="text-foreground">Tigris </span>
            <span className="text-gradient italic">DEX</span>
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
            Decentralized Exchange on Mezo. Swap tokens, provide liquidity, and trade on-chain with the Tigris protocol.
          </p>
          <a
            href={`https://explorer.mezo.org/address/${contracts.router}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-hero text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Open on Explorer <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </section>

      {/* Contracts */}
      <section className="pb-16">
        <div className="container max-w-3xl mx-auto">
          <h2 className="text-xl font-display font-bold text-foreground mb-6">Protocol Contracts</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { label: "Router", address: contracts.router },
              { label: "Pool Factory", address: contracts.poolFactory },
            ].map((c) => (
              <div key={c.label} className="rounded-xl border border-border bg-card p-5">
                <p className="text-xs text-muted-foreground mb-1">{c.label}</p>
                <div className="flex items-center gap-2">
                  <code className="text-sm font-mono text-foreground">{shortenAddr(c.address)}</code>
                  <CopyButton text={c.address} />
                  <a
                    href={`https://explorer.mezo.org/address/${c.address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Token Contracts */}
      <section className="pb-20">
        <div className="container max-w-3xl mx-auto">
          <h2 className="text-xl font-display font-bold text-foreground mb-6">Token Contracts</h2>
          <div className="space-y-3">
            {tokens.map((t) => (
              <div key={t.symbol} className="rounded-xl border border-border bg-card p-5 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-foreground text-sm">{t.symbol}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">{t.decimals} decimals</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{t.desc}</p>
                  <code className="text-xs font-mono text-muted-foreground mt-1 block truncate">{t.address}</code>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <CopyButton text={t.address} />
                  <a
                    href={`https://explorer.mezo.org/address/${t.address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default Trade;
