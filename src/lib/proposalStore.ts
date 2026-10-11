import { proposals as staticProposals, type Proposal } from "@/lib/proposals";

export const USER_PROPOSALS_KEY = "mezo.userProposals.v1";
export const VOTES_KEY = "mezo.proposalVotes.v1";

export type VoteType = "FOR" | "AGAINST" | "ABSTAIN";

export interface VoteRecord {
  voter: string;
  type: VoteType;
  weight: number; // vote weight units
  ts: number; // ms timestamp
  txHash?: string;
}

export type VotesMap = Record<string, VoteRecord[]>;

export function getUserProposals(): Proposal[] {
  try {
    const raw = localStorage.getItem(USER_PROPOSALS_KEY);
    return raw ? (JSON.parse(raw) as Proposal[]).map((p) => ({ ...p, status: p.status === "Finished" ? "Finished" : "Active" })) : [];
  } catch {
    return [];
  }
}

export function getAllProposals(): Proposal[] {
  return [...getUserProposals(), ...staticProposals].map((proposal) => ({
    ...proposal,
    status: proposal.status === "Finished" || Date.now() >= getVotingEndTime(proposal.id, proposal)
      ? "Finished"
      : "Active",
  }));
}

export function findProposal(id: string): Proposal | undefined {
  const lower = id.toLowerCase();
  return getAllProposals().find((p) => p.id.toLowerCase() === lower);
}

// JavaScript vote store with a browser backup so final results survive refresh.
const votesMemory: VotesMap = {};

// A fixed schedule is shared by all browsers; opening a page never starts a timer.
export const VOTING_WINDOW_MS = 25 * 60 * 1000;
export const EXISTING_PROPOSALS_END_AT = Date.parse("2026-10-06T17:10:31Z");
const endTimes: Record<string, number> = {};

export function getVotingEndTime(proposalId: string, proposal?: Proposal): number {
  const source = proposal ?? [...getUserProposals(), ...staticProposals].find((p) => p.id === proposalId);
  endTimes[proposalId] = source?.votingEndsAt ?? EXISTING_PROPOSALS_END_AT;
  return endTimes[proposalId];
}

export function isVotingOpen(proposalId: string): boolean {
  const proposal = findProposal(proposalId);
  return proposal?.status === "Active" && Date.now() < getVotingEndTime(proposalId, proposal);
}

export function getVotes(): VotesMap {
  try {
    const raw = localStorage.getItem(VOTES_KEY);
    if (raw) {
      const stored: unknown = JSON.parse(raw);
      if (stored && typeof stored === "object" && !Array.isArray(stored)) {
        for (const [id, records] of Object.entries(stored)) {
          if (!Array.isArray(records)) continue;
          votesMemory[id] = records.filter((vote): vote is VoteRecord =>
            vote && typeof vote.voter === "string" &&
            ["FOR", "AGAINST", "ABSTAIN"].includes(vote.type) &&
            typeof vote.weight === "number" && Number.isFinite(vote.weight) && vote.weight > 0 &&
            typeof vote.ts === "number" && Number.isFinite(vote.ts)
          );
        }
      }
    }
  } catch {
    // Keep the current JavaScript votes if browser storage is unavailable.
  }
  return votesMemory;
}

export function getVotesFor(proposalId: string): VoteRecord[] {
  return getVotes()[proposalId] ?? [];
}

export function addVote(proposalId: string, vote: VoteRecord) {
  if (!isVotingOpen(proposalId)) return false;
  getVotes();
  (votesMemory[proposalId] ??= []).push(vote);
  try {
    localStorage.setItem(VOTES_KEY, JSON.stringify(votesMemory));
  } catch {
    // The vote remains available in this session if saving is unavailable.
  }
  window.dispatchEvent(new CustomEvent("mezo:votes-updated", { detail: { proposalId } }));
  return true;
}

export function saveUserProposal(p: Proposal) {
  const list = getUserProposals();
  const next = [{ ...p, votingEndsAt: p.votingEndsAt ?? Date.now() + VOTING_WINDOW_MS }, ...list];
  try {
    localStorage.setItem(USER_PROPOSALS_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent("mezo:proposals-updated"));
  } catch {}
  return next;
}

export interface LiveTally {
  forVotes: number;
  againstVotes: number;
  abstainVotes: number;
  total: number;
  forPct: number;
  againstPct: number;
  abstainPct: number;
  quorum: number;
  differential: number;
  voteCount: number;
  lastVoteAt?: number;
}


/**
 * Compute live tally from real user votes only (no fake/static base totals).
 */
export function computeLiveTally(proposal: Proposal): LiveTally {
  const votes = getVotesFor(proposal.id);
  let f = 0;
  let a = 0;
  let ab = 0;
  let lastVoteAt: number | undefined;

  for (const v of votes) {
    const w = Math.max(1, v.weight || 1);
    if (v.type === "FOR") f += w;
    else if (v.type === "AGAINST") a += w;
    else ab += w;
    if (!lastVoteAt || v.ts > lastVoteAt) lastVoteAt = v.ts;
  }

  const total = f + a + ab;
  const pct = (n: number) => (total === 0 ? 0 : (n / total) * 100);

  return {
    forVotes: f,
    againstVotes: a,
    abstainVotes: ab,
    total,
    forPct: pct(f),
    againstPct: pct(a),
    abstainPct: pct(ab),
    quorum: total,
    differential: Math.abs(f - a),
    voteCount: votes.length,
    lastVoteAt,
  };
}

