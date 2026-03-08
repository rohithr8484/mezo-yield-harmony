import { useState } from "react";
import PageLayout from "@/components/PageLayout";
import { TrendingUp, Plus, ArrowDownCircle, ExternalLink } from "lucide-react";

interface Pool {
  name: string;
  tokenA: string;
  tokenB: string;
  address: string;
  type: string;
  volume: number;
  fees: number;
  tvl: number;
  apr: number;
}

const pools: Pool[] = [
  {
    name: "MUSD/BTC",
    tokenA: "MUSD",
    tokenB: "BTC",
    address: "0xd16A5Df82120ED8D626a1a15232bFcE2366d6AA9",
    type: "50/50 pool",
    volume: 115508.03,
    fees: 13.33,
    tvl: 100769.21,
    apr: 17.93,
  },
  {
    name: "MUSD/mUSDC",
    tokenA: "MUSD",
    tokenB: "mUSDC",
    address: "0x525F049A4494dA0a6c87E3C4df55f9929765Dc3e",
    type: "50/50 pool",
    volume: 23496.2,
    fees: 7.76,
    tvl: 15224.09,
    apr: 1.61,
  },
  {
    name: "MUSD/mUSDT",
    tokenA: "MUSD",
    tokenB: "mUSDT",
    address: "0x27414B76CF00E24ed087adb56E26bAeEE93494e",
    type: "50/50 pool",
    volume: 9967.71,
    fees: 0.04,
    tvl: 5104.45,
    apr: 2.04,
  },
];

const totalVolume = pools.reduce((s, p) => s + p.volume, 0);
const totalFees = pools.reduce((s, p) => s + p.fees, 0);
const totalTvl = pools.reduce((s, p) => s + p.tvl, 0);

const fmt = (n: number) =>
  "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const tokenColors: Record<string, string> = {
  MUSD: "bg-amber-400",
  BTC: "bg-orange-500",
  mUSDC: "bg-blue-500",
  mUSDT: "bg-emerald-500",
};

