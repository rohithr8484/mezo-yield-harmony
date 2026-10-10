import { useEffect, useRef, useState } from "react";
import { Search, Loader2, XCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AMLScreeningPanel } from "./AMLScreeningPanel";
import { AnalysisAccessGate } from "./AnalysisAccessGate";
import { loadAMLObservations, type AMLResult } from "@/lib/amlExplorer";

export const IdentityVerification = () => {
  const [requestId, setRequestId] = useState(0);
  const [requested, setRequested] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [input, setInput] = useState("");
  const [res, setRes] = useState<AMLResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submittedInput, setSubmittedInput] = useState("");
  const activeRequest = useRef<AbortController | null>(null);
  useEffect(() => () => activeRequest.current?.abort(), []);

  const screen = async (unlocked = false) => {
    const value = unlocked ? submittedInput : input.trim();
    if (!value || loading) return;
    if (!/^0x([0-9a-fA-F]{40}|[0-9a-fA-F]{64})$/.test(value)) {
      setError("Enter a wallet address (0x… 40 hex) or a transaction hash.");
      return;
    }
    if (!unlocked) {
      setSubmittedInput(value);
      setAuthorized(false);
      setRes(null);
      setRequestId(previous => previous + 1);
      setError("");
      setRequested(true);
      return;
    }
    setLoading(true);
    setError("");
    setRes(null);
    activeRequest.current?.abort();
    const controller = new AbortController();
    activeRequest.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), 30000);
    try {
      const result = await loadAMLObservations(value, controller.signal);
      if (controller.signal.aborted) throw new Error("Request timed out.");
      if (activeRequest.current === controller) setRes(result);
    } catch (err) {
      if (activeRequest.current === controller) setError(controller.signal.aborted ? "The explorer request timed out. Please try again." : err instanceof Error ? err.message : "Unable to load wallet records.");
    } finally {
      window.clearTimeout(timeout);
      if (activeRequest.current === controller) setLoading(false);
    }
  };

  useEffect(() => {
    if (authorized) void screen(true);
  }, [authorized]);

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
          onClick={() => screen()}
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
      {loading && <div role="status" className="flex items-center gap-2 py-6 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading transaction and token payment records…</div>}
      {requested && <AnalysisAccessGate
        key={requestId}
        serviceName="Identity Verification"
        displayName="AML Screening"
        onPaymentSuccess={() => {}}
        onUnlock={() => setAuthorized(true)}
      >
        {res && <AMLScreeningPanel result={res} />}
      </AnalysisAccessGate>}
    </div>
  );
};
