import { useState } from "react";
import { Search, Loader2, XCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AMLScreeningPanel } from "./AMLScreeningPanel";
import { AnalysisAccessGate } from "./AnalysisAccessGate";
import { type ExplorerTransaction } from "@/lib/onchainAnalytics";

const API = "https://api.explorer.test.mezo.org/api/v2";

interface Result {
  address: string;
  txs: ExplorerTransaction[];
}

const getJson = async (url: string) => {
  try {
    const response = await fetch(url);
    return response.ok ? await response.json() : null;
  } catch {
    return null;
  }
};

export const IdentityVerification = ({ isPaid = false, onPaymentSuccess = () => {} }: { isPaid?: boolean; onPaymentSuccess?: () => void }) => {
  const [requested, setRequested] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [input, setInput] = useState("");
  const [res, setRes] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const screen = async () => {
    const value = input.trim();
    if (!value || loading) return;
    if (!/^0x([0-9a-fA-F]{40}|[0-9a-fA-F]{64})$/.test(value)) {
      setError("Enter a wallet address (0x… 40 hex) or a transaction hash.");
      return;
    }
    if (!authorized) {
      setError("");
      setRequested(true);
      return;
    }
    setLoading(true);
    setError("");
    setRes(null);
    try {
      let address = value;
      if (/^0x[0-9a-fA-F]{64}$/.test(value)) {
        const transaction = await getJson(`${API}/transactions/${value}`);
        if (!transaction?.from?.hash) {
          setError("Transaction not found or API unavailable.");
          return;
        }
        address = transaction.from.hash;
      } else if (!/^0x[0-9a-fA-F]{40}$/.test(value)) {
        setError("Enter a wallet address (0x… 40 hex) or a transaction hash.");
        return;
      }
      const transactions = await getJson(`${API}/addresses/${address}/transactions`);
      if (!Array.isArray(transactions?.items)) {
        setError("Wallet transaction records unavailable. Please try again.");
        return;
      }
      setRes({ address, txs: transactions.items });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          aria-label="Wallet address or transaction hash"
          placeholder="Wallet address or transaction hash (0x...)"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          className="min-w-0 border-border bg-secondary/60 font-mono text-xs"
          onKeyDown={(event) => event.key === "Enter" && screen()}
        />
        <Button
          onClick={screen}
          disabled={loading || !input.trim()}
          className="flex shrink-0 items-center gap-2 rounded-lg bg-gradient-to-r from-primary to-accent px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          Screen
        </Button>
      </div>
      {error && (
        <div role="alert" className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          <XCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}
      {requested && <AnalysisAccessGate
        serviceName="Identity Verification"
        displayName="AML Screening API"
        isPaid={isPaid}
        onPaymentSuccess={onPaymentSuccess}
        onUnlock={() => setAuthorized(true)}
      >
        {res && <AMLScreeningPanel address={res.address} transactions={res.txs} />}
      </AnalysisAccessGate>}
    </div>
  );
};
