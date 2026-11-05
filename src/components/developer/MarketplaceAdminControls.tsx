import { useState } from "react";
import { Clock, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MARKETPLACE_VEMEZO_COLLECTION, readMarketplaceCollectionSupported, readMarketplaceFeeTimelock } from "@/lib/marketplaceAdminReads";

export const MarketplaceAdminControls = () => {
  const [fee, setFee] = useState<string | null>(null);
  const [collection, setCollection] = useState<boolean | null>(null);
  const [pending, setPending] = useState<"fee" | "collection" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const read = async (method: "fee" | "collection") => {
    if (pending) return;
    setPending(method);
    setError(null);
    if (method === "fee") setFee(null);
    else setCollection(null);
    try {
      if (method === "fee") setFee((await readMarketplaceFeeTimelock()).toString());
      else setCollection(await readMarketplaceCollectionSupported());
    } catch {
      setError("Contract read unavailable. Please try again.");
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="mb-8 space-y-3" aria-label="MarketplaceAdmin contract reads">
      <div className="flex flex-wrap justify-center gap-3">
        <Button onClick={() => read("fee")} disabled={pending !== null} className="ui-btn ui-btn-pay min-h-10">
          {pending === "fee" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Clock className="h-4 w-4" />}
          FEE_TIMELOCK()
        </Button>
        <Button onClick={() => read("collection")} disabled={pending !== null} className="ui-btn ui-btn-pay min-h-10">
          {pending === "collection" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
          isCollectionSupported()
        </Button>
      </div>
      <div className="space-y-2 text-center text-sm text-foreground" role="status" aria-live="polite">
        {fee !== null && <p>FEE_TIMELOCK: {fee} seconds ({Number(fee) / 3600} hours)</p>}
        {collection !== null && <p className="break-words">isCollectionSupported: <strong>{String(collection)}</strong><span className="mt-1 block font-mono text-xs text-muted-foreground">{MARKETPLACE_VEMEZO_COLLECTION}</span></p>}
        {error && <p className="text-destructive" role="alert">{error}</p>}
      </div>
    </div>
  );
};