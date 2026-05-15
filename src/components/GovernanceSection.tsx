import { Vote, Users, BarChart3, Wallet, Bitcoin } from "lucide-react";
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();
  const goToGovernance = () => navigate("/governance");

  return (
    <section className="py-24" id="governance">
      <div className="container">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-center text-foreground mb-4">
          Governance
        </h2>
        <p className="text-center text-muted-foreground text-lg max-w-2xl mx-auto mb-10">
          Shape the future of Bitcoin finance through decentralized governance.
        </p>

        <div className="flex flex-wrap gap-4 justify-center mb-16">
          <button
            onClick={goToGovernance}
            className="px-5 py-2.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-semibold hover:opacity-90 transition-opacity flex items-center gap-2 shadow-card"
          >
            <Wallet className="h-4 w-4" />
            Pay with MUSD
          </button>
          <button
            onClick={goToGovernance}
            className="px-5 py-2.5 rounded-full bg-gradient-to-r from-primary to-accent text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity flex items-center gap-2 shadow-card"
          >
            <Wallet className="h-4 w-4" />
            Pay with MEZO
          </button>
          <button
            onClick={goToGovernance}
            className="px-5 py-2.5 rounded-full bg-gradient-to-r from-bitcoin to-amber-600 text-white text-sm font-semibold hover:opacity-90 transition-opacity flex items-center gap-2 shadow-card"
          >
            <Bitcoin className="h-4 w-4" />
            Pay with BTC
          </button>
        </div>

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
