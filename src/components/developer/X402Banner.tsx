import { Zap } from "lucide-react";
import { toast } from "sonner";

export const X402Banner = () => {
  const handleClick = () => {
    toast.success("x402 Mezo: Gas Fees $0 — payments settled via HTTP 402 + Permit2 on Mezo Testnet (eip155:31611)");
  };
  return (
    <div className="container pt-4">
      <button
        onClick={handleClick}
        className="w-full md:w-auto inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-bold shadow-card hover:opacity-90 transition-opacity"
      >
        <Zap className="h-4 w-4" />
        x402 Mezo · Gas Fees $0 · Pay-per-call over HTTP 402
      </button>
    </div>
  );
};
