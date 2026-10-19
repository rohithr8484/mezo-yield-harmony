import { useCallback, useEffect, useMemo, useState } from "react";
import { useAccount, useSignMessage, useSwitchChain } from "wagmi";
import { parseUnits } from "viem";
import type { Eip1193Provider } from "ethers";
import { payWithMUSD, PREDICTION_MUSD } from "@/lib/musdPayment";
import { payWithMEZO, MEZO_TOKEN_ADDRESS } from "@/lib/mezoPayment";
import { getTokenPaymentError } from "@/lib/tokenPayment";

const MEZO_TESTNET_CHAIN_ID = 31611;
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { Braces, CheckCircle2, FileUp, Loader2, Play, Rocket, Store, Wallet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ServiceImage, type ServiceImageKind } from "@/components/ServiceImage";
import {
  buildDeployMessage,
  createSellerService,
  readSellerServices,
  sellerServiceTemplates,
  type SellerService,
  type SellerServiceTemplate,
} from "@/lib/sellerServices";

/** Same service keeps the same imagery as its built-in counterpart. */
const templateImage: Record<string, ServiceImageKind> = {
  "text-summarizer": "summarization",
  "wallet-analytics": "analytics",
  "contract-review": "contracts",
};

type DeployedService = { id: string; listing_id: string; deployed_at: string };
const SERVICE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/seller-services`;

const shortAddress = (value: string) => `${value.slice(0, 6)}…${value.slice(-4)}`;

export function ServiceSellerStudio() {
  const { address, isConnected, chainId, connector } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { switchChainAsync } = useSwitchChain();
  const [paying, setPaying] = useState<"MUSD" | "MEZO" | null>(null);
  const [paymentReceipts, setPaymentReceipts] = useState<{ label: string; hash: string }[]>([]);
  const visibleTemplates = useMemo(() => sellerServiceTemplates.filter((t) => t.id !== "wallet-analytics"), []);
  const [selected, setSelected] = useState<SellerServiceTemplate>(visibleTemplates[0]);
  const [draft, setDraft] = useState(selected);
  const [contractFile, setContractFile] = useState<{ name: string; source: string } | null>(null);
  const [services, setServices] = useState(() => readSellerServices());
  const normalizedAddress = address?.toLowerCase();
  const ownServices = useMemo(
    () => services.filter((service) => service.sellerAddress === normalizedAddress),
    [normalizedAddress, services],
  );

  const { signMessageAsync } = useSignMessage();
  const [deployed, setDeployed] = useState<Record<string, DeployedService>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [testOutput, setTestOutput] = useState<Record<string, string>>({});

  const loadDeployed = useCallback(async () => {
    if (!normalizedAddress) return setDeployed({});
    const { data } = await supabase
      .from("seller_services")
      .select("id, listing_id, deployed_at")
      .eq("seller_address", normalizedAddress);
    setDeployed(Object.fromEntries((data ?? []).map((row) => [row.listing_id, row])));
  }, [normalizedAddress]);

  useEffect(() => {
    void loadDeployed();
  }, [loadDeployed]);

  const deploy = async (service: SellerService) => {
    if (!address) {
      openConnectModal?.();
      return false;
    }
    setBusy(service.listingId);
    try {
      const signedAt = Date.now();
      const sellerAddress = address.toLowerCase();
      const signature = await signMessageAsync({
        account: address,
        message: buildDeployMessage({ ...service, sellerAddress, signedAt }),
      });
      const { data, error } = await supabase.functions.invoke("seller-services", {
        body: {
          action: "deploy",
          listingId: service.listingId,
          sellerAddress,
          templateId: service.id,
          title: service.title,
          category: service.category,
          description: service.description,
          endpoint: service.endpoint,
          signedAt,
          signature,
        },
      });
      if (error || data?.error) throw new Error(data?.error ?? "Deployment failed. Please try again.");
      setDeployed((current) => ({ ...current, [service.listingId]: data.service }));
      toast.success(`${service.title} is now live.`);
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Deployment failed.";
      toast.error(/reject|denied|cancel/i.test(message) ? "Signature cancelled in the wallet." : message);
      return false;
    } finally {
      setBusy(null);
    }
  };

  const deployAllPending = async () => {
    for (const service of ownServices.filter((item) => !deployed[item.listingId])) {
      const ok = await deploy(service);
      if (!ok) break;
    }
  };

  const testService = async (service: SellerService, id: string) => {
    setBusy(`test:${service.listingId}`);
    try {
      const input = service.id === "contract-review"
        ? contractFile?.source ||
          "contract Vault { mapping(address=>uint) b; function withdraw() external { (bool ok,) = msg.sender.call{value:b[msg.sender]}(\"\"); require(ok); b[msg.sender]=0; } }"
        : service.id === "wallet-analytics"
          ? "0x9A220b677234BB18273aC031bE6CA405a950cA2e"
          : "Mezo lets bitcoin holders borrow MUSD against BTC, lock MEZO as veMEZO for governance, and pay developer services on the Mezo test network.";
      const { data, error } = await supabase.functions.invoke("seller-services", { body: { action: "invoke", id, input } });
      if (error || data?.error) throw new Error(data?.error ?? "The service did not respond.");
      setTestOutput((current) => ({ ...current, [service.listingId]: data.output }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The service did not respond.");
    } finally {
      setBusy(null);
    }
  };

  const pendingCount = ownServices.filter((item) => !deployed[item.listingId]).length;

  const chooseTemplate = (template: SellerServiceTemplate) => {
    setSelected(template);
    setDraft(template);
    setContractFile(null);
  };

  const uploadContract = (file: File | undefined) => {
    if (!file) return;
    if (!/\.sol$/i.test(file.name)) {
      toast.error("Please choose a .sol Solidity file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setContractFile({ name: file.name, source: String(reader.result ?? "") });
      toast.success(`${file.name} is ready to review.`);
    };
    reader.onerror = () => toast.error("The file could not be read.");
    reader.readAsText(file);
  };

  const publish = () => {
    if (!isConnected || !address) {
      openConnectModal?.();
      return;
    }
    try {
      const created = createSellerService(draft, address);
      setServices((current) => [created, ...current]);
      toast.success(`${created.title} was added. Sign in your wallet to deploy it.`);
      void deploy(created);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The service could not be created.");
    }
  };

  const payAndPublish = async (token: "MUSD" | "MEZO") => {
    if (paying) return;
    if (!isConnected || !address) {
      openConnectModal?.();
      return;
    }
    setPaying(token);
    try {
      if (chainId !== MEZO_TESTNET_CHAIN_ID) await switchChainAsync({ chainId: MEZO_TESTNET_CHAIN_ID });
      const walletProvider = (await connector?.getProvider()) as Eip1193Provider | undefined;
      const { stakeHash, rewardHash } = token === "MUSD"
        ? await payWithMUSD(parseUnits("0.2", 18), "0.0005", walletProvider)
        : await payWithMEZO(parseUnits("0.2", 18), walletProvider);
      setPaymentReceipts((current) => [
        { label: `0.2 ${token} payment`, hash: stakeHash },
        ...(rewardHash ? [{ label: "0.0005 MUSD reward", hash: rewardHash }] : []),
        ...current,
      ].slice(0, 4));
      toast.success(`Payment confirmed on-chain with ${token}. Your wallet may still label it "failed" — the explorer receipt is the real result.`);
      publish();
    } catch (error) {
      toast.error(getTokenPaymentError(error));
    } finally {
      setPaying(null);
    }
  };

  const addTokensToWallet = async () => {
    try {
      const provider = (await connector?.getProvider()) as Eip1193Provider | undefined;
      if (!provider) {
        openConnectModal?.();
        return;
      }
      for (const token of [
        { address: MEZO_TOKEN_ADDRESS, symbol: "MEZO" },
        { address: PREDICTION_MUSD, symbol: "MUSD" },
      ]) {
        await provider.request({
          method: "wallet_watchAsset",
          params: { type: "ERC20", options: { address: token.address, symbol: token.symbol, decimals: 18 } } as never,
        });
      }
      toast.success("MEZO and MUSD were offered to your wallet.");
    } catch (error) {
      toast.error(getTokenPaymentError(error));
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="mb-3 text-xs font-bold uppercase text-primary">Step 1 · Choose a starting point</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {visibleTemplates.map((template) => {
              const active = selected.id === template.id;
              return (
                <Button
                  key={template.id}
                  type="button"
                  variant="outline"
                  onClick={() => chooseTemplate(template)}
                  aria-pressed={active}
                  className={`h-auto flex-col items-stretch overflow-hidden whitespace-normal p-0 text-left hover:bg-secondary hover:text-foreground ${active ? "border-accent bg-accent/10" : "bg-card"}`}
                >
                  {templateImage[template.id] && (
                    <ServiceImage kind={templateImage[template.id]} alt={`${template.title} service`} className="mx-auto rounded-none" />
                  )}
                  <span className="flex w-full items-start gap-3 p-4">
                    <Braces className={active ? "mt-0.5 text-accent" : "mt-0.5 text-muted-foreground"} />
                    <span className="min-w-0">
                      <span className="block font-display font-semibold text-foreground">{template.title}</span>
                      <span className="mt-1 block text-xs font-normal text-muted-foreground">{template.category}</span>
                    </span>
                    {active && <CheckCircle2 className="ml-auto text-accent" />}
                  </span>
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
            {selected.id === "contract-review" && (
              <div>
                <input
                  id="contract-upload"
                  type="file"
                  accept=".sol"
                  className="hidden"
                  onChange={(event) => {
                    uploadContract(event.target.files?.[0]);
                    event.target.value = "";
                  }}
                />
                <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById("contract-upload")?.click()}>
                  <FileUp /> Upload Solidity file
                </Button>
                {contractFile && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Loaded <span className="font-mono font-semibold text-foreground">{contractFile.name}</span> — it will be used when you test the live service.
                  </p>
                )}
              </div>
            )}
            <label className="block text-sm font-semibold text-foreground">
              Service endpoint
              <Input className="mt-2 font-mono" value={draft.endpoint} onChange={(event) => setDraft({ ...draft, endpoint: event.target.value })} maxLength={160} />
            </label>
            <div className="border-y border-border py-3 text-xs text-muted-foreground">
              Seller wallet: <span className="font-mono font-semibold text-foreground">{address ? shortAddress(address) : "Connect wallet to assign ownership"}</span>
              <span className="mt-2 block text-accent">Charge: Pay with MUSD 0.2 MUSD (0.0005 MUSD reward returned) · Pay with MEZO 0.2 MEZO · Publish &amp; deploy service is free</span>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button type="button" onClick={publish} className="w-full sm:w-auto">
                {isConnected ? <Store /> : <Wallet />}
                {isConnected ? "Publish & deploy service" : "Connect wallet to publish"}
              </Button>
              <Button type="button" onClick={() => payAndPublish("MUSD")} disabled={paying !== null} className="w-full sm:w-auto">
                {paying === "MUSD" ? <Loader2 className="animate-spin" /> : <Wallet />}
                {paying === "MUSD" ? "Wait..." : "Pay with MUSD"}
              </Button>
              <Button type="button" onClick={() => payAndPublish("MEZO")} disabled={paying !== null} className="w-full sm:w-auto">
                {paying === "MEZO" ? <Loader2 className="animate-spin" /> : <Wallet />}
                {paying === "MEZO" ? "Wait..." : "Pay with MEZO"}
              </Button>
            </div>
            <div className="space-y-2 text-xs text-muted-foreground">
              <button type="button" onClick={addTokensToWallet} className="font-semibold text-primary underline-offset-4 hover:underline">
                Add MEZO & MUSD to your wallet
              </button>
              <p>Some wallets show successful Mezo Testnet payments as "failed". The explorer receipt below is the real result.</p>
              {paymentReceipts.map((receipt) => (
                <a
                  key={receipt.hash}
                  href={`https://explorer.test.mezo.org/tx/${receipt.hash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 rounded-md border border-accent/30 bg-accent/10 px-3 py-2 font-medium text-foreground"
                >
                  <CheckCircle2 className="h-4 w-4 text-accent" />
                  {receipt.label} confirmed on-chain · <span className="font-mono">{receipt.hash.slice(0, 10)}…{receipt.hash.slice(-6)}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-border pt-7">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-accent">Seller registry</p>
            <h3 className="mt-1 font-display text-2xl font-bold text-foreground">Your published services</h3>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-muted-foreground">{ownServices.length} linked to this wallet · {ownServices.length - pendingCount} live</span>
            {pendingCount > 0 && (
              <Button type="button" size="sm" onClick={deployAllPending} disabled={busy !== null}>
                <Rocket /> Deploy {pendingCount} pending
              </Button>
            )}
          </div>
        </div>
        {ownServices.length === 0 ? (
          <div className="border border-dashed border-border bg-secondary/25 px-5 py-8 text-center text-sm text-muted-foreground">
            {isConnected ? "Choose a template and publish your first service." : "Connect the seller wallet to view its services."}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {ownServices.map((service) => (
              <article key={service.listingId} className="overflow-hidden rounded-lg border border-border bg-card shadow-card">
                {templateImage[service.id] && (
                  <ServiceImage kind={templateImage[service.id]} alt={`${service.title} service`} className="mx-auto rounded-none" />
                )}
                <div className="p-5">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase text-accent">{service.category}</p>
                    <h4 className="mt-1 font-display text-lg font-semibold text-foreground">{service.title}</h4>
                  </div>
                  {deployed[service.listingId] ? (
                    <span className="shrink-0 rounded-md border border-accent/30 bg-accent/10 px-2 py-1 text-[10px] font-bold uppercase text-accent">Live</span>
                  ) : (
                    <span className="shrink-0 rounded-md border border-border bg-secondary px-2 py-1 text-[10px] font-bold uppercase text-muted-foreground">Not deployed</span>
                  )}
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">{service.description}</p>
                <div className="mt-5 space-y-2 border-t border-border pt-4 text-xs">
                  <p className="break-all font-mono text-foreground">{service.endpoint}</p>
                  <p className="break-all text-muted-foreground">Seller: {service.sellerAddress}</p>
                  {deployed[service.listingId] ? (
                    <>
                      <p className="text-muted-foreground">
                        Deployed {new Date(deployed[service.listingId].deployed_at).toLocaleString()}
                      </p>
                      <p className="break-all font-mono text-muted-foreground">
                        POST {SERVICE_URL} {"{"} "action": "invoke", "id": "{deployed[service.listingId].id}", "input": "…" {"}"}
                      </p>
                    </>
                  ) : (
                    <p className="text-muted-foreground">Deployment: Not deployed yet</p>
                  )}
                </div>
                <div className="mt-4">
                  {deployed[service.listingId] ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={busy !== null}
                      onClick={() => testService(service, deployed[service.listingId].id)}
                    >
                      {busy === `test:${service.listingId}` ? <Loader2 className="animate-spin" /> : <Play />} Test live service
                    </Button>
                  ) : (
                    <Button type="button" size="sm" disabled={busy !== null} onClick={() => deploy(service)}>
                      {busy === service.listingId ? <Loader2 className="animate-spin" /> : <Rocket />} Deploy with wallet signature
                    </Button>
                  )}
                  {testOutput[service.listingId] && (
                    <pre className="mt-3 max-h-48 overflow-auto whitespace-pre-wrap rounded-md bg-secondary/50 p-3 text-xs text-foreground">
                      {testOutput[service.listingId]}
                    </pre>
                  )}
                </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}