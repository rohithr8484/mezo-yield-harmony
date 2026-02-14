import { Vote, Users, BarChart3 } from "lucide-react";

const items = [
  {
    icon: Vote,
    title: "On-chain Voting",
    description: "Participate in protocol decisions through transparent, decentralized governance proposals.",
  },
  {
    icon: Users,
    title: "Community Driven",
    description: "MEZO token holders shape the future of the protocol through collective decision-making.",
  },
  {
    icon: BarChart3,
    title: "Treasury Management",
    description: "Community-governed treasury ensures sustainable protocol growth and development funding.",
  },
];

const GovernanceSection = () => {
  return (
    <section className="py-24" id="governance">
      <div className="container">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-center text-foreground mb-4">
          Governance
        </h2>
        <p className="text-center text-muted-foreground text-lg max-w-2xl mx-auto mb-16">
          Shape the future of Bitcoin finance through decentralized governance.
        </p>

        <div className="grid md:grid-cols-3 gap-6">
          {items.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl bg-card border border-border p-8 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1"
            >
              <div className="h-12 w-12 rounded-xl bg-bitcoin/10 flex items-center justify-center mb-6">
                <item.icon className="h-6 w-6 text-bitcoin" />
              </div>
              <h3 className="text-xl font-display font-semibold text-foreground mb-3">
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

export default GovernanceSection;
