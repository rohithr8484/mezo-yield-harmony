import { ConnectButton } from "@rainbow-me/rainbowkit";

const WalletConnectButton = () => {
  return (
    <ConnectButton.Custom>
      {({ account, chain, openConnectModal, mounted }) => {
        const connected = mounted && account && chain;

        return (
          <button
            onClick={openConnectModal}
            className="inline-flex items-center gap-2 w-fit h-10 px-6 py-2 rounded-xl bg-[hsl(217,90%,55%)] text-white text-sm font-bold hover:bg-[hsl(217,90%,48%)] transition-colors"
          >
            {connected ? (
              <span>{account.displayName}</span>
            ) : (
              "Connect Wallet using Mezo Passport"
            )}
          </button>
        );
      }}
    </ConnectButton.Custom>
  );
};

export default WalletConnectButton;
