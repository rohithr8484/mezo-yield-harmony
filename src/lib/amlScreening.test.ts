import { describe, expect, it } from "vitest";
import { assessAMLBehavior, assessStructuringRisk, deriveAMLPayments, derivePaymentScreening, deriveAMLScreeningScore } from "./amlScreening";

describe("AML wallet observations", () => {
  const leg = (hash: string, from: string, to: string, minute: number, asset = "token", value = "2") => ({ transaction_hash: hash, from: { hash: from }, to: { hash: to }, timestamp: new Date(Date.UTC(2026, 0, 1, 0, minute)).toISOString(), token: { address_hash: asset, decimals: "0" }, total: { value } });
  const assess = (legs: ReturnType<typeof leg>[]) => assessAMLBehavior(deriveAMLPayments("0xa", [], legs), "0xa");
  const structure = (legs: ReturnType<typeof leg>[]) => assessStructuringRisk(deriveAMLPayments("0xa", [], legs), "0xa");
  it("scores observed AML pass-through at 65 of 100 with every check assessed", () => {
    expect(deriveAMLScreeningScore(deriveAMLPayments("0xa", [], [leg("in", "0xb", "0xa", 0), leg("out", "0xa", "0xc", 1)]), "0xa")).toMatchObject({ score: 65, assessed: 4, total: 4, upperBound: 100 });
  });
  it("assesses a single round-figure outgoing payment on the structuring check alone", () => {
    expect(deriveAMLScreeningScore(deriveAMLPayments("0xa", [], [leg("one", "0xa", "0xb", 0)]), "0xa")).toMatchObject({ score: 40, assessed: 1, total: 4, upperBound: 40 });
    expect(deriveAMLScreeningScore(deriveAMLPayments("0xa", [], [leg("one", "0xa", "0xb", 0), leg("two", "0xb", "0xa", 1, "other")]), "0xa")).toMatchObject({ score: 40, assessed: 1, total: 4, upperBound: 40 });
  });
  it("establishes a single-transaction structuring review without the six-payment minimum", () => {
    const result = structure([leg("one", "0xa", "0xb", 0)]);
    expect(result.status).toBe("Review pattern");
    expect(result.hashes).toEqual(["one"]);
    expect(result.evidence).toContain("Single outgoing");
    expect(result.evidence).not.toMatch(/at least 6/);
  });
  it("uses deterministic ML clusters to flag repeated same-asset outgoing bursts", () => {
    const legs = [0, 1, 2, 180, 360, 540].map((minute, i) => leg(`tx${i}`, "0xa", i % 2 ? "0xb" : "0xc", minute));
    const result = structure(legs);
    expect(result.status).toBe("Review pattern");
    expect(result.hashes).toEqual(["tx0", "tx1", "tx2"]);
    expect(structure([...legs].reverse())).toEqual(result);
  });
  it("flags a two-payment similar-amount interval without clustering", () => {
    const result = structure([leg("p1", "0xa", "0xb", 0), leg("p2", "0xa", "0xc", 30)]);
    expect(result.status).toBe("Review pattern");
    expect(result.hashes).toEqual(["p1", "p2"]);
    expect(structure([leg("p1", "0xa", "0xb", 0), leg("p2", "0xa", "0xc", 61)])).toMatchObject({ status: "No cluster flagged", assessedAssets: 1 });
  });
  it("does not combine different assets or duplicate logs as distinct payments", () => {
    expect(structure(Array.from({ length: 6 }, (_, i) => leg("same", "0xa", "0xb", i))).hashes).toEqual(["same"]);
    const spread = structure(Array.from({ length: 6 }, (_, i) => leg(`tx${i}`, "0xa", "0xb", i, `asset${i}`, "123457")));
    expect(spread.status).toBe("No cluster flagged");
    expect(spread.assessedAssets).toBe(6);
  });
  it("reports no flag for spaced activity without claiming low risk", () => {
    const result = structure(Array.from({ length: 6 }, (_, i) => leg(`tx${i}`, "0xa", i % 2 ? "0xb" : "0xc", i * 120)));
    expect(result.status).toBe("No cluster flagged");
    expect(result.hashes).toEqual([]);
    expect(result.assessedAssets).toBe(1);
  });
  it("does not infer structuring from missing timestamps or inbound receipts", () => {
    expect(structure(Array.from({ length: 6 }, (_, i) => ({ ...leg(`tx${i}`, "0xa", "0xb", i), timestamp: "" }))).status).toBe("No cluster flagged · limited sample");
    expect(structure(Array.from({ length: 6 }, (_, i) => leg(`tx${i}`, "0xb", "0xa", i))).status).toBe("No cluster flagged · limited sample");
  });
  it("observes equal same-asset pass-through within 60 minutes", () => {
    expect(assess([leg("in", "0xb", "0xa", 0), leg("out", "0xa", "0xc", 60)])[1].status).toBe("Pattern observed");
    expect(assess([leg("in", "0xb", "0xa", 0), leg("out", "0xa", "0xc", 61)])[1].status).toBe("No matching pattern in sample");
  });
  it("never matches pass-through across assets or in the same transaction", () => {
    expect(assess([leg("in", "0xb", "0xa", 0), leg("out", "0xa", "0xc", 1, "other")])[1].status).not.toBe("Pattern observed");
    expect(assess([leg("same", "0xb", "0xa", 0), leg("same", "0xa", "0xc", 0)])[1].status).not.toBe("Pattern observed");
  });
  it("observes a same-counterparty equal-amount round trip", () => {
    expect(assess([leg("out", "0xa", "0xb", 0), leg("in", "0xb", "0xa", 1)])[4].status).toBe("Pattern observed");
    expect(assess([leg("out", "0xa", "0xb", 0), leg("in", "0xc", "0xa", 1)])[4].status).not.toBe("Pattern observed");
  });
  it("observes mint receipt followed by same-asset outgoing activity", () => {
    expect(assess([leg("mint", "0x0000000000000000000000000000000000000000", "0xa", 0), leg("out", "0xa", "0xb", 1)])[5].status).toBe("Pattern observed");
  });
  it("keeps unavailable label and reporting checks undetermined", () => {
    const rows = assess([]);
    expect([rows[0].status, rows[2].status, rows[3].status]).toEqual(["No cluster flagged · limited sample", "Cannot determine", "Cannot determine"]);
    expect(rows[1].status).toBe("No matching pattern · limited sample");
  });
  it("graphs only successful native movements involving the selected wallet", () => {
    const data = derivePaymentScreening("0xA", [
      { hash: "out", status: "ok", from: { hash: "0xa" }, to: { hash: "0xb" }, value: "1000000000000000000" },
      { hash: "in", status: "ok", from: { hash: "0xb" }, to: { hash: "0xA" }, value: "2000000000000000000" },
      { hash: "failed", status: "error", from: { hash: "0xa" }, to: { hash: "0xc" }, value: "9000000000000000000" },
      { hash: "pending", status: null, from: { hash: "0xa" }, to: { hash: "0xc" }, value: "9000000000000000000" },
      { hash: "call", status: "ok", from: { hash: "0xa" }, to: { hash: "0xc" }, value: "0" },
    ]);
    expect(data.flows.map(flow => flow.hash)).toEqual(["out", "in"]);
    expect(data).toMatchObject({ nativeOut: 1, nativeIn: 2, failed: 1, pending: 1, counterparties: 2, bidirectional: true });
  });
  it("does not turn missing amounts into zero or claim screening", () => {
    const data = derivePaymentScreening("0xa", [{ hash: "unknown", status: "ok", from: { hash: "0xa" }, to: { hash: "0xb" } }]);
    expect(data.nativeOut).toBeNull();
    expect(data.flows).toEqual([]);
  });
  it("includes token payment legs without combining different assets", () => {
    const data = deriveAMLPayments("0xa", [{ hash: "tx", status: "ok", value: "0", from: { hash: "0xa" }, to: { hash: "0xb" } }], [
      { transaction_hash: "tx", from: { hash: "0xb", is_contract: true }, to: { hash: "0xa" }, token: { address_hash: "musd", symbol: "MUSD", decimals: "18" }, total: { value: "500000000000000" } },
      { transaction_hash: "tx", from: { hash: "0xa" }, to: { hash: "0xb" }, token: { address_hash: "other", symbol: "MUSD", decimals: "18" }, total: { value: "1000000000000000000" } },
    ]);
    expect(data.flows).toHaveLength(2);
    expect(data.flows[0]).toMatchObject({ amount: 0.0005, fromContract: true });
    expect(data.assets).toHaveLength(2);
    expect(data.hourlyRate).toBeNull();
  });
  it("excludes failed token transfers and preserves unknown quantities", () => {
    const data = deriveAMLPayments("0xa", [{ hash: "bad", status: "error" }], [
      { transaction_hash: "bad", from: { hash: "0xa" }, to: { hash: "0xb" } },
      { transaction_hash: "good", from: { hash: "0xa" }, to: { hash: "0xb" }, token: { address_hash: "musd", symbol: "MUSD" } },
    ]);
    expect(data.flows).toHaveLength(1);
    expect(data.assets[0].known).toBe(false);
    expect(data.flows[0].amount).toBeNull();
  });
});
