import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { getPythPrice, PYTH_CONTRACT, PYTH_MAX_AGE_SECONDS, type PythPrice } from "@/lib/pythOracle";

export function PythPriceCard({ feedName, feedId }: { feedName: string; feedId: string }) {
  const [data, setData] = useState<PythPrice | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await getPythPrice(feedId));
    } catch (e) {
      setError(e instanceof Error ? e.message.slice(0, 140) : "Could not read the Pyth contract.");
    } finally {
      setLoading(false);
    }
  }, [feedId]);

  useEffect(() => { void load(); }, [load]);

  const price = data ? Number(data.price) : 0;
  const digits = price < 10 ? 6 : 2;

  return (
    <div className="mb-5 rounded-lg border border-border/60 bg-secondary/30 p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase text-muted-foreground">Pyth Oracle · {feedName}</p>
        <button type="button" onClick={load} disabled={loading} className="inline-flex items-center gap-1 text-xs text-primary hover:underline disabled:opacity-50">
          <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>
      {error ? (
        <p className="text-sm text-destructive">Read failed: {error}</p>
      ) : !data ? (
        <p className="text-sm text-muted-foreground">Reading from Pyth contract…</p>
      ) : (
        <>
          <p className="font-display text-2xl font-semibold text-foreground">
            ${price.toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits })}
          </p>
          <p className="text-xs text-muted-foreground">± {Number(data.confidence).toFixed(digits)} · exponent {data.exponent}</p>
          <p className="mt-1 text-xs text-muted-foreground">Published {new Date(data.publishTime * 1000).toLocaleString()}</p>
          <p className={`mt-1 text-xs font-semibold ${data.fresh ? "text-accent" : "text-destructive"}`}>
            {data.fresh
              ? `Fresh — getPriceNoOlderThan(${PYTH_MAX_AGE_SECONDS}s) passed`
              : `Stale — older than ${PYTH_MAX_AGE_SECONDS}s, showing last stored on-chain price`}
          </p>
        </>
      )}
      <p className="mt-2 break-all font-mono text-[12px] text-muted-foreground">Contract {PYTH_CONTRACT} · Mezo Testnet</p>
    </div>
  );
}
