import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  user: "0x9A220b677234BB18273aC031bE6CA405a950cA2e",
  contract: vi.fn(),
  signer: vi.fn(),
  send: vi.fn(),
  approve: vi.fn(),
  allowance: vi.fn(),
  balanceOf: vi.fn(),
  fundMarket2: vi.fn(),
  adminWithdraw: vi.fn(),
}));

vi.mock("ethers", async (original) => {
  const actual = await original<typeof import("ethers")>();
  return { ...actual, ethers: { ...actual.ethers, Contract: mocks.contract } };
});
vi.mock("./tokenPayment", () => ({
  getPaymentSigner: mocks.signer,
  sendTokenPayment: mocks.send,
  getTokenPaymentError: (error: unknown) => String(error),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), warning: vi.fn() } }));

import { payWithMUSD } from "./musdPayment";

describe("regular MUSD payment token", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.signer.mockResolvedValue({ getAddress: async () => mocks.user });
    mocks.balanceOf.mockResolvedValue(1000000000000000000n);
    mocks.allowance.mockResolvedValue(0n);
    mocks.send.mockResolvedValue("0xconfirmed");
    mocks.contract.mockImplementation(function (address: string) {
      if (address === "0xD88b46ef8444dAA8aa493d714b1124DE75CCa067") {
        return { approve: mocks.approve, allowance: mocks.allowance, balanceOf: mocks.balanceOf };
      }
      if (address === "0x21f7C9fdA5ED418AF3a1C7593dec52142350A0F7") {
        return { fundMarket2: mocks.fundMarket2, adminWithdraw: mocks.adminWithdraw };
      }
      throw new Error(`Unexpected token: ${address}`);
    });
  });

  it("checks and approves 0xD88b MUSD for the platform, never the x402 token", async () => {
    const amount = 200000000000000000n;
    await payWithMUSD(amount);
    expect(mocks.contract.mock.calls.map(([address]) => address)).toEqual([
      "0xD88b46ef8444dAA8aa493d714b1124DE75CCa067",
      "0x21f7C9fdA5ED418AF3a1C7593dec52142350A0F7",
    ]);
    expect(mocks.allowance).toHaveBeenCalledWith(mocks.user, "0x21f7C9fdA5ED418AF3a1C7593dec52142350A0F7");
    expect(mocks.send).toHaveBeenNthCalledWith(1, mocks.approve, ["0x21f7C9fdA5ED418AF3a1C7593dec52142350A0F7", amount]);
    expect(mocks.send).toHaveBeenNthCalledWith(2, mocks.fundMarket2, [amount]);
  });
});