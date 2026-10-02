import { useState } from "react";
import { Zap, Loader2, CheckCircle2, ExternalLink, PenLine, Info } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAccount, useSignTypedData, useSwitchChain } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { supabase } from "@/integrations/supabase/client";

const MEZO_CHAIN_ID = 31611;
const MUSD = "0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503" as `0x${string}`;
const PERMIT2 = "0x000000000022D473030F116dDEE9F6B43aC78BA3" as `0x${string}`;
const X402_PERMIT2_PROXY = "0x8dea1b08dc2e1D9b556450f736F19968F367A98d" as `0x${string}`;
const X402_PAYEE = "0x000000000000000000000000000000000000dEaD" as `0x${string}`;
const PRICE_ATOMIC = 200_000_000_000_000_000n; // 0.2 mUSD (18 decimals) — Permit2 spending cap
const EXPLORER = "https://explorer.test.mezo.org/tx";

const PERMIT_TYPES = {
  PermitTransferFrom: [
    { name: "permitted", type: "TokenPermissions" },
    { name: "spender", type: "address" },
    { name: "nonce", type: "uint256" },
    { name: "deadline", type: "uint256" },
  ],
  TokenPermissions: [
    { name: "token", type: "address" },
    { name: "amount", type: "uint256" },
  ],
} as const;

export const X402Banner = ({ uniform = false }: { uniform?: boolean } = {}) => {
  const { isConnected, address, chainId } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const { openConnectModal } = useConnectModal();
  const { signTypedDataAsync } = useSignTypedData();
  const [busy, setBusy] = useState(false);
  const [permitSig, setPermitSig] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [sponsor, setSponsor] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const paymentButtonClass =
    "rounded-full bg-gradient-to-r from-primary via-magenta to-accent text-primary-foreground text-sm font-semibold shadow-card hover:opacity-90 transition-opacity disabled:opacity-60";

  const handleClick = async () => {
    if (busy) return;
    if (!isConnected || !address) {
      openConnectModal?.();
      return;
    }
    setBusy(true);
    setPermitSig(null);
    setTxHash(null);
    try {
      if (chainId !== MEZO_CHAIN_ID) {
        await switchChainAsync({ chainId: MEZO_CHAIN_ID });
      }

      // Step 1 of 2 — x402 protocol: sign Permit2 EIP-712 PermitTransferFrom.
      // This is an OFF-CHAIN signature (wallet interaction #1): it authorizes the
      // payment but moves no funds, so it produces a signature, not a tx hash.
      toast.info("Step 1/2 · GET /paid → 402 · sign the Permit2 authorization in your wallet");
      const nonceBytes = new Uint8Array(32);
      crypto.getRandomValues(nonceBytes);
      const nonce = BigInt(
        "0x" + Array.from(nonceBytes).map((b) => b.toString(16).padStart(2, "0")).join(""),
      );
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 300);

      const signature = await signTypedDataAsync({
        account: address,
        domain: { name: "Permit2", chainId: MEZO_CHAIN_ID, verifyingContract: PERMIT2 },
        types: PERMIT_TYPES,
        primaryType: "PermitTransferFrom",
        message: {
          permitted: { token: MUSD, amount: PRICE_ATOMIC },
          spender: X402_PERMIT2_PROXY,
          nonce,
          deadline,
        },
      });
      setPermitSig(signature);
      void toHex(nonce);
      toast.success("Step 1/2 done · Permit2 authorization signed (off-chain, no gas)");

      // Step 2 of 2 — settlement: on-chain MUSD transfer (wallet interaction #2).
      // This is the transaction that appears in your wallet activity and on the explorer.
      toast.info("Step 2/2 · confirm the mUSD settlement in your wallet");
      const hash = await writeContractAsync({
        address: MUSD,
        abi: erc20Abi,
        functionName: "transfer",
        args: [X402_PAYEE, PRICE_ATOMIC],
        chainId: MEZO_CHAIN_ID,
      });
      setTxHash(hash);
      toast.success(`Step 2/2 broadcast · ${hash.slice(0, 10)}… — confirming on Mezo…`);

      if (publicClient) {
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        if (receipt.status === "success") {
          toast.success(`x402 settled ✓ block ${receipt.blockNumber}`);
        } else {
          toast.error("Settlement reverted on-chain.");
        }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message.toLowerCase() : "";
      toast.error(
        msg.includes("reject") || msg.includes("denied") || msg.includes("cancelled")
          ? "Cancelled in wallet."
          : "x402 settlement failed. Please try again.",
      );
    } finally {
      setBusy(false);
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
          {busy ? "Confirming in wallet…" : "Pay with x402"}
        </Button>
        <button
          type="button"
          onClick={() => setShowInfo((v) => !v)}
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
        >
          <Info className="h-3.5 w-3.5" /> What is x402?
        </button>
      </div>

      {showInfo && (
        <div className="rounded-lg border border-border bg-card p-3 text-[11px] leading-relaxed text-muted-foreground animate-in fade-in duration-200">
          <span className="font-semibold text-foreground">x402</span> is an open payment protocol that
          revives the HTTP <span className="font-mono text-foreground">402 Payment Required</span> status
          code: a client requests a paid resource, the server answers <span className="font-mono text-foreground">402</span> with
          the price, the client signs a payment authorization, and retries with that proof attached — the
          server then settles the payment on-chain and returns the resource. Here it runs on Mezo Testnet
          with mUSD: <span className="font-semibold text-foreground">Step 1</span> signs a gasless Permit2
          authorization (off-chain), <span className="font-semibold text-foreground">Step 2</span> settles
          the mUSD payment on-chain. Two wallet confirmations, one paid request.
        </div>
      )}

      {(permitSig || txHash) && (
        <div className="space-y-1.5 rounded-lg border border-border bg-card p-3 text-[11px]">
          {permitSig && (
            <div className="flex flex-wrap items-center gap-1.5">
              <PenLine className="h-3.5 w-3.5 shrink-0 text-primary" />
              <span className="font-semibold text-foreground">Step 1 · Permit2 signature</span>
              <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground">OFF-CHAIN · NO TX HASH</span>
              <span className="break-all font-mono text-muted-foreground">
                {permitSig.slice(0, 18)}…{permitSig.slice(-10)}
              </span>
            </div>
          )}
          {txHash && (
            <div className="flex flex-wrap items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-accent" />
              <span className="font-semibold text-foreground">Step 2 · Settlement tx</span>
              <a
                href={`${EXPLORER}/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-mono text-accent hover:underline"
              >
                {txHash.slice(0, 14)}…{txHash.slice(-10)}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
