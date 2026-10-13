import { describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ signer: { getAddress: vi.fn().mockResolvedValue("wallet") }, balanceOf: vi.fn(), transfer: vi.fn(), send: vi.fn() }));
vi.mock("./tokenPayment", () => ({ getPaymentSigner: vi.fn(async () => mocks.signer), sendTokenPayment: mocks.send }));
vi.mock("ethers", () => ({ ethers: { Contract: vi.fn(function () { return { balanceOf: mocks.balanceOf, transfer: mocks.transfer }; }) } }));
import { MEZO_TOKEN_ADDRESS, payWithMEZO } from "./mezoPayment";

describe("MEZO payments", () => {
  it("pays the requested 0.2 MEZO only once and does not send a self-transfer reward", async () => {
    mocks.balanceOf.mockResolvedValue(1000000000000000000n);
    mocks.send.mockResolvedValue("0xconfirmed");
    mocks.send.mockClear();
    expect(await payWithMEZO(200000000000000000n)).toEqual({ stakeHash: "0xconfirmed" });
    expect(mocks.send).toHaveBeenCalledTimes(1);
    expect(mocks.send).toHaveBeenCalledWith(mocks.transfer, [MEZO_TOKEN_ADDRESS, 200000000000000000n]);
  });
  it("does not submit when the payment wallet lacks 0.2 MEZO", async () => {
    mocks.balanceOf.mockResolvedValue(199999999999999999n);
    mocks.send.mockClear();
    await expect(payWithMEZO(200000000000000000n)).rejects.toThrow("Insufficient MEZO balance");
    expect(mocks.send).not.toHaveBeenCalled();
  });
});