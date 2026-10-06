import { useState } from "react";
import { createPublicClient, http, formatUnits } from "viem";
import { mezoTestnet } from "@/lib/mezo";
import { Terminal, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const GOV_HELPER = "0xE58329AE4803E2aa9594912066A5cB087C68f88c" as const;
const VOTE_HELPER = "0xD0AEc8C123add8aFBf64bdB58cB1adc6CC3f9D15" as const;

const client = createPublicClient({ chain: mezoTestnet, transport: http() });

const summary = {
  type: "tuple[]",
  components: [
    { name: "id", type: "uint256" },
    { name: "proposer", type: "address" },
    { name: "title", type: "string" },
    { name: "category", type: "string" },
    { name: "forVotes", type: "uint256" },
    { name: "againstVotes", type: "uint256" },
    { name: "abstainVotes", type: "uint256" },
    { name: "state", type: "uint8" },
  ],
} as const;

const GOV_ABI = [
  { name: "getProposalsBatch", type: "function", stateMutability: "view", inputs: [{ name: "ids", type: "uint256[]" }], outputs: [{ name: "list", ...summary }] },
  { name: "getProposalsRange", type: "function", stateMutability: "view", inputs: [{ name: "from", type: "uint256" }, { name: "to", type: "uint256" }], outputs: [{ name: "list", ...summary }] },
] as const;

const VOTE_ABI = [
  {
    name: "getTurnout", type: "function", stateMutability: "view", inputs: [{ name: "proposalId", type: "uint256" }],
    outputs: [{ name: "t", type: "tuple", components: [
      { name: "proposalId", type: "uint256" }, { name: "forVotes", type: "uint256" }, { name: "againstVotes", type: "uint256" },
      { name: "abstainVotes", type: "uint256" }, { name: "totalVotes", type: "uint256" }, { name: "forShareBps", type: "uint256" },
      { name: "againstShareBps", type: "uint256" }, { name: "abstainShareBps", type: "uint256" },
    ] }],
  },
  {
    name: "getReceiptsBatch", type: "function", stateMutability: "view",
    inputs: [{ name: "proposalId", type: "uint256" }, { name: "voters", type: "address[]" }],
    outputs: [{ name: "list", type: "tuple[]", components: [
      { name: "voter", type: "address" }, { name: "hasVoted", type: "bool" }, { name: "voteType", type: "uint8" }, { name: "votes", type: "uint256" },
    ] }],
  },
  { name: "getMUSDBalance", type: "function", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "uint256" }] },
] as const;

const fmt = (v: unknown) => JSON.stringify(v, (_k, x) => (typeof x === "bigint" ? x.toString() : x), 2);
const proposalId = (s: string) => {
  if (!/^\d+$/.test(s.trim())) throw new Error("Enter a non-negative numeric on-chain proposal ID.");
  const value = BigInt(s.trim());
  if (value >= 2n ** 256n) throw new Error("Proposal ID is too large.");
  return value;
};
const ids = (s: string) => {
  if (!s.trim()) throw new Error("Enter at least one on-chain proposal ID.");
  return s.split(",").map(proposalId);
};

