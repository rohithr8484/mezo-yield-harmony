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
import { getTokenPaymentError } from "@/lib/tokenPayment";
import type { Eip1193Provider } from "ethers";
import { X402Banner } from "./X402Banner";

const MEZO_TESTNET_CHAIN_ID = 31611;
const MUSD_TOKEN = "0x94FF830F078eb9c6e77bADe29FB46B1a249A5fd3" as `0x${string}`;
const MEZO_TOKEN = "0x7B7c000000000000000000000000000000000001" as `0x${string}`;
const FREE_ENTRY_LIMIT = 8;

interface PaymentGateProps {
  serviceName: string;
  displayName?: string;
  onPaymentSuccess: () => void;
  isPaid: boolean;
  children: React.ReactNode;
  uniform?: boolean;
  compact?: boolean;
  extraButton?: React.ReactNode;
}

export const PaymentGate = ({ serviceName, displayName = serviceName, onPaymentSuccess, isPaid, children, uniform = false, compact = false, extraButton }: PaymentGateProps) => {
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
        const walletProvider = await connector?.getProvider() as Eip1193Provider | undefined;
        const { stakeHash } = await payWithMUSD(parseUnits("0.2", 18), "0.0005", walletProvider);
        txHash = stakeHash as `0x${string}`;
      } else {
        const walletProvider = await connector?.getProvider() as Eip1193Provider | undefined;
        const { stakeHash } = await payWithMEZO(parseUnits("0.2", 18), walletProvider);
        txHash = stakeHash as `0x${string}`;
      }
      toast.success(`Payment for ${displayName} confirmed via ${connectedWalletName}. Tx: ${txHash.slice(0, 10)}...`);
      onPaymentSuccess();
    } catch (error) {
      toast.error(getTokenPaymentError(error));
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
  const paymentButtonClass = "ui-btn ui-btn-pay min-h-10";
  const secondaryButtonClass = "ui-btn ui-btn-alt min-h-10";
  const freeButtonClass = "ui-btn ui-btn-free min-h-11";

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
    toast.success(`Free entry activated for ${displayName}. ${FREE_ENTRY_LIMIT - nextUsed} left.`);
  };

  const isProcessing = isSubmitting || isSwitching;

  return (
    <div className={compact ? "mt-4" : "mt-4 space-y-3"}>
      {(isPaid || freeUnlocked) ? (
        <>
          {children}
          {freeUnlocked && !isPaid && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-accent/25 bg-accent/10 px-4 py-3 text-xs font-semibold text-accent">
              <span>Free plan active for this user</span>
              <span className="ui-pill ui-pill-active">{freeRemaining} of {FREE_ENTRY_LIMIT} left</span>
            </div>
          )}
        </>
      ) : (
        <div className="ui-cluster">
          <div className="ui-cluster-head">
            <p className={compact ? "text-xs font-semibold text-muted-foreground" : "text-xs text-muted-foreground"}>
              {compact ? "Free allowance" : `Free plan includes ${FREE_ENTRY_LIMIT} entries per user. Pay on Mezo Testnet after that.`}
            </p>
            {compact && (
              <span className="ui-pill ui-pill-active">
                {freeRemaining} of {FREE_ENTRY_LIMIT} left
              </span>
            )}
          </div>
          {freeRemaining > 0 && (
            <div className={compact ? "" : "flex justify-center"}>
              <Button
                onClick={activateFreeEntry}
                className={compact ? `${freeButtonClass} w-full` : freeButtonClass}
              >
                {compact ? "Use free entry" : `Use free entry (${freeRemaining} left)`}
              </Button>
            </div>
          )}
          {freeRemaining <= 0 && (
            <p className="text-xs text-muted-foreground text-center">Free plan used for this user.</p>
          )}
        </div>
      )}
      {!isPaid && !freeUnlocked && (
        <div className={compact ? "mt-3 flex flex-wrap items-start gap-2" : "flex gap-3 justify-center flex-wrap items-start"}>
          {extraButton ?? <X402Banner uniform receiptKey={serviceName} onPaymentSuccess={() => onPaymentSuccess()} />}
          <Button
            onClick={() => handlePay("MUSD")}
            disabled={isProcessing}
            className={compact ? `${paymentButtonClass} px-3 text-xs` : `${paymentButtonClass} px-4`}
          >
            <Wallet className="h-4 w-4" />
            {pending === "MUSD" && isProcessing ? "Wait..." : compact ? "MUSD" : "Pay with MUSD"}
          </Button>
          <Button
            onClick={() => handlePay("MEZO")}
            disabled={isProcessing}
            className={compact ? `${secondaryButtonClass} px-3 text-xs` : `${secondaryButtonClass} px-4`}
          >
            <Wallet className="h-4 w-4" />
            {pending === "MEZO" && isProcessing ? "Wait..." : compact ? "MEZO" : "Pay with MEZO"}
          </Button>
        </div>
      )}
      {!isPaid && !freeUnlocked && (
        <div className="ui-meta mt-3">
          <div className="ui-meta-row">
            <span className="ui-meta-label">MUSD</span>
            <span className="ui-meta-value">{MUSD_TOKEN}</span>
          </div>
          <div className="ui-meta-row">
            <span className="ui-meta-label">MEZO</span>
            <span className="ui-meta-value">{MEZO_TOKEN}</span>
          </div>
          <div className="ui-meta-row">
            <span className="ui-meta-label">Network</span>
            <span className="ui-meta-value">Mezo Testnet (Chain ID: {MEZO_TESTNET_CHAIN_ID})</span>
          </div>
        </div>
      )}
    </div>
  );
};
