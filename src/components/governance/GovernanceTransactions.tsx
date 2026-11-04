import { getAnchor } from "@/lib/governanceAnchor";

export default function GovernanceTransactions({ proposalId }: { proposalId: string }) {
  const anchor = getAnchor(proposalId);
  if (!anchor) return null;
  const transactions = [
    ...(anchor.anchorTx ? [{ hash: anchor.anchorTx, method: "anchorProposal", detail: "Proposal" }] : []),
    ...(anchor.voteTransactions ?? []).map((vote) => ({ hash: vote.hash, method: "vote", detail: vote.choice })),
    ...(anchor.finalizeTx ? [{ hash: anchor.finalizeTx, method: "finalize", detail: "Results" }] : []),
  ];
  if (!transactions.length) return null;
  return (
    <section className="border-t border-border pt-4 space-y-3" aria-label="Governance transactions">
      <h4 className="text-sm font-semibold text-foreground">Governance transactions</h4>
      {transactions.map((transaction) => (
        <div key={transaction.hash} className="space-y-1 text-xs">
          <p className="text-muted-foreground">Status: <span className="text-foreground">Confirmed on-chain</span></p>
          <p className="text-muted-foreground">Method: <span className="font-mono text-foreground">{transaction.method}</span> · {transaction.detail}</p>
          <a href={`https://explorer.test.mezo.org/tx/${transaction.hash}`} target="_blank" rel="noreferrer" className="block break-all text-primary underline">
            {transaction.hash}
          </a>
        </div>
      ))}
    </section>
  );
}