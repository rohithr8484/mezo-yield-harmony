// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { addVote, computeLiveTally, EXISTING_PROPOSALS_END_AT, findProposal, getUserProposals, getVotingEndTime, isVotingOpen, saveUserProposal, USER_PROPOSALS_KEY, VOTES_KEY, VOTING_WINDOW_MS } from "./proposalStore";

afterEach(() => {
  vi.useRealTimers();
  localStorage.clear();
});

describe("shared proposal deadlines", () => {
  it("returns newly submitted proposals as Finished from the user store when their saved deadline expires", () => {
    vi.useFakeTimers();
    const createdAt = EXISTING_PROPOSALS_END_AT + 60000;
    vi.setSystemTime(createdAt);
    const base = findProposal("MIP-045");
    if (!base) throw new Error("Missing proposal");
    saveUserProposal({ ...base, id: "TEST-CLOSURE", status: "Active", votingEndsAt: undefined });
    expect(getUserProposals()[0].status).toBe("Active");
    expect(addVote("TEST-CLOSURE", { voter: "new-voter", type: "FOR", weight: 1, ts: createdAt })).toBe(true);
    vi.setSystemTime(createdAt + VOTING_WINDOW_MS);
    const closed = getUserProposals()[0];
    expect(closed.status).toBe("Finished");
    expect(closed.votingEndsAt).toBe(createdAt + VOTING_WINDOW_MS);
    expect(computeLiveTally(closed).forVotes).toBe(1);
    expect(addVote(closed.id, { voter: "late-new-voter", type: "AGAINST", weight: 1, ts: Date.now() })).toBe(false);
  });

  it("restores each proposal's recorded votes after reload and closure", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(EXISTING_PROPOSALS_END_AT - 1000);
    vi.resetModules();
    const store = await import("./proposalStore");
    expect(store.addVote("MIP-046", { voter: "wallet-a", type: "FOR", weight: 1, ts: Date.now() })).toBe(true);
    expect(store.addVote("MIP-047", { voter: "wallet-b", type: "AGAINST", weight: 1, ts: Date.now() })).toBe(true);
    expect(JSON.parse(localStorage.getItem(VOTES_KEY) ?? "{}")["MIP-046"]).toHaveLength(1);
    vi.setSystemTime(EXISTING_PROPOSALS_END_AT);
    vi.resetModules();
    const restored = await import("./proposalStore");
    const first = restored.findProposal("MIP-046");
    const second = restored.findProposal("MIP-047");
    if (!first || !second) throw new Error("Missing proposals");
    expect(first.status).toBe("Finished");
    expect(restored.computeLiveTally(first).forVotes).toBe(1);
    expect(restored.computeLiveTally(first).againstVotes).toBe(0);
    expect(restored.computeLiveTally(second).againstVotes).toBe(1);
    expect(restored.addVote(first.id, { voter: "late", type: "FOR", weight: 1, ts: Date.now() })).toBe(false);
  });
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