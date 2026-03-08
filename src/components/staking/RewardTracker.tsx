import { ArrowDownRight, ArrowUpRight, RotateCw } from "lucide-react";
import { rewardHistory } from "./stakingData";

const typeConfig = {
  distribution: { label: "Distribution", icon: ArrowDownRight, color: "text-primary" },
  compound: { label: "Compounded", icon: RotateCw, color: "text-bitcoin" },
  claim: { label: "Claimed", icon: ArrowUpRight, color: "text-accent" },
};

const RewardTracker = () => {
  return (
    <div className="rounded-2xl bg-card border border-border shadow-[var(--shadow-card)] overflow-hidden">
      <div className="p-6 border-b border-border">
        <h3 className="text-lg font-display font-semibold text-foreground">Reward History</h3>
        <p className="text-sm text-muted-foreground mt-1">Track all your staking reward distributions, claims, and auto-compounds.</p>
      </div>
      <div className="divide-y divide-border">
        {rewardHistory.map((entry) => {
          const config = typeConfig[entry.type];
          const Icon = config.icon;
          const date = new Date(entry.timestamp);
          return (
            <div key={entry.id} className="px-6 py-4 flex items-center justify-between hover:bg-secondary/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className={`h-8 w-8 rounded-lg bg-secondary flex items-center justify-center ${config.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">{entry.pool} — {config.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-sm font-display font-bold ${config.color}`}>
                  +{entry.amount} {entry.symbol}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {rewardHistory.length === 0 && (
        <div className="p-8 text-center text-sm text-muted-foreground">
          No reward history yet. Start staking to earn rewards.
        </div>
      )}
    </div>
  );
};

export default RewardTracker;
