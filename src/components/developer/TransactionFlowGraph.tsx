import { useMemo } from "react";
import { buildFlowGraph, type FlowLeg } from "@/lib/transactionFlowGraph";
import { formatNumber, shortAddress } from "@/lib/onchainAnalytics";

const EXPLORER = "https://explorer.test.mezo.org";
const COL = 250, ROW = 96, PAD_X = 90, PAD_Y = 60, R = 18;

const fmtTime = (t?: string) => {
  const d = t ? new Date(t) : null;
  return d && Number.isFinite(d.getTime()) ? d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "";
};

export function TransactionFlowGraph({ legs, root, rootLabel = "Origin", note }: { legs: FlowLeg[]; root: string; rootLabel?: string; note?: string }) {
  const graph = useMemo(() => buildFlowGraph(legs, root), [legs, root]);
  if (!root || graph.edges.length === 0) return <p className="text-xs text-muted-foreground">No movements loaded to draw a flow graph.</p>;
  const minD = Math.min(...graph.nodes.map(n => n.depth));
  const maxD = Math.max(...graph.nodes.map(n => n.depth));
  const counts = new Map<number, number>();
  graph.nodes.forEach(n => counts.set(n.depth, Math.max(counts.get(n.depth) ?? 0, n.row + 1)));
  const tallest = Math.max(...counts.values());
  const height = PAD_Y * 2 + (tallest - 1) * ROW + 30;
  const width = PAD_X * 2 + (maxD - minD) * COL;
  const pos = new Map(graph.nodes.map(n => {
    const rowsInCol = counts.get(n.depth)!;
    const offset = ((tallest - rowsInCol) * ROW) / 2;
    return [n.id, { x: PAD_X + (n.depth - minD) * COL, y: PAD_Y + offset + n.row * ROW, node: n }];
  }));
  // separate parallel edges between the same pair
  const pairIndex = new Map<string, number>();

  return <div className="min-w-0 space-y-2">
    <div className="overflow-x-auto rounded-lg border border-border bg-background/60">
      <svg role="img" aria-label="Transaction flow graph" width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="block">
        <defs>
          <marker id="flow-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="hsl(var(--accent))" /></marker>
        </defs>
        {graph.edges.map(e => {
          const a = pos.get(e.from)!, b = pos.get(e.to)!;
          const pk = [e.from, e.to].sort().join("|");
          const i = pairIndex.get(pk) ?? 0; pairIndex.set(pk, i + 1);
          const self = e.from === e.to;
          const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1;
          const sx = a.x + (dx / len) * R, sy = a.y + (dy / len) * R, ex = b.x - (dx / len) * (R + 4), ey = b.y - (dy / len) * (R + 4);
          const bend = (i % 2 ? -1 : 1) * Math.ceil(i / 2) * 26 + (e.from > e.to && a.depth === b.depth ? 20 : 0);
          const mx = (sx + ex) / 2 - (dy / len) * bend, my = (sy + ey) / 2 + (dx / len) * bend;
          const d = self ? `M${a.x - 8},${a.y - R} C${a.x - 40},${a.y - 70} ${a.x + 40},${a.y - 70} ${a.x + 8},${a.y - R - 2}` : `M${sx},${sy} Q${mx},${my} ${ex},${ey}`;
          const lx = self ? a.x : (sx + 2 * mx + ex) / 4, ly = self ? a.y - 62 : (sy + 2 * my + ey) / 4;
          const label = `${e.amount === null ? "Unknown" : formatNumber(e.amount)} ${e.symbol}${e.count > 1 ? ` ×${e.count}` : ""}`;
          return <g key={e.id} className="flow-edge">
            <path d={d} fill="none" stroke="hsl(var(--accent) / 0.55)" strokeWidth={1.6} markerEnd="url(#flow-arrow)"><title>{`${e.from} → ${e.to}\n${label}`}</title></path>
            <text x={lx} y={ly - 4} textAnchor="middle" className="fill-foreground font-mono" fontSize={10}>{label}</text>
            {e.firstTime && <text x={lx} y={ly + 8} textAnchor="middle" className="fill-muted-foreground" fontSize={9}>{fmtTime(e.firstTime)}</text>}
          </g>;
        })}
        {[...pos.values()].map(({ x, y, node }) => <a key={node.id} href={`${EXPLORER}/address/${node.id}`} target="_blank" rel="noopener noreferrer">
          <title>{node.id}</title>
          {node.isRoot
            ? <polygon points={Array.from({ length: 10 }, (_, k) => { const rr = k % 2 ? R * 0.5 : R * 1.15; const ang = -Math.PI / 2 + (k * Math.PI) / 5; return `${x + rr * Math.cos(ang)},${y + rr * Math.sin(ang)}`; }).join(" ")} fill="hsl(var(--accent))" />
            : node.isContract
              ? <rect x={x - R} y={y - R} width={R * 2} height={R * 2} rx={6} fill="hsl(var(--foreground))" />
              : <circle cx={x} cy={y} r={R} fill="hsl(var(--primary))" />}
          {!node.isRoot && <text x={x} y={y + 4} textAnchor="middle" fontSize={11} fontWeight={700} fill="hsl(var(--background))">{node.isContract ? "C" : "W"}</text>}
          {node.isRoot && <><rect x={x - 34} y={y + R + 4} width={68} height={14} rx={3} fill="hsl(var(--accent) / 0.15)" /><text x={x} y={y + R + 14} textAnchor="middle" fontSize={9} fontWeight={600} className="fill-accent">{rootLabel}</text></>}
          <text x={x} y={y + R + (node.isRoot ? 30 : 16)} textAnchor="middle" fontSize={10} className="fill-foreground font-mono">{shortAddress(node.id)}</text>
        </a>)}
      </svg>
    </div>
    <div className="flex flex-wrap gap-4 text-[12px] text-muted-foreground">
      <span className="inline-flex items-center gap-1"><span className="h-3 w-3 bg-accent [clip-path:polygon(50%_0,61%_35%,98%_35%,68%_57%,79%_91%,50%_70%,21%_91%,32%_57%,2%_35%,39%_35%)]" />{rootLabel}</span>
      <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-primary" />Wallet / unknown</span>
      <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded-sm bg-foreground" />Contract</span>
      <span>Arrows show direction; labels show amount per asset and first time seen. Click a node to open it in the explorer.</span>
    </div>
    <p className="text-[12px] leading-relaxed text-muted-foreground">{note ?? "Drawn only from loaded records; amounts of different assets are never combined."}{graph.truncated ? " Graph limited to the first 40 addresses." : ""}</p>
  </div>;
}
