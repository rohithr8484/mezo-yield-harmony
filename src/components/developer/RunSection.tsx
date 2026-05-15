import { useState } from "react";
import { Upload, Play, Brain, Database, AlertTriangle, DollarSign, Shield, Loader2 } from "lucide-react";

interface AnalysisResult {
  risks: string[];
  hiddenFees: string[];
  attackVectors: string[];
}

const MOCK_ANALYSES: Record<string, AnalysisResult> = {
  contract: {
    risks: [
      "Reentrancy vulnerability detected in withdraw() function — external call before state update",
      "Unchecked return value on low-level call in fallback function",
      "Integer overflow possible in token multiplication (use SafeMath or Solidity ≥0.8)",
    ],
    hiddenFees: [
      "Dynamic fee modifier can be changed by owner without timelock — potential rug vector",
      "Gas optimization: redundant SSTORE operations in loop increase tx cost by ~40%",
      "Proxy upgrade pattern may incur unexpected storage collision costs",
    ],
    attackVectors: [
      "Flash loan attack: price oracle can be manipulated within a single transaction",
      "Front-running risk on swap functions — no slippage protection or deadline parameter",
      "Privilege escalation: onlyOwner modifier missing on setFeeRecipient()",
    ],
  },
  simulation: {
    risks: [
      "State divergence detected between testnet and mainnet fork after block 1,200,000",
      "Gas estimation underestimates complex nested calls by up to 25%",
      "Contract interaction fails silently when target contract is paused",
    ],
    hiddenFees: [
      "Simulation uses simplified gas model — actual mainnet costs may be 15-30% higher",
      "Bridge relayer fees not included in simulation (estimated 0.001 BTC per relay)",
      "MEV exposure: sandwich attack profitable on simulated swap path",
    ],
    attackVectors: [
      "Simulation shows oracle stale price window of 45 minutes — exploitable during volatility",
      "Governance timelock can be bypassed via emergency function during simulation",
      "Cross-contract reentrancy possible through callback in simulated scenario",
    ],
  },
  ai: {
    risks: [
      "Model inference latency spikes during network congestion (p99 > 5s)",
      "Training data may contain biased DeFi protocol assessments",
      "Model outputs should not be used as sole basis for financial decisions",
    ],
    hiddenFees: [
      "GPU compute costs scale non-linearly with batch size — 10x input ≠ 10x cost",
      "Embedding storage on-chain costs ~0.005 MEZO per KB",
      "Model retraining triggers additional compute charges",
    ],
    attackVectors: [
      "Prompt injection could extract system instructions or cached context",
      "Adversarial inputs may cause model to produce hallucinated contract addresses",
      "Rate limiting bypass possible through parallel session creation",
    ],
  },
  indexing: {
    risks: [
      "Indexer lag during chain reorganizations can serve stale data for up to 30 blocks",
      "Large event logs (>10MB) may timeout during indexing — pagination recommended",
      "Schema migrations on indexed data require full re-index (downtime: ~2h for 1M events)",
    ],
    hiddenFees: [
      "Historical backfill charges 0.001 MEZO per 1000 events indexed",
      "Real-time webhook delivery retries incur additional compute costs",
      "Custom ABI decoding adds 20% processing overhead to indexing pipeline",
    ],
    attackVectors: [
      "Malicious contract emitting excessive events could inflate indexing costs (log bomb)",
      "Unvalidated webhook endpoints could leak indexed data to unauthorized parties",
      "Index poisoning: crafted events can create misleading aggregated statistics",
    ],
  },
};

type RunType = "contract" | "simulation" | "ai";

const runOptions = [
  { id: "contract" as RunType, label: "Upload Solidity Contract", icon: Upload, desc: "Upload .sol files for automated security analysis" },
  { id: "simulation" as RunType, label: "Smart Contract Simulations", icon: Play, desc: "Simulate contract interactions on Mezo Testnet fork" },
  { id: "ai" as RunType, label: "AI Models & Indexing Jobs", icon: Brain, desc: "Deploy AI inference models and index on-chain events for fast queries" },
];

