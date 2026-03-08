import PageLayout from "@/components/PageLayout";
import { useAccount } from "wagmi";
import StakeCard from "@/components/staking/StakeCard";
import { stakingPools } from "@/components/staking/stakingData";

const Staking = () => {
  const { isConnected } = useAccount();

  return (
    <PageLayout>
      {/* Hero */}
      <section className="py-16 md:py-24">
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

      {/* Stake Cards */}
      <section className="pb-20">
        <div className="container max-w-3xl space-y-6">
          {stakingPools.map((pool) => (
            <StakeCard key={pool.id} pool={pool} />
          ))}

          {!isConnected && (
            <p className="text-center text-sm text-muted-foreground pt-4">
              Connect your wallet to view balances, stake assets, and claim rewards on Mezo Testnet.
            </p>
          )}
        </div>
      </section>
    </PageLayout>
  );
};

export default Staking;
