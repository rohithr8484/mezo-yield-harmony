import { WagmiProvider, createConfig, http } from "wagmi";
import { ConnectKitProvider, getDefaultConfig } from "connectkit";
import { mezoTestnet } from "@/lib/mezo";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const config = createConfig(
  getDefaultConfig({
    chains: [mezoTestnet],
    transports: {
      [mezoTestnet.id]: http("https://rpc.test.mezo.org"),
    },
    walletConnectProjectId: "mezo-btc-yield-hub",
    appName: "Mezo BTC Yield Hub",
    appDescription: "The Bitcoin finance app — powered by Mezo testnet",
  })
);

const queryClient = new QueryClient();

export const Web3Provider = ({ children }: { children: React.ReactNode }) => {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider
          theme="midnight"
          customTheme={{
            "--ck-font-family": "'Inter', sans-serif",
            "--ck-accent-color": "hsl(340, 80%, 55%)",
            "--ck-accent-text-color": "#fff",
          }}
        >
          {children}
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};