const PoolRow = ({ pool }: { pool: Pool }) => {
  const [expanded, setExpanded] = useState(false);
  const [tab, setTab] = useState<"add" | "withdraw">("add");
  const [amountA, setAmountA] = useState("");
  const [amountB, setAmountB] = useState("");
  const [withdrawPct, setWithdrawPct] = useState(0);

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card">
      {/* Row */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full grid grid-cols-[2fr_1fr_1fr_1fr_0.7fr] items-center px-5 py-4 text-sm hover:bg-secondary/40 transition-colors"
      >
        <div className="flex items-center gap-3 text-left">
          <div className="flex -space-x-1.5">
            <span className={`h-6 w-6 rounded-full ${tokenColors[pool.tokenA]} border-2 border-card`} />
            <span className={`h-6 w-6 rounded-full ${tokenColors[pool.tokenB]} border-2 border-card`} />
          </div>
          <div>
            <span className="font-semibold text-foreground">{pool.name}</span>
            <span className="block text-xs text-muted-foreground">{pool.type}</span>
          </div>
        </div>
        <span className="text-foreground text-right">{fmt(pool.volume)}</span>
        <span className="text-foreground text-right">{fmt(pool.fees)}</span>
        <span className="text-foreground text-right">{fmt(pool.tvl)}</span>
        <span className="text-right font-semibold text-emerald-500">{pool.apr.toFixed(2)}%</span>
      </button>

      {/* Expanded panel */}
      {expanded && (
        <div className="border-t border-border px-5 py-6">
          {/* Tabs */}
          <div className="flex gap-1 mb-6">
            <button
              onClick={() => setTab("add")}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                tab === "add"
                  ? "bg-bitcoin/10 text-bitcoin"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Add Liquidity
            </button>
            <button
              onClick={() => setTab("withdraw")}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                tab === "withdraw"
                  ? "bg-bitcoin/10 text-bitcoin"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Withdraw
            </button>
          </div>

          {tab === "add" ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Providing liquidity makes swapping possible. In return, you will receive LP tokens (LP) for the option to stake, earn from the pair's Swaps fees and MATS rewards.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Token A */}
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-foreground">{pool.tokenA}</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={amountA}
                    onChange={(e) => setAmountA(e.target.value)}
                    className="w-full rounded-xl border border-border bg-secondary/50 px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-bitcoin/40"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0.00 {pool.tokenA} Available</span>
                    <button className="text-bitcoin font-medium hover:underline">Max</button>
                  </div>
                </div>
                {/* Token B */}
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-foreground">{pool.tokenB}</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={amountB}
                    onChange={(e) => setAmountB(e.target.value)}
                    className="w-full rounded-xl border border-border bg-secondary/50 px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-bitcoin/40"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0.00 {pool.tokenB} Available</span>
                    <button className="text-bitcoin font-medium hover:underline">Max</button>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <button className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-bitcoin py-3 text-sm font-semibold text-card hover:bg-bitcoin/90 transition-colors">
                  <Plus className="h-4 w-4" /> Add Liquidity
                </button>
                <button
                  onClick={() => { setAmountA(""); setAmountB(""); }}
                  className="px-5 py-3 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                >
                  Reset
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Exit your liquidity position to receive your assets and don't forget to claim your rewards.
              </p>
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-400">
                You don't have assets to withdraw. Please add liquidity to the pool.
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Enter any percentage you want to withdraw</p>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={withdrawPct}
                    onChange={(e) => setWithdrawPct(Math.min(100, Math.max(0, Number(e.target.value))))}
                    className="w-full rounded-xl border border-border bg-secondary/50 px-4 py-3 pr-8 text-foreground focus:outline-none focus:ring-2 focus:ring-bitcoin/40"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[25, 50, 75, 100].map((pct) => (
                    <button
                      key={pct}
                      onClick={() => setWithdrawPct(pct)}
                      className={`py-2 rounded-lg border text-sm font-medium transition-colors ${
                        withdrawPct === pct
                          ? "border-bitcoin text-bitcoin bg-bitcoin/10"
                          : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/20"
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-border p-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Withdraw value</span><span className="text-foreground">$0</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">sAMM-{pool.name} LP amount</span><span className="text-foreground">0.00</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">{pool.tokenA} amount</span><span className="text-foreground">0.00 {pool.tokenA}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">{pool.tokenB} amount</span><span className="text-foreground">0.00 {pool.tokenB}</span></div>
              </div>
              <button className="w-full flex items-center justify-center gap-2 rounded-xl border border-border py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                <ArrowDownCircle className="h-4 w-4" /> Withdraw
              </button>
            </div>
          )}

          {/* Explorer link */}
          <div className="mt-4 pt-4 border-t border-border">
            <a
              href={`https://explorer.test.mezo.org/address/${pool.address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              View contract on Explorer <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

const Liquidity = () => {
  return (
    <PageLayout>
      <div className="container py-12 max-w-5xl">
        {/* Banner */}
        <div className="rounded-xl border border-bitcoin/20 bg-bitcoin/5 p-5 mb-8 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-bitcoin">Add liquidity to start earning rewards</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Earn MATS with your first deposit in each pool—limited-time bonus, limited spots.
            </p>
          </div>
          <TrendingUp className="h-6 w-6 text-bitcoin shrink-0" />
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          {[
            { label: "Volume", value: totalVolume },
            { label: "Fees", value: totalFees },
            { label: "TVL", value: totalTvl },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-border bg-card p-5">
              <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
              <p className="text-xl font-bold text-foreground font-display">{fmt(stat.value)}</p>
            </div>
          ))}
        </div>

        {/* Pool Table */}
        <h2 className="text-lg font-semibold text-foreground mb-4">Available pools</h2>

        {/* Header */}
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_0.7fr] px-5 py-2 text-xs font-medium text-muted-foreground mb-2">
          <span>Pools</span>
          <span className="text-right">Volume</span>
          <span className="text-right">Fees</span>
          <span className="text-right">TVL</span>
          <span className="text-right">APR</span>
        </div>

        <div className="space-y-3">
          {pools.map((pool) => (
            <PoolRow key={pool.address} pool={pool} />
          ))}
        </div>
      </div>
    </PageLayout>
  );
};

export default Liquidity;
