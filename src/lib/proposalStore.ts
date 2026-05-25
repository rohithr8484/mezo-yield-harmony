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

export function getVotes(): VotesMap {
  try {
    const raw = localStorage.getItem(VOTES_KEY);
    return raw ? (JSON.parse(raw) as VotesMap) : {};
  } catch {
    return {};
  }
}

export function getVotesFor(proposalId: string): VoteRecord[] {
  return getVotes()[proposalId] ?? [];
}

export function addVote(proposalId: string, vote: VoteRecord) {
  const map = getVotes();
  const list = map[proposalId] ?? [];
  list.push(vote);
  map[proposalId] = list;
  try {
    localStorage.setItem(VOTES_KEY, JSON.stringify(map));
    // Notify same-tab listeners (storage event only fires cross-tab)
    window.dispatchEvent(new CustomEvent("mezo:votes-updated", { detail: { proposalId } }));
  } catch {}
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
 * Compute live tally for a proposal: base totals + user votes,
 * with a tiny time-decay weighting so newer votes nudge the result
 * immediately (real-time feel) while older votes still count fully.
 */
export function computeLiveTally(proposal: Proposal): LiveTally {
  const votes = getVotesFor(proposal.id);
  let f = proposal.forVotes;
  let a = proposal.againstVotes;
  let ab = proposal.abstainVotes;
  let lastVoteAt: number | undefined;

  for (const v of votes) {
    // weight defaults to 1 vote unit if not provided
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
    voteCount: (proposal.topVoters?.length ?? 0) + votes.length,
    lastVoteAt,
  };
}
