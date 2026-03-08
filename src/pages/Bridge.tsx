import PageLayout from "@/components/PageLayout";
import { useAccount, useBalance, useReadContract } from "wagmi";
import { formatUnits } from "viem";
import { CONTRACTS, ERC20_ABI } from "@/lib/mezo";
import { useState } from "react";
import { ArrowDown, Lock, Coins, Shield, Zap } from "lucide-react";

type InputToken = "BTC" | "MEZO";
type OutputToken = "veBTC" | "veMEZO" | "MUSD";

const outputOptions: Record<InputToken, { token: OutputToken; description: string }[]> = {
  BTC: [
    { token: "veBTC", description: "Lock BTC as Anchor Capital to receive veBTC" },
    { token: "MUSD", description: "Borrow MUSD against your BTC collateral" },
  ],
  MEZO: [
    { token: "veMEZO", description: "Lock MEZO to apply boost and receive veMEZO" },
  ],
};

const lockDurations = [
  { label: "7 Days", days: 7, multiplier: "1x" },
  { label: "30 Days", days: 30, multiplier: "1.2x" },
  { label: "90 Days", days: 90, multiplier: "1.5x" },
  { label: "365 Days", days: 365, multiplier: "2x" },
];

const Bridge = () => {
  const { isConnected, address } = useAccount();
  const [inputToken, setInputToken] = useState<InputToken>("BTC");
  const [outputToken, setOutputToken] = useState<OutputToken>("veBTC");
  const [amount, setAmount] = useState("");
  const [selectedDuration, setSelectedDuration] = useState(1);

  const { data: btcBalance } = useBalance({ address, chainId: 31611 });
  const { data: musdBalance } = useReadContract({
    address: CONTRACTS.testnet.MUSD,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: 31611,
    query: { enabled: !!address },
  });

  const handleInputChange = (token: InputToken) => {
    setInputToken(token);
    setOutputToken(token === "BTC" ? "veBTC" : "veMEZO");
    setAmount("");
  };

  return (
    <PageLayout>
      {/* Hero */}
      <section className="py-16 md:py-24">
        <div className="container text-center">
          <span className="inline-block px-4 py-1.5 rounded-full border border-border bg-card text-sm font-medium text-muted-foreground mb-6">
            🔗 Mezo Testnet · veBoost Calculator
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-display font-bold leading-tight">
            <span className="text-foreground">Lock. </span>
            <span className="text-gradient italic">Receive.</span>
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
            Lock BTC or MEZO to receive veBTC, veMEZO, or borrow MUSD. Your locked assets power the Mezo economy.
          </p>
        </div>
      </section>

      {/* veBoost Calculator Card */}
      <section className="pb-20">
        <div className="container max-w-lg mx-auto">
          <div className="rounded-2xl bg-card border border-border shadow-card overflow-hidden">
            {/* Step 1: Input Token */}
            <div className="p-6 border-b border-border">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-7 w-7 rounded-full bg-gradient-hero flex items-center justify-center text-primary-foreground text-xs font-bold">1</div>
                <span className="text-sm font-semibold text-foreground">Select Input Token</span>
              </div>
              <div className="flex gap-3">
                {(["BTC", "MEZO"] as InputToken[]).map((token) => (
                  <button
                    key={token}
                    onClick={() => handleInputChange(token)}
                    className={`flex-1 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                      inputToken === token
                        ? "bg-gradient-hero text-primary-foreground shadow-md"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    }`}
                  >
                    {token}
                  </button>
                ))}
              </div>

              {/* Amount */}
              <div className="mt-4">
                <label className="text-xs text-muted-foreground mb-1 block">Amount</label>
                <input
                  type="number"
                  step="0.001"
                  placeholder={`0.00 ${inputToken}`}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                />
                {isConnected && inputToken === "BTC" && btcBalance && (
                  <button
                    onClick={() => setAmount(formatUnits(btcBalance.value, 18))}
                    className="text-xs text-primary mt-1 hover:underline"
                  >
                    Max: {parseFloat(formatUnits(btcBalance.value, 18)).toFixed(6)} BTC
                  </button>
                )}
              </div>
            </div>

            {/* Arrow */}
            <div className="flex justify-center -my-4 relative z-10">
              <div className="h-8 w-8 rounded-full bg-card border border-border shadow-sm flex items-center justify-center">
                <ArrowDown className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            {/* Step 2: Action */}
            <div className="p-6 border-b border-border">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-7 w-7 rounded-full bg-gradient-hero flex items-center justify-center text-primary-foreground text-xs font-bold">2</div>
                <span className="text-sm font-semibold text-foreground">
                  {inputToken === "BTC" ? "Lock BTC · Anchor Capital" : "Lock MEZO · Apply Boost"}
                </span>
              </div>

              {/* Lock Duration */}
              <div className="grid grid-cols-2 gap-2">
                {lockDurations.map((d, i) => (
                  <button
                    key={d.label}
                    onClick={() => setSelectedDuration(i)}
                    className={`px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                      selectedDuration === i
                        ? "bg-primary/10 border border-primary text-primary"
                        : "bg-secondary border border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <div>{d.label}</div>
                    <div className="text-[10px] mt-0.5 opacity-70">{d.multiplier} boost</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Arrow */}
            <div className="flex justify-center -my-4 relative z-10">
              <div className="h-8 w-8 rounded-full bg-card border border-border shadow-sm flex items-center justify-center">
                <ArrowDown className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            {/* Step 3: Output */}
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-7 w-7 rounded-full bg-gradient-hero flex items-center justify-center text-primary-foreground text-xs font-bold">3</div>
                <span className="text-sm font-semibold text-foreground">Receive</span>
              </div>
              <div className="space-y-2">
                {outputOptions[inputToken].map((opt) => (
                  <button
                    key={opt.token}
                    onClick={() => setOutputToken(opt.token)}
                    className={`w-full text-left px-4 py-3 rounded-xl transition-all ${
                      outputToken === opt.token
                        ? "bg-primary/10 border border-primary"
                        : "bg-secondary border border-transparent hover:bg-secondary/80"
                    }`}
                  >
                    <div className="text-sm font-semibold text-foreground">{opt.token}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{opt.description}</div>
                  </button>
                ))}
              </div>

              {/* Summary */}
              {amount && (
                <div className="mt-4 rounded-xl bg-secondary/50 p-4 text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">You lock</span>
                    <span className="text-foreground font-semibold">{amount} {inputToken}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duration</span>
                    <span className="text-foreground">{lockDurations[selectedDuration].label}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">You receive</span>
                    <span className="text-gradient font-semibold">{amount} {outputToken}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Boost</span>
                    <span className="text-bitcoin font-semibold">{lockDurations[selectedDuration].multiplier}</span>
                  </div>
                </div>
              )}

              {/* CTA */}
              <button
                disabled={!isConnected || !amount}
                className="mt-4 w-full px-6 py-3.5 rounded-full bg-gradient-hero text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {!isConnected ? "Connect Wallet" : `Lock ${inputToken} → ${outputToken}`}
              </button>
              <p className="text-xs text-center text-muted-foreground mt-2">
                Mezo Testnet (Chain ID 31611)
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-secondary/50">
        <div className="container">
          <h2 className="text-3xl font-display font-bold text-center text-foreground mb-12">How the veBoost Calculator Works</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {[
              { icon: Coins, title: "Deposit", desc: "Choose BTC or MEZO to lock into the protocol" },
              { icon: Lock, title: "Lock", desc: "BTC becomes Anchor Capital, MEZO applies boost" },
              { icon: Zap, title: "Receive", desc: "Get veBTC, veMEZO, or borrow MUSD" },
              { icon: Shield, title: "Earn", desc: "veBTC earns fees, veMEZO amplifies yield up to 5x" },
            ].map((item) => (
              <div key={item.title} className="text-center rounded-2xl bg-card border border-border p-6 shadow-card">
                <div className="h-12 w-12 rounded-xl bg-gradient-hero flex items-center justify-center mx-auto mb-4">
                  <item.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="text-base font-display font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default Bridge;
