import { useRef, useState } from "react";
import { useAccount } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { Wallet, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import type { Eip1193Provider } from "ethers";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel } from "@/components/ui/alert-dialog";
import { HOMEPAGE_PAYMENT_AMOUNT, HOMEPAGE_PAYMENT_RECIPIENT, HOMEPAGE_REWARD_AMOUNT, payHomepageNew } from "@/lib/homepageNewPayment";
import { getTokenPaymentError } from "@/lib/tokenPayment";

export default function HomepageNewPayment() {
  const { isConnected, connector } = useAccount();
  const { openConnectModal } = useConnectModal();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [receipt, setReceipt] = useState<string>();
  const [rewardReceipt, setRewardReceipt] = useState<string>();
  const [rewardError, setRewardError] = useState<string>();
  const submitting = useRef(false);

  const pay = async () => {
    if (submitting.current) return;
    submitting.current = true;
    setBusy(true);
    try {
      const provider = await connector?.getProvider() as Eip1193Provider | undefined;
      if (!provider) throw new Error("Connect your wallet before paying.");
      setRewardReceipt(undefined);
      setRewardError(undefined);
      const result = await payHomepageNew(provider, setReceipt);
      setReceipt(result.paymentHash);
      setRewardReceipt(result.rewardHash);
      setRewardError(result.rewardError);
      setOpen(false);
      toast.success(`${HOMEPAGE_PAYMENT_AMOUNT} test MUSD transfer confirmed.`);
      if (result.rewardHash) toast.success(`${HOMEPAGE_REWARD_AMOUNT} contract MUSD reward confirmed.`);
      if (result.rewardError) toast.warning("Payment confirmed, but reward withdrawal failed. Do not repay to retry the reward.");
    } catch (error) {
      toast.error(getTokenPaymentError(error));
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  };

  return (
    <section className="container mx-auto flex flex-col items-center gap-3 px-4 py-10">
      <Button className="ui-btn ui-btn-pay min-h-11 px-6" disabled={busy} onClick={() => {
        if (!isConnected) { openConnectModal?.(); return; }
        setOpen(true);
      }}><Wallet className="h-4 w-4" />PAY(NEW)</Button>
      {receipt && <a href={`https://explorer.test.mezo.org/tx/${receipt}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-primary underline">Confirmed payment <ExternalLink className="h-4 w-4" /></a>}
      {rewardReceipt && <a href={`https://explorer.test.mezo.org/tx/${rewardReceipt}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-primary underline">Confirmed reward <ExternalLink className="h-4 w-4" /></a>}
      {rewardError && <p role="status" className="max-w-lg break-words text-center text-sm text-muted-foreground">Payment confirmed; reward not confirmed: {rewardError} Do not pay again to retry the reward.</p>}
      <AlertDialog open={open} onOpenChange={(value) => { if (!busy) setOpen(value); }}>
        <AlertDialogContent className="max-w-[calc(100%-2rem)] sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>PAY(NEW) — {HOMEPAGE_PAYMENT_AMOUNT} test MUSD</AlertDialogTitle>
            <AlertDialogDescription className="break-words">
              Mezo Testnet · Direct transfer to {HOMEPAGE_PAYMENT_RECIPIENT}, followed immediately after confirmation by a {HOMEPAGE_REWARD_AMOUNT} MUSD withdrawal request to your wallet. The reward uses the contract’s 0xD88b…a067 MUSD, not the payment token, and requires contract authorization and funds. A second wallet confirmation and test BTC gas fees apply; no service unlock.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <Button disabled={busy} onClick={pay}><Wallet className="h-4 w-4" />{busy ? "Confirming…" : `Pay ${HOMEPAGE_PAYMENT_AMOUNT} test MUSD`}</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}