import { describe, expect, it } from "vitest";
import { deriveAnalytics, deriveAnalyticsRiskScore, finiteNumber, type ExplorerTransaction } from "./onchainAnalytics";

const tx: ExplorerTransaction = { hash: "0x123", status: "ok", from: { hash: "0xA" }, to: { hash: "0xB", is_contract: true }, gas_used: "21000", gas_limit: "42000", fee: { value: "21000000000000" }, value: "1000000000000000000", raw_input: "0x12345678", decoded_input: { method_call: "swap(address,uint256)", parameters: [] } };

describe("observed transaction analytics", () => {
  it("scores observed concerns out of 100 using fixed disclosed weights", () => {
    const score = deriveAnalyticsRiskScore({ ...tx, status: "error", gas_limit: "21000", decoded_input: { method_call: "liquidate()" }, fee: { value: "100000000000000000" } }, [], { is_contract: true, is_verified: false });
    expect(score).toMatchObject({ score: 100, upperBound: 100, assessed: 5, total: 5 });
  });
  it("does not score missing data as a passed check", () => {
    expect(deriveAnalyticsRiskScore({ hash: "pending", status: null, to: { hash: "0xb" } }, [], null)).toMatchObject({ score: null, assessed: 0, upperBound: 100 });
    expect(deriveAnalyticsRiskScore({ ...tx, status: "error", gas_used: undefined, decoded_input: null, raw_input: undefined, fee: undefined }, [], null)).toMatchObject({ score: 30, assessed: 1, upperBound: 100 });
  });
  it("returns zero observed points only with explicit assessed coverage", () => {
    expect(deriveAnalyticsRiskScore(tx, [], { is_contract: true, is_verified: true })).toMatchObject({ score: 0, assessed: 5, upperBound: 0 });
  });
  it("calculates gas, input bytes and method hints from observations", () => {
    expect(deriveAnalytics(tx, [], null)).toMatchObject({ gasPct: 50, gasHeadroom: 21000, inputBytes: 4, liquidity: true, lending: false, effectiveGasPrice: 1, status: "Success" });
  });
  it("keeps same-symbol assets separate and detects sender direction", () => {
    const data = deriveAnalytics(tx, [
      { from: { hash: "0xa" }, to: { hash: "0xC" }, token: { address: "0x1", symbol: "MUSD" }, total: { value: "2000000", decimals: "6" } },
      { from: { hash: "0xC" }, to: { hash: "0xA" }, token: { address: "0x2", symbol: "MUSD" }, total: { value: "3000000", decimals: "6" } },
    ], null);
    expect(data.assets).toHaveLength(2);
    expect(data.assets[0]).toMatchObject({ volume: 2, outgoing: 2, incoming: 0 });
    expect(data.assets[1]).toMatchObject({ volume: 3, outgoing: 0, incoming: 3 });
    expect(data.participants).toBe(3);
  });
  it("does not invent zeros, decimals or pending failures", () => {
    const data = deriveAnalytics({ hash: "0x1", status: null }, [{ token: { symbol: "NFT" }, total: { value: "1" } }], null);
    expect(data.status).toBe("Pending");
    expect(data.gasPct).toBeNull();
    expect(data.risks).toEqual([]);
    expect(data.assets[0].known).toBe(false);
    expect(finiteNumber(undefined)).toBeNull();
  });
  it("flags observed failure and unverified contract without a safety score", () => {
    const data = deriveAnalytics({ ...tx, status: "error", gas_limit: "21000" }, [], { is_contract: true, is_verified: false });
    expect(data.risks).toHaveLength(3);
  });
  it("labels generic deposit as method inference only", () => {
    expect(deriveAnalytics({ ...tx, decoded_input: { method_call: "deposit()" } }, [], null).lending).toBe(true);
  });
});