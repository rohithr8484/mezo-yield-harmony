import { useState } from "react";
import { TrendingDown, Lock, Zap, Calendar, Tag, ShieldCheck, ChevronRight, X, Wallet, Sparkles, Copy } from "lucide-react";
import { useAccount, useSwitchChain, useWriteContract } from "wagmi";
import { parseUnits } from "viem";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { toast } from "sonner";
import { ERC20_ABI } from "@/lib/mezo";

const MEZO_TESTNET_CHAIN_ID = 31611;
const MUSD_TOKEN = "0x94FF830F078eb9c6e77bADe29FB46B1a249A5fd3" as `0x${string}`;
const FEE_RECIPIENT = "0x000000000000000000000000000000000000dEaD" as `0x${string}`;

interface VePosition {
  id: number;
  type: "veMEZO" | "veBTC";
  seller: string;
  intrinsicValue: number;
  votingPower: number;
  lockEndsDays: number;
  lockEndsDate: string;
  listingPrice: number;
  discount: number;
}

const positions: VePosition[] = [
  { id: 1539, type: "veMEZO", seller: "0xe9Eb...57E9", intrinsicValue: 20155, votingPower: 20034.23, lockEndsDays: 1447, lockEndsDate: "Apr 4, 2030", listingPrice: 750, discount: 45.7 },
  { id: 2841, type: "veBTC", seller: "0x4A3c...88F1", intrinsicValue: 1.85, votingPower: 1.72, lockEndsDays: 920, lockEndsDate: "Oct 12, 2028", listingPrice: 0.95, discount: 38.2 },
  { id: 1102, type: "veMEZO", seller: "0x7B22...A4DC", intrinsicValue: 8420, votingPower: 8201.5, lockEndsDays: 720, lockEndsDate: "Mar 18, 2028", listingPrice: 410, discount: 51.3 },
  { id: 3377, type: "veBTC", seller: "0xC88a...12B0", intrinsicValue: 3.2, votingPower: 2.98, lockEndsDays: 1260, lockEndsDate: "Sep 22, 2029", listingPrice: 1.85, discount: 42.1 },
  { id: 982, type: "veMEZO", seller: "0xFD11...9E04", intrinsicValue: 45200, votingPower: 44980, lockEndsDays: 1610, lockEndsDate: "Sep 14, 2030", listingPrice: 1850, discount: 49.8 },
  { id: 4421, type: "veBTC", seller: "0x21A4...77BB", intrinsicValue: 0.62, votingPower: 0.58, lockEndsDays: 540, lockEndsDate: "Sep 30, 2027", listingPrice: 0.32, discount: 36.5 },
];

interface AcquiredToken {
  id: number;
  owner?: string;
  balance?: number;
  empty?: boolean;
}

const ACQUIRED_TOKENS: AcquiredToken[] = [
  { id: 25, owner: "0x27343E0410acd8Cf711d079C57811fe8c0666DF2", balance: 13 },
  { id: 26, owner: "0x6e80164ea60673D64d5d6228beb684a1274Bb017", balance: 61 },
  { id: 27, owner: "0x6e80164ea60673D64d5d6228beb684a1274Bb017", balance: 61 },
  { id: 28, owner: "0x6eA4409ec503b0D5431dCE7E241dF35c511c0768", balance: 1 },
  { id: 29, owner: "0x58C6A45AcFCc1fD0E5A103Cab2caE00b0B188EC5", balance: 57 },
  { id: 30, owner: "0x58C6A45AcFCc1fD0E5A103Cab2caE00b0B188EC5", balance: 57 },
  { id: 31, owner: "0x58C6A45AcFCc1fD0E5A103Cab2caE00b0B188EC5", balance: 57 },
  { id: 32, empty: true },
  { id: 33, empty: true },
  { id: 34, empty: true },
  { id: 35, empty: true },
  { id: 36, owner: "0x6e80164ea60673D64d5d6228beb684a1274Bb017", balance: 61 },
];

