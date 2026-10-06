import { describe, expect, it } from "vitest";
import { getVeMezoWithdrawError, VEMEZO_WITHDRAW_REVERT_MESSAGE } from "./veMezoWithdrawError";

describe("veMEZO withdrawal messages", () => {
  it.each([
    { code: "CALL_EXCEPTION", reason: null },
    { code: "CALL_EXCEPTION", reason: "ERC721: caller is not token owner or approved" },
    { message: "execution reverted: not owner" },
    { shortMessage: "could not coalesce error", info: { error: { code: -32000, message: "execution reverted" } } },
    { cause: { code: "CALL_EXCEPTION", reason: "Lock not expired" } },
  ])("uses the same explanation for contract rejections: %j", (error) => {
    expect(getVeMezoWithdrawError(error)).toBe(VEMEZO_WITHDRAW_REVERT_MESSAGE);
  });
  it("does not mislabel cancellation as a contract rejection", () => {
    expect(getVeMezoWithdrawError({ code: "ACTION_REJECTED", info: { error: { message: "execution reverted" } } })).toBe("Withdrawal cancelled.");
    expect(getVeMezoWithdrawError({ info: { error: { code: 4001 } } })).toBe("Withdrawal cancelled.");
  });
  it("keeps network and balance errors distinct", () => {
    expect(getVeMezoWithdrawError({ shortMessage: "Network unavailable" })).toBe("Network unavailable");
    expect(getVeMezoWithdrawError({ code: "INSUFFICIENT_FUNDS", shortMessage: "Insufficient funds" })).toBe("Insufficient funds");
  });
  it("handles absent and cyclic errors", () => {
    expect(getVeMezoWithdrawError(null)).toBe("Withdraw failed");
    const error: { message: string; cause?: unknown } = { message: "execution reverted" };
    error.cause = error;
    expect(getVeMezoWithdrawError(error)).toBe(VEMEZO_WITHDRAW_REVERT_MESSAGE);
  });
});