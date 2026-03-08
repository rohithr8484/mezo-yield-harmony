import { useState } from "react";
import { TrendingUp, Lock, Zap, ChevronDown, ChevronUp } from "lucide-react";
import { useAccount } from "wagmi";
import { Progress } from "@/components/ui/progress";
import type { StakingPool } from "./types";

interface PoolCardProps {
  pool: StakingPool;
}

const PoolCard = ({ pool }: PoolCardProps) => {
  const { isConnected } = useAccount();
  const [expanded, setExpanded] = useState(false);
  const [stakeAmount, setStakeAmount] = useState("");
  const [unstakeAmount, setUnstakeAmount] = useState("");
  const [activeTab, setActiveTab] = useState<"stake" | "unstake">("stake");
  const [autoCompound, setAutoCompound] = useState(pool.autoCompound);

  return (
    <div className="rounded-2xl bg-card border border-border shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-hover)] transition-all duration-300 overflow-hidden">
      {/* Header */}
      <div
        className="p-6 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-magenta flex items-center justify-center">
              <span className="text-primary-foreground font-display font-bold text-lg">{pool.icon}</span>
            </div>
            <div>
              <h3 className="text-lg font-display font-semibold text-foreground">{pool.asset}</h3>
              <span className="text-sm text-muted-foreground">{pool.symbol} Staking</span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right hidden sm:block">
              <div className="text-xs text-muted-foreground">APR / APY</div>
              <div className="text-lg font-display font-bold text-primary">{pool.apr}% <span className="text-sm text-muted-foreground font-normal">/ {pool.apy}%</span></div>
            </div>
            <div className="text-right hidden md:block">
              <div className="text-xs text-muted-foreground">Total Staked</div>
              <div className="text-sm font-semibold text-foreground">{pool.totalStakedUsd}</div>
            </div>
            {expanded ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        </div>

        {/* Mobile APR display */}
        <div className="flex items-center gap-4 mt-3 sm:hidden">
          <div>
            <span className="text-xs text-muted-foreground">APR </span>
            <span className="text-sm font-display font-bold text-primary">{pool.apr}%</span>
          </div>
          <div>
            <span className="text-xs text-muted-foreground">APY </span>
            <span className="text-sm font-display font-bold text-primary">{pool.apy}%</span>
          </div>
          <div>
            <span className="text-xs text-muted-foreground">TVL </span>
            <span className="text-sm font-semibold text-foreground">{pool.totalStakedUsd}</span>
          </div>
        </div>

        {/* Pool liquidity bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Pool Capacity</span>
            <span>{pool.liquidity}%</span>
          </div>
          <Progress value={pool.liquidity} className="h-1.5" />
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="border-t border-border p-6 space-y-6">
          {/* Pool Info Row */}
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-xl bg-secondary/50 p-4 text-center">
              <Lock className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
              <div className="text-xs text-muted-foreground">Lock Period</div>
              <div className="text-sm font-semibold text-foreground">{pool.lockDays > 0 ? `${pool.lockDays} days` : "Flexible"}</div>
            </div>
            <div className="rounded-xl bg-secondary/50 p-4 text-center">
              <TrendingUp className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
              <div className="text-xs text-muted-foreground">Min Stake</div>
              <div className="text-sm font-semibold text-foreground">{pool.minStake} {pool.symbol}</div>
            </div>
            <div className="rounded-xl bg-secondary/50 p-4 text-center">
              <Zap className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
              <div className="text-xs text-muted-foreground">Total Staked</div>
              <div className="text-sm font-semibold text-foreground">{pool.totalStaked} {pool.symbol}</div>
            </div>
          </div>

          {/* Auto-Compound Toggle */}
          <div className="flex items-center justify-between rounded-xl bg-secondary/50 p-4">
            <div>
              <div className="text-sm font-semibold text-foreground">Auto-Compound</div>
              <div className="text-xs text-muted-foreground">Automatically reinvest rewards for higher APY</div>
            </div>
            <button
              onClick={() => setAutoCompound(!autoCompound)}
              className={`relative w-12 h-6 rounded-full transition-colors ${autoCompound ? "bg-primary" : "bg-border"}`}
            >
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-primary-foreground shadow transition-transform ${autoCompound ? "translate-x-6" : "translate-x-0.5"}`} />
            </button>
          </div>

          {/* Stake/Unstake Tabs */}
          {isConnected ? (
            <div>
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setActiveTab("stake")}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    activeTab === "stake" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  }`}
                >
                  Stake
                </button>
                <button
                  onClick={() => setActiveTab("unstake")}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    activeTab === "unstake" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  }`}
                >
                  Unstake
                </button>
              </div>

              {activeTab === "stake" ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">Amount ({pool.symbol})</label>
                    <input
                      type="number"
                      step="0.001"
                      placeholder={`Min: ${pool.minStake} ${pool.symbol}`}
                      value={stakeAmount}
                      onChange={(e) => setStakeAmount(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    />
                  </div>
                  <div className="rounded-xl bg-secondary/50 p-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Est. Daily Reward</span>
                      <span className="text-foreground font-semibold">
                        {stakeAmount ? (parseFloat(stakeAmount) * pool.apr / 100 / 365).toFixed(6) : "0.000000"} {pool.symbol}
                      </span>
                    </div>
                  </div>
                  <button className="w-full px-6 py-3.5 rounded-full bg-gradient-to-r from-primary to-magenta text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity">
                    Stake {pool.symbol} (Testnet)
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">Amount ({pool.symbol})</label>
                    <input
                      type="number"
                      step="0.001"
                      placeholder={`Staked: ${pool.userStaked} ${pool.symbol}`}
                      value={unstakeAmount}
                      onChange={(e) => setUnstakeAmount(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    />
                  </div>
                  {pool.lockDays > 0 && (
                    <div className="rounded-xl bg-accent/10 border border-accent/20 p-3 text-xs text-accent">
                      ⚠️ Early unstaking incurs a penalty. Lock period: {pool.lockDays} days.
                    </div>
                  )}
                  <button className="w-full px-6 py-3.5 rounded-full border border-border text-foreground text-sm font-semibold hover:bg-secondary transition-colors">
                    Unstake {pool.symbol}
                  </button>
                </div>
              )}

              {/* Claim Rewards */}
              <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-foreground">Pending Rewards</div>
                  <div className="text-lg font-display font-bold text-primary">{pool.userRewards} {pool.symbol}</div>
                </div>
                <button className="px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity">
                  Claim
                </button>
              </div>
            </div>
          ) : (
            <p className="text-center text-sm text-muted-foreground py-4">
              Connect your wallet to stake and earn rewards.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default PoolCard;
