import heroBitcoin from "@/assets/hero-bitcoin.png";

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden min-h-[85vh] flex items-center">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={heroBitcoin}
          alt="Bitcoin with pink rays"
          className="w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-transparent to-background" />
      </div>

      <div className="container relative z-10 text-center py-20">
        <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-display font-bold leading-[0.95] tracking-tight animate-fade-in-up">
          <span className="text-gradient italic">B</span>
          <span className="text-gradient">ank </span>
          <span className="text-foreground">on </span>
          <span className="text-foreground italic">yourself</span>
          <span className="text-gradient italic">.</span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-lg mx-auto animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
          Bring everyday finance to your Bitcoin.
        </p>
      </div>
    </section>
  );
};

export default HeroSection;
