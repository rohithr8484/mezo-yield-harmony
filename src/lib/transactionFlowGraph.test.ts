import { describe, it, expect } from "vitest";
import { buildFlowGraph } from "./transactionFlowGraph";

const A = "0xAAA", B = "0xbbb", C = "0xccc", D = "0xddd";
describe("buildFlowGraph", () => {
  it("places root at depth 0, recipients after it and senders before it", () => {
    const g = buildFlowGraph([
      { from: D, to: A, amount: 5, symbol: "MUSD", asset: "m" },
      { from: A, to: B, amount: 2, symbol: "MUSD", asset: "m" },
      { from: B, to: C, amount: 1, symbol: "MUSD", asset: "m" },
    ], A);
    const d = Object.fromEntries(g.nodes.map(n => [n.id, n.depth]));
    expect(d).toEqual({ "0xaaa": 0, "0xbbb": 1, "0xccc": 2, "0xddd": -1 });
  });
  it("aggregates repeated legs but keeps assets separate", () => {
    const g = buildFlowGraph([
      { from: A, to: B, amount: 1, symbol: "MUSD", asset: "m" },
      { from: A, to: B, amount: 2, symbol: "MUSD", asset: "m" },
      { from: A, to: B, amount: 7, symbol: "BTC", asset: "btc" },
    ], A);
    expect(g.edges).toHaveLength(2);
    expect(g.edges.find(e => e.asset === "m")).toMatchObject({ count: 2, amount: 3 });
    expect(g.edges.find(e => e.asset === "btc")).toMatchObject({ count: 1, amount: 7 });
  });
  it("keeps unknown amounts unknown instead of zero", () => {
    const g = buildFlowGraph([{ from: A, to: B, amount: null, symbol: "X", asset: "x" }, { from: A, to: B, amount: 4, symbol: "X", asset: "x" }], A);
    expect(g.edges[0].amount).toBeNull();
  });
});
