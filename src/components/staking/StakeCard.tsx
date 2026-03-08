import { useState, useCallback } from "react";
import { ExternalLink, Info, Loader2, CheckCircle } from "lucide-react";
import { useAccount, useBalance, useReadContract } from "wagmi";
import { formatUnits } from "viem";
import { CONTRACTS, ERC20_ABI } from "@/lib/mezo";
import { toast } from "sonner";
import type { StakingPool } from "./types";

interface StakeCardProps {
  pool: StakingPool;
}

const StakeCard = ({ pool }: StakeCardProps) => {
  const { isConnected, address } = useAccount();
  const [userStaked, setUserStaked] = useState(0);
  const [userRewards, setUserRewards] = useState(0);
  const [loading, setLoading] = useState<"stake" | "unstake" | "claim" | "restake" | null>(null);
  const [stakeModalOpen, setStakeModalOpen] = useState(false);
  const [stakeAmount, setStakeAmount] = useState("");

  const { data: btcBalance } = useBalance({ address, chainId: 31611, query: { enabled: pool.symbol === "BTC" && !!address } });
  const { data: musdBalance } = useReadContract({
    address: CONTRACTS.testnet.MUSD,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: 31611,
    query: { enabled: pool.symbol === "MUSD" && !!address },
  });

  const getWalletBalance = () => {
    if (!isConnected) return "0";
    if (pool.symbol === "BTC" && btcBalance) return parseFloat(formatUnits(btcBalance.value, 18)).toFixed(4);
    if (pool.symbol === "MUSD" && musdBalance) return parseFloat(formatUnits(musdBalance as bigint, 18)).toFixed(2);
    return "0";
  };

  const simulateTx = useCallback((action: () => void, delay = 1500) => {
    return new Promise<void>((resolve) => {
      setTimeout(() => { action(); resolve(); }, delay);
    });
  }, []);

  const handleStake = async () => {
    const amount = parseFloat(stakeAmount);
    if (!amount || amount <= 0) { toast.error("Enter a valid amount"); return; }
    if (amount < parseFloat(pool.minStake)) { toast.error(`Minimum stake is ${pool.minStake} ${pool.symbol}`); return; }
    setLoading("stake");
    await simulateTx(() => {
      setUserStaked((prev) => prev + amount);
      setUserRewards((prev) => prev + amount * pool.apr / 100 / 365);
      setStakeAmount("");
      setStakeModalOpen(false);
    });
    setLoading(null);
    toast.success(`Staked ${amount} ${pool.symbol}`, { icon: <CheckCircle className="h-4 w-4 text-primary" /> });
  };

  const handleCooldown = async () => {
    if (userStaked <= 0) { toast.error("Nothing staked"); return; }
    setLoading("unstake");
    await simulateTx(() => { setUserStaked(0); });
    setLoading(null);
    toast.success(`Unstaked ${pool.symbol}`, { description: `Cooldown: ${pool.lockDays}d before withdrawal` });
  };

  const handleClaim = async () => {
    if (userRewards <= 0) { toast.error("No rewards to claim"); return; }
    const claimed = userRewards;
    setLoading("claim");
    await simulateTx(() => { setUserRewards(0); });
    setLoading(null);
    toast.success(`Claimed ${claimed.toFixed(6)} ${pool.symbol}`);
  };

  const handleRestake = async () => {
    if (userRewards <= 0) { toast.error("No rewards to restake"); return; }
    const amount = userRewards;
    setLoading("restake");
    await simulateTx(() => { setUserStaked((prev) => prev + amount); setUserRewards(0); });
    setLoading(null);
    toast.success(`Restaked ${amount.toFixed(6)} ${pool.symbol}`);
  };

  const rewardsPerMonth = userStaked > 0 ? (userStaked * pool.apr / 100 / 12).toFixed(6) : "0";

  return (
    <div className="rounded-2xl bg-card border border-border shadow-[var(--shadow-card)] p-6 md:p-8">
      {/* Title */}
      <div className="flex items-center gap-2 mb-1">
        <h2 className="text-xl font-display font-bold text-foreground">Stake {pool.symbol}</h2>
        <a href="https://explorer.test.mezo.org" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Total staked: {pool.totalStaked} ({pool.totalStakedUsd})
      </p>

      {/* Info Row */}
      <div className="rounded-xl border border-border p-4 md:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-magenta flex items-center justify-center">
            <span className="text-primary-foreground font-display font-bold text-sm">{pool.icon}</span>
          </div>
          <span className="text-base font-semibold text-foreground">{pool.symbol}</span>
        </div>
        <div className="flex flex-wrap items-center gap-6 sm:gap-8">
          <div>
            <div className="text-xs text-muted-foreground mb-0.5">Staking APR</div>
            <div className="text-base font-display font-bold text-foreground">{pool.apr} %</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-0.5">Max slashing</div>
            <div className="text-base font-display font-bold text-foreground">30 %</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-0.5">Wallet Balance</div>
            <div className="text-base font-display font-bold text-foreground">{getWalletBalance()}</div>
          </div>
        </div>
        <button
          onClick={() => setStakeModalOpen(!stakeModalOpen)}
          disabled={!isConnected}
          className="px-6 py-2.5 rounded-lg border border-border text-sm font-semibold text-foreground hover:bg-secondary transition-colors disabled:opacity-40"
        >
          Stake
        </button>
      </div>

      {/* Stake Input (inline modal) */}
      {stakeModalOpen && isConnected && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 mb-6 space-y-3">
          <label className="text-sm font-semibold text-foreground">Amount to Stake</label>
          <input
            type="number"
            step="0.001"
            placeholder={`Min: ${pool.minStake} ${pool.symbol}`}
            value={stakeAmount}
            onChange={(e) => setStakeAmount(e.target.value)}
            disabled={loading === "stake"}
            className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all disabled:opacity-50"
          />
          <div className="flex gap-3">
            <button
              onClick={handleStake}
              disabled={!!loading}
              className="flex-1 px-6 py-3 rounded-lg bg-gradient-to-r from-primary to-magenta text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading === "stake" ? <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</> : "Confirm Stake"}
            </button>
            <button onClick={() => { setStakeModalOpen(false); setStakeAmount(""); }} className="px-4 py-3 rounded-lg border border-border text-sm font-semibold text-foreground hover:bg-secondary transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Staked + Claimable Panels */}
      <div className="grid sm:grid-cols-2 gap-4">
        {/* Staked Panel */}
        <div className="rounded-xl border border-border p-5 flex flex-col">
          <div className="text-sm text-muted-foreground text-center mb-3">Staked {pool.symbol}</div>
          <div className="text-3xl font-display font-bold text-foreground text-center">{userStaked.toFixed(userStaked > 0 ? 6 : 0)}</div>
          <div className="text-sm text-muted-foreground text-center mb-5">
            ${userStaked > 0 ? (userStaked * 1).toFixed(2) : "0"}
          </div>
          <div className="mt-auto">
            <button
              onClick={handleCooldown}
              disabled={!!loading || userStaked <= 0}
              className="w-full px-4 py-3 rounded-lg bg-secondary text-secondary-foreground text-sm font-semibold hover:bg-secondary/80 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {loading === "unstake" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Cooldown to unstake
            </button>
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                Cooldown period <Info className="h-3 w-3" />
              </div>
              <span className="text-xs font-semibold text-foreground">{pool.lockDays}d</span>
            </div>
          </div>
        </div>

        {/* Claimable Panel */}
        <div className="rounded-xl border border-border p-5 flex flex-col">
          <div className="text-sm text-muted-foreground text-center mb-3">Claimable {pool.symbol}</div>
          <div className="text-3xl font-display font-bold text-foreground text-center">{userRewards.toFixed(userRewards > 0 ? 6 : 0)}</div>
          <div className="text-sm text-muted-foreground text-center mb-5">
            ${userRewards > 0 ? (userRewards * 1).toFixed(2) : "0"}
          </div>
          <div className="mt-auto">
            <div className="flex gap-3">
              <button
                onClick={handleClaim}
                disabled={!!loading || userRewards <= 0}
                className="flex-1 px-4 py-3 rounded-lg bg-secondary text-secondary-foreground text-sm font-semibold hover:bg-secondary/80 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {loading === "claim" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Claim
              </button>
              <button
                onClick={handleRestake}
                disabled={!!loading || userRewards <= 0}
                className="flex-1 px-4 py-3 rounded-lg bg-secondary text-secondary-foreground text-sm font-semibold hover:bg-secondary/80 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {loading === "restake" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Restake
              </button>
            </div>
            <div className="flex items-center justify-between mt-3">
              <span className="text-xs text-muted-foreground">{pool.symbol} per month</span>
              <span className="text-xs font-semibold text-foreground">{rewardsPerMonth}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StakeCard;
