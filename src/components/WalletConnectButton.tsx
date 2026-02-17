import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Wallet } from "lucide-react";

const WalletConnectButton = () => {
  return (
    <ConnectButton.Custom>
      {({ account, chain, openConnectModal, mounted }) => {
        const connected = mounted && account && chain;

        return (
          <button
            onClick={openConnectModal}
            className="inline-flex items-center gap-2 w-full px-5 py-3 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            <Wallet className="h-4 w-4" />
            {connected ? (
              <span>
                {account.displayName}
              </span>
            ) : (
              "WalletConnect"
            )}
          </button>
        );
      }}
    </ConnectButton.Custom>
  );
};

export default WalletConnectButton;
