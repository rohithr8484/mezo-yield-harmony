import PageLayout from "@/components/PageLayout";
import { useAccount } from "wagmi";
import StakingDashboard from "@/components/staking/StakingDashboard";
import PoolCard from "@/components/staking/PoolCard";
import RewardTracker from "@/components/staking/RewardTracker";
import { stakingPools } from "@/components/staking/stakingData";

const Staking = () => {
  const { isConnected } = useAccount();

  return (
    <PageLayout>
      {/* Hero */}
      <section className="py-20 md:py-28">
        <div className="container text-center">
          <span className="inline-block px-4 py-1.5 rounded-full border border-border bg-card text-sm font-medium text-muted-foreground mb-6">
            🔗 Mezo Testnet · Staking
          </span>
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-display font-bold leading-tight">
            <span className="text-foreground">Stake. </span>
            <span className="text-gradient italic">Earn. Compound.</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            Stake your tokens or underlying assets to earn rewards. In case of a shortfall event, your stake may be slashed to cover the deficit.
          </p>
        </div>
      </section>

      {/* Dashboard */}
      {isConnected && (
        <section className="pb-12">
          <div className="container">
            <StakingDashboard />
          </div>
        </section>
      )}

      {/* Staking Pools */}
      <section className="py-12">
        <div className="container">
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-2">Staking Pools</h2>
          <p className="text-muted-foreground text-lg mb-8">
            Select a pool to stake, unstake, or claim rewards.
          </p>
          <div className="space-y-4">
            {stakingPools.map((pool) => (
              <PoolCard key={pool.id} pool={pool} />
            ))}
          </div>
        </div>
      </section>

      {/* Reward Tracker */}
      <section className="py-12 pb-20">
        <div className="container">
          <RewardTracker />
        </div>
      </section>

      {/* Info */}
      {!isConnected && (
        <section className="pb-20">
          <div className="container">
            <p className="text-center text-sm text-muted-foreground">
              Connect your wallet to view balances, stake assets, and claim rewards on Mezo Testnet.
            </p>
          </div>
        </section>
      )}
    </PageLayout>
  );
};

export default Staking;
