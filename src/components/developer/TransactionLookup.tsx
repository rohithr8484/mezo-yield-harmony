import { useState } from "react";
import { Search, ExternalLink, Loader2, CheckCircle, XCircle, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";

interface TxData {
  hash: string;
  status: string;
  block: number;
  from: { hash: string };
  to: { hash: string };
  value: string;
  fee: { value: string };
  gas_used: string;
  gas_limit: string;
  method: string;
  timestamp: string;
  token_transfers?: Array<{
    token: { name: string; symbol: string };
    total: { value: string; decimals: string };
    from: { hash: string };
    to: { hash: string };
  }>;
  decoded_input?: {
    method_call: string;
    parameters: Array<{ name: string; value: string; type: string }>;
  };
}

const EXPLORER_API = "https://api.explorer.test.mezo.org/api/v2/transactions";

export const TransactionLookup = ({ title, icon: Icon }: { title: string; icon: React.ElementType }) => {
  const [hash, setHash] = useState("");
  const [txData, setTxData] = useState<TxData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const lookup = async () => {
    if (!hash.trim()) return;
    setLoading(true);
    setError("");
    setTxData(null);
    try {
      const res = await fetch(`${EXPLORER_API}/${hash.trim()}`);
      if (!res.ok) throw new Error("Transaction not found");
      const data = await res.json();
      setTxData(data);
    } catch {
      setError("Transaction not found or API unavailable.");
    } finally {
      setLoading(false);
    }
  };

  const formatAddr = (addr: string) => `${addr.slice(0, 8)}...${addr.slice(-6)}`;
  const formatValue = (val: string, decimals = 18) => {
    const num = Number(val) / Math.pow(10, decimals);
    return num.toFixed(num < 0.001 ? 8 : 4);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Enter transaction hash (0x...)"
          value={hash}
          onChange={(e) => setHash(e.target.value)}
          className="font-mono text-xs bg-secondary/60 border-border"
          onKeyDown={(e) => e.key === "Enter" && lookup()}
        />
        <button
          onClick={lookup}
          disabled={loading || !hash.trim()}
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-primary to-accent text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2 shrink-0"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          Lookup
        </button>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 text-sm text-destructive flex items-center gap-2">
          <XCircle className="h-4 w-4" /> {error}
        </div>
      )}

      {txData && (
        <div className="bg-secondary/40 rounded-xl border border-border p-5 space-y-4 animate-in fade-in duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {txData.status === "ok" ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-destructive" />
              )}
              <span className={`text-sm font-bold ${txData.status === "ok" ? "text-green-500" : "text-destructive"}`}>
                {txData.status === "ok" ? "Success" : "Failed"}
              </span>
            </div>
            <a
              href={`https://explorer.test.mezo.org/tx/${txData.hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              Explorer <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground text-xs mb-1">Block</p>
              <p className="font-mono text-foreground">{txData.block}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-1">Timestamp</p>
              <p className="text-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {new Date(txData.timestamp).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-1">From</p>
              <p className="font-mono text-foreground text-xs">{formatAddr(txData.from.hash)}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-1">To</p>
              <p className="font-mono text-foreground text-xs">{formatAddr(txData.to.hash)}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-1">Value</p>
              <p className="font-mono text-foreground">{formatValue(txData.value)} BTC</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-1">Fee</p>
              <p className="font-mono text-foreground">{formatValue(txData.fee.value)} BTC</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-1">Gas Used / Limit</p>
              <p className="font-mono text-foreground text-xs">{txData.gas_used} / {txData.gas_limit}</p>
            </div>
            {txData.method && (
              <div>
                <p className="text-muted-foreground text-xs mb-1">Method</p>
                <p className="font-mono text-foreground text-xs">{txData.method}</p>
              </div>
            )}
          </div>

          {txData.decoded_input && (
            <div>
              <p className="text-muted-foreground text-xs mb-2 font-semibold">Decoded Input</p>
              <div className="bg-card rounded-lg p-3 border border-border">
                <p className="font-mono text-xs text-primary mb-2">{txData.decoded_input.method_call}</p>
                {txData.decoded_input.parameters?.map((p, i) => (
                  <div key={i} className="flex gap-2 text-xs mb-1">
                    <span className="text-muted-foreground">{p.name}:</span>
                    <span className="font-mono text-foreground break-all">{p.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {txData.token_transfers && txData.token_transfers.length > 0 && (
            <div>
              <p className="text-muted-foreground text-xs mb-2 font-semibold">Token Transfers</p>
              <div className="space-y-2">
                {txData.token_transfers.map((t, i) => (
                  <div key={i} className="bg-card rounded-lg p-3 border border-border text-xs">
                    <span className="text-primary font-semibold">{t.token.symbol}</span>
                    <span className="text-muted-foreground"> {formatValue(t.total.value, Number(t.total.decimals))}</span>
                    <span className="text-muted-foreground"> from </span>
                    <span className="font-mono">{formatAddr(t.from.hash)}</span>
                    <span className="text-muted-foreground"> → </span>
                    <span className="font-mono">{formatAddr(t.to.hash)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
