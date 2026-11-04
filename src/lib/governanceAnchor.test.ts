import { beforeEach, describe, expect, it, vi } from "vitest";
import { ethers } from "ethers";

const mocks = vi.hoisted(() => ({
  signer: vi.fn(), confirm: vi.fn(), contract: vi.fn(),
  anchorProposal: Object.assign(vi.fn(), { staticCall: vi.fn() }),
  vote: Object.assign(vi.fn(), { staticCall: vi.fn() }),
  finalize: Object.assign(vi.fn(), { staticCall: vi.fn() }),
}));
vi.mock("ethers", async (original) => {
  const actual = await original<typeof import("ethers")>();
  return { ...actual, ethers: { ...actual.ethers, Contract: mocks.contract } };
});
vi.mock("@/lib/tokenPayment", () => ({ getPaymentSigner: mocks.signer, confirmPaymentTransaction: mocks.confirm }));

import { anchorProposalOnchain, voteOnchain, finalizeOnchain, getAnchor, GOVERNANCE_ANCHOR_ABI } from "./governanceAnchor";

describe("governance method transactions", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.clearAllMocks();
    mocks.signer.mockResolvedValue({});
    mocks.contract.mockImplementation(function () { return mocks; });
    for (const method of [mocks.anchorProposal, mocks.vote, mocks.finalize]) {
      method.staticCall.mockResolvedValue(undefined);
      method.mockResolvedValue({ hash: "0xoriginal" });
    }
    mocks.confirm.mockResolvedValue("0xconfirmed");
  });

  it("encodes all three deployed selectors, rather than an empty-data transfer", () => {
    const abi = new ethers.Interface(GOVERNANCE_ANCHOR_ABI);
    expect(abi.encodeFunctionData("anchorProposal", [1n, "Proposal"]).slice(0, 10)).toBe("0x26864c46");
    expect(abi.encodeFunctionData("vote", [1n, 0]).slice(0, 10)).toBe("0x943e8216");
    expect(abi.encodeFunctionData("finalize", [1n]).slice(0, 10)).toBe("0x05261aea");
  });

  it("saves only the confirmed anchor receipt for the requested contract", async () => {
    await anchorProposalOnchain("MIP-1004", 360000, "Test");
    expect(mocks.contract).toHaveBeenCalledWith("0x82531Fc1b2eB804D7484b1346fb0FE503F81c75a", GOVERNANCE_ANCHOR_ABI, {});
    expect(getAnchor("MIP-1004")?.anchorTx).toBe("0xconfirmed");
  });

  it.each([["FOR", 0], ["AGAINST", 1], ["ABSTAIN", 2]] as const)("retains the existing app encoding for %s without inferring contract semantics", async (choice, code) => {
    await anchorProposalOnchain("MIP-1004", 360000, "Test");
    await voteOnchain("MIP-1004", choice);
    expect(mocks.vote).toHaveBeenCalledWith(BigInt(getAnchor("MIP-1004")?.onchainId ?? "0"), code);
    expect(getAnchor("MIP-1004")?.voteTransactions).toEqual([{ hash: "0xconfirmed", choice }]);
  });

  it("does not save an unconfirmed vote as a successful transaction", async () => {
    await anchorProposalOnchain("MIP-1004", 360000, "Test");
    mocks.confirm.mockRejectedValue(new Error("reverted"));
    await expect(voteOnchain("MIP-1004", "FOR")).rejects.toThrow("reverted");
    expect(getAnchor("MIP-1004")?.voteTransactions).toBeUndefined();
  });

  it("persists the confirmed finalize receipt", async () => {
    await anchorProposalOnchain("MIP-1004", 360000, "Test");
    await finalizeOnchain("MIP-1004");
    expect(mocks.finalize).toHaveBeenCalledTimes(1);
    expect(getAnchor("MIP-1004")?.finalizeTx).toBe("0xconfirmed");
  });
});