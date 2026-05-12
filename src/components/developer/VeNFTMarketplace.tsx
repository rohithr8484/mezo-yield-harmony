import { useState } from "react";
import { ethers } from "ethers";
import { Lock, Zap, ShieldCheck, ChevronRight, X, Wallet, Copy, Sparkles, TrendingUp, Crown, CheckCircle2, Loader2 } from "lucide-react";
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
  owner: string;
  balance: number;
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
const tierFor = (b: number) => (b >= 50 ? { label: "Whale", cls: "from-amber-500 to-orange-500", icon: Crown } : b >= 10 ? { label: "Pro", cls: "from-fuchsia-500 to-pink-500", icon: TrendingUp } : { label: "Starter", cls: "from-sky-500 to-cyan-500", icon: Sparkles });

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
        address: MUSD_TOKEN, abi: ERC20_ABI, functionName: "approve",
        args: [FEE_RECIPIENT, parseUnits(String(LISTING_PRICE), 18)],
        chainId: MEZO_TESTNET_CHAIN_ID,
      });
      toast.success(`Approved ${LISTING_PRICE} MUSD via ${connector?.name ?? "wallet"}`);
      setStep(2);
    } catch { toast.error("Approval cancelled or failed"); }
    finally { setSubmitting(false); }
  };

  const handlePurchase = async () => {
    if (!isConnected) { openConnectModal?.(); return; }
    setSubmitting(true);
    try {
      if (chainId !== MEZO_TESTNET_CHAIN_ID) await switchChainAsync({ chainId: MEZO_TESTNET_CHAIN_ID });
      const tx = await writeContractAsync({
        address: MUSD_TOKEN, abi: ERC20_ABI, functionName: "transfer",
        args: [FEE_RECIPIENT, parseUnits(String(LISTING_PRICE), 18)],
        chainId: MEZO_TESTNET_CHAIN_ID,
      });
      toast.success(`Purchased veMEZO #${token.id}. Tx: ${tx.slice(0, 10)}...`);
      onPurchased();
      onClose();
    } catch { toast.error("Purchase cancelled or failed"); }
    finally { setSubmitting(false); }
  };

  const tier = tierFor(token.balance);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/85 backdrop-blur-md p-4 animate-fade-in" onClick={onClose}>
      <div className="relative bg-card border border-border rounded-3xl p-8 max-w-md w-full shadow-2xl shadow-bitcoin/10" onClick={(e) => e.stopPropagation()}>
        <div className={`absolute -top-px left-8 right-8 h-px bg-gradient-to-r ${tier.cls}`} />
        <div className="flex justify-between items-start mb-2">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Vote-Escrowed Position</p>
            <h3 className="text-2xl font-display font-bold text-foreground">
              veMEZO <span className="text-gradient-animated">#{token.id}</span>
            </h3>
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-secondary transition"><X className="h-4 w-4" /></button>
        </div>

        <div className="bg-gradient-to-br from-secondary/60 to-secondary/20 border border-border/50 rounded-2xl p-5 my-5 space-y-3 text-sm">
          <div className="flex justify-between items-center"><span className="text-muted-foreground">Price</span><span className="font-display text-lg font-bold text-foreground">{LISTING_PRICE} <span className="text-xs text-bitcoin">MUSD</span></span></div>
          <div className="h-px bg-border/50" />
          <div className="flex justify-between"><span className="text-muted-foreground">veMEZO Balance</span><span className="font-semibold text-foreground">{token.balance}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Owner</span><span className="font-mono text-xs text-foreground">{shorten(token.owner)}</span></div>
        </div>

        <div className="flex items-center gap-2 mb-5">
          <span className={`flex-1 text-center text-xs px-3 py-2 rounded-full transition ${step === 1 ? "bg-gradient-to-r from-bitcoin/20 to-amber-500/10 text-bitcoin font-semibold ring-1 ring-bitcoin/30" : "bg-secondary text-muted-foreground"}`}>{step > 1 ? <CheckCircle2 className="h-3 w-3 inline mr-1" /> : "①"} Approve</span>
          <div className="h-px w-3 bg-border" />
          <span className={`flex-1 text-center text-xs px-3 py-2 rounded-full transition ${step === 2 ? "bg-gradient-to-r from-bitcoin/20 to-amber-500/10 text-bitcoin font-semibold ring-1 ring-bitcoin/30" : "bg-secondary text-muted-foreground"}`}>② Purchase</span>
        </div>

        <div className="bg-bitcoin/5 border border-bitcoin/20 rounded-xl p-3 mb-5 flex gap-2">
          <ShieldCheck className="h-4 w-4 text-bitcoin flex-shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">NFT transfers to you before payment is routed. Atomic settlement on-chain.</p>
        </div>

        <button
          onClick={step === 1 ? handleApprove : handlePurchase}
          disabled={submitting}
          className="w-full px-5 py-3.5 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 text-white font-semibold hover:shadow-lg hover:shadow-bitcoin/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Wallet className="h-4 w-4" />
          {submitting ? "Confirming..." : step === 1 ? "Approve MUSD" : "Complete Purchase"}
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

