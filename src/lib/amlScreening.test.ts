import { describe, expect, it } from "vitest";
import { deriveAMLPayments, derivePaymentScreening } from "./amlScreening";

describe("AML wallet observations", () => {
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