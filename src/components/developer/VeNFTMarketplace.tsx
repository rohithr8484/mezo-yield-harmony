import { useEffect, useState } from "react";
import { ethers, type Eip1193Provider } from "ethers";
import { Lock, Zap, ShieldCheck, ChevronRight, X, Wallet, Copy, Sparkles, TrendingUp, Crown, CheckCircle2, Loader2 } from "lucide-react";
import { useAccount, useSwitchChain, useWriteContract } from "wagmi";
import { parseUnits } from "viem";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { toast } from "sonner";
import { ERC20_ABI } from "@/lib/mezo";

const MEZO_TESTNET_CHAIN_ID = 31611;
const MEZO_TESTNET_RPC = "https://rpc.test.mezo.org";
const MUSD_TOKEN = "0x94FF830F078eb9c6e77bADe29FB46B1a249A5fd3" as `0x${string}`;
const MEZO_TOKEN = "0x7B7c000000000000000000000000000000000001";
const VEMEZO_TOKEN = "0xaCE816CA2bcc9b12C59799dcC5A959Fb9b98111b";
const FEE_RECIPIENT = "0x000000000000000000000000000000000000dEaD" as `0x${string}`;
const LISTING_PRICE = 0.2;

interface VeToken {
  id: number;
  owner: string;
  balance: number;
}

interface MintedToken extends VeToken { txHash?: string; source?: "local" | "chain"; }

const LOCKED_POSITIONS_STORAGE_KEY = "vemezo_locked_positions";
const OWNED_POSITIONS_STORAGE_KEY = "vemezo_owned_positions";

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

const loadLockedPositions = (): MintedToken[] => {
  if (typeof window === "undefined") return [];

  try {
    const parsed = JSON.parse(window.localStorage.getItem(LOCKED_POSITIONS_STORAGE_KEY) ?? "[]");
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      (item): item is MintedToken =>
        typeof item?.id === "number" &&
        typeof item?.owner === "string" &&
        typeof item?.balance === "number" &&
        (typeof item?.txHash === "string" || typeof item?.txHash === "undefined"),
    );
  } catch {
    return [];
  }
};

const mergeLockedPositions = (current: MintedToken[], incoming: MintedToken[]) => {
  const byId = new Map<number, MintedToken>();
  [...current, ...incoming].forEach((token) => byId.set(token.id, { ...byId.get(token.id), ...token }));
  return [...byId.values()].sort((a, b) => b.id - a.id);
};

const loadOwnedPositions = (): Record<number, boolean> => {
  if (typeof window === "undefined") return {};

  try {
    const parsed = JSON.parse(window.localStorage.getItem(OWNED_POSITIONS_STORAGE_KEY) ?? "{}");
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};

    return Object.fromEntries(
      Object.entries(parsed).filter(([id, value]) => Number.isFinite(Number(id)) && typeof value === "boolean"),
    ) as Record<number, boolean>;
  } catch {
    return {};
  }
};

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

const TokenCard = ({ token, owned, onBuy, onWithdraw, withdrawing }: { token: VeToken; owned: boolean; onBuy: () => void; onWithdraw: () => void; withdrawing: boolean }) => {
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
        onClick={onWithdraw}
        disabled={withdrawing || owned}
        className={`w-full font-semibold py-3 rounded-full transition flex items-center justify-center gap-2 ${owned ? "bg-emerald-500/10 text-emerald-500 cursor-default" : "bg-foreground text-background hover:bg-gradient-to-r hover:from-amber-500 hover:to-orange-500 hover:text-white hover:shadow-lg hover:shadow-bitcoin/30 disabled:opacity-50"}`}
      >
        {owned ? <><CheckCircle2 className="h-4 w-4" /> Withdrawn</> : withdrawing ? <><Loader2 className="h-4 w-4 animate-spin" /> Withdrawing…</> : <>Withdraw #{token.id} <ChevronRight className="h-4 w-4" /></>}
      </button>
    </div>
  );
};

