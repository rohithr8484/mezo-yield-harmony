import { useState, useEffect, useMemo } from "react";
import { Lock, Unlock, ChevronDown, ChevronUp, Info, Zap, RefreshCw, Settings, ExternalLink } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const VeBoostCalculator = () => {
  const [veBTC, setVeBTC] = useState("21");
  const [veMEZO, setVeMEZO] = useState("");
  const [lockedField, setLockedField] = useState<"veBTC" | "veMEZO" | null>("veBTC");
  const [boostTarget, setBoostTarget] = useState([2.96]);
  const [systemOpen, setSystemOpen] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  // System totals
  const [totalVeBTC, setTotalVeBTC] = useState(4630);
  const [totalVeMEZO, setTotalVeMEZO] = useState(390000000);

  const maxVeBTC = 10000;
  const maxVeMEZO = 500000000;

  // Calculate boost from veBTC and veMEZO amounts
  const calculateBoost = (btc: number, mezo: number): number => {
    if (btc <= 0 || totalVeBTC <= 0) return 1;
    const btcShare = btc / totalVeBTC;
    const mezoShare = totalVeMEZO > 0 && mezo > 0 ? mezo / totalVeMEZO : 0;
    const rawBoost = 1 + 4 * Math.min(1, mezoShare / btcShare);
    return Math.min(5, Math.max(1, rawBoost));
  };

  // Calculate veMEZO needed for a target boost given veBTC
  const calcVeMEZOForBoost = (btc: number, target: number): number => {
    if (btc <= 0 || target <= 1) return 0;
    const btcShare = btc / totalVeBTC;
    const neededMezoShare = ((target - 1) / 4) * btcShare;
    return neededMezoShare * totalVeMEZO;
  };

  // Calculate veBTC needed for a target boost given veMEZO
  const calcVeBTCForBoost = (mezo: number, target: number): number => {
    if (mezo <= 0 || target <= 1) return 0;
    const mezoShare = mezo / totalVeMEZO;
    const neededBtcShare = mezoShare / ((target - 1) / 4);
    return neededBtcShare * totalVeBTC;
  };

  // When boost slider changes and a field is locked, calculate the other
  useEffect(() => {
    if (lockedField === "veBTC") {
      const btcNum = parseFloat(veBTC) || 0;
      if (btcNum > 0) {
        const needed = calcVeMEZOForBoost(btcNum, boostTarget[0]);
        setVeMEZO(needed > 0 ? needed.toLocaleString("en-US", { maximumFractionDigits: 2 }) : "0");
      }
    } else if (lockedField === "veMEZO") {
      const mezoNum = parseFloat(veMEZO.replace(/,/g, "")) || 0;
      if (mezoNum > 0) {
        const needed = calcVeBTCForBoost(mezoNum, boostTarget[0]);
        setVeBTC(needed > 0 ? needed.toLocaleString("en-US", { maximumFractionDigits: 2 }) : "0");
      }
    }
  }, [boostTarget, lockedField, totalVeBTC, totalVeMEZO]);

  const currentBoost = useMemo(() => {
    const btcNum = parseFloat(veBTC.replace(/,/g, "")) || 0;
    const mezoNum = parseFloat(veMEZO.replace(/,/g, "")) || 0;
    return calculateBoost(btcNum, mezoNum);
  }, [veBTC, veMEZO, totalVeBTC, totalVeMEZO]);

  // When both unlocked, update boost display from inputs
  useEffect(() => {
    if (lockedField === null) {
      setBoostTarget([currentBoost]);
    }
  }, [currentBoost, lockedField]);

  const toggleLock = (field: "veBTC" | "veMEZO") => {
    setLockedField((prev) => (prev === field ? null : field));
  };

  const formatNumber = (n: number): string => {
    if (n >= 1e9) return (n / 1e9).toFixed(1) + "B";
    if (n >= 1e6) return (n / 1e6).toFixed(0) + "M";
    if (n >= 1e3) return (n / 1e3).toFixed(0) + "K";
    return n.toFixed(0);
  };

  const boostColor = (b: number) => {
    if (b >= 4) return "text-primary";
    if (b >= 3) return "text-primary";
    if (b >= 2) return "text-bitcoin";
    return "text-foreground";
  };

  return (
    <section className="py-20 border-t border-border">
      <div className="container max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-display font-bold text-foreground">veBoost Calculator</h2>
          <p className="mt-2 text-muted-foreground">
            Calculate your optimal veMEZO and veBTC locks
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Calculator */}
          <div className="lg:col-span-3">
            <div className="rounded-2xl bg-card border border-border shadow-card overflow-hidden">
              {/* Header gradient */}
              <div className="h-2 bg-[image:var(--gradient-hero)]" />

              <div className="p-6 space-y-6">
                {/* veBTC Input */}
                <div className="flex items-center gap-3 rounded-xl border border-border p-4">
                  <button
                    onClick={() => toggleLock("veBTC")}
                    className={`h-10 w-10 rounded-lg flex items-center justify-center transition-colors ${
                      lockedField === "veBTC"
                        ? "bg-primary/10 text-primary"
                        : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                    }`}
                  >
                    {lockedField === "veBTC" ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                  </button>
                  <input
                    type="text"
                    value={veBTC}
                    onChange={(e) => {
                      if (lockedField !== "veBTC") return;
                      setVeBTC(e.target.value);
                    }}
                    readOnly={lockedField !== "veBTC" && lockedField !== null}
                    className="flex-1 bg-transparent text-2xl font-bold text-foreground outline-none min-w-0"
                    placeholder="0"
                  />
                  <span className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold whitespace-nowrap">
                    <span className="h-5 w-5 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-[10px] font-bold">₿</span>
                    veBTC
                  </span>
                </div>

                {/* veMEZO Input */}
                <div className="flex items-center gap-3 rounded-xl border border-border p-4">
                  <button
                    onClick={() => toggleLock("veMEZO")}
                    className={`h-10 w-10 rounded-lg flex items-center justify-center transition-colors ${
                      lockedField === "veMEZO"
                        ? "bg-primary/10 text-primary"
                        : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                    }`}
                  >
                    {lockedField === "veMEZO" ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                  </button>
                  <input
                    type="text"
                    value={veMEZO}
                    onChange={(e) => {
                      if (lockedField !== "veMEZO") return;
                      setVeMEZO(e.target.value);
                    }}
                    readOnly={lockedField !== "veMEZO" && lockedField !== null}
                    className="flex-1 bg-transparent text-2xl font-bold text-foreground outline-none min-w-0"
                    placeholder="0"
                  />
                  <span className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold whitespace-nowrap">
                    <span className="h-5 w-5 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-[10px] font-bold">M</span>
                    veMEZO
                  </span>
                </div>

                {/* System Totals Collapsible */}
                <Collapsible open={systemOpen} onOpenChange={setSystemOpen}>
                  <CollapsibleTrigger className="flex items-center justify-between w-full text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Settings className="h-3.5 w-3.5" />
                      System Totals
                    </div>
                    {systemOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-4 space-y-4">
                    {/* veBTC total */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="flex items-center gap-2 text-sm text-foreground font-medium">
                          <span className="h-5 w-5 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-[10px] font-bold">₿</span>
                          veBTC
                        </span>
                        <span className="text-sm font-semibold text-foreground">{totalVeBTC.toLocaleString()}</span>
                      </div>
                      <div className="relative">
                        <Slider
                          value={[totalVeBTC]}
                          min={100}
                          max={maxVeBTC}
                          step={10}
                          onValueChange={(v) => setTotalVeBTC(v[0])}
                        />
                        <div className="flex justify-end mt-1">
                          <span className="text-[10px] text-muted-foreground">MAX {formatNumber(maxVeBTC)}</span>
                        </div>
                      </div>
                    </div>
                    {/* veMEZO total */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="flex items-center gap-2 text-sm text-foreground font-medium">
                          <span className="h-5 w-5 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-[10px] font-bold">M</span>
                          veMEZO
                        </span>
                        <span className="text-sm font-semibold text-foreground">{totalVeMEZO.toLocaleString()}</span>
                      </div>
                      <div className="relative">
                        <Slider
                          value={[totalVeMEZO]}
                          min={1000000}
                          max={maxVeMEZO}
                          step={1000000}
                          onValueChange={(v) => setTotalVeMEZO(v[0])}
                        />
                        <div className="flex justify-end mt-1">
                          <span className="text-[10px] text-muted-foreground">MAX {formatNumber(maxVeMEZO)}</span>
                        </div>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                {/* Boost Display */}
                <div className="text-center pt-2">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Your Boost</p>
                  <p className={`text-5xl font-display font-bold ${boostColor(boostTarget[0])}`}>
                    {boostTarget[0].toFixed(2)}<span className="text-2xl ml-1">×</span>
                  </p>
                </div>

                {/* Boost Slider */}
                <div>
                  <Slider
                    value={boostTarget}
                    min={1}
                    max={5}
                    step={0.01}
                    onValueChange={(v) => {
                      if (lockedField !== null) setBoostTarget(v);
                    }}
                    disabled={lockedField === null}
                  />
                  <div className="flex justify-between mt-2">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <span
                        key={n}
                        className={`text-xs font-semibold ${
                          Math.round(boostTarget[0]) === n ? "text-primary" : "text-muted-foreground"
                        }`}
                      >
                        {n}×
                      </span>
                    ))}
                  </div>
                </div>

                {/* Manage link */}
                <div className="text-center pt-2">
                  <a
                    href="https://mezo.org/earn/lock"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    Manage my locks <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* How to Use Panel */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl bg-card border border-border shadow-card p-6 space-y-6 sticky top-24">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-display font-semibold text-foreground flex items-center gap-2">
                  <Info className="h-5 w-5 text-primary" />
                  How to Use
                </h3>
              </div>

              <p className="text-sm text-muted-foreground">
                This tool helps you plan your veMEZO and veBTC lock amounts to achieve your desired boost multiplier. Your boost affects the rewards you earn from the Mezo protocol.
              </p>

              <div className="space-y-5">
                <div>
                  <h4 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-1">
                    <Lock className="h-4 w-4" />
                    Using the Lock Icons
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Click the lock icon next to an input to fix the value.
                  </p>
                  <div className="flex gap-3 mt-2">
                    <div className="flex-1 rounded-lg bg-secondary p-3">
                      <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                        <Lock className="h-3.5 w-3.5" /> Locked
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">Auto-calculated</p>
                    </div>
                    <div className="flex-1 rounded-lg bg-secondary p-3">
                      <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                        <Unlock className="h-3.5 w-3.5" /> Unlocked
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">User Input</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-1">
                    <Zap className="h-4 w-4 text-primary" />
                    The Boost Slider
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    When one input is locked, use the boost slider to set your target multiplier (1× to 5×). The locked value will update to show how much you need for that boost.
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-1">
                    <RefreshCw className="h-4 w-4" />
                    Unlock Both Values
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Now you can manually enter both veBTC and veMEZO amounts, and the calculator will show you the resulting boost you'd receive.
                  </p>
                  <div className="mt-2 rounded-lg bg-bitcoin/10 border border-bitcoin/20 p-3">
                    <p className="text-xs text-muted-foreground">
                      <span className="font-semibold text-bitcoin">Tip:</span> This mode is great for checking "what if" scenarios with specific token amounts you have in mind.
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-1">
                    <Settings className="h-4 w-4" />
                    System Totals
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Expand "System Totals" to adjust the total veBTC and veMEZO in the protocol. This helps you model different scenarios as the protocol grows.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default VeBoostCalculator;
