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
    return raw ? (JSON.parse(raw) as Proposal[]) : [];
  } catch {
    return [];
  }
}

export function getAllProposals(): Proposal[] {
  return [...getUserProposals(), ...staticProposals];
}

export function findProposal(id: string): Proposal | undefined {
  const lower = id.toLowerCase();
  return getAllProposals().find((p) => p.id.toLowerCase() === lower);
}

// In-memory JavaScript store for voting data (per proposal). Resets on page refresh.
const votesMemory: VotesMap = {};

// 10-minute voting window per active proposal, kept in memory.
export const VOTING_WINDOW_MS = 10 * 60 * 1000;
const endTimes: Record<string, number> = {};

export function getVotingEndTime(proposalId: string): number {
  if (!endTimes[proposalId]) endTimes[proposalId] = Date.now() + VOTING_WINDOW_MS;
  return endTimes[proposalId];
}

export function isVotingOpen(proposalId: string): boolean {
  return Date.now() < getVotingEndTime(proposalId);
}

export function getVotes(): VotesMap {
  return votesMemory;
}

export function getVotesFor(proposalId: string): VoteRecord[] {
  return getVotes()[proposalId] ?? [];
}

export function addVote(proposalId: string, vote: VoteRecord) {
  if (!isVotingOpen(proposalId)) return;
  (votesMemory[proposalId] ??= []).push(vote);
  window.dispatchEvent(new CustomEvent("mezo:votes-updated", { detail: { proposalId } }));
}

export function saveUserProposal(p: Proposal) {
  const list = getUserProposals();
  const next = [p, ...list];
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

