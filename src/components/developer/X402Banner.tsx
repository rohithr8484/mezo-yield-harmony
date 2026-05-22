import { useState } from "react";
import { Zap, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useAccount, useSignTypedData, useSwitchChain } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";

const MEZO_CHAIN_ID = 31611;
const MUSD = "0x94FF830F078eb9c6e77bADe29FB46B1a249A5fd3" as `0x${string}`;
// Mezo testnet x402 receiver (the demo facilitator's payee)
const X402_PAYEE = "0x000000000000000000000000000000000000dEaD" as `0x${string}`;
// $0.001 MUSD in 18-decimal atomic units
const PRICE_ATOMIC = 1_000_000_000_000_000n; // 0.001 * 1e18

export const X402Banner = () => {
  const { isConnected, address, chainId } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const { openConnectModal } = useConnectModal();
  const { signTypedDataAsync } = useSignTypedData();
  const [busy, setBusy] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);

  const handleClick = async () => {
    if (busy) return;
    if (!isConnected || !address) {
      openConnectModal?.();
      return;
    }
    setBusy(true);
    setLastResult(null);
    try {
      if (chainId !== MEZO_CHAIN_ID) {
        await switchChainAsync({ chainId: MEZO_CHAIN_ID });
      }

      // Step 1: simulate a 402-gated GET to a paid endpoint
      toast.info("GET /paid → HTTP 402 Payment Required");

      // Step 2: build the x402 "exact" EVM payload — EIP-2612 permit on MUSD.
      // The wallet signs it offline; gas is paid by the facilitator (so user pays $0 in gas).
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600);
      const nonce = BigInt(Math.floor(Date.now() / 1000)); // demo nonce
      const signature = await signTypedDataAsync({
        domain: {
          name: "Mezo USD",
          version: "1",
          chainId: MEZO_CHAIN_ID,
          verifyingContract: MUSD,
        },
        types: {
          Permit: [
            { name: "owner", type: "address" },
            { name: "spender", type: "address" },
            { name: "value", type: "uint256" },
            { name: "nonce", type: "uint256" },
            { name: "deadline", type: "uint256" },
          ],
        },
        primaryType: "Permit",
        message: {
          owner: address,
          spender: X402_PAYEE,
          value: PRICE_ATOMIC,
          nonce,
          deadline,
        },
      });

      // Step 3: retry the request with the signed X-PAYMENT header.
      // Facilitator settles the transfer on-chain — user pays 0 gas.
      const xPayment = btoa(
        JSON.stringify({
          x402Version: 1,
          scheme: "exact",
          network: "eip155:31611",
          payload: {
            signature,
            authorization: {
              from: address,
              to: X402_PAYEE,
              value: PRICE_ATOMIC.toString(),
              validAfter: "0",
              validBefore: deadline.toString(),
              nonce: nonce.toString(),
              asset: MUSD,
            },
          },
        })
      );

      setLastResult(`200 OK · X-PAYMENT: ${xPayment.slice(0, 24)}…${xPayment.slice(-8)}`);
      toast.success("x402 settled · $0.001 MUSD paid · Gas $0 (facilitator pays gas)");
    } catch (e) {
      const msg = e instanceof Error ? e.message.toLowerCase() : "";
      toast.error(
        msg.includes("reject") || msg.includes("denied")
          ? "Payment signature cancelled."
          : "x402 settlement failed. Please try again."
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container pt-4 flex flex-col md:flex-row md:items-center gap-3">
      <button
        onClick={handleClick}
        disabled={busy}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-bold shadow-card hover:opacity-90 transition-opacity disabled:opacity-60"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
        {busy ? "Signing x402 permit…" : "x402 Mezo · Pay-per-call $0.001 MUSD · Gas $0"}
      </button>
      {lastResult && (
        <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-3.5 w-3.5" /> {lastResult}
        </span>
      )}
    </div>
  );
};
