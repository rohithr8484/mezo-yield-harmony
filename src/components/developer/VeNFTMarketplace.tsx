import { useState } from "react";
import { Lock, Zap, ShieldCheck, ChevronRight, X, Wallet, Copy } from "lucide-react";
import { useAccount, useSwitchChain, useWriteContract } from "wagmi";
import { parseUnits } from "viem";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { toast } from "sonner";
import { ERC20_ABI } from "@/lib/mezo";

const MEZO_TESTNET_CHAIN_ID = 31611;
const MUSD_TOKEN = "0x94FF830F078eb9c6e77bADe29FB46B1a249A5fd3" as `0x${string}`;
const FEE_RECIPIENT = "0x000000000000000000000000000000000000dEaD" as `0x${string}`;
const LISTING_PRICE = 0.2;

interface VeToken {
  id: number;
  owner?: string;
  balance?: number;
}

const TOKENS: VeToken[] = [
  { id: 25, owner: "0x27343E0410acd8Cf711d079C57811fe8c0666DF2", balance: 13 },
  { id: 26, owner: "0x6e80164ea60673D64d5d6228beb684a1274Bb017", balance: 61 },
  { id: 27, owner: "0x6e80164ea60673D64d5d6228beb684a1274Bb017", balance: 61 },
  { id: 28, owner: "0x6eA4409ec503b0D5431dCE7E241dF35c511c0768", balance: 1 },
  { id: 29, owner: "0x58C6A45AcFCc1fD0E5A103Cab2caE00b0B188EC5", balance: 57 },
  { id: 30, owner: "0x58C6A45AcFCc1fD0E5A103Cab2caE00b0B188EC5", balance: 57 },
  { id: 31, owner: "0x58C6A45AcFCc1fD0E5A103Cab2caE00b0B188EC5", balance: 57 },
  { id: 36, owner: "0x6e80164ea60673D64d5d6228beb684a1274Bb017", balance: 61 },
];

const shorten = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

const PurchaseModal = ({ token, onClose, onPurchased }: { token: VeToken; onClose: () => void; onPurchased: () => void }) => {
  const { isConnected, chainId, connector } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  const [step, setStep] = useState<1 | 2>(1);
  const [submitting, setSubmitting] = useState(false);

  const handleApprove = async () => {
    if (!isConnected) { openConnectModal?.(); return; }
    setSubmitting(true);
    try {
      if (chainId !== MEZO_TESTNET_CHAIN_ID) await switchChainAsync({ chainId: MEZO_TESTNET_CHAIN_ID });
      await writeContractAsync({
        address: MUSD_TOKEN,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [FEE_RECIPIENT, parseUnits(String(LISTING_PRICE), 18)],
        chainId: MEZO_TESTNET_CHAIN_ID,
      });
      toast.success(`Approved ${LISTING_PRICE} MUSD via ${connector?.name ?? "wallet"}`);
      setStep(2);
    } catch {
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
        args: [FEE_RECIPIENT, parseUnits(String(LISTING_PRICE), 18)],
        chainId: MEZO_TESTNET_CHAIN_ID,
      });
      toast.success(`Purchased veMEZO #${token.id}. Tx: ${tx.slice(0, 10)}...`);
      onPurchased();
      onClose();
    } catch {
      toast.error("Purchase cancelled or failed");
    } finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl p-8 max-w-md w-full shadow-card-hover" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="text-xl font-display font-bold text-foreground">
              Buy veMEZO <span className="text-bitcoin">#{token.id}</span>
            </h3>
            <p className="text-xs text-muted-foreground mt-1">Two steps: approve token spend, then purchase.</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>

        <div className="bg-secondary/40 rounded-xl p-4 my-5 space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">You pay</span><span className="font-semibold text-foreground">{LISTING_PRICE} MUSD</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Owner veMEZO Balance</span><span className="font-semibold text-foreground">{token.balance}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Owner</span><span className="font-mono text-xs text-foreground">{shorten(token.owner!)}</span></div>
        </div>

        <div className="flex items-center gap-2 mb-5">
          <span className={`flex-1 text-center text-xs px-3 py-1.5 rounded-full ${step === 1 ? "bg-bitcoin/10 text-bitcoin font-semibold" : "bg-secondary text-muted-foreground"}`}>① Approve MUSD</span>
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
          {submitting ? "Confirming..." : step === 1 ? "1. Approve MUSD" : "2. Purchase NFT"}
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

const TokenCard = ({ token, owned, onBuy }: { token: VeToken; owned: boolean; onBuy: () => void }) => {
  return (
    <div className={`rounded-2xl bg-card border p-6 shadow-card hover:shadow-card-hover transition-all ${owned ? "border-emerald-500/40 ring-1 ring-emerald-500/20" : "border-border"}`}>
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-bitcoin animate-pulse" />
          <h3 className="font-display font-bold text-foreground">ID <span className="text-bitcoin">#{token.id}</span></h3>
        </div>
        {owned && (
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold">OWNED</span>
        )}
      </div>

      <p className="text-[10px] text-muted-foreground uppercase mb-1">Owner</p>
      <button
        onClick={() => { navigator.clipboard.writeText(token.owner!); toast.success("Address copied"); }}
        className="font-mono text-xs text-foreground hover:text-bitcoin transition flex items-center gap-1 group mb-4"
      >
        {shorten(token.owner!)}
        <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100 transition" />
      </button>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="bg-secondary/40 rounded-lg p-3">
          <p className="text-[10px] text-muted-foreground uppercase flex items-center gap-1 mb-1"><Zap className="h-3 w-3 text-bitcoin" />veMEZO Balance</p>
          <p className="text-sm font-semibold text-foreground">{token.balance}</p>
        </div>
        <div className="bg-secondary/40 rounded-lg p-3">
          <p className="text-[10px] text-muted-foreground uppercase flex items-center gap-1 mb-1"><Lock className="h-3 w-3" />Price</p>
          <p className="text-sm font-semibold text-foreground">{LISTING_PRICE} MUSD</p>
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground italic mb-4">Extra NFT data unavailable</p>

      <button
        onClick={onBuy}
        disabled={owned}
        className="w-full bg-foreground text-background font-semibold py-3 rounded-full hover:opacity-90 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {owned ? "Acquired" : <>Complete Purchase <ChevronRight className="h-4 w-4" /></>}
      </button>
    </div>
  );
};

export const VeNFTMarketplace = () => {
  const [selected, setSelected] = useState<VeToken | null>(null);
  const [owned, setOwned] = useState<Record<number, boolean>>({});

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {TOKENS.map((t) => (
          <TokenCard
            key={t.id}
            token={t}
            owned={!!owned[t.id]}
            onBuy={() => setSelected(t)}
          />
        ))}
      </div>

      {selected && (
        <PurchaseModal
          token={selected}
          onClose={() => setSelected(null)}
          onPurchased={() => setOwned((prev) => ({ ...prev, [selected.id]: true }))}
        />
      )}
    </div>
  );
};
