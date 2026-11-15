import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getOracleHistory, isSnapshotStale, type OracleHistory } from "@/lib/pythHistory";
import { PYTH_CONTRACT } from "@/lib/pythOracle";

export const PriceFeedChart = ({ feedName, feedId }: { feedName: string; feedId: string }) => {
  const [history, setHistory] = useState<OracleHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setHistory(await getOracleHistory(feedId));
    } catch {
      setHistory(null);
      setError("Oracle history unavailable. The contract or historical RPC reads could not be accessed. No sample data is shown.");
    } finally {
      setLoading(false);
    }
  }, [feedId]);
  useEffect(() => { void load(); }, [load]);

  const data = history?.points ?? [];
  const first = data[0];
  const last = data[data.length - 1];
  const min = data.length ? Math.min(...data.map((d) => d.price)) : 0;
  const max = data.length ? Math.max(...data.map((d) => d.price)) : 0;
  const span = first && last ? last.observedTime - first.observedTime : 0;
  const range = max - min;
  const plotted = data.map((point) => ({
    ...point,
    x: first && span ? 12 + ((point.observedTime - first.observedTime) / span) * 376 : 200,
    y: range ? 90 - ((point.price - min) / range) * 70 : 55,
  }));
  const path = plotted.map((point) => `${point.x},${point.y}`).join(" ");
  const money = (value: number) => `$${value.toLocaleString(undefined, { minimumFractionDigits: value < 10 ? 6 : 2, maximumFractionDigits: value < 10 ? 6 : 2 })}`;
  const time = (value: number) => new Date(value * 1000).toLocaleString();
  const stale = last ? isSnapshotStale(last, Date.now() / 1000) : false;

  return (
    <div className="rounded-lg border border-border bg-secondary/40 p-5 animate-in fade-in duration-500" aria-label={`${feedName} contract price history`}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h4 className="text-lg font-display font-bold text-foreground">{feedName} · On-chain history</h4>
          {last && <p className="text-2xl font-mono font-bold text-foreground">{money(last.price)}</p>}
        </div>
        <Button variant="ghost" size="sm" onClick={load} disabled={loading} aria-label={`Refresh ${feedName} history`}>
          <RefreshCw className={`mr-1 h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>
      {loading && <p className="text-sm text-muted-foreground" role="status">Reading historical oracle states…</p>}
      {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
      {last && first && history && <>
        <p className={`mb-3 text-sm font-semibold ${stale ? "text-destructive" : "text-accent"}`}>
          {stale ? "Stale stored oracle price — not a current market quote." : "Recent oracle publication."}
        </p>
        <svg viewBox="0 0 400 110" className="h-36 w-full text-accent" role="img" aria-label={`${feedName}: ${data.length} actual contract observations`}>
          {data.length > 1 && <polyline points={path} fill="none" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke" />}
          {plotted.map((point) => <circle key={point.blockNumber} cx={point.x} cy={point.y} r="3" fill="currentColor"><title>{`${time(point.observedTime)} · Block ${point.blockNumber} · ${money(point.price)} · Oracle published ${time(point.publishTime)}`}</title></circle>)}
        </svg>
        <div className="mt-2 flex flex-wrap justify-between gap-2 text-xs font-mono text-muted-foreground">
          <span>{time(first.observedTime)}</span><span>{time(last.observedTime)}</span>
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-3 text-center text-sm">
          <div><dt className="text-muted-foreground">Observed high</dt><dd className="font-mono font-semibold text-foreground">{money(max)}</dd></div>
          <div><dt className="text-muted-foreground">Observed low</dt><dd className="font-mono font-semibold text-foreground">{money(min)}</dd></div>
        </dl>
        <p className="mt-4 text-xs text-muted-foreground">Oracle published: {time(last.publishTime)} · Confidence ± {money(last.confidence)}.</p>
        <p className="mt-2 text-xs text-muted-foreground">{data.length}/{history.requested} block-state samples over approximately 24 hours. Times on the graph are block observation times, not oracle update times. Sampled states are not complete trade or candle history; volume is not provided by this contract.</p>
        {max === min && <p className="mt-2 text-xs text-muted-foreground">The contract returned the same stored price for every available sample. No price movement was observed.</p>}
        {data.length === 1 && <p className="mt-2 text-xs text-muted-foreground">Only one observation is available; no historical trend can be determined.</p>}
        {history.unavailable > 0 && <p className="mt-2 text-xs text-destructive">Incomplete coverage: {history.unavailable} historical reads unavailable. Missing prices are not filled in.</p>}
      </>}
      <p className="mt-3 break-all font-mono text-xs text-muted-foreground">Source: {PYTH_CONTRACT} · Mezo Testnet · getPriceUnsafe at each sampled block</p>
    </div>
  );
};
