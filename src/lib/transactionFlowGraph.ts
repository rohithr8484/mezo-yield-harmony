/** Pure builder for transaction flow graphs. Edges are aggregated per sender, recipient and asset; amounts are never combined across assets. */
export interface FlowLeg { from: string; to: string; amount: number | null; symbol: string; asset: string; timestamp?: string; hash?: string; fromContract?: boolean; toContract?: boolean }
export interface FlowNode { id: string; depth: number; row: number; isRoot: boolean; isContract: boolean }
export interface FlowEdge { id: string; from: string; to: string; symbol: string; asset: string; count: number; amount: number | null; firstTime?: string; hashes: string[] }

export function buildFlowGraph(legs: FlowLeg[], root: string, maxNodes = 40) {
  const key = (a: string) => a.toLowerCase();
  const r = key(root);
  const edgeMap = new Map<string, FlowEdge>();
  const contracts = new Set<string>();
  for (const leg of legs) {
    if (!leg.from || !leg.to) continue;
    const f = key(leg.from), t = key(leg.to);
    if (leg.fromContract) contracts.add(f);
    if (leg.toContract) contracts.add(t);
    const id = `${f}>${t}>${leg.asset}`;
    const e = edgeMap.get(id) ?? { id, from: f, to: t, symbol: leg.symbol, asset: leg.asset, count: 0, amount: 0, hashes: [] };
    e.count++;
    e.amount = e.amount === null || leg.amount === null ? null : e.amount + leg.amount;
    if (leg.timestamp && (!e.firstTime || Date.parse(leg.timestamp) < Date.parse(e.firstTime))) e.firstTime = leg.timestamp;
    if (leg.hash && !e.hashes.includes(leg.hash)) e.hashes.push(leg.hash);
    edgeMap.set(id, e);
  }
  const edges = [...edgeMap.values()];
  const depth = new Map<string, number>([[r, 0]]);
  const walk = (forward: boolean) => {
    const queue = [r];
    while (queue.length) {
      const n = queue.shift()!;
      for (const e of edges) {
        const [src, dst] = forward ? [e.from, e.to] : [e.to, e.from];
        if (src === n && !depth.has(dst)) { depth.set(dst, depth.get(n)! + (forward ? 1 : -1)); queue.push(dst); }
      }
    }
  };
  walk(true); walk(false);
  const all = new Set(edges.flatMap(e => [e.from, e.to]));
  const maxDepth = Math.max(0, ...depth.values());
  for (const n of all) if (!depth.has(n)) depth.set(n, maxDepth + 1);
  const ids = [...depth.keys()].filter(n => n === r || all.has(n)).slice(0, maxNodes);
  const kept = new Set(ids);
  const rows = new Map<number, number>();
  const nodes: FlowNode[] = ids.map(id => {
    const d = depth.get(id)!;
    const row = rows.get(d) ?? 0;
    rows.set(d, row + 1);
    return { id, depth: d, row, isRoot: id === r, isContract: contracts.has(id) };
  });
  return { nodes, edges: edges.filter(e => kept.has(e.from) && kept.has(e.to)), truncated: kept.size < all.size + (all.has(r) ? 0 : 1) };
}
