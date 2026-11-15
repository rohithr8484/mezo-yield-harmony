import { describe, expect, it } from "vitest";
import { decodeSnapshot, isSnapshotStale, readOracleHistory } from "./pythHistory";

const raw = { price: 100270118n, conf: 1046118n, expo: -8n, publishTime: 100000n };
const block = { number: 200000, timestamp: 200000 };
describe("real Pyth chart observations", () => {
  it("decodes actual oracle price, confidence and publication time", () => {
    expect(decodeSnapshot(block, raw)).toEqual({ blockNumber: 200000, observedTime: 200000, publishTime: 100000, price: 1.00270118, confidence: 0.01046118 });
    expect(decodeSnapshot(block, { ...raw, price: 12n, expo: 2n }).price).toBe(1200);
  });
  it("marks stored prices older than the 3600 second freshness limit stale", () => {
    const point = decodeSnapshot(block, raw);
    expect(isSnapshotStale(point, 103600)).toBe(false);
    expect(isSnapshotStale(point, 103601)).toBe(true);
  });
  it("reads the requested feed at historical blocks without fabricating movement", async () => {
    const calls: number[] = [];
    const history = await readOracleHistory("real-feed-id", {
      getBlock: async (tag) => ({ number: tag === "latest" ? 200000 : tag, timestamp: tag === "latest" ? 200000 : tag }),
      getPrice: async (id, number) => { expect(id).toBe("real-feed-id"); calls.push(number); return raw; },
    });
    expect(history.points).toHaveLength(13);
    expect(calls).toContain(113600);
    expect(calls).toContain(200000);
    expect(new Set(history.points.map((p) => p.price)).size).toBe(1);
    expect(history.unavailable).toBe(0);
  });
  it("omits unavailable archive data rather than replacing it", async () => {
    const history = await readOracleHistory("feed", {
      getBlock: async (tag) => ({ number: tag === "latest" ? 200000 : tag, timestamp: tag === "latest" ? 200000 : tag }),
      getPrice: async (_, number) => { if (number !== 200000) throw new Error("archive unavailable"); return raw; },
    });
    expect(history.points).toHaveLength(1);
    expect(history.unavailable).toBe(12);
    expect(history.points[0].blockNumber).toBe(200000);
  });
  it("rejects missing or invalid feed observations", async () => {
    expect(() => decodeSnapshot(block, { ...raw, publishTime: 0n })).toThrow();
    await expect(readOracleHistory("missing", {
      getBlock: async () => block,
      getPrice: async () => { throw new Error("feed missing"); },
    })).rejects.toThrow("No readable oracle prices");
  });
});