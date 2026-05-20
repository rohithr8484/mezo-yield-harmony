import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";

export const AIReviewAnalyzer = () => {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const run = async () => {
    if (!text.trim()) return toast.error("Enter some review text");
    setLoading(true); setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("ai-sentiment", { body: { text } });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      setResult(data);
    } catch (e: any) {
      toast.error(e.message ?? "Analysis failed");
    } finally { setLoading(false); }
  };

  const sentimentColor = result?.sentiment === "positive" ? "text-emerald-500"
    : result?.sentiment === "negative" ? "text-red-500" : "text-amber-500";

  return (
    <div className="space-y-3">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste a customer review or feedback..."
        rows={4}
        className="w-full rounded-lg bg-secondary/60 border border-border p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
      />
      <button
        onClick={run}
        disabled={loading}
        className="w-full px-4 py-2 rounded-full bg-gradient-to-r from-primary to-accent text-primary-foreground text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
      >
        <Sparkles className="h-4 w-4" /> {loading ? "Analyzing..." : "Analyze Sentiment"}
      </button>
      {result && (
        <div className="rounded-lg bg-secondary/40 border border-border p-4 text-sm space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Sentiment</span>
            <span className={`font-bold uppercase ${sentimentColor}`}>{result.sentiment}</span>
          </div>
          {typeof result.score === "number" && (
            <div className="flex justify-between"><span className="text-muted-foreground">Score</span><span className="font-mono">{result.score.toFixed(2)}</span></div>
          )}
          {result.summary && <p className="text-foreground">{result.summary}</p>}
          {result.pros?.length > 0 && <div><p className="text-xs text-emerald-500 font-bold mb-1">PROS</p><ul className="list-disc list-inside text-xs space-y-0.5">{result.pros.map((p: string, i: number) => <li key={i}>{p}</li>)}</ul></div>}
          {result.cons?.length > 0 && <div><p className="text-xs text-red-500 font-bold mb-1">CONS</p><ul className="list-disc list-inside text-xs space-y-0.5">{result.cons.map((p: string, i: number) => <li key={i}>{p}</li>)}</ul></div>}
        </div>
      )}
    </div>
  );
};
