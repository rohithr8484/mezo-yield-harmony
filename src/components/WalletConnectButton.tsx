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
            className="inline-flex items-center gap-2 w-fit px-4 py-2 rounded-lg bg-[hsl(217,90%,55%)] text-white text-xs font-semibold hover:bg-[hsl(217,90%,48%)] transition-colors"
          >
            <Wallet className="h-4 w-4" />
            {connected ? (
              <span>
                {account.displayName}
              </span>
            ) : (
              "Connect using Wallet Connect"
            )}
          </button>
        );
      }}
    </ConnectButton.Custom>
  );
};

export default WalletConnectButton;
