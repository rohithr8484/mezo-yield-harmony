import { useState, useEffect } from "react";
import { Wallet, Bitcoin } from "lucide-react";
import { useAccount, useSwitchChain } from "wagmi";
import { parseUnits, parseEther } from "viem";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { payWithMUSD } from "@/lib/musdPayment";
import { payWithMEZO } from "@/lib/mezoPayment";
import { payWithBTC } from "@/lib/btcPayment";

const MEZO_TESTNET_CHAIN_ID = 31611;
const MUSD_TOKEN = "0x94FF830F078eb9c6e77bADe29FB46B1a249A5fd3" as `0x${string}`;
const MEZO_TOKEN = "0x7B7c000000000000000000000000000000000001" as `0x${string}`;
const FREE_ENTRY_LIMIT = 4;

interface PaymentGateProps {
  serviceName: string;
  onPaymentSuccess: () => void;
  isPaid: boolean;
  children: React.ReactNode;
  uniform?: boolean;
}

export const PaymentGate = ({ serviceName, onPaymentSuccess, isPaid, children, uniform = false }: PaymentGateProps) => {
  const { isConnected, chainId, connector, address } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { switchChainAsync, isPending: isSwitching } = useSwitchChain();
  const [pending, setPending] = useState<"MUSD" | "MEZO" | "BTC" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [freeUsed, setFreeUsed] = useState(0);
  const [freeUnlocked, setFreeUnlocked] = useState(false);
  const connectedWalletName = connector?.name ?? "Wallet";
  const freeUsageKey = `developer_free_entries_v1:${address?.toLowerCase() ?? "guest"}:${serviceName}`;

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
        const { stakeHash } = await payWithBTC(parseEther("0.0001"));
        txHash = stakeHash as `0x${string}`;
      } else if (token === "MUSD") {
        const { stakeHash } = await payWithMUSD(parseUnits("0.2", 18), "0.5");
        txHash = stakeHash as `0x${string}`;
      } else {
        const { stakeHash } = await payWithMEZO(parseUnits("0.2", 18));
        txHash = stakeHash as `0x${string}`;
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

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(freeUsageKey);
      setFreeUsed(stored ? Math.min(Number(stored) || 0, FREE_ENTRY_LIMIT) : 0);
      setFreeUnlocked(false);
    } catch {
      setFreeUsed(0);
      setFreeUnlocked(false);
    }
  }, [freeUsageKey]);

  const freeRemaining = Math.max(0, FREE_ENTRY_LIMIT - freeUsed);
  const paymentButtonClass =
    "rounded-full bg-gradient-to-r from-primary via-magenta to-accent text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity shadow-card";

  const activateFreeEntry = () => {
    if (freeRemaining <= 0) {
      toast.error("Free plan used. Please pay to continue.");
      return;
    }
    const nextUsed = freeUsed + 1;
    setFreeUsed(nextUsed);
    setFreeUnlocked(true);
    try {
      window.localStorage.setItem(freeUsageKey, String(nextUsed));
    } catch {
      // Ignore storage errors and keep the in-session free entry active.
    }
    toast.success(`Free entry activated for ${serviceName}. ${FREE_ENTRY_LIMIT - nextUsed} left.`);
  };

  const isProcessing = isSubmitting || isSwitching;

  if (isPaid) return <>{children}</>;

  if (freeUnlocked) {
    return (
      <div className="mt-4 space-y-3">
        {children}
        <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-center text-xs text-muted-foreground">
          Free plan active · {freeRemaining} of {FREE_ENTRY_LIMIT} entries left for this user
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-3">
      <p className="text-xs text-muted-foreground text-center">
        Free plan includes {FREE_ENTRY_LIMIT} entries per user. Pay on Mezo Testnet after that.
      </p>
      {freeRemaining > 0 && (
        <div className="flex justify-center">
          <Button
            onClick={activateFreeEntry}
            className="rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 text-sm font-semibold shadow-card"
          >
            Use free entry ({freeRemaining} left)
          </Button>
        </div>
      )}
      {freeRemaining <= 0 && (
        <p className="text-xs text-muted-foreground text-center">Free plan used for this user.</p>
      )}
      <div className="flex gap-3 justify-center flex-wrap">
        <Button
          onClick={() => handlePay("MUSD")}
          disabled={isProcessing}
          className={paymentButtonClass}
        >
          <Wallet className="h-4 w-4" />
          {pending === "MUSD" && isProcessing ? "Confirming..." : "Pay with MUSD"}
        </Button>
        <Button
          onClick={() => handlePay("MEZO")}
          disabled={isProcessing}
          className={paymentButtonClass}
        >
          <Wallet className="h-4 w-4" />
          {pending === "MEZO" && isProcessing ? "Confirming..." : "Pay with MEZO"}
        </Button>
        <Button
          onClick={() => handlePay("BTC")}
          disabled={isProcessing}
          className={paymentButtonClass}
        >
          <Bitcoin className="h-4 w-4" />
          {pending === "BTC" && isProcessing ? "Confirming..." : "Pay with BTC"}
        </Button>
      </div>
      <div className="text-center space-y-1">
        <p className="text-[10px] font-mono text-muted-foreground">MUSD: {MUSD_TOKEN}</p>
        <p className="text-[10px] font-mono text-muted-foreground">MEZO: {MEZO_TOKEN}</p>
        <p className="text-[10px] text-muted-foreground">Network: Mezo Testnet (Chain ID: {MEZO_TESTNET_CHAIN_ID})</p>
      </div>
    </div>
  );
};
