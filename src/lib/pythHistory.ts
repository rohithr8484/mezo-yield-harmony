import { ethers } from "ethers";
import { PYTH_CONTRACT, PYTH_RPC, PYTH_MAX_AGE_SECONDS } from "./pythOracle";

export interface OracleSnapshot {
  blockNumber: number;
  observedTime: number;
  publishTime: number;
  price: number;
  confidence: number;
}

export interface OracleHistory {
  points: OracleSnapshot[];
  requested: number;
  unavailable: number;
}

interface HistoryReader {
  getBlock: (tag: number | "latest") => Promise<{ number: number; timestamp: number } | null>;
  getPrice: (feedId: string, blockNumber: number) => Promise<{ price: bigint; conf: bigint; expo: bigint; publishTime: bigint }>;
}

export function decodeSnapshot(block: { number: number; timestamp: number }, raw: { price: bigint; conf: bigint; expo: bigint; publishTime: bigint }): OracleSnapshot {
  const factor = 10 ** Number(raw.expo);
  const price = Number(raw.price) * factor;
  const confidence = Number(raw.conf) * factor;
  const publishTime = Number(raw.publishTime);
  if (!Number.isFinite(price) || price <= 0 || !Number.isFinite(confidence) || confidence < 0 || publishTime <= 0 || publishTime > block.timestamp) {
    throw new Error("Oracle returned an invalid price observation.");
  }
  return { blockNumber: block.number, observedTime: block.timestamp, publishTime, price, confidence };
}

export const isSnapshotStale = (point: OracleSnapshot, nowSeconds: number) => nowSeconds - point.publishTime > PYTH_MAX_AGE_SECONDS;

/** Approximate 24h of block-state samples, not a trade/candle history. Every plotted value is an actual contract read. */
export async function readOracleHistory(feedId: string, reader: HistoryReader): Promise<OracleHistory> {
  const latest = await reader.getBlock("latest");
  if (!latest) throw new Error("Latest Mezo block unavailable.");
  const reference = await reader.getBlock(Math.max(0, latest.number - 1000));
  const secondsPerBlock = reference && reference.number < latest.number
    ? (latest.timestamp - reference.timestamp) / (latest.number - reference.number)
    : 0;
  const span = secondsPerBlock > 0 ? Math.min(latest.number, Math.ceil(86400 / secondsPerBlock)) : 0;
  const blocks = [...new Set(Array.from({ length: span ? 13 : 1 }, (_, i) => span ? latest.number - Math.round(span * (12 - i) / 12) : latest.number))];
  const points: OracleSnapshot[] = [];
  let unavailable = 0;
  // Limit RPC concurrency; failed archive reads are not filled with synthetic points.
  for (let i = 0; i < blocks.length; i += 3) {
    await Promise.all(blocks.slice(i, i + 3).map(async (number) => {
      try {
        const block = number === latest.number ? latest : await reader.getBlock(number);
        if (!block) throw new Error("Block unavailable.");
        points.push(decodeSnapshot(block, await reader.getPrice(feedId, number)));
      } catch {
        unavailable += 1;
      }
    }));
  }
  if (!points.length) throw new Error("No readable oracle prices for this feed. Historical RPC access or feed data may be unavailable.");
  return { points: points.sort((a, b) => a.blockNumber - b.blockNumber), requested: blocks.length, unavailable };
}

export function getOracleHistory(feedId: string): Promise<OracleHistory> {
  const provider = new ethers.JsonRpcProvider(PYTH_RPC);
  const contract = new ethers.Contract(PYTH_CONTRACT, ["function getPriceUnsafe(bytes32 id) view returns (tuple(int64 price, uint64 conf, int32 expo, uint256 publishTime))"], provider);
  return readOracleHistory(feedId, {
    getBlock: (tag) => provider.getBlock(tag),
    getPrice: (id, blockNumber) => contract.getPriceUnsafe(id, { blockTag: blockNumber }),
  }).finally(() => provider.destroy());
}