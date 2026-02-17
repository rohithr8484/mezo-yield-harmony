import { useConnect, useAccount, useDisconnect } from "wagmi";
import { Wallet } from "lucide-react";

const WalletConnectButton = () => {
  const { connectors, connect } = useConnect();
  const { isConnected, address } = useAccount();
  const { disconnect } = useDisconnect();

  // Find the WalletConnect connector
  const wcConnector = connectors.find(
    (c) => c.id === "walletConnect" || c.name.toLowerCase().includes("walletconnect")
  );

  if (isConnected) {
    return (
      <button
        onClick={() => disconnect()}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 transition-colors border border-border"
      >
        <Wallet className="h-4 w-4" />
        <span className="max-w-[100px] truncate">
          {address?.slice(0, 6)}...{address?.slice(-4)}
        </span>
      </button>
    );
  }

  if (!wcConnector) return null;

  return (
    <button
      onClick={() => connect({ connector: wcConnector })}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
    >
      <Wallet className="h-4 w-4" />
      WalletConnect
    </button>
  );
};

export default WalletConnectButton;
