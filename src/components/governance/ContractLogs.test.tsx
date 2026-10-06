// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

const { readContract } = vi.hoisted(() => ({ readContract: vi.fn() }));
vi.mock("viem", async (original) => ({ ...await original<typeof import("viem")>(), createPublicClient: () => ({ readContract }) }));
import { ContractLogs } from "./ContractLogs";

afterEach(() => { cleanup(); vi.resetAllMocks(); });

describe("proposal contract logs", () => {
  it.each(["getProposalsBatch", "getProposalsRange"])("explains missing IDs for %s without claiming success", async (fn) => {
    readContract.mockRejectedValue(new Error(`The contract function "${fn}" reverted: Invalid proposal`));
    render(<ContractLogs />);
    fireEvent.click(screen.getByRole("button", { name: `${fn}()` }));
    await screen.findByText(/No results: one or more requested on-chain proposal IDs/);
    expect(screen.getByText(new RegExp(`${fn}\\(\\) — No results`))).toBeTruthy();
    expect(readContract).toHaveBeenCalledWith(expect.objectContaining({ functionName: fn }));
  });

  it("keeps successful on-chain results", async () => {
    readContract.mockResolvedValue([{ id: 1n, title: "Real proposal" }]);
    render(<ContractLogs />);
    fireEvent.click(screen.getByRole("button", { name: "getProposalsBatch()" }));
    await screen.findByText(/Real proposal/);
    expect(screen.getByText(/getProposalsBatch\(\) ✓/)).toBeTruthy();
  });

  it("rejects reversed ranges before calling the contract", async () => {
    render(<ContractLogs />);
    fireEvent.change(screen.getByLabelText("First on-chain proposal ID"), { target: { value: "5" } });
    fireEvent.click(screen.getByRole("button", { name: "getProposalsRange()" }));
    await screen.findByText(/Last proposal ID must be greater/);
    expect(readContract).not.toHaveBeenCalled();
  });

  it("rejects invalid batch IDs before calling the contract", async () => {
    render(<ContractLogs />);
    fireEvent.change(screen.getByLabelText("On-chain proposal IDs"), { target: { value: "1,-2" } });
    fireEvent.click(screen.getByRole("button", { name: "getProposalsBatch()" }));
    await screen.findByText(/Enter a non-negative numeric/);
    expect(readContract).not.toHaveBeenCalled();
  });

  it("does not hide network errors as empty results", async () => {
    readContract.mockRejectedValue(new Error("Network unavailable"));
    render(<ContractLogs />);
    fireEvent.click(screen.getByRole("button", { name: "getProposalsBatch()" }));
    await screen.findByText("Network unavailable");
    await waitFor(() => expect(screen.getByText(/getProposalsBatch\(\) ✕/)).toBeTruthy());
  });
});