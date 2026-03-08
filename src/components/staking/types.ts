export interface StakingPool {
  id: string;
  asset: string;
  symbol: string;
  icon: string;
  apr: number;
  apy: number;
  totalStaked: string;
  totalStakedUsd: string;
  userStaked: string;
  userRewards: string;
  autoCompound: boolean;
  lockDays: number;
  minStake: string;
  liquidity: number; // percentage of capacity filled
}

export interface RewardEntry {
  id: string;
  pool: string;
  amount: string;
  symbol: string;
  timestamp: number;
  type: "claim" | "compound" | "distribution";
}