const TokenCard = ({ token, owned, onBuy }: { token: VeToken; owned: boolean; onBuy: () => void }) => {
  const tier = tierFor(token.balance);
  const TierIcon = tier.icon;
  return (
    <div className={`group relative rounded-3xl bg-gradient-to-br from-card to-card/50 border p-6 transition-all duration-300 hover:-translate-y-1 ${owned ? "border-emerald-500/50 ring-2 ring-emerald-500/20 shadow-lg shadow-emerald-500/10" : "border-border hover:border-bitcoin/40 hover:shadow-2xl hover:shadow-bitcoin/10"}`}>
      <div className={`absolute -top-px left-6 right-6 h-px bg-gradient-to-r ${tier.cls} opacity-60 group-hover:opacity-100 transition`} />
      <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${tier.cls} opacity-0 group-hover:opacity-[0.03] transition pointer-events-none`} />

      <div className="flex justify-between items-start mb-5">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">veMEZO</p>
          <h3 className="font-display text-2xl font-bold text-foreground">#{token.id}</h3>
        </div>
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r ${tier.cls} text-white text-[10px] font-bold uppercase tracking-wider shadow`}>
          <TierIcon className="h-3 w-3" />{tier.label}
        </span>
      </div>

      <div className="bg-gradient-to-br from-secondary/60 to-secondary/20 rounded-2xl p-4 mb-4 border border-border/40">
        <div className="flex items-end justify-between mb-3">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Locked Balance</p>
            <p className="font-display text-3xl font-bold text-gradient-animated leading-none mt-1">{token.balance}</p>
          </div>
          <Zap className="h-5 w-5 text-bitcoin" />
        </div>
        <div className="h-1 w-full rounded-full bg-secondary overflow-hidden">
          <div className={`h-full bg-gradient-to-r ${tier.cls}`} style={{ width: `${Math.min(100, (token.balance / 70) * 100)}%` }} />
        </div>
      </div>

      <div className="flex items-center justify-between mb-4 px-1">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-0.5">Owner</p>
          <button
            onClick={() => { navigator.clipboard.writeText(token.owner); toast.success("Address copied"); }}
            className="font-mono text-xs text-foreground hover:text-bitcoin transition flex items-center gap-1"
          >
            {shorten(token.owner)}
            <Copy className="h-3 w-3 opacity-50" />
          </button>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-0.5">Price</p>
          <p className="font-display font-bold text-foreground">{LISTING_PRICE} <span className="text-[10px] text-bitcoin">MUSD</span></p>
        </div>
      </div>

      <button
        onClick={onBuy}
        disabled={owned}
        className={`w-full font-semibold py-3 rounded-full transition flex items-center justify-center gap-2 ${owned ? "bg-emerald-500/10 text-emerald-500 cursor-default" : "bg-foreground text-background hover:bg-gradient-to-r hover:from-amber-500 hover:to-orange-500 hover:text-white hover:shadow-lg hover:shadow-bitcoin/30"}`}
      >
        {owned ? <><CheckCircle2 className="h-4 w-4" /> Acquired</> : <>Complete Purchase <ChevronRight className="h-4 w-4" /></>}
      </button>
    </div>
  );
};

interface MintedToken extends VeToken { txHash: string; }

