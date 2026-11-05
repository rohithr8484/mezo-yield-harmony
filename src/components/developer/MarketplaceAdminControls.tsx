import { useState } from "react";
import { Clock, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MARKETPLACE_VEMEZO_COLLECTION, readMarketplaceCollectionSupported, readMarketplaceFeeTimelock } from "@/lib/marketplaceAdminReads";
import { useAccount } from "wagmi";
import { type Eip1193Provider } from "ethers";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { callMarketplaceAdminAction, MARKETPLACE_ADMIN_ACTIONS, MARKETPLACE_ADMIN_ROLES, type MarketplaceAdminAction, type MarketplaceAdminRole } from "@/lib/marketplaceAdminActions";

export const MarketplaceAdminControls = () => {
  const { address, connector } = useAccount();
  const [action, setAction] = useState<MarketplaceAdminAction | null>(null);
  const [role, setRole] = useState<MarketplaceAdminRole>("COLLECTION_MANAGER_ROLE");
  const [account, setAccount] = useState("");
  const [targetCollection, setTargetCollection] = useState(MARKETPLACE_VEMEZO_COLLECTION);
  const [actionPending, setActionPending] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [result, setResult] = useState<{ method: string; value?: boolean; hash?: string } | null>(null);
  const selected = MARKETPLACE_ADMIN_ACTIONS.find((item) => item.id === action);
  const roleAction = action === "grantRole" || action === "hasRole";
  const execute = async () => {
    if (!action || actionPending) return;
    setActionPending(true);
    setActionError(null);
    try {
      const wallet = selected?.write && connector ? await connector.getProvider() as Eip1193Provider : undefined;
      const output = await callMarketplaceAdminAction(action, { role, account, collection: targetCollection }, wallet);
      setResult({ method: action, ...output });
      setAction(null);
    } catch (err) {
      const e = err as { code?: unknown; shortMessage?: string; message?: string };
      setActionError(e.code === 4001 || e.code === "ACTION_REJECTED" ? "Action cancelled in your wallet." : e.shortMessage ?? e.message ?? "Contract action unavailable. Please try again.");
    } finally { setActionPending(false); }
  };
  const [fee, setFee] = useState<string | null>(null);
  const [collection, setCollection] = useState<boolean | null>(null);
  const [pending, setPending] = useState<"fee" | "collection" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const read = async (method: "fee" | "collection") => {
    if (pending) return;
    setPending(method);
    setError(null);
    if (method === "fee") setFee(null);
    else setCollection(null);
    try {
      if (method === "fee") setFee((await readMarketplaceFeeTimelock()).toString());
      else setCollection(await readMarketplaceCollectionSupported());
    } catch {
      setError("Contract read unavailable. Please try again.");
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="mb-8 space-y-3" aria-label="MarketplaceAdmin contract reads">
      <div className="flex flex-wrap justify-center gap-3">
        <Button hidden onClick={() => read("fee")} disabled={pending !== null} className="hidden ui-btn ui-btn-pay min-h-10">
          {pending === "fee" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Clock className="h-4 w-4" />}
          FEE_TIMELOCK()
        </Button>
        <Button hidden onClick={() => read("collection")} disabled={pending !== null} className="hidden ui-btn ui-btn-pay min-h-10">
          {pending === "collection" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
          isCollectionSupported()
        </Button>
        {MARKETPLACE_ADMIN_ACTIONS.map((item) => (
          <Button key={item.id} className="ui-btn ui-btn-pay min-h-10" disabled={pending !== null || actionPending} onClick={() => {
            setAction(item.id); setAccount(address ?? ""); setActionError(null);
          }}>
            <ShieldCheck className="h-4 w-4" />{item.label}
          </Button>
        ))}
      </div>
      <div className="space-y-2 text-center text-sm text-foreground" role="status" aria-live="polite">
        {fee !== null && <p>FEE_TIMELOCK: {fee} seconds ({Number(fee) / 3600} hours)</p>}
        {collection !== null && <p className="break-words">isCollectionSupported: <strong>{String(collection)}</strong><span className="mt-1 block font-mono text-xs text-muted-foreground">{MARKETPLACE_VEMEZO_COLLECTION}</span></p>}
        {error && <p className="text-destructive" role="alert">{error}</p>}
        {result && <p className="break-words">{result.method}: {result.hash ? <>Confirmed on-chain · <a className="text-primary underline" href={`https://explorer.test.mezo.org/tx/${result.hash}`} target="_blank" rel="noopener noreferrer">View transaction</a></> : <strong>{String(result.value)}</strong>}</p>}
      </div>
      <Dialog open={action !== null} onOpenChange={(open) => { if (!open && !actionPending) setAction(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selected?.label}</DialogTitle>
            <DialogDescription>{action === "grantRole" ? "Grant access to the target wallet. Only the role’s admin can approve this change." : action === "supportedCollections" ? "Check a collection address in supportedCollections. This mapping does not provide a complete collection list." : selected?.write ? "Update the MarketplaceAdmin whitelist on Mezo Testnet. Collection manager permission is required; this whitelist is advisory." : "Read the MarketplaceAdmin contract on Mezo Testnet. No transaction is submitted."}</DialogDescription>
          </DialogHeader>
          {roleAction ? <div className="space-y-3">
            <Label htmlFor="marketplace-role">Role</Label>
            <Select value={role} onValueChange={(value) => setRole(value as MarketplaceAdminRole)} disabled={actionPending}>
              <SelectTrigger id="marketplace-role"><SelectValue /></SelectTrigger>
              <SelectContent>{MARKETPLACE_ADMIN_ROLES.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
            </Select>
            <Label htmlFor="marketplace-account">Target wallet address</Label>
            <Input id="marketplace-account" value={account} onChange={(event) => setAccount(event.target.value)} disabled={actionPending} />
          </div> : <div className="space-y-3">
            <Label htmlFor="marketplace-collection">Collection address</Label>
            <Input id="marketplace-collection" value={targetCollection} onChange={(event) => setTargetCollection(event.target.value)} disabled={actionPending} />
          </div>}
          {actionError && <p className="break-words text-sm text-destructive" role="alert">{actionError}</p>}
          <Button className="ui-btn ui-btn-pay" onClick={execute} disabled={actionPending}>
            {actionPending && <Loader2 className="h-4 w-4 animate-spin" />}{selected?.write ? "Confirm in wallet" : "Read contract"}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};