import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FileText } from "lucide-react";

export const AITextSummarizer = () => {
  const [text, setText] = useState("");
  const [length, setLength] = useState<"short" | "medium" | "long">("medium");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ summary?: string; keyPoints?: string[] } | null>(null);

  const run = async () => {
    if (!text.trim()) return toast.error("Enter some text to summarize");
    setLoading(true); setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("ai-summarize", { body: { text, length } });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      setResult(data as any);
    } catch (e: any) {
      toast.error(e.message ?? "Summarization failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-3">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste an article, doc, or long text..."
        rows={5}
        className="w-full rounded-lg bg-secondary/60 border border-border p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
      />
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