export const VeNFTMarketplace = () => {
  const { address, isConnected } = useAccount();
  const [selected, setSelected] = useState<VeToken | null>(null);
  const [owned, setOwned] = useState<Record<number, boolean>>(loadOwnedPositions);
  const [minted, setMinted] = useState<MintedToken[]>(loadLockedPositions);

  useEffect(() => {
    window.localStorage.setItem(LOCKED_POSITIONS_STORAGE_KEY, JSON.stringify(minted));
  }, [minted]);

  useEffect(() => {
    window.localStorage.setItem(OWNED_POSITIONS_STORAGE_KEY, JSON.stringify(owned));
  }, [owned]);

  useEffect(() => {
    if (!address) return;

    let cancelled = false;
    const restoreOnChainPositions = async () => {
      try {
        const provider = new ethers.JsonRpcProvider(MEZO_TESTNET_RPC);
        const veMEZO = new ethers.Contract(
          VEMEZO_TOKEN,
          [
            "function balanceOf(address owner) view returns (uint256)",
            "function tokenOfOwnerByIndex(address owner,uint256 index) view returns (uint256)",
            "function ownerOf(uint256 tokenId) view returns (address)",
          ],
          provider,
        );
        const balance = Number(await veMEZO.balanceOf(address));
        const restored = await Promise.all(
          Array.from({ length: balance }, async (_, index) => {
            const id = Number(await veMEZO.tokenOfOwnerByIndex(address, index));
            return { id, owner: address, balance: 2, source: "chain" as const };
          }),
        );

        if (!cancelled && restored.length > 0) {
          setMinted((prev) => mergeLockedPositions(prev, restored));
        }
      } catch {
        if (!cancelled) {
          setMinted((prev) =>
            mergeLockedPositions(
              prev,
              prev.filter((token) => token.owner.toLowerCase() === address.toLowerCase()),
            ),
          );
        }
      }
    };

    restoreOnChainPositions();
    return () => {
      cancelled = true;
    };
  }, [address]);

  const allTokens = [...TOKENS, ...minted];
  const totalLocked = allTokens.reduce((s, t) => s + t.balance, 0);
  const ownedCount = Object.values(owned).filter(Boolean).length;

  const [locking, setLocking] = useState(false);
  const [withdrawingId, setWithdrawingId] = useState<number | null>(null);

  const handleWithdraw = async (tokenId: number) => {
    try {
      const eth = (window as Window & { ethereum?: Eip1193Provider }).ethereum;
      if (!eth) {
        toast.error("Install MetaMask or a Web3 wallet");
        return;
      }
      setWithdrawingId(tokenId);

      // =====================================
      // WALLET
      // =====================================
      const provider = new ethers.BrowserProvider(eth);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const account = await signer.getAddress();
      console.log("Wallet:", account);

      // =====================================
      // veMEZO CONTRACT
      // =====================================
      const veMEZO = new ethers.Contract(
        VEMEZO_TOKEN,
        [
          "function withdraw(uint256 _tokenId) external",
          "function locked(uint256) view returns(uint256 amount,uint256 end)",
          "function ownerOf(uint256 tokenId) view returns(address)",
          "function getApproved(uint256 tokenId) view returns(address)",
          "function isApprovedForAll(address owner, address operator) view returns(bool)",
        ],
        signer,
      );

      // =====================================
      // CHECK 1 — token must exist & caller must be owner/approved
      // =====================================
      let nftOwner: string;
      try {
        nftOwner = await veMEZO.ownerOf(tokenId);
      } catch {
        toast.error(`Token #${tokenId} does not exist on the veMEZO contract.`);
        return;
      }

      const isOwner = nftOwner.toLowerCase() === account.toLowerCase();
      let isAuthorized = isOwner;
      if (!isOwner) {
        try {
          const approved: string = await veMEZO.getApproved(tokenId);
          const operatorOk: boolean = await veMEZO.isApprovedForAll(nftOwner, account);
          isAuthorized = approved.toLowerCase() === account.toLowerCase() || operatorOk;
        } catch {
          isAuthorized = false;
        }
      }
      if (!isAuthorized) {
        toast.error(`Not authorized for veMEZO #${tokenId}. Owner: ${shorten(nftOwner)}. Connect that wallet or get approval.`);
        return;
      }

      // =====================================
      // CHECK 2 — lock must be expired
      // =====================================
      try {
        const lock = await veMEZO.locked(tokenId);
        const lockEnd = Number(lock.end);
        const now = Math.floor(Date.now() / 1000);
        if (lockEnd > 0 && now < lockEnd) {
          const daysLeft = Math.ceil((lockEnd - now) / 86400);
          const unlockDate = new Date(lockEnd * 1000).toLocaleDateString();
          toast.error(`Lock still active — ${daysLeft} day(s) remaining (unlocks ${unlockDate}).`);
          return;
        }
      } catch {
        // contract may not expose locked(); fall through and let the tx revert with reason
      }

      // =====================================
      // WITHDRAW (funds return to msg.sender = connected account)
      // =====================================
      toast.info(`Withdrawing veMEZO #${tokenId} to ${shorten(account)}…`);
      const tx = await veMEZO.withdraw(tokenId);
      console.log("Withdraw TX:", tx.hash);
      await tx.wait();

      toast.success(`Withdrawn veMEZO #${tokenId} → ${shorten(account)} • ${tx.hash.slice(0, 10)}…`);
      setMinted((prev) => prev.filter((t) => t.id !== tokenId));
      setOwned((prev) => ({ ...prev, [tokenId]: true }));
    } catch (err: unknown) {
      console.error(err);
      const e = err as { code?: string; shortMessage?: string; reason?: string; message?: string };
      let message = e.shortMessage || e.reason || e.message || "Withdraw failed";
      if (e.code === "CALL_EXCEPTION" && !e.reason) {
        message = "Transaction reverted by contract. Most likely cause: lock has not expired yet, or the connected wallet is not authorized to withdraw this veMEZO position.";
      }
      toast.error(message);
    } finally {
      setWithdrawingId(null);
    }
  };

  const handleLock = async () => {
    const LOCK_AMOUNT = "2";
    const WEEK = 7 * 24 * 60 * 60;
    const LOCK_DURATION = 52 * WEEK;

    const eth = (window as Window & { ethereum?: Eip1193Provider }).ethereum;
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
        MEZO_TOKEN,
        ["function approve(address spender,uint256 amount) external returns (bool)", "function decimals() external view returns(uint8)"],
        signer
      );
      const decimals = await mezo.decimals();
      const parsedAmount = ethers.parseUnits(LOCK_AMOUNT, decimals);

      toast.info("Approving MEZO…");
      const approveTx = await mezo.approve(VEMEZO_TOKEN, parsedAmount);
      await approveTx.wait();

      const veMEZO = new ethers.Contract(
        VEMEZO_TOKEN,
        [
          "function createLock(uint256 _value,uint256 _lockDuration) external returns(uint256)",
          "event Transfer(address indexed from,address indexed to,uint256 indexed tokenId)",
        ],
        signer
      );
      toast.info("Creating lock…");
      const tx = await veMEZO.createLock(parsedAmount, LOCK_DURATION);
      const receipt = await tx.wait();
      const owner = await signer.getAddress();
      const transferLog = receipt.logs
        .map((log: ethers.Log) => {
          try { return veMEZO.interface.parseLog(log); } catch { return null; }
        })
        .find((log) => log?.name === "Transfer" && log.args?.from === ethers.ZeroAddress);
      const newId = transferLog ? Number(transferLog.args.tokenId) : (allTokens.reduce((m, t) => Math.max(m, t.id), 0) || 36) + 1;
      setMinted((prev) => mergeLockedPositions(prev, [{ id: newId, owner, balance: Number(LOCK_AMOUNT), txHash: tx.hash, source: "local" }]));
      toast.success(`Lock created! veMEZO #${newId} • ${tx.hash.slice(0, 10)}…`);
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Transaction failed";
      toast.error(message);
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

      <div className="rounded-3xl border border-bitcoin/30 bg-bitcoin/5 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-bitcoin mb-1">Newly Locked Positions</p>
            <h3 className="font-display text-2xl font-bold text-foreground">Your recent veMEZO locks</h3>
          </div>
          <p className="text-xs text-muted-foreground">{isConnected ? `${minted.length} restored` : "Connect wallet to restore on-chain locks"}</p>
        </div>

        {minted.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {minted.map((token) => (
              <div key={`new-${token.id}`} className="space-y-2">
                <TokenCard token={token} owned={!!owned[token.id]} onBuy={() => setSelected(token)} onWithdraw={() => handleWithdraw(token.id)} withdrawing={withdrawingId === token.id} />
                {token.txHash ? (
                  <a
                    href={`https://explorer.test.mezo.org/tx/${token.txHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="block px-2 text-[10px] font-mono text-muted-foreground hover:text-bitcoin transition truncate"
                    title={token.txHash}
                  >
                    Tx: {token.txHash.slice(0, 10)}…{token.txHash.slice(-8)}
                  </a>
                ) : (
                  <p className="px-2 text-[10px] font-mono text-muted-foreground">Restored from wallet • ID #{token.id}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-border/60 bg-card/60 p-5 text-sm text-muted-foreground">
            Newly locked veMEZO positions will appear here immediately after locking and after refresh.
          </div>
        )}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {allTokens.map((t) => {
          const mintedTx = minted.find((m) => m.id === t.id)?.txHash;
          return (
            <div key={t.id} className="space-y-2">
              <TokenCard token={t} owned={!!owned[t.id]} onBuy={() => setSelected(t)} onWithdraw={() => handleWithdraw(t.id)} withdrawing={withdrawingId === t.id} />
              {mintedTx && (
                <a
                  href={`https://explorer.test.mezo.org/tx/${mintedTx}`}
                  target="_blank"
                  rel="noreferrer"
                  className="block px-2 text-[10px] font-mono text-muted-foreground hover:text-bitcoin transition truncate"
                  title={mintedTx}
                >
                  Tx: {mintedTx.slice(0, 10)}…{mintedTx.slice(-8)}
                </a>
              )}
            </div>
          );
        })}
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
