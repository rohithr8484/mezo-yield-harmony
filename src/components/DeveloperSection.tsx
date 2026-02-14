import { Code2, Layers, Zap, GitBranch } from "lucide-react";

const items = [
  {
    icon: Code2,
    title: "Smart Contract SDK",
    description: "Build on Mezo with our comprehensive SDK. Deploy Bitcoin-native smart contracts with ease.",
  },
  {
    icon: Layers,
    title: "Modular Architecture",
    description: "Plug-and-play infrastructure modules let developers compose custom DeFi applications.",
  },
  {
    icon: Zap,
    title: "High Performance",
    description: "Sub-second finality with optimistic rollup technology built specifically for Bitcoin DeFi.",
  },
  {
    icon: GitBranch,
    title: "Open Source",
    description: "Fully open-source infrastructure. Audit, fork, and build with complete transparency.",
  },
];

const DeveloperSection = () => {
  return (
    <section className="py-24 bg-secondary/50" id="developer">
      <div className="container">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-center text-foreground mb-4">
          Developer Infrastructure
        </h2>
        <p className="text-center text-muted-foreground text-lg max-w-2xl mx-auto mb-16">
          Mezo's infrastructure mechanisms powering the next generation of Bitcoin applications.
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl bg-card border border-border p-6 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1"
            >
              <div className="h-10 w-10 rounded-lg bg-gradient-hero flex items-center justify-center mb-5">
                <item.icon className="h-5 w-5 text-primary-foreground" />
              </div>
              <h3 className="text-lg font-display font-semibold text-foreground mb-2">
                {item.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DeveloperSection;
