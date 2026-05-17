import { useState, useEffect } from "react";
import { Wallet, Bitcoin } from "lucide-react";
import { useAccount, useSwitchChain, useWriteContract, useSendTransaction } from "wagmi";
import { parseUnits, parseEther } from "viem";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { toast } from "sonner";
import { ERC20_ABI } from "@/lib/mezo";
import { payWithMUSD } from "@/lib/musdPayment";

const MEZO_TESTNET_CHAIN_ID = 31611;
const FEE_RECIPIENT = "0x000000000000000000000000000000000000dEaD" as `0x${string}`;
const MUSD_TOKEN = "0x94FF830F078eb9c6e77bADe29FB46B1a249A5fd3" as `0x${string}`;
const MEZO_TOKEN = "0x7B7c000000000000000000000000000000000001" as `0x${string}`;

interface PaymentGateProps {
  serviceName: string;
  onPaymentSuccess: () => void;
  isPaid: boolean;
  children: React.ReactNode;
}

export const PaymentGate = ({ serviceName, onPaymentSuccess, isPaid, children }: PaymentGateProps) => {
  const { isConnected, chainId, connector } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { switchChainAsync, isPending: isSwitching } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  const { sendTransactionAsync } = useSendTransaction();
  const [pending, setPending] = useState<"MUSD" | "MEZO" | "BTC" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const connectedWalletName = connector?.name ?? "Wallet";

  const handlePay = async (token: "MUSD" | "MEZO" | "BTC") => {
    if (isSubmitting) return;
    if (!isConnected) {
      setPending(token);
      openConnectModal?.();
      return;
    }
    setPending(token);
    setIsSubmitting(true);
    try {
      if (chainId !== MEZO_TESTNET_CHAIN_ID) {
        await switchChainAsync({ chainId: MEZO_TESTNET_CHAIN_ID });
      }
      let txHash: `0x${string}`;
      if (token === "BTC") {
        txHash = await sendTransactionAsync({
          to: FEE_RECIPIENT,
          value: parseEther("0.0001"),
          chainId: MEZO_TESTNET_CHAIN_ID,
        });
      } else if (token === "MUSD") {
        const { stakeHash } = await payWithMUSD(parseUnits("0.2", 18), "0.5");
        txHash = stakeHash as `0x${string}`;
      } else {
        txHash = await writeContractAsync({
          address: MEZO_TOKEN,
          abi: ERC20_ABI,
          functionName: "transfer",
          args: [FEE_RECIPIENT, parseUnits("0.2", 18)],
          chainId: MEZO_TESTNET_CHAIN_ID,
        });
      }
      toast.success(`Payment for ${serviceName} confirmed via ${connectedWalletName}. Tx: ${txHash.slice(0, 10)}...`);
      onPaymentSuccess();
    } catch (error) {
      const msg = error instanceof Error ? error.message.toLowerCase() : "";
      const rejected = msg.includes("rejected") || msg.includes("denied") || msg.includes("cancelled");
      toast.error(rejected ? `Transfer cancelled in ${connectedWalletName}.` : `Payment failed. Please try again.`);
    } finally {
      setIsSubmitting(false);
      setPending(null);
    }
  };

  useEffect(() => {
    if (isConnected && pending && !isSubmitting) {
      toast.info(`Connected. Click "Pay with ${pending}" again to complete.`);
      setPending(null);
    }
  }, [isConnected, pending, isSubmitting]);

  const isProcessing = isSubmitting || isSwitching;

  if (isPaid) return <>{children}</>;

  return (
    <div className="mt-4 space-y-3">
      <p className="text-xs text-muted-foreground text-center">
        Pay 0.2 tokens on Mezo Testnet to activate this service.
      </p>
      <div className="flex gap-3 justify-center">
        <button
          onClick={() => handlePay("MUSD")}
          disabled={isProcessing}
          className="px-5 py-2.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
        >
          <Wallet className="h-4 w-4" />
          {pending === "MUSD" && isProcessing ? "Confirming..." : "Pay with MUSD"}
        </button>
        <button
          onClick={() => handlePay("MEZO")}
          disabled={isProcessing}
          className="px-5 py-2.5 rounded-full bg-gradient-to-r from-primary to-accent text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
        >
          <Wallet className="h-4 w-4" />
          {pending === "MEZO" && isProcessing ? "Confirming..." : "Pay with MEZO"}
        </button>
        <button
          onClick={() => handlePay("BTC")}
          disabled={isProcessing}
          className="px-5 py-2.5 rounded-full bg-gradient-to-r from-bitcoin to-amber-600 text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
        >
          <Bitcoin className="h-4 w-4" />
          {pending === "BTC" && isProcessing ? "Confirming..." : "Pay with BTC"}
        </button>
      </div>
      <div className="text-center space-y-1">
        <p className="text-[10px] font-mono text-muted-foreground">MUSD: {MUSD_TOKEN}</p>
        <p className="text-[10px] font-mono text-muted-foreground">MEZO: {MEZO_TOKEN}</p>
        <p className="text-[10px] text-muted-foreground">Network: Mezo Testnet (Chain ID: {MEZO_TESTNET_CHAIN_ID})</p>
      </div>
    </div>
  );
};
