import { Coins, TrendingUp, Gift, Wallet } from "lucide-react";
import { useAccount, useBalance, useReadContract } from "wagmi";
import { formatUnits } from "viem";
import { CONTRACTS, ERC20_ABI } from "@/lib/mezo";

const StakingDashboard = () => {
  const { isConnected, address } = useAccount();
  const { data: btcBalance } = useBalance({ address, chainId: 31611 });
  const { data: musdBalance } = useReadContract({
    address: CONTRACTS.testnet.MUSD,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: 31611,
    query: { enabled: !!address },
  });

  const stats = [
    {
      icon: Wallet,
      label: "BTC Balance",
      value: btcBalance ? `${parseFloat(formatUnits(btcBalance.value, 18)).toFixed(6)} BTC` : "0.000000 BTC",
    },
    {
      icon: Coins,
      label: "MUSD Balance",
      value: musdBalance ? `${parseFloat(formatUnits(musdBalance as bigint, 18)).toFixed(2)} MUSD` : "0.00 MUSD",
    },
    {
      icon: TrendingUp,
      label: "Total Staked Value",
      value: "$0.00",
    },
    {
      icon: Gift,
      label: "Unclaimed Rewards",
      value: "$0.00",
    },
  ];

  if (!isConnected) return null;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div key={stat.label} className="rounded-2xl bg-card border border-border p-5 shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <stat.icon className="h-4 w-4 text-primary" />
            </div>
            <span className="text-xs text-muted-foreground">{stat.label}</span>
          </div>
          <div className="text-lg font-display font-bold text-foreground">{stat.value}</div>
        </div>
      ))}
    </div>
  );
};

export default StakingDashboard;
