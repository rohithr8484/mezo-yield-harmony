import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ contract: vi.fn(), signer: vi.fn(), send: vi.fn(), decimals: vi.fn(), balance: vi.fn(), transfer: vi.fn(), withdraw: vi.fn() }));
vi.mock("ethers", async (original) => {
  const actual = await original<typeof import("ethers")>();
  return { ...actual, ethers: { ...actual.ethers, Contract: mocks.contract } };
});
vi.mock("./tokenPayment", () => ({ getPaymentSigner: mocks.signer, sendTokenPayment: mocks.send, getTokenPaymentError: (error: Error) => error.message }));
import { payHomepageNew } from "./homepageNewPayment";

describe("standalone homepage reference payment", () => {
  const provider = { request: vi.fn() };
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.signer.mockResolvedValue({ getAddress: async () => "0xuser" });
    mocks.decimals.mockResolvedValue(18n);
    mocks.balance.mockResolvedValue(20000000000000n);
    mocks.contract.mockImplementation(function (address: string) {
      if (address === "0x21f7C9fdA5ED418AF3a1C7593dec52142350A0F7") return { musdToken: async () => "0xD88b46ef8444dAA8aa493d714b1124DE75CCa067", adminWithdraw: mocks.withdraw };
      return { decimals: mocks.decimals, balanceOf: mocks.balance, transfer: mocks.transfer };
    });
    mocks.send.mockResolvedValue("0xconfirmed");
  });
  it("uses only the specified test MUSD token and connected wallet", async () => {
    await payHomepageNew(provider);
    expect(mocks.signer).toHaveBeenCalledWith(provider);
    expect(mocks.contract.mock.calls.map(([address]) => address)).toEqual(["0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503", "0x21f7C9fdA5ED418AF3a1C7593dec52142350A0F7"]);
  });
  it("transfers exactly 0.00002 MUSD and returns its confirmed receipt", async () => {
    expect((await payHomepageNew(provider)).paymentHash).toBe("0xconfirmed");
    expect(mocks.send).toHaveBeenNthCalledWith(1, mocks.transfer, ["0x21f7C9fdA5ED418AF3a1C7593dec52142350A0F7", 20000000000000n]);
  });
  it("requests exactly 0.00001 contract MUSD only after payment confirmation", async () => {
    const confirmed = vi.fn(() => expect(mocks.send).toHaveBeenCalledTimes(1));
    const result = await payHomepageNew(provider, confirmed);
    expect(confirmed).toHaveBeenCalledWith("0xconfirmed");
    expect(mocks.send).toHaveBeenNthCalledWith(2, mocks.withdraw, ["0xuser", 10000000000000n]);
    expect(result.rewardHash).toBe("0xconfirmed");
  });
  it("preserves payment and never resends when reward authorization fails", async () => {
    mocks.send.mockResolvedValueOnce("0xpaid").mockRejectedValueOnce(new Error("Owner authorization required"));
    expect(await payHomepageNew(provider)).toEqual({ paymentHash: "0xpaid", rewardError: "Owner authorization required" });
    expect(mocks.send).toHaveBeenCalledTimes(2);
  });
  it("does not submit when the wallet lacks the payment amount", async () => {
    mocks.balance.mockResolvedValue(19999999999999n);
    await expect(payHomepageNew(provider)).rejects.toThrow("PAY(NEW) needs 0.00002 test MUSD; this wallet has 0.000019999999999999 test MUSD");
    expect(mocks.send).not.toHaveBeenCalled();
  });
});