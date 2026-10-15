import { useMemo, useState } from "react";
import { useAccount } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { Braces, CheckCircle2, Store, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  createSellerService,
  readSellerServices,
  sellerServiceTemplates,
  type SellerServiceTemplate,
} from "@/lib/sellerServices";

const shortAddress = (value: string) => `${value.slice(0, 6)}…${value.slice(-4)}`;

export function ServiceSellerStudio() {
  const { address, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const [selected, setSelected] = useState<SellerServiceTemplate>(sellerServiceTemplates[0]);
  const [draft, setDraft] = useState(selected);
  const [services, setServices] = useState(() => readSellerServices());
  const normalizedAddress = address?.toLowerCase();
  const ownServices = useMemo(
    () => services.filter((service) => service.sellerAddress === normalizedAddress),
    [normalizedAddress, services],
  );

  const chooseTemplate = (template: SellerServiceTemplate) => {
    setSelected(template);
    setDraft(template);
  };

  const publish = () => {
    if (!isConnected || !address) {
      openConnectModal?.();
      return;
    }
    try {
      const created = createSellerService(draft, address);
      setServices((current) => [created, ...current]);
      toast.success(`${created.title} was added to the control room.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The service could not be created.");
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="mb-3 text-xs font-bold uppercase text-primary">Step 1 · Choose a starting point</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {sellerServiceTemplates.map((template) => {
              const active = selected.id === template.id;
              return (
                <Button
                  key={template.id}
                  type="button"
                  variant="outline"
                  onClick={() => chooseTemplate(template)}
                  aria-pressed={active}
                  className={`h-auto min-h-20 justify-start whitespace-normal p-4 text-left hover:bg-secondary hover:text-foreground ${active ? "border-accent bg-accent/10" : "bg-card"}`}
                >
                  <Braces className={active ? "text-accent" : "text-muted-foreground"} />
                  <span className="min-w-0">
                    <span className="block font-display font-semibold text-foreground">{template.title}</span>
                    <span className="mt-1 block text-xs font-normal text-muted-foreground">{template.category}</span>
                  </span>
                  {active && <CheckCircle2 className="ml-auto text-accent" />}
                </Button>
              );
            })}
          </div>
        </div>

        <div className="border-l-2 border-primary bg-card p-5 shadow-card md:p-7">
          <p className="mb-5 text-xs font-bold uppercase text-primary">Step 2 · Configure and publish</p>
          <div className="space-y-4">
            <label className="block text-sm font-semibold text-foreground">
              Service name
              <Input className="mt-2" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} maxLength={80} />
            </label>
            <label className="block text-sm font-semibold text-foreground">
              Description
              <Textarea className="mt-2 min-h-24" value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} maxLength={280} />
            </label>
            <label className="block text-sm font-semibold text-foreground">
              Service endpoint
              <Input className="mt-2 font-mono" value={draft.endpoint} onChange={(event) => setDraft({ ...draft, endpoint: event.target.value })} maxLength={160} />
            </label>
            <div className="border-y border-border py-3 text-xs text-muted-foreground">
              Seller wallet: <span className="font-mono font-semibold text-foreground">{address ? shortAddress(address) : "Connect wallet to assign ownership"}</span>
            </div>
            <Button type="button" onClick={publish} className="w-full sm:w-auto">
              {isConnected ? <Store /> : <Wallet />}
              {isConnected ? "Publish service" : "Connect wallet to publish"}
            </Button>
          </div>
        </div>
      </div>

      <div className="border-t border-border pt-7">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-accent">Seller registry</p>
            <h3 className="mt-1 font-display text-2xl font-bold text-foreground">Your published services</h3>
          </div>
          <span className="text-sm text-muted-foreground">{ownServices.length} linked to this wallet · Saved in this browser</span>
        </div>
        {ownServices.length === 0 ? (
          <div className="border border-dashed border-border bg-secondary/25 px-5 py-8 text-center text-sm text-muted-foreground">
            {isConnected ? "Choose a template and publish your first service." : "Connect the seller wallet to view its services."}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {ownServices.map((service) => (
              <article key={service.listingId} className="rounded-lg border border-border bg-card p-5 shadow-card">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase text-accent">{service.category}</p>
                    <h4 className="mt-1 font-display text-lg font-semibold text-foreground">{service.title}</h4>
                  </div>
                  <span className="shrink-0 rounded-md border border-accent/20 bg-accent/10 px-2 py-1 text-[10px] font-bold uppercase text-accent">Template listing</span>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">{service.description}</p>
                <div className="mt-5 space-y-2 border-t border-border pt-4 text-xs">
                  <p className="break-all font-mono text-foreground">{service.endpoint}</p>
                  <p className="break-all text-muted-foreground">Seller: {service.sellerAddress}</p>
                  <p className="text-muted-foreground">Deployment: Not deployed</p>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}