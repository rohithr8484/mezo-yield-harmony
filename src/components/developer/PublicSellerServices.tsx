import { useCallback, useEffect, useState } from "react";
import { FileUp, Loader2, Play, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ServiceImage, type ServiceImageKind } from "@/components/ServiceImage";
import { supabase } from "@/integrations/supabase/client";
import { loadPublicSellerServices, type PublicSellerService } from "@/lib/publicSellerServices";
import { usesSolidityInput } from "@/lib/sellerServices";

const images: Record<string, ServiceImageKind> = {
  "text-summarizer": "summarization",
  "contract-review": "contracts",
  "contract-function-viewer": "contracts",
};

function PublicService({ service }: { service: PublicSellerService }) {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const solidity = usesSolidityInput(service.id);
  const invoke = async () => {
    if (busy || !input.trim()) return;
    setBusy(true);
    setError("");
    setOutput("");
    try {
      const { data, error: requestError } = await supabase.functions.invoke("seller-services", {
        body: { action: "invoke", id: service.deploymentId, input },
      });
      if (requestError || data?.error) throw new Error(data?.error ?? "The service did not respond.");
      setOutput(data.output);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The service did not respond.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <article className="overflow-hidden rounded-lg border border-border bg-card shadow-card">
      {images[service.id] && <ServiceImage kind={images[service.id]} alt={`${service.title} service`} className="mx-auto rounded-none" />}
      <div className="space-y-4 p-5">
        <div>
          <p className="text-xs font-bold uppercase text-accent">{service.category} · Live</p>
          <h4 className="mt-1 font-display text-lg font-semibold text-foreground">{service.title}</h4>
        </div>
        <p className="text-sm text-muted-foreground">{service.description}</p>
        <p className="break-all text-xs text-muted-foreground">Seller: {service.sellerAddress}</p>
        <p className="break-all font-mono text-xs text-muted-foreground">{service.endpoint}</p>
        <label className="block text-sm font-semibold text-foreground">
          {solidity ? "Solidity source" : "Text"}
          <Textarea className="mt-2 min-h-28" value={input} onChange={(event) => setInput(event.target.value)} />
        </label>
        {solidity && <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-primary">
          <FileUp className="h-4 w-4" /> Upload Solidity file
          <input type="file" accept=".sol" className="sr-only" onChange={async (event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            if (!/\.sol$/i.test(file.name)) { setError("Please choose a .sol Solidity file."); return; }
            try { setInput(await file.text()); setError(""); }
            catch { setError("The file could not be read."); }
          }} />
        </label>}
        <div><Button variant="outline" size="sm" disabled={busy || !input.trim()} onClick={invoke}>
          {busy ? <Loader2 className="animate-spin" /> : <Play />} {busy ? "Running…" : "Run service"}
        </Button></div>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        {output && <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-words rounded-md bg-secondary/50 p-3 text-xs text-foreground">{output}</pre>}
      </div>
    </article>
  );
}

export function PublicSellerServices({ revision }: { revision: unknown }) {
  const [services, setServices] = useState<PublicSellerService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try { setServices(await loadPublicSellerServices()); }
    catch { setError("Published services could not be loaded. Please try again."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load, revision]);
  return <section className="border-t border-border pt-7" aria-labelledby="public-services-title">
    <div className="mb-5 flex items-center justify-between gap-3">
      <h3 id="public-services-title" className="font-display text-2xl font-bold text-foreground">All users’ published services</h3>
      <Button variant="outline" size="icon" aria-label="Refresh published services" title="Refresh published services" disabled={loading} onClick={load}>
        <RefreshCw className={loading ? "animate-spin" : ""} />
      </Button>
    </div>
    {loading ? <p role="status" className="text-sm text-muted-foreground">Loading published services…</p>
      : error ? <p role="alert" className="text-sm text-destructive">{error}</p>
      : services.length === 0 ? <p className="text-sm text-muted-foreground">No deployed services yet.</p>
      : <div className="grid gap-4 md:grid-cols-2">{services.map((service) => <PublicService key={service.deploymentId} service={service} />)}</div>}
  </section>;
}