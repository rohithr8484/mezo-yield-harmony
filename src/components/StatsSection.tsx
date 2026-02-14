const stats = [
  { label: "Total Value Locked", value: "$2.4B+" },
  { label: "BTC APY", value: "4%+" },
  { label: "Active Users", value: "125K+" },
  { label: "Transactions", value: "3.2M+" },
];

const badges = ["Permissionless", "Bank-free", "Intuitive", "Secure", "Decentralized"];

const StatsSection = () => {
  return (
    <section className="py-24 bg-secondary/50" id="staking">
      <div className="container">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-center text-foreground mb-4">
          Ready for the Bitcoin Age
        </h2>

        {/* Badges */}
        <div className="flex flex-wrap justify-center gap-3 mt-6 mb-16">
          {badges.map((badge) => (
            <span
              key={badge}
              className="px-4 py-1.5 rounded-full border border-border bg-card text-sm font-medium text-muted-foreground"
            >
              {badge}
            </span>
          ))}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="text-center rounded-2xl bg-card border border-border p-8 shadow-card"
            >
              <div className="text-3xl sm:text-4xl font-display font-bold text-gradient mb-2">
                {stat.value}
              </div>
              <div className="text-sm text-muted-foreground font-medium">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
