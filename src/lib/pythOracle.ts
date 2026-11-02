import { ethers } from "ethers";

export const PYTH_CONTRACT = "0x2880aB155794e7179c9eE2e38200202908C17B43";
export const PYTH_RPC = "https://rpc.test.mezo.org";
export const PYTH_MAX_AGE_SECONDS = 3600;

const ABI = [
  "function getPriceNoOlderThan(bytes32 id, uint256 age) view returns (tuple(int64 price, uint64 conf, int32 expo, uint256 publishTime))",
  "function getPriceUnsafe(bytes32 id) view returns (tuple(int64 price, uint64 conf, int32 expo, uint256 publishTime))",
];

export interface PythPrice {
  price: string;
  confidence: string;
  exponent: number;
  publishTime: number;
  /** true when getPriceNoOlderThan passed the staleness check */
  fresh: boolean;
}

let contract: ethers.Contract | null = null;
const getContract = () =>
  (contract ??= new ethers.Contract(PYTH_CONTRACT, ABI, new ethers.JsonRpcProvider(PYTH_RPC)));

const format = (d: { price: bigint; conf: bigint; expo: bigint; publishTime: bigint }, fresh: boolean): PythPrice => {
  const decimals = -Number(d.expo);
  return {
    price: ethers.formatUnits(d.price, decimals),
    confidence: ethers.formatUnits(d.conf, decimals),
    exponent: Number(d.expo),
    publishTime: Number(d.publishTime),
    fresh,
  };
};

/** Reads with getPriceNoOlderThan; if the feed is older than maxAge it falls back to the last stored price, marked stale. */
export async function getPythPrice(feedId: string, maxAge = PYTH_MAX_AGE_SECONDS): Promise<PythPrice> {
  const c = getContract();
  try {
    return format(await c.getPriceNoOlderThan(feedId, maxAge), true);
  } catch {
    return format(await c.getPriceUnsafe(feedId), false);
  }
}
