import PageLayout from "@/components/PageLayout";
import { ExternalLink } from "lucide-react";

const pools = [
  {
    name: "MUSD / BTC",
    address: "0xd16A5Df82120ED8D626a1a15232bFcE2366d6AA9",
  },
  {
    name: "MUSD / mUSDC",
    address: "0x525F049A4494dA0a6c87E3C4df55f9929765Dc3e",
  },
  {
    name: "MUSD / mUSDT",
    address: "0x27414B76CF00E24ed087adb56E26bAeEE93494e",
  },
];

const Liquidity = () => {
  return (
    <PageLayout>
      <div className="container py-12 max-w-4xl">
        <h1 className="text-3xl font-bold font-display text-foreground mb-2">
          Liquidity Pools
        </h1>
        <p className="text-muted-foreground mb-8">
          Testnet liquidity pools available on Mezo.
        </p>

        <div className="space-y-4">
          {pools.map((pool) => (
            <div
              key={pool.address}
              className="flex items-center justify-between p-5 rounded-xl border border-border bg-card hover:bg-secondary/50 transition-colors"
            >
              <div className="space-y-1">
                <h3 className="text-lg font-semibold text-foreground font-display">
                  {pool.name}
                </h3>
                <p className="text-xs text-muted-foreground font-mono break-all">
                  {pool.address}
                </p>
              </div>
              <a
                href={`https://explorer.test.mezo.org/address/${pool.address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 ml-4 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <ExternalLink className="h-5 w-5" />
              </a>
            </div>
          ))}
        </div>
      </div>
    </PageLayout>
  );
};

export default Liquidity;
