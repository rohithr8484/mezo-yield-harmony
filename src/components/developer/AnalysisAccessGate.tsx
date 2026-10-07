import { useEffect, useRef, type ReactNode } from "react";
import { PaymentGate } from "./PaymentGate";

function AuthorizedResult({ onUnlock, children }: { onUnlock: () => void; children: ReactNode }) {
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    onUnlock();
  }, [onUnlock]);
  return <>{children}</>;
}

export function AnalysisAccessGate({ serviceName, displayName, isPaid, onPaymentSuccess, onUnlock, children }: {
  serviceName: string;
  displayName: string;
  isPaid: boolean;
  onPaymentSuccess: () => void;
  onUnlock: () => void;
  children: ReactNode;
}) {
  return <PaymentGate serviceName={serviceName} displayName={displayName} isPaid={isPaid} onPaymentSuccess={onPaymentSuccess} compact>
    <AuthorizedResult onUnlock={onUnlock}>{children}</AuthorizedResult>
  </PaymentGate>;
}