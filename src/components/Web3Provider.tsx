import { WagmiProvider } from "wagmi";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { getConfig, mezoTestnet } from "@mezo-org/passport";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@rainbow-me/rainbowkit/styles.css";

const config = getConfig({
  appName: "Mezo BTC Yield Hub",
  mezoNetwork: "testnet",
  walletConnectProjectId: "696956c426d467cb2aed00d4b0a543b2",
  appDescription: "The Bitcoin finance app — powered by Mezo testnet",
});

const queryClient = new QueryClient();

export const Web3Provider = ({ children }: { children: React.ReactNode }) => {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider initialChain={mezoTestnet}>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};
