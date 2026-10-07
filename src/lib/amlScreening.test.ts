import { describe, expect, it } from "vitest";
import { derivePaymentScreening } from "./amlScreening";

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
});