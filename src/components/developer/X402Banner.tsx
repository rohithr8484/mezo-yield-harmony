import { useState } from "react";
import { Zap, Loader2, CheckCircle2, ExternalLink, Info, Laugh } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAccount, useSignTypedData, useSwitchChain, useWriteContract, usePublicClient } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { erc20Abi, maxUint256 } from "viem";
import { wrapFetchWithPayment, x402Client, decodePaymentResponseHeader } from "@x402/fetch";
import { ExactEvmScheme } from "@x402/evm/exact/client";
import { toClientEvmSigner } from "@x402/evm";

// Same live x402 resource + facilitator as the reference app (vativ/mezo-hack apps/humor).
const RESOURCE_URL = "https://humor.vativ.io/joke";
const MEZO_CHAIN_ID = 31611;
const MUSD = "0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503" as `0x${string}`;
const PERMIT2 = "0x000000000022D473030F116dDEE9F6B43aC78BA3" as `0x${string}`;
const EXPLORER = "https://explorer.test.mezo.org/tx";

type Receipt = { joke: { setup: string; punchline: string }; tx?: string; payer?: string; network?: string };

export const X402Banner = ({ uniform = false }: { uniform?: boolean } = {}) => {
  const { isConnected, address, chainId } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const { openConnectModal } = useConnectModal();
  const { signTypedDataAsync } = useSignTypedData();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient({ chainId: MEZO_CHAIN_ID });
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [result, setResult] = useState<Receipt | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const paymentButtonClass =
    "rounded-full bg-gradient-to-r from-primary via-magenta to-accent text-primary-foreground text-sm font-semibold shadow-card hover:opacity-90 transition-opacity disabled:opacity-60";

  const handleClick = async () => {
    if (busy) return;
    if (!isConnected || !address) {
      openConnectModal?.();
      return;
    }
    if (!publicClient) return;
    setBusy(true);
    setResult(null);
    try {
      if (chainId !== MEZO_CHAIN_ID) await switchChainAsync({ chainId: MEZO_CHAIN_ID });

      // One-time setup: Permit2 must be allowed to move mUSD (only asked the very first time).
      const allowance = await publicClient.readContract({
        address: MUSD, abi: erc20Abi, functionName: "allowance", args: [address, PERMIT2],
      });
      if (allowance === 0n) {
        setStatus("One-time setup: approve Permit2 for mUSD…");
        const h = await writeContractAsync({
          address: MUSD, abi: erc20Abi, functionName: "approve", args: [PERMIT2, maxUint256], chainId: MEZO_CHAIN_ID,
        });
        await publicClient.waitForTransactionReceipt({ hash: h });
      }

      const signer = toClientEvmSigner(
        {
          address,
          signTypedData: (msg) =>
            signTypedDataAsync({ account: address, ...(msg as any) }) as Promise<`0x${string}`>,
        },
        publicClient as any,
      );
      const client = new x402Client();
      client.register("eip155:*", new ExactEvmScheme(signer));
      const fetchWithPay = wrapFetchWithPayment(fetch, client);

      setStatus("402 received · sign the payment in your wallet (no gas)…");
      const res = await fetchWithPay(RESOURCE_URL);
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      setStatus("Facilitator settling on Mezo…");
      const joke = await res.json();
      const header = res.headers.get("PAYMENT-RESPONSE") || res.headers.get("X-PAYMENT-RESPONSE");
      const settle = header ? decodePaymentResponseHeader(header) : null;
      setResult({ joke, tx: settle?.transaction, payer: settle?.payer, network: settle?.network });
      toast.success("x402 payment settled — resource unlocked");
    } catch (e) {
      const msg = e instanceof Error ? e.message.toLowerCase() : "";
      toast.error(
        msg.includes("reject") || msg.includes("denied") || msg.includes("cancel")
          ? "Cancelled in wallet."
          : "x402 payment failed. Make sure you hold a little testnet mUSD.",
      );
    } finally {
      setBusy(false);
      setStatus("");
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          onClick={handleClick}
          disabled={busy}
          className={uniform ? paymentButtonClass : `${paymentButtonClass} text-xs px-4 py-2`}
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
          {busy ? "Processing…" : "Pay with x402"}
        </Button>
        <button
          type="button"
          onClick={() => setShowInfo((v) => !v)}
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
        >
          <Info className="h-3.5 w-3.5" /> What is x402?
        </button>
      </div>

      {busy && status && <p className="text-[11px] text-muted-foreground">{status}</p>}

      {showInfo && (
        <div className="rounded-lg border border-border bg-card p-3 text-[11px] leading-relaxed text-muted-foreground animate-in fade-in duration-200">
          <span className="font-semibold text-foreground">x402</span> revives HTTP{" "}
          <span className="font-mono text-foreground">402 Payment Required</span>. The app requests a paid
          resource, the server replies 402 with the price, you sign a gasless Permit2 authorization (one
          wallet popup, no transaction from you), and the request is retried with that signature. The
          server's facilitator submits the on-chain settlement and pays the gas, then returns the resource
          plus a payment receipt — shown right here in the app.
        </div>
      )}

      {result && (
        <div className="space-y-2 rounded-lg border border-border bg-card p-3 text-[11px] animate-in fade-in duration-200">
          <div className="flex items-start gap-2">
            <Laugh className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div>
              <p className="font-semibold text-foreground">{result.joke.setup}</p>
              <p className="text-muted-foreground">{result.joke.punchline}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 border-t border-border pt-2">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-accent" />
            <span className="font-semibold text-foreground">Payment receipt</span>
            {result.tx ? (
              <a
                href={`${EXPLORER}/${result.tx}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-mono text-accent hover:underline"
              >
                {result.tx.slice(0, 12)}…{result.tx.slice(-8)}
                <ExternalLink className="h-3 w-3" />
              </a>
            ) : (
              <span className="text-muted-foreground">settled</span>
            )}
            {result.network && <span className="text-muted-foreground">· {result.network}</span>}
          </div>
        </div>
      )}
    </div>
  );
};
