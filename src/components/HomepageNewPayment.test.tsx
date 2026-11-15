import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ pay: vi.fn() }));
vi.mock("wagmi", () => ({ useAccount: () => ({ isConnected: true, connector: { getProvider: async () => ({ request: vi.fn() }) } }) }));
vi.mock("@rainbow-me/rainbowkit", () => ({ useConnectModal: () => ({}) }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), warning: vi.fn(), error: vi.fn() } }));
vi.mock("@/lib/homepageNewPayment", () => ({ HOMEPAGE_PAYMENT_AMOUNT: "0.00002", HOMEPAGE_PAYMENT_RECIPIENT: "0x21f7C9fdA5ED418AF3a1C7593dec52142350A0F7", HOMEPAGE_REWARD_AMOUNT: "0.00001", payHomepageNew: mocks.pay }));
import HomepageNewPayment from "./HomepageNewPayment";
describe("official service unlock", () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(cleanup);
  async function submit(onPaymentSuccess: () => void) {
    render(<HomepageNewPayment onPaymentSuccess={onPaymentSuccess} />);
    fireEvent.click(screen.getByRole("button", { name: "PAY WITH MUSD (OFFICIAL)" }));
    fireEvent.click(screen.getByRole("button", { name: "Pay 0.00002 test MUSD" }));
    await waitFor(() => expect(mocks.pay).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull());
  }
  it("unlocks the selected service after both confirmed receipts", async () => {
    mocks.pay.mockResolvedValue({ paymentHash: "0xpaid", rewardHash: "0xreward" });
    const unlock = vi.fn();
    await submit(unlock);
    expect(unlock).toHaveBeenCalledTimes(1);
  });
  it("does not unlock when payment succeeds but reward fails", async () => {
    mocks.pay.mockResolvedValue({ paymentHash: "0xpaid", rewardError: "Unauthorized" });
    const unlock = vi.fn();
    await submit(unlock);
    expect(unlock).not.toHaveBeenCalled();
  });
});