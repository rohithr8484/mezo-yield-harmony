import { ConnectButton } from "@rainbow-me/rainbowkit";

const WalletButton = () => {
  return (
    <ConnectButton
      label="Connect Wallet"
      accountStatus="address"
      chainStatus="icon"
      showBalance={true}
    />
  );
};

export default WalletButton;
