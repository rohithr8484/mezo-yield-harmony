// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { addVote, computeLiveTally, EXISTING_PROPOSALS_END_AT, findProposal, getVotingEndTime, isVotingOpen, saveUserProposal, USER_PROPOSALS_KEY, VOTING_WINDOW_MS } from "./proposalStore";

afterEach(() => {
  vi.useRealTimers();
  localStorage.clear();
});

describe("shared proposal deadlines", () => {
  it("does not start or reset the existing deadline when a user opens a proposal", () => {
    vi.useFakeTimers();
    vi.setSystemTime(EXISTING_PROPOSALS_END_AT - 60000);
    expect(getVotingEndTime("MIP-045")).toBe(EXISTING_PROPOSALS_END_AT);
    vi.setSystemTime(EXISTING_PROPOSALS_END_AT - 1000);
    expect(getVotingEndTime("MIP-045")).toBe(EXISTING_PROPOSALS_END_AT);
    expect(findProposal("MIP-045")?.status).toBe("Active");
  });

  it("finishes at the deadline, keeps the result, and rejects late votes", () => {
    vi.useFakeTimers();
    vi.setSystemTime(EXISTING_PROPOSALS_END_AT - 1000);
    expect(addVote("MIP-045", { voter: "test", type: "FOR", weight: 1, ts: Date.now() })).toBe(true);
    vi.setSystemTime(EXISTING_PROPOSALS_END_AT);
    const proposal = findProposal("MIP-045");
    expect(proposal?.status).toBe("Finished");
    expect(isVotingOpen("MIP-045")).toBe(false);
    expect(addVote("MIP-045", { voter: "late", type: "AGAINST", weight: 1, ts: Date.now() })).toBe(false);
    if (!proposal) throw new Error("Missing proposal");
    expect(computeLiveTally(proposal).forVotes).toBe(1);
  });

  it("saves a new proposal deadline at creation instead of first viewing", () => {
    vi.useFakeTimers();
    vi.setSystemTime(EXISTING_PROPOSALS_END_AT - 10000);
    const base = findProposal("MIP-045");
    if (!base) throw new Error("Missing proposal");
    const createdAt = Date.now();
    saveUserProposal({ ...base, id: "TEST-NEW", status: "Active" });
    expect(JSON.parse(localStorage.getItem(USER_PROPOSALS_KEY) ?? "[]")[0].votingEndsAt).toBe(createdAt + VOTING_WINDOW_MS);
    vi.setSystemTime(createdAt + VOTING_WINDOW_MS);
    expect(findProposal("TEST-NEW")?.status).toBe("Finished");
  });
});