import { Bitcoin, ShieldCheck, Sparkles, Network, KeyRound } from "lucide-react";

const pillars = [
  { icon: KeyRound, label: "Permissionless" },
  { icon: Bitcoin, label: "Bank-free" },
  { icon: Sparkles, label: "Intuitive" },
  { icon: ShieldCheck, label: "Secure" },
  { icon: Network, label: "Decentralized" },
];

const StatsSection = () => {
  return (
    <section className="relative py-28 overflow-hidden" id="bitcoin-age">
      {/* Ambient backdrop */}
      <div className="absolute inset-0 bg-gradient-to-b from-secondary/40 via-background to-secondary/30" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[680px] h-[680px] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[420px] h-[420px] rounded-full bg-bitcoin/10 blur-[120px] pointer-events-none" />

      <div className="container relative">
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border/60 bg-card/60 backdrop-blur text-[11px] font-medium tracking-[0.18em] uppercase text-muted-foreground mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-bitcoin animate-pulse" />
            Mezo Testnet · Live
          </span>

          <h2 className="text-4xl sm:text-5xl md:text-6xl font-display font-bold leading-[1.05] text-foreground">
            Ready for the{" "}
            <span className="text-gradient italic">Bitcoin Age</span>
          </h2>

          <p className="mt-5 text-base md:text-lg text-muted-foreground leading-relaxed max-w-xl">
            A governance and developer layer for Bitcoin — settled in mUSD,
            signed by your wallet, owned by no one.
          </p>

          {/* Pillars */}
          <div className="flex flex-wrap justify-center gap-2.5 mt-10">
            {pillars.map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="group inline-flex items-center gap-2 pl-3 pr-4 py-2 rounded-full border border-border/60 bg-card/70 backdrop-blur text-sm font-medium text-foreground/80 hover:text-foreground hover:border-primary/40 hover:bg-card transition-all"
              >
                <Icon className="h-3.5 w-3.5 text-primary group-hover:text-bitcoin transition-colors" />
                {label}
              </span>
            ))}
          </div>

          {/* Subtle divider mark */}
          <div className="mt-14 flex items-center gap-3 text-[10px] font-mono tracking-[0.3em] uppercase text-muted-foreground/60">
            <span className="h-px w-10 bg-border" />
            Chain ID 31611
            <span className="h-px w-10 bg-border" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
