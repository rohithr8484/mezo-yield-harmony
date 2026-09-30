import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FileText, Sparkles } from "lucide-react";

export type SummaryFocus = "general" | "liquidity" | "lending" | "wallet" | "governance";

const FOCUS_OPTIONS: { id: SummaryFocus; label: string; hint: string; sample: string }[] = [
  {
    id: "general",
    label: "General",
    hint: "Balanced summary of any text",
    sample: "Paste an article, doc, or long text about Mezo...",
  },
  {
    id: "liquidity",
    label: "Liquidity",
    hint: "Pool depth, TVL, swap flow, incentive rounds",
    sample: "Summarize this liquidity plan: MUSD/MEZO pool receives 200K MUSD in incentives over 4 weeks, with a 60/40 weight split targeting 1.5M TVL depth...",
  },
  {
    id: "lending",
    label: "Lending",
    hint: "Collateral ratios, borrow rates, liquidation risk",
    sample: "Summarize this lending proposal: cbBTC collateral at 70% LTV, MUSD borrow at 3% base rate, liquidation threshold 82% with a 5% penalty...",
  },
  {
    id: "wallet",
    label: "Wallet behavior",
    hint: "Activity patterns, holdings, transaction flow",
    sample: "Summarize this wallet report: 0xabc... made 142 transfers in 30 days, holds 12.4 BTC and 3,900 MUSD, mostly Tigris DEX swaps with weekly inflow spikes...",
  },
  {
    id: "governance",
    label: "Governance",
    hint: "Proposals, quorum, voting power, fees",
    sample: "Summarize this governance proposal: raise the vote fee from 0.2 to 0.5 MUSD to fund the security multisig, quorum stays at 200K votes with a 7-day window...",
  },
];

export const AITextSummarizer = () => {
  const [text, setText] = useState("");
  const [length, setLength] = useState<"short" | "medium" | "long">("medium");
  const [focus, setFocus] = useState<SummaryFocus>("general");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ summary?: string; keyPoints?: string[] } | null>(null);

  const run = async () => {
    if (!text.trim()) return toast.error("Enter some text to summarize");
    setLoading(true); setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("ai-summarize", { body: { text, length, focus } });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      setResult(data as any);
    } catch (e: any) {
      toast.error(e.message ?? "Summarization failed");
    } finally { setLoading(false); }
  };

  const active = FOCUS_OPTIONS.find((f) => f.id === focus)!;

  return (
    <div className="space-y-3">
      <div>
        <p className="text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-accent" /> AI FOCUS
        </p>
        <div className="flex flex-wrap gap-2">
          {FOCUS_OPTIONS.map((f) => (
            <button key={f.id} onClick={() => setFocus(f.id)} title={f.hint}
              className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${focus === f.id ? "bg-primary text-primary-foreground border-primary" : "bg-secondary/60 text-muted-foreground border-border hover:border-primary/40"}`}>
              {f.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-1.5">{active.hint}</p>
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={active.sample}
        rows={5}
        className="w-full rounded-lg bg-secondary/60 border border-border p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
      />
      <button
        onClick={() => setText(active.sample)}
        className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
      >
        <Sparkles className="h-3 w-3" /> Use sample query ({active.label})
      </button>
      <div className="flex gap-2">
        {(["short", "medium", "long"] as const).map((l) => (
          <button key={l} onClick={() => setLength(l)}
            className={`px-3 py-1 rounded-full text-xs font-semibold border ${length === l ? "bg-primary text-primary-foreground border-primary" : "bg-secondary/60 text-muted-foreground border-border"}`}>
            {l}
          </button>
        ))}
      </div>
      <button
        onClick={run}
        disabled={loading}
        className="w-full px-4 py-2 rounded-full bg-gradient-to-r from-primary to-accent text-primary-foreground text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
      >
        <FileText className="h-4 w-4" /> {loading ? "Summarizing..." : "Summarize"}
      </button>
      {result && (
        <div className="rounded-lg bg-secondary/40 border border-border p-4 text-sm space-y-2">
          {result.summary && <p className="text-foreground">{result.summary}</p>}
          {result.keyPoints && result.keyPoints.length > 0 && (
            <div>
              <p className="text-xs text-primary font-bold mb-1">KEY POINTS</p>
              <ul className="list-disc list-inside text-xs space-y-0.5">
                {result.keyPoints.map((p, i) => <li key={i}>{p}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
