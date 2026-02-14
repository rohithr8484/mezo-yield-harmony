import { ConnectKitButton } from "connectkit";
import { useAccount, useBalance } from "wagmi";
import { formatUnits } from "viem";

const WalletButton = () => {
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({ address });

  return (
    <ConnectKitButton.Custom>
      {({ isConnected, show, truncatedAddress }) => {
        return (
          <button
            onClick={show}
            className="px-5 py-2.5 rounded-full bg-foreground text-background text-sm font-semibold hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            {isConnected ? (
              <>
                <span className="h-2 w-2 rounded-full bg-bitcoin animate-pulse" />
                <span>{truncatedAddress}</span>
                {balance && (
                  <span className="text-xs opacity-70">
                    {parseFloat(formatUnits(balance.value, balance.decimals)).toFixed(4)} BTC
                  </span>
                )}
              </>
            ) : (
              "Connect Wallet"
            )}
          </button>
        );
      }}
    </ConnectKitButton.Custom>
  );
};

export default WalletButton;
