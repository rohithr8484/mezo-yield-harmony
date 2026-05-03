import { useState } from "react";
import { Zap } from "lucide-react";
import { toast } from "sonner";

const BOAR_CHAIN = {
  chainId: "0x7b7c", // 31612 — Mezo Mainnet
  chainName: "Mezo Mainnet (Boar)",
  nativeCurrency: { name: "Bitcoin", symbol: "BTC", decimals: 18 },
  rpcUrls: ["https://rpc-http.mezo.boar.network/81YcmV8cjuhVuCdoidBcGlWIC0rSfy4c"],
  blockExplorerUrls: ["https://explorer.mezo.org"],
};

const BoarConnectButton = () => {
  const [busy, setBusy] = useState(false);

  const connect = async () => {
    const eth = (window as any).ethereum;
    if (!eth) {
      toast.error("No wallet detected. Install MetaMask first.");
      return;
    }
    setBusy(true);
    try {
      await eth.request({ method: "eth_requestAccounts" });
      try {
        await eth.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: BOAR_CHAIN.chainId }],
        });
      } catch (err: any) {
        if (err?.code === 4902 || /Unrecognized chain/i.test(err?.message ?? "")) {
          await eth.request({ method: "wallet_addEthereumChain", params: [BOAR_CHAIN] });
        } else {
          throw err;
        }
      }
      toast.success("Connected to Mezo Mainnet via Boar RPC");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to connect via Boar");
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      onClick={connect}
      disabled={busy}
      className="group relative inline-flex items-center justify-center gap-2 w-full h-10 px-4 rounded-lg bg-gradient-to-r from-bitcoin via-accent to-primary text-white text-xs font-semibold overflow-hidden transition-all hover:shadow-[0_0_24px_-4px_hsl(var(--bitcoin)/0.7)] disabled:opacity-60"
    >
      <span className="absolute inset-0 bg-[linear-gradient(110deg,transparent_25%,rgba(255,255,255,0.35)_50%,transparent_75%)] bg-[length:200%_100%] animate-shimmer" />
      <Zap className="h-4 w-4 relative z-10" />
      <span className="relative z-10">{busy ? "Connecting…" : "Connect via Boar"}</span>
    </button>
  );
};

export default BoarConnectButton;
