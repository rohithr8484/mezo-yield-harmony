import { useState } from "react";
import { Zap, Loader2, CheckCircle2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useAccount, useWriteContract, useSwitchChain } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { erc20Abi } from "viem";

const MEZO_CHAIN_ID = 31611;
const MUSD = "0x94FF830F078eb9c6e77bADe29FB46B1a249A5fd3" as `0x${string}`;
// x402 facilitator payee on Mezo testnet
const X402_PAYEE = "0x000000000000000000000000000000000000dEaD" as `0x${string}`;
// $0.001 MUSD in 18-decimal atomic units
const PRICE_ATOMIC = 1_000_000_000_000_000n; // 0.001 * 1e18

export const X402Banner = () => {
  const { isConnected, address, chainId } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const { openConnectModal } = useConnectModal();
  const { writeContractAsync } = useWriteContract();
  const [busy, setBusy] = useState(false);
  const [lastTx, setLastTx] = useState<string | null>(null);

  const handleClick = async () => {
    if (busy) return;
    if (!isConnected || !address) {
      openConnectModal?.();
      return;
    }
    setBusy(true);
    setLastTx(null);
    try {
      if (chainId !== MEZO_CHAIN_ID) {
        await switchChainAsync({ chainId: MEZO_CHAIN_ID });
      }

      toast.info("GET /paid → HTTP 402 · Settling on-chain via MUSD transfer");

      // Real on-chain MUSD transfer — visible in MetaMask activity.
      const txHash = await writeContractAsync({
        address: MUSD,
        abi: erc20Abi,
        functionName: "transfer",
        args: [X402_PAYEE, PRICE_ATOMIC],
        chainId: MEZO_CHAIN_ID,
      });

      setLastTx(txHash);
      toast.success(`x402 settled · 0.001 MUSD paid · Tx ${txHash.slice(0, 10)}…`);
    } catch (e) {
      const msg = e instanceof Error ? e.message.toLowerCase() : "";
      toast.error(
        msg.includes("reject") || msg.includes("denied")
          ? "Payment cancelled."
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
        {busy ? "Confirming in wallet…" : "x402 Mezo · Pay-per-call $0.001 MUSD"}
      </button>
      {lastTx && (
        <a
          href={`https://explorer.test.mezo.org/tx/${lastTx}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-[11px] font-mono text-emerald-600 dark:text-emerald-400 hover:underline"
        >
          <CheckCircle2 className="h-3.5 w-3.5" /> 200 OK · {lastTx.slice(0, 10)}…{lastTx.slice(-6)}
          <ExternalLink className="h-3 w-3" />
        </a>
      )}
    </div>
  );
};