export const ContractLogs = () => {
  const [idList, setIdList] = useState("1,2");
  const [from, setFrom] = useState("1");
  const [to, setTo] = useState("3");
  const [pid, setPid] = useState("1");
  const [voters, setVoters] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [log, setLog] = useState<{ fn: string; status: "success" | "empty" | "error"; out: string; ts: string }[]>([]);

  const run = async (fn: string, call: () => Promise<unknown>) => {
    setBusy(fn);
    try {
      const out = await call();
      setLog((l) => [{ fn, status: "success", out: fmt(out), ts: new Date().toLocaleTimeString() }, ...l]);
    } catch (e: unknown) {
      const error = e instanceof Error ? e : new Error(String(e));
      const shortMessage = "shortMessage" in error && typeof error.shortMessage === "string" ? error.shortMessage : error.message;
      const missingProposal = (fn === "getProposalsBatch" || fn === "getProposalsRange") && /Invalid proposal/i.test(error.message);
      const requested = fn === "getProposalsBatch" ? idList : `${from}–${to}`;
      const out = missingProposal
        ? `No results: one or more requested on-chain proposal IDs (${requested}) do not exist. The helper returns no data when any ID is missing. App proposals and JavaScript votes are not stored in this contract. Create a proposal in the linked governance contract, then use its on-chain ID here.`
        : shortMessage;
      setLog((l) => [{ fn, status: missingProposal ? "empty" : "error", out, ts: new Date().toLocaleTimeString() }, ...l]);
    } finally {
      setBusy(null);
    }
  };

  const input = "h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground";
  const btn = "inline-flex h-9 items-center gap-2 rounded-md border border-primary/30 bg-primary/10 px-3 font-mono text-xs font-semibold text-primary transition-colors hover:bg-primary/20 disabled:opacity-50";
  const B = ({ fn, onClick }: { fn: string; onClick: () => void }) => (
    <Button variant="outline" size="sm" className={btn} disabled={!!busy} onClick={onClick}>
      {busy === fn && <Loader2 className="h-3 w-3 animate-spin" />}{fn}()
    </Button>
  );

  return (
    <div className="mx-auto mt-8 max-w-4xl rounded-lg border border-border bg-card text-left shadow-card">
      <div className="ops-panel-title">
        <span className="flex items-center gap-2 text-sm font-semibold text-foreground"><Terminal className="h-4 w-4 text-accent" /> Contract logs</span>
        <span className="text-xs text-muted-foreground">Read-only · Mezo Testnet</span>
      </div>
      <div className="grid gap-4 p-5 md:grid-cols-2">
        <div className="space-y-3">
          <p className="text-xs font-bold uppercase text-accent">GovernanceDataHelper</p>
          <p className="break-all font-mono text-[11px] text-muted-foreground">{GOV_HELPER}</p>
          <div className="flex flex-wrap gap-2">
            <input aria-label="On-chain proposal IDs" className={`${input} w-28`} value={idList} onChange={(e) => setIdList(e.target.value)} placeholder="ids 1,2" />
            <B fn="getProposalsBatch" onClick={() => run("getProposalsBatch", () => client.readContract({ address: GOV_HELPER, abi: GOV_ABI, functionName: "getProposalsBatch", args: [ids(idList)] }))} />
          </div>
          <div className="flex flex-wrap gap-2">
            <input aria-label="First on-chain proposal ID" className={`${input} w-14`} value={from} onChange={(e) => setFrom(e.target.value)} />
            <input aria-label="Last on-chain proposal ID" className={`${input} w-14`} value={to} onChange={(e) => setTo(e.target.value)} />
            <B fn="getProposalsRange" onClick={() => run("getProposalsRange", () => {
              const start = proposalId(from);
              const end = proposalId(to);
              if (end < start) throw new Error("Last proposal ID must be greater than or equal to the first.");
              return client.readContract({ address: GOV_HELPER, abi: GOV_ABI, functionName: "getProposalsRange", args: [start, end] });
            })} />
          </div>
        </div>
        <div className="space-y-3">
          <p className="text-xs font-bold uppercase text-accent">VotingDataHelper</p>
          <p className="break-all font-mono text-[11px] text-muted-foreground">{VOTE_HELPER}</p>
          <div className="flex flex-wrap gap-2">
            <input className={`${input} w-14`} value={pid} onChange={(e) => setPid(e.target.value)} placeholder="id" />
            <B fn="getTurnout" onClick={() => run("getTurnout", () => client.readContract({ address: VOTE_HELPER, abi: VOTE_ABI, functionName: "getTurnout", args: [BigInt(pid || 0)] }))} />
          </div>
          <div className="flex flex-wrap gap-2">
            <input className={`${input} min-w-0 flex-1`} value={voters} onChange={(e) => setVoters(e.target.value)} placeholder="voter 0x…, 0x…" />
            <B fn="getReceiptsBatch" onClick={() => run("getReceiptsBatch", () => client.readContract({ address: VOTE_HELPER, abi: VOTE_ABI, functionName: "getReceiptsBatch", args: [BigInt(pid || 0), voters.split(",").map((v) => v.trim()).filter(Boolean) as `0x${string}`[]] }))} />
          </div>
          <B fn="getMUSDBalance" onClick={() => run("getMUSDBalance", async () => `${formatUnits(await client.readContract({ address: VOTE_HELPER, abi: VOTE_ABI, functionName: "getMUSDBalance" }), 18)} MUSD`)} />
        </div>
      </div>
      <div className="max-h-72 overflow-auto border-t border-border/70 bg-secondary/25 p-4">
        {log.length === 0 ? (
          <p className="text-xs text-muted-foreground">Click a function to see its result here.</p>
        ) : log.map((l, i) => (
          <div key={i} className="mb-3 last:mb-0">
            <p className={`font-mono text-xs font-semibold ${l.status === "success" ? "text-primary" : l.status === "empty" ? "text-muted-foreground" : "text-destructive"}`}>[{l.ts}] {l.fn}() {l.status === "success" ? "✓" : l.status === "empty" ? "— No results" : "✕"}</p>
            <pre className="mt-1 whitespace-pre-wrap break-all font-mono text-[11px] text-foreground">{l.out}</pre>
          </div>
        ))}
      </div>
    </div>
  );
};
