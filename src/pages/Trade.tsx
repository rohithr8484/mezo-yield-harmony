import { useState } from "react";
import PageLayout from "@/components/PageLayout";
import { ArrowDownUp, Settings, Zap, ChevronDown } from "lucide-react";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";

const tokenList = [
  { symbol: "BTC", name: "Bitcoin", color: "bg-orange-500" },
  { symbol: "MUSD", name: "Mezo USD", color: "bg-amber-400" },
  { symbol: "mUSDC", name: "Bridged USDC", color: "bg-blue-500" },
  { symbol: "mUSDT", name: "Bridged USDT", color: "bg-emerald-500" },
];

const TokenSelector = ({
  selected,
  onSelect,
  open,
  onToggle,
}: {
  selected: string;
  onSelect: (s: string) => void;
  open: boolean;
  onToggle: () => void;
}) => {
  const token = tokenList.find((t) => t.symbol === selected)!;
  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className="flex items-center gap-2 px-4 py-3 rounded-xl border border-border bg-card hover:bg-secondary/60 transition-colors"
      >
        <span className={`h-6 w-6 rounded-full ${token.color}`} />
        <span className="font-semibold text-foreground text-sm">{token.symbol}</span>
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-44 rounded-xl border border-border bg-card shadow-lg z-20 py-1">
          {tokenList
            .filter((t) => t.symbol !== selected)
            .map((t) => (
              <button
                key={t.symbol}
                onClick={() => {
                  onSelect(t.symbol);
                  onToggle();
                }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-secondary/60 transition-colors"
              >
                <span className={`h-5 w-5 rounded-full ${t.color}`} />
                {t.symbol}
              </button>
            ))}
        </div>
      )}
    </div>
  );
};

const Trade = () => {
  const { isConnected } = useAccount();
  const [payToken, setPayToken] = useState("mUSDT");
  const [receiveToken, setReceiveToken] = useState("MUSD");
  const [payAmount, setPayAmount] = useState("");
  const [payDropdown, setPayDropdown] = useState(false);
  const [receiveDropdown, setReceiveDropdown] = useState(false);

  const handleFlip = () => {
    setPayToken(receiveToken);
    setReceiveToken(payToken);
    setPayAmount("");
  };

  return (
    <PageLayout>
      <section className="py-16 md:py-24">
        <div className="container max-w-lg mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-bitcoin/10 flex items-center justify-center">
                <ArrowDownUp className="h-5 w-5 text-bitcoin" />
              </div>
              <div>
                <h1 className="text-2xl font-display font-bold text-bitcoin">Swap</h1>
                <p className="text-xs text-muted-foreground">Tigris DEX</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-bitcoin/30 text-bitcoin text-xs font-medium">
                <Zap className="h-3.5 w-3.5" /> Instant
              </button>
              <button className="h-8 w-8 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                <Settings className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Swap Card */}
          <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
            {/* You Pay */}
            <div className="p-6 pb-4">
              <p className="text-sm font-medium text-foreground mb-3">You Pay</p>
              <div className="flex gap-3">
                <input
                  type="number"
                  placeholder="0.0"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="flex-1 bg-secondary/50 rounded-xl border border-border px-4 py-3.5 text-foreground text-lg placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-bitcoin/30 focus:border-bitcoin/40 transition-all"
                />
                <TokenSelector
                  selected={payToken}
                  onSelect={(t) => {
                    if (t === receiveToken) setReceiveToken(payToken);
                    setPayToken(t);
                  }}
                  open={payDropdown}
                  onToggle={() => {
                    setPayDropdown(!payDropdown);
                    setReceiveDropdown(false);
                  }}
                />
              </div>
            </div>

            {/* Flip */}
            <div className="flex justify-center -my-3 relative z-10">
              <button
                onClick={handleFlip}
                className="h-9 w-9 rounded-full bg-card border border-border shadow-sm flex items-center justify-center hover:bg-secondary transition-colors"
              >
                <ArrowDownUp className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            {/* You Receive */}
            <div className="p-6 pt-4">
              <p className="text-sm font-medium text-foreground mb-3">You Receive</p>
              <div className="flex gap-3">
                <input
                  type="number"
                  placeholder="0"
                  readOnly
                  value={payAmount ? (parseFloat(payAmount) * 0.998).toFixed(4) : ""}
                  className="flex-1 bg-secondary/50 rounded-xl border border-border px-4 py-3.5 text-foreground text-lg placeholder:text-muted-foreground cursor-default"
                />
                <TokenSelector
                  selected={receiveToken}
                  onSelect={(t) => {
                    if (t === payToken) setPayToken(receiveToken);
                    setReceiveToken(t);
                  }}
                  open={receiveDropdown}
                  onToggle={() => {
                    setReceiveDropdown(!receiveDropdown);
                    setPayDropdown(false);
                  }}
                />
              </div>
            </div>

            {/* Info */}
            <div className="mx-6 mb-6 rounded-xl border border-border p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Slippage</span>
                <span className="text-foreground font-medium">0.5%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">DEX</span>
                <span className="text-bitcoin font-medium">Tigris</span>
              </div>
            </div>

            {/* CTA */}
            <div className="px-6 pb-6">
              {!isConnected ? (
                <ConnectButton.Custom>
                  {({ openConnectModal, mounted }) => (
                    <button
                      onClick={openConnectModal}
                      disabled={!mounted}
                      className="w-full py-4 rounded-xl bg-gradient-hero text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity"
                    >
                      Connect Wallet
                    </button>
                  )}
                </ConnectButton.Custom>
              ) : (
                <button
                  disabled={!payAmount || parseFloat(payAmount) <= 0}
                  className="w-full py-4 rounded-xl bg-gradient-hero text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {payAmount ? "Swap" : "Enter Amount"}
                </button>
              )}
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default Trade;