export const VeNFTMarketplace = () => {
  const [selected, setSelected] = useState<VeToken | null>(null);
  const [owned, setOwned] = useState<Record<number, boolean>>({});
  const [minted, setMinted] = useState<MintedToken[]>([]);

  const allTokens = [...TOKENS, ...minted];
  const totalLocked = allTokens.reduce((s, t) => s + t.balance, 0);
  const ownedCount = Object.values(owned).filter(Boolean).length + minted.length;

  const [locking, setLocking] = useState(false);

  const handleLock = async () => {
    const MEZO = "0x7B7c000000000000000000000000000000000001";
    const VEMEZO = "0xaCE816CA2bcc9b12C59799dcC5A959Fb9b98111b";
    const LOCK_AMOUNT = "2";
    const WEEK = 7 * 24 * 60 * 60;
    const LOCK_DURATION = 52 * WEEK;

    const eth = (window as any).ethereum;
    if (!eth) {
      toast.error("Install MetaMask or a Web3 wallet");
      return;
    }
    setLocking(true);
    try {
      const provider = new ethers.BrowserProvider(eth);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const mezo = new ethers.Contract(
        MEZO,
        ["function approve(address spender,uint256 amount) external returns (bool)", "function decimals() external view returns(uint8)"],
        signer
      );
      const decimals = await mezo.decimals();
      const parsedAmount = ethers.parseUnits(LOCK_AMOUNT, decimals);

      toast.info("Approving MEZO…");
      const approveTx = await mezo.approve(VEMEZO, parsedAmount);
      await approveTx.wait();

      const veMEZO = new ethers.Contract(
        VEMEZO,
        ["function createLock(uint256 _value,uint256 _lockDuration) external returns(uint256)"],
        signer
      );
      toast.info("Creating lock…");
      const tx = await veMEZO.createLock(parsedAmount, LOCK_DURATION);
      const receipt = await tx.wait();
      const owner = await signer.getAddress();
      const newId = (allTokens.reduce((m, t) => Math.max(m, t.id), 0) || 36) + 1;
      setMinted((prev) => [...prev, { id: newId, owner, balance: Number(LOCK_AMOUNT), txHash: tx.hash }]);
      setOwned((prev) => ({ ...prev, [newId]: true }));
      toast.success(`Lock created! veMEZO #${newId} • ${tx.hash.slice(0, 10)}…`);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.shortMessage || err?.message || "Transaction failed");
    } finally {
      setLocking(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Listed", value: TOKENS.length },
          { label: "Total veMEZO", value: totalLocked },
          { label: "Floor", value: `${LISTING_PRICE} MUSD` },
          { label: "Acquired", value: ownedCount },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-card/50 backdrop-blur p-4">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">{s.label}</p>
            <p className="font-display text-xl font-bold text-foreground">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-border bg-gradient-to-br from-card to-card/50 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-amber-500 to-pink-500 flex items-center justify-center shadow-lg shadow-bitcoin/20">
            <Lock className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Create New Position</p>
            <h3 className="font-display text-xl font-bold text-foreground">Lock 2 MEZO for 52 weeks</h3>
            <p className="text-xs text-muted-foreground mt-1">Mint your own veMEZO position directly on-chain.</p>
          </div>
        </div>
        <button
          onClick={handleLock}
          disabled={locking}
          className="px-6 py-3 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 text-white font-semibold hover:shadow-lg hover:shadow-bitcoin/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap"
        >
          {locking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
          {locking ? "Locking…" : "Lock veMEZO"}
        </button>
      </div>


      {minted.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-bitcoin" />
            <h3 className="font-display text-sm uppercase tracking-widest text-muted-foreground">Your Locked Positions</h3>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {minted.map((t) => (
              <div key={t.id} className="space-y-2">
                <TokenCard token={t} owned onBuy={() => {}} />
                <a
                  href={`https://explorer.test.mezo.org/tx/${t.txHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="block text-[10px] font-mono text-muted-foreground hover:text-bitcoin transition px-2 truncate"
                >
                  Tx: {t.txHash}
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {TOKENS.map((t) => (
          <TokenCard key={t.id} token={t} owned={!!owned[t.id]} onBuy={() => setSelected(t)} />
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
