import { useState } from "react";
import { Zap, Loader2, CheckCircle2, Copy } from "lucide-react";
import { toast } from "sonner";
import { useAccount, useSignTypedData, useSwitchChain } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { toHex } from "viem";

const MEZO_CHAIN_ID = 31611;
const MUSD = "0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503" as `0x${string}`;
const PERMIT2 = "0x000000000022D473030F116dDEE9F6B43aC78BA3" as `0x${string}`;
const X402_PERMIT2_PROXY = "0x8dea1b08dc2e1D9b556450f736F19968F367A98d" as `0x${string}`;
const X402_PAYEE = "0x000000000000000000000000000000000000dEaD" as `0x${string}`;
const PRICE_ATOMIC = 1_000_000_000_000_000n; // $0.001 mUSD

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

export const X402Banner = () => {
  const { isConnected, address, chainId } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const { openConnectModal } = useConnectModal();
  const { signTypedDataAsync } = useSignTypedData();
  const [busy, setBusy] = useState(false);
  const [paymentHeader, setPaymentHeader] = useState<string | null>(null);

  const handleClick = async () => {
    if (busy) return;
    if (!isConnected || !address) {
      openConnectModal?.();
      return;
    }
    setBusy(true);
    setPaymentHeader(null);
    try {
      if (chainId !== MEZO_CHAIN_ID) {
        await switchChainAsync({ chainId: MEZO_CHAIN_ID });
      }

      toast.info("GET /paid → 402 · signing Permit2 authorization…");

      // Random 256-bit Permit2 nonce
      const nonceBytes = new Uint8Array(32);
      crypto.getRandomValues(nonceBytes);
      const nonce = BigInt(
        "0x" + Array.from(nonceBytes).map((b) => b.toString(16).padStart(2, "0")).join(""),
      );
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 300);

      const signature = await signTypedDataAsync({
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

      const paymentPayload = {
        x402Version: 2,
        scheme: "exact",
        network: `eip155:${MEZO_CHAIN_ID}`,
        payload: {
          owner: address,
          signature,
          permit: {
            permitted: { token: MUSD, amount: PRICE_ATOMIC.toString() },
            nonce: toHex(nonce),
            deadline: deadline.toString(),
          },
          payTo: X402_PAYEE,
        },
      };
      const header = btoa(JSON.stringify(paymentPayload));
      setPaymentHeader(header);
      toast.success(`x402 X-PAYMENT signed · facilitator will settle via Permit2 → ${X402_PAYEE.slice(0, 10)}…`);
    } catch (e) {
      const msg = e instanceof Error ? e.message.toLowerCase() : "";
      toast.error(
        msg.includes("reject") || msg.includes("denied")
          ? "Signature cancelled."
          : "x402 signing failed. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  const copyHeader = async () => {
    if (!paymentHeader) return;
    await navigator.clipboard.writeText(paymentHeader);
    toast.success("X-PAYMENT header copied");
  };

  return (
    <div className="container pt-4 flex flex-col md:flex-row md:items-center gap-3">
      <button
        onClick={handleClick}
        disabled={busy}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-bold shadow-card hover:opacity-90 transition-opacity disabled:opacity-60"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
        {busy ? "Signing Permit2…" : "x402 Mezo · Pay-per-call $0.001 mUSD (Permit2)"}
      </button>
      {paymentHeader && (
        <button
          onClick={copyHeader}
          className="inline-flex items-center gap-1.5 text-[11px] font-mono text-emerald-600 dark:text-emerald-400 hover:underline max-w-md truncate"
          title="Copy X-PAYMENT header"
        >
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
          X-PAYMENT {paymentHeader.slice(0, 24)}…
          <Copy className="h-3 w-3 shrink-0" />
        </button>
      )}
    </div>
  );
};
