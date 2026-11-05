import { Contract, JsonRpcProvider } from "ethers";

export const MARKETPLACE_ADMIN_READ_ADDRESS = "0x1D462522A9f8fbea6c10122dce01E09432A64dBF";
export const MARKETPLACE_VEMEZO_COLLECTION = "0xaCE816CA2bcc9b12C59799dcC5A959Fb9b98111b";

const getContract = () => new Contract(
  MARKETPLACE_ADMIN_READ_ADDRESS,
  ["function FEE_TIMELOCK() view returns (uint256)", "function isCollectionSupported(address collection) view returns (bool)"],
  new JsonRpcProvider("https://rpc.test.mezo.org"),
);

export async function readMarketplaceFeeTimelock(): Promise<bigint> {
  return await getContract().FEE_TIMELOCK();
}

export async function readMarketplaceCollectionSupported(): Promise<boolean> {
  return await getContract().isCollectionSupported(MARKETPLACE_VEMEZO_COLLECTION);
}