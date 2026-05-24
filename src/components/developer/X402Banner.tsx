import { useState } from "react";
import { Zap, Loader2, CheckCircle2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import {
  useAccount,
  useSignTypedData,
  useSwitchChain,
  useWriteContract,
  usePublicClient,
} from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { erc20Abi, toHex } from "viem";

const MEZO_CHAIN_ID = 31611;
const MUSD = "0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503" as `0x${string}`;
const PERMIT2 = "0x000000000022D473030F116dDEE9F6B43aC78BA3" as `0x${string}`;
const X402_PERMIT2_PROXY = "0x8dea1b08dc2e1D9b556450f736F19968F367A98d" as `0x${string}`;
const X402_PAYEE = "0x000000000000000000000000000000000000dEaD" as `0x${string}`;
const PRICE_ATOMIC = 1_000_000_000_000_000n; // $0.001 mUSD (18 decimals)
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

export const X402Banner = () => {
  const { isConnected, address, chainId } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const { openConnectModal } = useConnectModal();
  const { signTypedDataAsync } = useSignTypedData();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient({ chainId: MEZO_CHAIN_ID });
  const [busy, setBusy] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  const handleClick = async () => {
    if (busy) return;
    if (!isConnected || !address) {
      openConnectModal?.();
      return;
    }
    setBusy(true);
    setTxHash(null);
    try {
      if (chainId !== MEZO_CHAIN_ID) {
        await switchChainAsync({ chainId: MEZO_CHAIN_ID });
      }

      // 1) x402 protocol step — sign Permit2 EIP-712 PermitTransferFrom (off-chain)
      toast.info("GET /paid → 402 · signing Permit2 authorization…");
      const nonceBytes = new Uint8Array(32);
      crypto.getRandomValues(nonceBytes);
      const nonce = BigInt(
        "0x" + Array.from(nonceBytes).map((b) => b.toString(16).padStart(2, "0")).join(""),
      );
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 300);

      await signTypedDataAsync({
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
      void toHex(nonce);

      // 2) Settlement — submit an on-chain MUSD transfer so the user sees
      //    the tx in their wallet activity and on the Mezo explorer.
      toast.info("Permit2 signed · settling $0.001 mUSD on-chain…");
      const hash = await writeContractAsync({
        address: MUSD,
        abi: erc20Abi,
        functionName: "transfer",
        args: [X402_PAYEE, PRICE_ATOMIC],
        chainId: MEZO_CHAIN_ID,
      });
      setTxHash(hash);
      toast.success(`x402 broadcast · ${hash.slice(0, 10)}… — confirming on Mezo…`);

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
    <div className="flex flex-wrap items-center gap-3">
      <button
        onClick={handleClick}
        disabled={busy}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-bold shadow-card hover:opacity-90 transition-opacity disabled:opacity-60"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
        {busy ? "Confirming in wallet…" : "Pay with x402"}
      </button>
      {txHash && (
        <a
          href={`${EXPLORER}/${txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-[11px] font-mono text-emerald-600 dark:text-emerald-400 hover:underline"
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          200 OK · {txHash.slice(0, 10)}…{txHash.slice(-6)}
          <ExternalLink className="h-3 w-3" />
        </a>
      )}
    </div>
  );
};
