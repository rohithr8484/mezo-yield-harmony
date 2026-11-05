import { BrowserProvider, Contract, JsonRpcProvider, isAddress, ZeroAddress, type Eip1193Provider } from "ethers";
import { MARKETPLACE_ADMIN_READ_ADDRESS } from "./marketplaceAdminReads";

export const MARKETPLACE_ADMIN_ACTIONS = [
  { id: "grantRole", label: "Get Role", write: true },
  { id: "hasRole", label: "Verify Role", write: false },
  { id: "supportedCollections", label: "Discover Collections", write: false },
  { id: "addCollection", label: "Add Collection", write: true },
  { id: "removeCollection", label: "Remove Collection", write: true },
  { id: "isCollectionSupported", label: "Verify Collection", write: false },
] as const;
export type MarketplaceAdminAction = typeof MARKETPLACE_ADMIN_ACTIONS[number]["id"];
export const MARKETPLACE_ADMIN_ROLES = ["COLLECTION_MANAGER_ROLE", "FEE_MANAGER_ROLE", "PAUSER_ROLE", "DEFAULT_ADMIN_ROLE"] as const;
export type MarketplaceAdminRole = typeof MARKETPLACE_ADMIN_ROLES[number];
const ABI = [
  "function DEFAULT_ADMIN_ROLE() view returns (bytes32)",
  "function COLLECTION_MANAGER_ROLE() view returns (bytes32)",
  "function FEE_MANAGER_ROLE() view returns (bytes32)",
  "function PAUSER_ROLE() view returns (bytes32)",
  "function getRoleAdmin(bytes32) view returns (bytes32)",
  "function grantRole(bytes32 role,address account)",
  "function hasRole(bytes32 role,address account) view returns (bool)",
  "function supportedCollections(address) view returns (bool)",
  "function isCollectionSupported(address) view returns (bool)",
  "function addCollection(address)",
  "function removeCollection(address)",
  "error AlreadyWhitelisted()", "error NotWhitelisted()", "error InvalidAddress()",
];

export function getMarketplaceAdminArgs(action: MarketplaceAdminAction, input: { account: string; collection: string }, role?: string): string[] {
  const address = action === "grantRole" || action === "hasRole" ? input.account.trim() : input.collection.trim();
  if (!isAddress(address) || address.toLowerCase() === ZeroAddress) throw new Error("Enter a valid nonzero wallet or collection address.");
  if (action === "grantRole" || action === "hasRole") {
    if (!role) throw new Error("Select a contract role.");
    return [role, address];
  }
  return [address];
}

export async function callMarketplaceAdminAction(action: MarketplaceAdminAction, input: { account: string; collection: string; role: MarketplaceAdminRole }, wallet?: Eip1193Provider): Promise<{ value?: boolean; hash?: string }> {
  const rpc = new JsonRpcProvider("https://rpc.test.mezo.org", 31611, { staticNetwork: true });
  try {
    const reader = new Contract(MARKETPLACE_ADMIN_READ_ADDRESS, ABI, rpc);
    const role = action === "grantRole" || action === "hasRole" ? String(await reader[input.role]()) : undefined;
    const args = getMarketplaceAdminArgs(action, input, role);
    const config = MARKETPLACE_ADMIN_ACTIONS.find((item) => item.id === action);
    if (!config?.write) return { value: Boolean(await reader[action](...args)) };
    if (!wallet) throw new Error("Connect your admin wallet before submitting this action.");
    if (Number(await wallet.request({ method: "eth_chainId" })) !== 31611) {
      await wallet.request({ method: "wallet_switchEthereumChain", params: [{ chainId: "0x7b7b" }] });
    }
    const provider = new BrowserProvider(wallet);
    if (Number((await provider.getNetwork()).chainId) !== 31611) throw new Error("Switch your wallet to Mezo Testnet.");
    const signer = await provider.getSigner();
    const requiredRole = action === "grantRole" ? await reader.getRoleAdmin(role) : await reader.COLLECTION_MANAGER_ROLE();
    if (!(await reader.hasRole(requiredRole, await signer.getAddress()))) throw new Error("Your connected wallet does not have the required admin permission for this action.");
    const contract = new Contract(MARKETPLACE_ADMIN_READ_ADDRESS, ABI, signer);
    await contract[action].staticCall(...args);
    const estimate: bigint = await contract[action].estimateGas(...args);
    const tx = await contract[action](...args, { gasLimit: (estimate * 130n + 99n) / 100n });
    let receipt;
    try { receipt = await tx.wait(); }
    catch { receipt = await rpc.getTransactionReceipt(tx.hash).catch(() => null); }
    if (!receipt) throw new Error(`Confirmation unavailable. Check transaction ${tx.hash} before submitting again.`);
    if (receipt.status !== 1) throw new Error(`Transaction reverted: ${tx.hash}`);
    return { hash: receipt.hash };
  } finally { rpc.destroy(); }
}