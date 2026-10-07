import { useEffect, useRef, useState, type ReactNode } from "react";
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

export function AnalysisAccessGate({ serviceName, displayName, onPaymentSuccess, onUnlock, children }: {
  serviceName: string;
  displayName: string;
  onPaymentSuccess: () => void;
  onUnlock: () => void;
  children: ReactNode;
}) {
  const [paid, setPaid] = useState(false);
  return <PaymentGate serviceName={serviceName} displayName={displayName} isPaid={paid} onPaymentSuccess={() => { setPaid(true); onPaymentSuccess(); }} compact>
    <AuthorizedResult onUnlock={onUnlock}>{children}</AuthorizedResult>
  </PaymentGate>;
}