const AcquiredTokensPanel = () => {
  const shorten = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;
  return (
    <div className="rounded-2xl bg-gradient-to-br from-bitcoin/5 via-card to-primary/5 border border-bitcoin/30 p-6 shadow-card-hover animate-fade-in">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles className="h-5 w-5 text-bitcoin animate-pulse" />
        <h3 className="font-display font-bold text-foreground text-lg">Acquired veMEZO Tokens</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-5">
        On-chain veMEZO inventory delivered to your account after settlement.
      </p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {ACQUIRED_TOKENS.map((t) => (
          <div
            key={t.id}
            className={`rounded-xl border p-4 transition-all hover:scale-[1.02] ${
              t.empty
                ? "bg-secondary/30 border-dashed border-border opacity-60"
                : "bg-card border-border hover:border-bitcoin/40 hover:shadow-card"
            }`}
          >
            <div className="flex justify-between items-center mb-2">
              <span className="font-display font-bold text-foreground">
                ID <span className="text-bitcoin">#{t.id}</span>
              </span>
              {t.empty ? (
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Empty</span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold">
                  veMEZO {t.balance}
                </span>
              )}
            </div>
            {!t.empty && (
              <>
                <p className="text-[10px] text-muted-foreground uppercase mb-0.5">Owner</p>
                <button
                  onClick={() => navigator.clipboard.writeText(t.owner!)}
                  className="font-mono text-xs text-foreground hover:text-bitcoin transition flex items-center gap-1 group"
                  title="Copy address"
                >
                  {shorten(t.owner!)}
                  <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100 transition" />
                </button>
                <p className="text-[10px] text-muted-foreground mt-2 italic">Extra NFT data unavailable</p>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const PurchaseModal = ({ position, onClose, onPurchased }: { position: VePosition; onClose: () => void; onPurchased: () => void }) => {
  const { isConnected, chainId, connector } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  const [step, setStep] = useState<1 | 2>(1);
  const [submitting, setSubmitting] = useState(false);
  const protocolFee = 1;
  const tokenSymbol = position.type === "veMEZO" ? "MUSD" : "MUSD";

  const handleApprove = async () => {
    if (!isConnected) { openConnectModal?.(); return; }
    setSubmitting(true);
    try {
      if (chainId !== MEZO_TESTNET_CHAIN_ID) await switchChainAsync({ chainId: MEZO_TESTNET_CHAIN_ID });
      await writeContractAsync({
        address: MUSD_TOKEN,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [FEE_RECIPIENT, parseUnits(String(position.listingPrice), 18)],
        chainId: MEZO_TESTNET_CHAIN_ID,
      });
      toast.success(`Approved ${position.listingPrice} MUSD via ${connector?.name ?? "wallet"}`);
      setStep(2);
    } catch (e) {
      toast.error("Approval cancelled or failed");
    } finally { setSubmitting(false); }
  };

  const handlePurchase = async () => {
    if (!isConnected) { openConnectModal?.(); return; }
    setSubmitting(true);
    try {
      if (chainId !== MEZO_TESTNET_CHAIN_ID) await switchChainAsync({ chainId: MEZO_TESTNET_CHAIN_ID });
      const tx = await writeContractAsync({
        address: MUSD_TOKEN,
        abi: ERC20_ABI,
        functionName: "transfer",
        args: [FEE_RECIPIENT, parseUnits(String(position.listingPrice), 18)],
        chainId: MEZO_TESTNET_CHAIN_ID,
      });
      toast.success(`Purchased ve${position.type.slice(2)} #${position.id}. Tx: ${tx.slice(0, 10)}...`);
      onPurchased();
      onClose();
    } catch (e) {
      toast.error("Purchase cancelled or failed");
    } finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl p-8 max-w-md w-full shadow-card-hover" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="text-xl font-display font-bold text-foreground">
              Buy {position.type} <span className="text-bitcoin">#{position.id}</span>
            </h3>
            <p className="text-xs text-muted-foreground mt-1">Two steps: approve token spend, then purchase.</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>

        <div className="bg-secondary/40 rounded-xl p-4 my-5 space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">You pay</span><span className="font-semibold text-foreground">{position.listingPrice.toFixed(6)} {tokenSymbol}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Discount</span><span className="font-semibold text-emerald-500">{position.discount}%</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Protocol fee</span><span className="font-semibold text-foreground">{protocolFee}%</span></div>
        </div>

        <div className="flex items-center gap-2 mb-5">
          <span className={`flex-1 text-center text-xs px-3 py-1.5 rounded-full ${step === 1 ? "bg-bitcoin/10 text-bitcoin font-semibold" : "bg-secondary text-muted-foreground"}`}>① Approve {tokenSymbol}</span>
          <div className="h-px w-4 bg-border" />
          <span className={`flex-1 text-center text-xs px-3 py-1.5 rounded-full ${step === 2 ? "bg-bitcoin/10 text-bitcoin font-semibold" : "bg-secondary text-muted-foreground"}`}>② Purchase NFT</span>
        </div>

        <div className="bg-bitcoin/5 border border-bitcoin/20 rounded-xl p-3 mb-5 flex gap-2">
          <ShieldCheck className="h-4 w-4 text-bitcoin flex-shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">NFT transfers to you before payment is routed. If the seller moves the NFT before you buy, the transaction reverts automatically.</p>
        </div>

        <button
          onClick={step === 1 ? handleApprove : handlePurchase}
          disabled={submitting}
          className="w-full px-5 py-3.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Wallet className="h-4 w-4" />
          {submitting ? "Confirming..." : step === 1 ? `1. Approve ${tokenSymbol}` : `2. Purchase NFT`}
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

const PositionCard = ({ position, onBuy }: { position: VePosition; onBuy: () => void }) => {
  const isMezo = position.type === "veMEZO";
  const symbol = isMezo ? "MEZO" : "BTC";
  return (
    <div className="rounded-2xl bg-card border border-border p-6 shadow-card hover:shadow-card-hover transition-all">
      <div className="flex justify-between items-start mb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-2 w-2 rounded-full bg-bitcoin animate-pulse" />
            <h3 className="font-display font-bold text-foreground">{position.type} <span className="text-bitcoin">#{position.id}</span></h3>
          </div>
          <p className="text-[10px] font-mono text-muted-foreground">Seller: {position.seller}</p>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-bold flex items-center gap-1">
          <TrendingDown className="h-3 w-3" />{position.discount}% OFF
        </span>
      </div>

      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Intrinsic Value</p>
      <p className="text-2xl font-display font-bold text-foreground mb-5">
        {position.intrinsicValue.toLocaleString(undefined, { maximumFractionDigits: 4 })} <span className="text-sm text-muted-foreground font-normal">{symbol}</span>
      </p>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="bg-secondary/40 rounded-lg p-3">
          <p className="text-[10px] text-muted-foreground uppercase flex items-center gap-1 mb-1"><Lock className="h-3 w-3" />Locked</p>
          <p className="text-sm font-semibold text-foreground">{position.intrinsicValue.toLocaleString(undefined, { maximumFractionDigits: 4 })} <span className="text-xs text-muted-foreground">{symbol}</span></p>
        </div>
        <div className="bg-secondary/40 rounded-lg p-3">
          <p className="text-[10px] text-muted-foreground uppercase flex items-center gap-1 mb-1"><Zap className="h-3 w-3 text-bitcoin" />Voting Power</p>
          <p className="text-sm font-semibold text-foreground">{position.votingPower.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
        </div>
      </div>

      <div className="bg-secondary/40 rounded-lg p-3 mb-3 flex justify-between items-center">
        <div>
          <p className="text-[10px] text-muted-foreground uppercase mb-1">Lock Ends</p>
          <p className="text-sm font-semibold text-foreground">{Math.floor(position.lockEndsDays / 30)}mo {position.lockEndsDays}d</p>
        </div>
        <div className="text-right text-xs text-muted-foreground flex items-center gap-1">
          <Calendar className="h-3 w-3" />{position.lockEndsDate}
        </div>
      </div>

      <div className="bg-secondary/40 rounded-lg p-3 mb-4">
        <p className="text-[10px] text-muted-foreground uppercase mb-2 flex items-center gap-1"><Tag className="h-3 w-3" />Value Breakdown</p>
        <div className="flex justify-between items-center text-sm">
          <span className="text-foreground">{position.intrinsicValue.toLocaleString(undefined, { maximumFractionDigits: 4 })} {symbol}</span>
          <ChevronRight className="h-3 w-3 text-muted-foreground" />
          <span className="text-emerald-500 font-semibold">{position.listingPrice.toFixed(4)} MUSD</span>
        </div>
      </div>

      <button onClick={onBuy} className="w-full bg-foreground text-background font-semibold py-3 rounded-full hover:opacity-90 transition flex items-center justify-center gap-2">
        Complete Purchase <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
};

export const VeNFTMarketplace = () => {
  const [selected, setSelected] = useState<VePosition | null>(null);
  const [filter, setFilter] = useState<"all" | "veMEZO" | "veBTC">("all");

  const filtered = filter === "all" ? positions : positions.filter((p) => p.type === filter);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 justify-center">
        {(["all", "veMEZO", "veBTC"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${filter === f ? "bg-foreground text-background" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
            {f === "all" ? "All Positions" : f}
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((p) => <PositionCard key={p.id} position={p} onBuy={() => setSelected(p)} />)}
      </div>

      {selected && <PurchaseModal position={selected} onClose={() => setSelected(null)} />}
    </div>
  );
};
