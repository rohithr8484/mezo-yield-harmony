import { ArrowRight, TrendingUp, Shield, Coins, Zap } from "lucide-react";

const features = [
  {
    icon: Coins,
    title: "Borrow with Bitcoin",
    description: "Get a line of credit using your Bitcoin as collateral. Decentralized, flexible, and intuitive.",
    cta: "Unlock credit",
    gradient: "from-primary to-magenta",
  },
  {
    icon: TrendingUp,
    title: "Grow your Bitcoin",
    description: "Grow your Bitcoin stack with vaults powered by expert-managed yield strategies. Simple and secure.",
    cta: "Start earning",
    gradient: "from-bitcoin to-primary",
  },
  {
    icon: Shield,
    title: "Stability backed by Bitcoin",
    description: "MUSD stablecoin is 100% backed by Bitcoin reserves, maintaining a 1:1 value with the U.S. dollar.",
    cta: "Learn more",
    gradient: "from-magenta to-bitcoin",
  },
  {
    icon: Zap,
    title: "Lightning-fast governance",
    description: "Vote on protocol upgrades, gauge weights, and treasury allocations with gasless meta-transactions.",
    cta: "View proposals",
    gradient: "from-primary to-bitcoin",
  },
];

const FeaturesSection = () => {
  return (
    <section className="py-24 relative" id="earn">
      {/* Subtle background accent */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-secondary/30 to-transparent pointer-events-none" />
      
      <div className="container relative">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full border border-border bg-card text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
            Built on Bitcoin
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-foreground mb-4">
            The Bitcoin finance app
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Mezo empowers you to live off of Bitcoin, without selling it.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((feature, idx) => (
            <div
              key={feature.title}
              className="group relative rounded-2xl bg-card border border-border p-7 shadow-card hover:shadow-card-hover transition-all duration-500 hover:-translate-y-2"
              style={{ animationDelay: `${idx * 0.1}s` }}
            >
              {/* Gradient top accent */}
              <div className={`absolute top-0 left-6 right-6 h-[2px] rounded-full bg-gradient-to-r ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              
              <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-5 shadow-lg`}>
                <feature.icon className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="text-lg font-display font-bold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-5">
                {feature.description}
              </p>
              <a
                href="#"
                className="inline-flex items-center gap-1 text-sm font-semibold text-primary group-hover:gap-2 transition-all"
              >
                {feature.cta} <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
