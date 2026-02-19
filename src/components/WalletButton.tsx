import { ConnectButton } from "@rainbow-me/rainbowkit";

const WalletButton = () => {
  return (
    <ConnectButton.Custom>
      {({ account, chain, openConnectModal, openAccountModal, openChainModal, mounted }) => {
        const connected = mounted && account && chain;

        return (
          <button
            onClick={connected ? openAccountModal : openConnectModal}
            className="inline-flex items-center justify-center gap-2 w-full h-10 px-4 rounded-lg bg-[hsl(217,90%,55%)] text-white text-xs font-semibold hover:bg-[hsl(217,90%,48%)] transition-colors"
          >
            {connected ? account.displayName : "Connect Wallet"}
          </button>
        );
      }}
    </ConnectButton.Custom>
  );
};

export default WalletButton;
