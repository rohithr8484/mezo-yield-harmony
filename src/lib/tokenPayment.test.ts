import { describe, expect, it, vi } from "vitest";
import { confirmPaymentTransaction, getTokenPaymentError, sendTokenPayment } from "./tokenPayment";
import type { ethers } from "ethers";

describe("token payment confirmations", () => {
  it("returns the confirmed hash when wallet confirmation fails after a successful broadcast", async () => {
    const wait = vi.fn().mockRejectedValue(new Error("RPC disconnected"));
    const read = vi.fn().mockResolvedValue({ status: 1, hash: "0xconfirmed" });
    expect(await confirmPaymentTransaction({ hash: "0xconfirmed", wait }, read)).toBe("0xconfirmed");
    expect(read).toHaveBeenCalledWith("0xconfirmed");
  });
  it("never accepts a failed receipt", async () => {
    await expect(confirmPaymentTransaction({ hash: "0xfailed", wait: async () => ({ status: 0, hash: "0xfailed" }) })).rejects.toThrow("reverted");
  });
  it("does not unlock or encourage a retry when a broadcast has no receipt", async () => {
    await expect(confirmPaymentTransaction({ hash: "0xpending", wait: async () => { throw new Error("offline"); } }, async () => null)).rejects.toThrow("before paying again");
  });
  it("adds gas headroom and sends exactly one transaction after simulation", async () => {
    const method = Object.assign(vi.fn().mockResolvedValue({ hash: "0xpaid", wait: async () => ({ status: 1, hash: "0xpaid" }) }), {
      staticCall: vi.fn().mockResolvedValue(true), estimateGas: vi.fn().mockResolvedValue(25348n),
    });
    expect(await sendTokenPayment(method as unknown as ethers.BaseContractMethod, ["recipient", 200000000000000000n])).toBe("0xpaid");
    expect(method).toHaveBeenCalledTimes(1);
    expect(method).toHaveBeenCalledWith("recipient", 200000000000000000n, { gasLimit: 32953n });
  });
  it("never submits a transfer when the token simulation returns false", async () => {
    const method = Object.assign(vi.fn(), { staticCall: vi.fn().mockResolvedValue(false) });
    await expect(sendTokenPayment(method as unknown as ethers.BaseContractMethod, [])).rejects.toThrow("No transfer was submitted");
    expect(method).not.toHaveBeenCalled();
  });
  it("distinguishes gas shortages from nested wallet cancellations", () => {
    expect(getTokenPaymentError({ info: { error: { code: 4001 } } })).toBe("Payment cancelled in your wallet.");
    expect(getTokenPaymentError({ code: "INSUFFICIENT_FUNDS" })).toContain("test BTC");
  });
});