export const RunSection = () => {
  const [selected, setSelected] = useState<RunType | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [fileName, setFileName] = useState("");
  const [contractCode, setContractCode] = useState("");

  const handleRun = (type: RunType) => {
    setSelected(type);
    setResult(null);
    setFileName("");
    setContractCode("");
  };

  const handleAnalyze = () => {
    if (!selected) return;
    setAnalyzing(true);
    setResult(null);
    setTimeout(() => {
      setResult(MOCK_ANALYSES[selected]);
      setAnalyzing(false);
    }, 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (ev) => {
        setContractCode((ev.target?.result as string) || "");
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        {runOptions.map((opt) => (
          <button
            key={opt.id}
            onClick={() => handleRun(opt.id)}
            className={`rounded-xl border p-5 text-left transition-all duration-200 hover:shadow-md ${
              selected === opt.id
                ? "border-primary bg-primary/5 shadow-md"
                : "border-border bg-card hover:border-primary/40"
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <opt.icon className="h-5 w-5 text-primary-foreground" />
              </div>
              <h4 className="font-display font-semibold text-foreground">{opt.label}</h4>
            </div>
            <p className="text-sm text-muted-foreground">{opt.desc}</p>
          </button>
        ))}
      </div>

      {selected && (
        <div className="bg-card rounded-xl border border-border p-6 animate-in fade-in duration-300">
          {selected === "contract" && (
            <div className="mb-4 space-y-3">
              <label className="block text-sm font-medium text-foreground mb-2">Upload or Paste Solidity Contract</label>
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                <input type="file" accept=".sol" onChange={handleFileChange} className="hidden" id="sol-upload" />
                <label htmlFor="sol-upload" className="cursor-pointer">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {fileName ? `✓ ${fileName}` : "Click to upload .sol file"}
                  </p>
                </label>
              </div>
              <div className="relative">
                <textarea
                  value={contractCode}
                  onChange={(e) => { setContractCode(e.target.value); if (!fileName) setFileName("pasted-contract.sol"); }}
                  placeholder="// Or paste your Solidity code here...&#10;pragma solidity ^0.8.0;&#10;&#10;contract MyContract {&#10;    // ...&#10;}"
                  className="w-full h-48 rounded-lg bg-background border border-border p-4 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y"
                />
                {contractCode && (
                  <span className="absolute top-2 right-2 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                    {contractCode.split('\n').length} lines
                  </span>
                )}
              </div>
            </div>
          )}

          <button
            onClick={handleAnalyze}
            disabled={analyzing || (selected === "contract" && !contractCode)}
            className="w-full py-3 rounded-lg bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {analyzing ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                AI Analyzing...
              </>
            ) : (
              <>
                <Brain className="h-5 w-5" />
                Run AI Analysis
              </>
            )}
          </button>
        </div>
      )}

      {result && (
        <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
          <h4 className="text-lg font-display font-bold text-foreground flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" /> AI Analysis Report
          </h4>

          <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-5">
            <h5 className="flex items-center gap-2 text-red-400 font-semibold mb-3">
              <AlertTriangle className="h-4 w-4" /> Risks
            </h5>
            <ul className="space-y-2">
              {result.risks.map((r, i) => (
                <li key={i} className="text-sm text-foreground/80 flex items-start gap-2">
                  <span className="text-red-400 mt-1">•</span> {r}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-5">
            <h5 className="flex items-center gap-2 text-amber-400 font-semibold mb-3">
              <DollarSign className="h-4 w-4" /> Hidden Fees
            </h5>
            <ul className="space-y-2">
              {result.hiddenFees.map((f, i) => (
                <li key={i} className="text-sm text-foreground/80 flex items-start gap-2">
                  <span className="text-amber-400 mt-1">•</span> {f}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-purple-500/5 border border-purple-500/20 rounded-xl p-5">
            <h5 className="flex items-center gap-2 text-purple-400 font-semibold mb-3">
              <Shield className="h-4 w-4" /> Attack Vectors
            </h5>
            <ul className="space-y-2">
              {result.attackVectors.map((a, i) => (
                <li key={i} className="text-sm text-foreground/80 flex items-start gap-2">
                  <span className="text-purple-400 mt-1">•</span> {a}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
