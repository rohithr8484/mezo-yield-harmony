import { useEffect, useState, useCallback } from "react";
import { Zap } from "lucide-react";
import { toast } from "sonner";

const BOAR_CHAIN = {
  chainId: "0x7b7c", // 31612 — Mezo Mainnet
  chainName: "Mezo Mainnet (Boar)",
  nativeCurrency: { name: "Bitcoin", symbol: "BTC", decimals: 18 },
  rpcUrls: ["https://rpc-http.mezo.boar.network/0jg0cJ5DWuHRYmU9xIb6mlyweqr9HO1R"],
  blockExplorerUrls: ["https://explorer.mezo.org"],
};

const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

const BoarConnectButton = () => {
  const [busy, setBusy] = useState(false);
  const [account, setAccount] = useState<string | null>(null);

  const eth = typeof window !== "undefined" ? (window as any).ethereum : null;

  // Pick up existing accounts and listen for changes
  useEffect(() => {
    if (!eth) return;
    eth.request({ method: "eth_accounts" })
      .then((accs: string[]) => {
        const stored = localStorage.getItem("boar_connected") === "1";
        if (stored && accs?.[0]) setAccount(accs[0]);
      })
      .catch(() => {});
    const onAccounts = (accs: string[]) => {
      if (!accs?.length) {
        setAccount(null);
        localStorage.removeItem("boar_connected");
      } else if (localStorage.getItem("boar_connected") === "1") {
        setAccount(accs[0]);
      }
    };
    eth.on?.("accountsChanged", onAccounts);
    return () => eth.removeListener?.("accountsChanged", onAccounts);
  }, [eth]);

  const connect = useCallback(async () => {
    if (!eth) {
      toast.error("No wallet detected. Install MetaMask first.");
      return;
    }
    setBusy(true);
    try {
      const accs: string[] = await eth.request({ method: "eth_requestAccounts" });
      try {
        await eth.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: BOAR_CHAIN.chainId }],
        });
      } catch (err: any) {
        if (err?.code === 4902 || /Unrecognized chain|not added/i.test(err?.message ?? "")) {
          await eth.request({ method: "wallet_addEthereumChain", params: [BOAR_CHAIN] });
        } else {
          throw err;
        }
      }
      setAccount(accs[0]);
      localStorage.setItem("boar_connected", "1");
      toast.success("Connected to Mezo Mainnet via Boar RPC");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to connect via Boar");
    } finally {
      setBusy(false);
    }
  }, [eth]);

  const disconnect = () => {
    setAccount(null);
    localStorage.removeItem("boar_connected");
    toast.info("Disconnected Boar session");
  };

  return (
    <button
      onClick={account ? disconnect : connect}
      disabled={busy}
      title={account ? `${account} — click to disconnect` : "Connect via Boar"}
      className="group relative inline-flex items-center justify-center gap-2 w-full h-10 px-4 rounded-lg bg-gradient-to-r from-bitcoin via-accent to-primary text-white text-xs font-semibold overflow-hidden transition-all hover:shadow-[0_0_24px_-4px_hsl(var(--bitcoin)/0.7)] disabled:opacity-60"
    >
      <span className="absolute inset-0 bg-[linear-gradient(110deg,transparent_25%,rgba(255,255,255,0.35)_50%,transparent_75%)] bg-[length:200%_100%] animate-shimmer" />
      <Zap className="h-4 w-4 relative z-10" />
      <span className="relative z-10">
        {busy ? "Connecting…" : account ? `Boar: ${short(account)}` : "Connect via Boar"}
      </span>
    </button>
  );
};

export default BoarConnectButton;
