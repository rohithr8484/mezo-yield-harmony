import PageLayout from "@/components/PageLayout";
import { useAccount, useBalance, useReadContract } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { formatUnits } from "viem";
import { CONTRACTS, ERC20_ABI } from "@/lib/mezo";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowDown, Lock, Coins, Shield, Zap, ExternalLink, CheckCircle2 } from "lucide-react";

type InputToken = "BTC" | "MEZO";
type OutputToken = "veBTC" | "veMEZO" | "MUSD";

const outputOptions: Record<InputToken, { token: OutputToken; description: string }[]> = {
  BTC: [
    { token: "veBTC", description: "Lock BTC as Anchor Capital to receive veBTC NFT" },
    { token: "MUSD", description: "Borrow MUSD against your BTC collateral" },
  ],
  MEZO: [
    { token: "veMEZO", description: "Lock MEZO to apply boost and receive veMEZO NFT" },
  ],
};

const lockDurationsBTC = [
  { label: "1 Day", days: 1, multiplier: "1x" },
  { label: "7 Days", days: 7, multiplier: "1.2x" },
  { label: "14 Days", days: 14, multiplier: "1.5x" },
  { label: "28 Days", days: 28, multiplier: "2x" },
];

const lockDurationsMEZO = [
  { label: "1 Year", days: 365, multiplier: "1x" },
  { label: "2 Years", days: 730, multiplier: "1.5x" },
  { label: "3 Years", days: 1095, multiplier: "2x" },
  { label: "4 Years", days: 1460, multiplier: "3x" },
];

const btcSteps = [
  "Visit Mezo Earn",
  "Navigate to the Lock section",
  "Choose your lock amount (in BTC)",
  "Select your lock duration (1–28 days)",
  "Confirm the transaction",
  "Receive your veBTC NFT",
];

const mezoSteps = [
  "Visit Mezo Earn",
  "Navigate to the Lock section",
  "Select MEZO as the token to lock",
  "Choose your lock amount",
  "Select your lock duration (1–4 years)",
  "Confirm the transaction",
  "Receive your veMEZO NFT",
];

const Bridge = () => {
  const { isConnected, address } = useAccount();
  const [inputToken, setInputToken] = useState<InputToken>("BTC");
  const [outputToken, setOutputToken] = useState<OutputToken>("veBTC");
  const [amount, setAmount] = useState("");
  const [selectedDuration, setSelectedDuration] = useState(0);

  const lockDurations = inputToken === "BTC" ? lockDurationsBTC : lockDurationsMEZO;

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
    setSelectedDuration(0);
  };

  const instructionSteps = inputToken === "BTC" ? btcSteps : mezoSteps;

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
            Select BTC or MEZO to lock, choose your amount & duration, confirm the transaction, and receive your veBTC or veMEZO NFT.
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
                <span className="text-sm font-semibold text-foreground">Select Token to Lock</span>
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
                <label className="text-xs text-muted-foreground mb-1 block">Choose your lock amount</label>
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

            {/* Step 2: Lock Duration */}
            <div className="p-6 border-b border-border">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-7 w-7 rounded-full bg-gradient-hero flex items-center justify-center text-primary-foreground text-xs font-bold">2</div>
                <span className="text-sm font-semibold text-foreground">
                  Select Lock Duration
                </span>
              </div>

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
                <span className="text-sm font-semibold text-foreground">Receive NFT</span>
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
                    <span className="text-gradient font-semibold">{amount} {outputToken} NFT</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Boost</span>
                    <span className="text-bitcoin font-semibold">{lockDurations[selectedDuration].multiplier}</span>
                  </div>
                </div>
              )}

              {/* CTA - Connect Wallet or Lock */}
              {!isConnected ? (
                <div className="mt-4">
                  <ConnectButton.Custom>
                    {({ openConnectModal, mounted }) => (
                      <button
                        onClick={openConnectModal}
                        disabled={!mounted}
                        className="w-full px-6 py-3.5 rounded-full bg-gradient-hero text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
                      >
                        Connect Wallet
                      </button>
                    )}
                  </ConnectButton.Custom>
                </div>
              ) : (
                <button
                  disabled={!amount}
                  onClick={() => {
                    toast.success(`Lock ${amount} ${inputToken} → ${outputToken} NFT`, {
                      description: `Duration: ${lockDurations[selectedDuration].label} · Boost: ${lockDurations[selectedDuration].multiplier}. Redirecting to Mezo Earn...`,
                    });
                    setTimeout(() => {
                      window.open("https://mezo.org/earn/lock", "_blank");
                    }, 1500);
                  }}
                  className="mt-4 w-full px-6 py-3.5 rounded-full bg-gradient-hero text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Lock {inputToken} → {outputToken} NFT
                </button>
              )}
              <p className="text-xs text-center text-muted-foreground mt-2">
                Mezo Testnet (Chain ID 31611)
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Instructions Section */}
      <section className="py-20 border-t border-border">
        <div className="container max-w-3xl mx-auto">
          <h2 className="text-3xl font-display font-bold text-center text-foreground mb-4">How to Lock</h2>
          <p className="text-center text-muted-foreground mb-10">
            Open the Mezo app → Click <strong>Lock</strong> in the left sidebar (under "Earn") → You'll see your eligible assets.
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Lock BTC */}
            <div className="rounded-2xl bg-card border border-border p-6 shadow-card">
              <div className="flex items-center gap-3 mb-5">
                <div className="h-10 w-10 rounded-xl bg-bitcoin/10 flex items-center justify-center">
                  <Coins className="h-5 w-5 text-bitcoin" />
                </div>
                <h3 className="text-lg font-display font-semibold text-foreground">Lock BTC → veBTC</h3>
              </div>
              <ol className="space-y-3">
                {btcSteps.map((step, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <span className="text-sm text-muted-foreground">{step}</span>
                  </li>
                ))}
              </ol>
              <a
                href="https://mezo.org/earn/lock"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
              >
                Visit Mezo Earn <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>

            {/* Lock MEZO */}
            <div className="rounded-2xl bg-card border border-border p-6 shadow-card">
              <div className="flex items-center gap-3 mb-5">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Lock className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-lg font-display font-semibold text-foreground">Lock MEZO → veMEZO</h3>
              </div>
              <ol className="space-y-3">
                {mezoSteps.map((step, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <span className="text-sm text-muted-foreground">{step}</span>
                  </li>
                ))}
              </ol>
              <a
                href="https://mezo.org/earn/lock"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
              >
                Visit Mezo Earn <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-secondary/50">
        <div className="container">
          <h2 className="text-3xl font-display font-bold text-center text-foreground mb-12">Receive fees and emissions by locking your assets.</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {[
              { icon: Coins, title: "Deposit", desc: "Choose BTC or MEZO to lock into the protocol" },
              { icon: Lock, title: "Lock", desc: "BTC locks for 1–28 days, MEZO locks for 1–4 years" },
              { icon: Zap, title: "Receive", desc: "Get veBTC NFT, veMEZO NFT, or borrow MUSD" },
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