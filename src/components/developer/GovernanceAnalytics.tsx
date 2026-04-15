import { Vote, BarChart3, Users, FileText } from "lucide-react";

const mockProposals = [
  { id: "MIP-001", title: "Increase Staking Rewards Cap", status: "Passed", votesFor: 1245000, votesAgainst: 312000, participation: 78.3 },
  { id: "MIP-002", title: "Bridge Fee Reduction to 0.1%", status: "Passed", votesFor: 987000, votesAgainst: 156000, participation: 65.1 },
  { id: "MIP-003", title: "Add cbBTC Collateral Support", status: "Active", votesFor: 543000, votesAgainst: 234000, participation: 42.8 },
  { id: "MIP-004", title: "Treasury Diversification Plan", status: "Active", votesFor: 321000, votesAgainst: 198000, participation: 31.2 },
  { id: "MIP-005", title: "Reduce Governance Quorum to 15%", status: "Failed", votesFor: 189000, votesAgainst: 567000, participation: 52.6 },
];

const formatVotes = (n: number) => (n >= 1000000 ? `${(n / 1000000).toFixed(1)}M` : `${(n / 1000).toFixed(0)}K`);

export const GovernanceAnalytics = () => {
  const totalProposals = mockProposals.length;
  const passed = mockProposals.filter((p) => p.status === "Passed").length;
  const avgParticipation = (mockProposals.reduce((s, p) => s + p.participation, 0) / totalProposals).toFixed(1);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border border-border p-4 text-center">
          <FileText className="h-6 w-6 mx-auto text-primary mb-2" />
          <p className="text-2xl font-bold font-mono text-foreground">{totalProposals}</p>
          <p className="text-xs text-muted-foreground">Total Proposals</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 text-center">
          <Vote className="h-6 w-6 mx-auto text-green-500 mb-2" />
          <p className="text-2xl font-bold font-mono text-foreground">{passed}</p>
          <p className="text-xs text-muted-foreground">Passed</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 text-center">
          <Users className="h-6 w-6 mx-auto text-amber-500 mb-2" />
          <p className="text-2xl font-bold font-mono text-foreground">{avgParticipation}%</p>
          <p className="text-xs text-muted-foreground">Avg Participation</p>
        </div>
      </div>

      <div className="space-y-3">
        {mockProposals.map((p) => {
          const total = p.votesFor + p.votesAgainst;
          const forPct = (p.votesFor / total) * 100;
          return (
            <div key={p.id} className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-primary font-bold">{p.id}</span>
                  <span className="text-sm font-semibold text-foreground">{p.title}</span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                  p.status === "Passed" ? "bg-green-500/10 text-green-500" :
                  p.status === "Active" ? "bg-blue-500/10 text-blue-500" :
                  "bg-red-500/10 text-red-500"
                }`}>
                  {p.status}
                </span>
              </div>
              <div className="w-full h-2 bg-secondary rounded-full overflow-hidden mb-2">
                <div className="h-full bg-green-500 rounded-full" style={{ width: `${forPct}%` }} />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>For: {formatVotes(p.votesFor)} ({forPct.toFixed(1)}%)</span>
                <span>Against: {formatVotes(p.votesAgainst)} ({(100 - forPct).toFixed(1)}%)</span>
                <span>Participation: {p.participation}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
