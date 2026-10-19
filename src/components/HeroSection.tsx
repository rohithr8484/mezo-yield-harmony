import heroBitcoin from "@/assets/hero-bitcoin.png";

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden min-h-[88vh] flex items-center">
      {/* Animated gradient blobs */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 -left-32 h-96 w-96 rounded-full bg-primary/30 blur-3xl animate-blob" />
        <div className="absolute bottom-1/4 -right-24 h-[28rem] w-[28rem] rounded-full bg-bitcoin/25 blur-3xl animate-blob" style={{ animationDelay: "3s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 h-80 w-80 rounded-full bg-magenta/20 blur-3xl animate-blob" style={{ animationDelay: "6s" }} />
      </div>

      <div className="absolute inset-0">
        <img
          src={heroBitcoin}
          alt="Bitcoin with pink rays"
          className="w-full h-full object-cover opacity-50 animate-float-slow"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-transparent to-background" />
      </div>

      <div className="container relative z-10 text-center py-20">
        <span className="inline-block px-4 py-1.5 mb-6 rounded-full glass-card text-xs font-semibold uppercase tracking-wider text-muted-foreground animate-fade-in">
          Live On Mezo Testnet
        </span>
        <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-display font-bold leading-[0.95] tracking-tight animate-fade-in-up">
          <span className="text-gradient-animated italic">B</span>
          <span className="text-gradient-animated">ank </span>
          <span className="text-foreground">on </span>
          <span className="text-foreground italic">yourself</span>
          <span className="text-gradient-animated italic">.</span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-lg mx-auto animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
          Bring everyday finance to your Bitcoin.
        </p>

        <div className="mt-10 flex items-center justify-center gap-4 animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
          <a href="/developer-services" className="px-6 h-12 inline-flex items-center rounded-xl bg-gradient-to-r from-primary to-bitcoin text-primary-foreground font-semibold shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all">
            Explore Infrastructure →
          </a>
          <a href="/developer-services#governance-analytics" className="px-6 h-12 inline-flex items-center rounded-xl glass-card font-semibold hover:bg-card transition-all">
            Governance
          </a>
        </div>

        <div className="mt-8 animate-fade-in" style={{ animationDelay: "0.45s" }}>
          <div className="inline-flex flex-col items-center gap-1.5 rounded-xl glass-card px-5 py-3 border border-primary/30">
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">
              Submitted for Build with MUSD and MEZO : Bitcoin's Economic Layer — Wavehack
            </span>
            <span className="text-sm font-semibold text-accent">
              Track 2: Access and Distribution for MUSD/MEZO
            </span>
            <span className="text-sm text-muted-foreground max-w-xl">
              How might we make MUSD and MEZO easier to discover, access, and use?
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
