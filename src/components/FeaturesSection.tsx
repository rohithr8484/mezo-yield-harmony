import { ArrowRight, TrendingUp, Shield, Coins } from "lucide-react";

const features = [
  {
    icon: Coins,
    title: "Borrow with Bitcoin",
    description: "Get a line of credit using your Bitcoin as collateral. Decentralized, flexible, and intuitive.",
    cta: "Unlock credit",
  },
  {
    icon: TrendingUp,
    title: "Grow your Bitcoin",
    description: "Grow your Bitcoin stack with vaults powered by expert-managed yield strategies. Simple and secure.",
    cta: "Start earning",
  },
  {
    icon: Shield,
    title: "Stability backed by Bitcoin",
    description: "MUSD stablecoin is 100% backed by Bitcoin reserves, maintaining a 1:1 value with the U.S. dollar.",
    cta: "Learn more",
  },
];

const FeaturesSection = () => {
  return (
    <section className="py-24" id="earn">
      <div className="container">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-center text-foreground mb-4">
          The Bitcoin finance app
        </h2>
        <p className="text-center text-muted-foreground text-lg max-w-2xl mx-auto mb-16">
          Mezo empowers you to live off of Bitcoin, without selling it.
        </p>

        <div className="grid md:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-2xl bg-card border border-border p-8 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1"
            >
              <div className="h-12 w-12 rounded-xl bg-gradient-hero flex items-center justify-center mb-6">
                <feature.icon className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-display font-semibold text-foreground mb-3">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-6">
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
