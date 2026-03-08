import { useState, useCallback } from "react";
import { TrendingUp, Lock, Zap, ChevronDown, ChevronUp, CheckCircle, Loader2 } from "lucide-react";
import { useAccount } from "wagmi";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
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
  const [userStaked, setUserStaked] = useState(parseFloat(pool.userStaked));
  const [userRewards, setUserRewards] = useState(parseFloat(pool.userRewards));
  const [loading, setLoading] = useState<"stake" | "unstake" | "claim" | null>(null);

  const simulateTx = useCallback((action: () => void, delay = 1500) => {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        action();
        resolve();
      }, delay);
    });
  }, []);

  const handleStake = async () => {
    const amount = parseFloat(stakeAmount);
    if (!amount || amount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (amount < parseFloat(pool.minStake)) {
      toast.error(`Minimum stake is ${pool.minStake} ${pool.symbol}`);
      return;
    }
    setLoading("stake");
    await simulateTx(() => {
      setUserStaked((prev) => prev + amount);
      // Simulate some initial rewards accrual
      setUserRewards((prev) => prev + amount * pool.apr / 100 / 365);
      setStakeAmount("");
    });
    setLoading(null);
    toast.success(`Staked ${amount} ${pool.symbol}`, {
      description: `Your position is now ${(userStaked + amount).toFixed(6)} ${pool.symbol}`,
      icon: <CheckCircle className="h-4 w-4 text-primary" />,
    });
  };

  const handleUnstake = async () => {
    const amount = parseFloat(unstakeAmount);
    if (!amount || amount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (amount > userStaked) {
      toast.error(`Insufficient staked balance. You have ${userStaked.toFixed(6)} ${pool.symbol}`);
      return;
    }
    setLoading("unstake");
    await simulateTx(() => {
      setUserStaked((prev) => prev - amount);
      setUnstakeAmount("");
    });
    setLoading(null);
    toast.success(`Unstaked ${amount} ${pool.symbol}`, {
      description: pool.lockDays > 0 ? `Cooldown: ${pool.lockDays} days before withdrawal` : "Funds returned to wallet",
    });
  };

  const handleClaim = async () => {
    if (userRewards <= 0) {
      toast.error("No rewards to claim");
      return;
    }
    setLoading("claim");
    const claimed = userRewards;
    await simulateTx(() => {
      if (autoCompound) {
        setUserStaked((prev) => prev + claimed);
        setUserRewards(0);
      } else {
        setUserRewards(0);
      }
    });
    setLoading(null);
    toast.success(
      autoCompound ? `Compounded ${claimed.toFixed(6)} ${pool.symbol}` : `Claimed ${claimed.toFixed(6)} ${pool.symbol}`,
      { description: autoCompound ? "Rewards added to your staked position" : "Rewards sent to your wallet" }
    );
  };

  return (
    <div className="rounded-2xl bg-card border border-border shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-hover)] transition-all duration-300 overflow-hidden">
      {/* Header */}
      <div className="p-6 cursor-pointer" onClick={() => setExpanded(!expanded)}>
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
            {expanded ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
          </div>
        </div>

        {/* Mobile APR */}
        <div className="flex items-center gap-4 mt-3 sm:hidden">
          <div><span className="text-xs text-muted-foreground">APR </span><span className="text-sm font-display font-bold text-primary">{pool.apr}%</span></div>
          <div><span className="text-xs text-muted-foreground">APY </span><span className="text-sm font-display font-bold text-primary">{pool.apy}%</span></div>
          <div><span className="text-xs text-muted-foreground">TVL </span><span className="text-sm font-semibold text-foreground">{pool.totalStakedUsd}</span></div>
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
          {/* Pool Info */}
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
              <div className="text-xs text-muted-foreground">Your Staked</div>
              <div className="text-sm font-semibold text-foreground">{userStaked.toFixed(6)} {pool.symbol}</div>
            </div>
          </div>

          {/* Auto-Compound Toggle */}
          <div className="flex items-center justify-between rounded-xl bg-secondary/50 p-4">
            <div>
              <div className="text-sm font-semibold text-foreground">Auto-Compound</div>
              <div className="text-xs text-muted-foreground">Automatically reinvest rewards for higher APY</div>
            </div>
            <button
              onClick={() => {
                setAutoCompound(!autoCompound);
                toast.success(autoCompound ? "Auto-compound disabled" : "Auto-compound enabled");
              }}
              className={`relative w-12 h-6 rounded-full transition-colors ${autoCompound ? "bg-primary" : "bg-border"}`}
            >
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-primary-foreground shadow transition-transform ${autoCompound ? "translate-x-6" : "translate-x-0.5"}`} />
            </button>
          </div>

          {/* Stake/Unstake */}
          {isConnected ? (
            <div>
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setActiveTab("stake")}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${activeTab === "stake" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}
                >
                  Stake
                </button>
                <button
                  onClick={() => setActiveTab("unstake")}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${activeTab === "unstake" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}
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
                      disabled={loading === "stake"}
                      className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all disabled:opacity-50"
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
                  <button
                    onClick={handleStake}
                    disabled={!!loading}
                    className="w-full px-6 py-3.5 rounded-full bg-gradient-to-r from-primary to-magenta text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading === "stake" ? <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</> : `Stake ${pool.symbol}`}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">Amount ({pool.symbol})</label>
                    <input
                      type="number"
                      step="0.001"
                      placeholder={`Staked: ${userStaked.toFixed(6)} ${pool.symbol}`}
                      value={unstakeAmount}
                      onChange={(e) => setUnstakeAmount(e.target.value)}
                      disabled={loading === "unstake"}
                      className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all disabled:opacity-50"
                    />
                    {userStaked > 0 && (
                      <button
                        onClick={() => setUnstakeAmount(userStaked.toFixed(6))}
                        className="text-xs text-primary mt-1 hover:underline"
                      >
                        Max: {userStaked.toFixed(6)} {pool.symbol}
                      </button>
                    )}
                  </div>
                  {pool.lockDays > 0 && (
                    <div className="rounded-xl bg-accent/10 border border-accent/20 p-3 text-xs text-accent">
                      ⚠️ Early unstaking incurs a penalty. Lock period: {pool.lockDays} days.
                    </div>
                  )}
                  <button
                    onClick={handleUnstake}
                    disabled={!!loading}
                    className="w-full px-6 py-3.5 rounded-full border border-border text-foreground text-sm font-semibold hover:bg-secondary transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading === "unstake" ? <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</> : `Unstake ${pool.symbol}`}
                  </button>
                </div>
              )}

              {/* Claim Rewards */}
              <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-foreground">Pending Rewards</div>
                  <div className="text-lg font-display font-bold text-primary">{userRewards.toFixed(6)} {pool.symbol}</div>
                </div>
                <button
                  onClick={handleClaim}
                  disabled={!!loading || userRewards <= 0}
                  className="px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
                >
                  {loading === "claim" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {autoCompound ? "Compound" : "Claim"}
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
