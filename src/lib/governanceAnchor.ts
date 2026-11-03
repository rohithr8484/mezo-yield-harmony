import { ethers } from "ethers";
import { getPaymentSigner, confirmPaymentTransaction } from "@/lib/tokenPayment";

/** On-chain governance record contract on Mezo Testnet. */
export const GOVERNANCE_ANCHOR_ADDRESS = "0x82531Fc1b2eB804D7484b1346fb0FE503F81c75a";

export const GOVERNANCE_ANCHOR_ABI = [
  "function anchorProposal(uint256 proposalId, string metadata)",
  "function vote(uint256 proposalId, uint8 support)",
  "function finalize(uint256 proposalId)",
  "function hasVoted(uint256 proposalId, address voter) view returns (bool)",
];

/** Contract vote codes: 0 = Yes (For), 1 = No (Against), 2 = Abstain. */
export const VOTE_CODE = { FOR: 0, AGAINST: 1, ABSTAIN: 2 } as const;
export type VoteChoice = keyof typeof VOTE_CODE;

const ANCHORED_KEY = "governance_onchain_anchors_v1";

export interface AnchorRecord {
  onchainId: string;
  anchorTx?: string;
  finalizeTx?: string;
}

function readAnchors(): Record<string, AnchorRecord> {
  try {
    return JSON.parse(window.localStorage.getItem(ANCHORED_KEY) || "{}") ?? {};
  } catch {
    return {};
  }
}

function writeAnchor(proposalId: string, patch: Partial<AnchorRecord>) {
  const all = readAnchors();
  all[proposalId] = { ...(all[proposalId] ?? { onchainId: "" }), ...patch } as AnchorRecord;
  try {
    window.localStorage.setItem(ANCHORED_KEY, JSON.stringify(all));
  } catch {
    /* storage unavailable */
  }
}

export function getAnchor(proposalId: string): AnchorRecord | undefined {
  const rec = readAnchors()[proposalId];
  return rec?.onchainId ? rec : undefined;
}

/** Unique uint256 id derived from the local proposal id and its saved deadline. */
export function deriveOnchainId(proposalId: string, deadline: number): bigint {
  return BigInt(ethers.keccak256(ethers.toUtf8Bytes(`mezo-auth-dev:${proposalId}:${deadline}`)));
}

async function send(
  method: "anchorProposal" | "vote" | "finalize",
  args: unknown[],
  walletProvider?: ethers.Eip1193Provider,
) {
  const signer = await getPaymentSigner(walletProvider);
  const contract = new ethers.Contract(GOVERNANCE_ANCHOR_ADDRESS, GOVERNANCE_ANCHOR_ABI, signer);
  await contract[method].staticCall(...args);
  const tx = await contract[method](...args);
  await confirmPaymentTransaction(signer.provider!, tx.hash);
  return tx.hash as string;
}

export async function anchorProposalOnchain(
  proposalId: string,
  deadline: number,
  title: string,
  walletProvider?: ethers.Eip1193Provider,
) {
  const onchainId = deriveOnchainId(proposalId, deadline);
  const hash = await send("anchorProposal", [onchainId, `${proposalId}: ${title}`], walletProvider);
  writeAnchor(proposalId, { onchainId: onchainId.toString(), anchorTx: hash });
  return hash;
}

export async function voteOnchain(proposalId: string, choice: VoteChoice, walletProvider?: ethers.Eip1193Provider) {
  const anchor = getAnchor(proposalId);
  if (!anchor) return null;
  return send("vote", [BigInt(anchor.onchainId), VOTE_CODE[choice]], walletProvider);
}

export async function finalizeOnchain(proposalId: string, walletProvider?: ethers.Eip1193Provider) {
  const anchor = getAnchor(proposalId);
  if (!anchor) throw new Error("This proposal was not anchored on-chain.");
  const hash = await send("finalize", [BigInt(anchor.onchainId)], walletProvider);
  writeAnchor(proposalId, { finalizeTx: hash });
  return hash;
}
