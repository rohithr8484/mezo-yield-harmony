import { ethers } from "ethers";
import { toast } from "sonner";

/**
 * MEZO token (acts as both stake recipient and reward source)
 */
export const MEZO_TOKEN_ADDRESS =
  "0x7B7c000000000000000000000000000000000001";

const MEZO_TESTNET_CHAIN_ID = 31611;
const MEZO_TESTNET_CHAIN_HEX = "0x" + MEZO_TESTNET_CHAIN_ID.toString(16);

const ERC20_ABI = [
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function balanceOf(address account) external view returns (uint256)",
];

export interface PayWithMEZOResult {
  stakeHash: string;
  rewardHash?: string;
  rewardError?: string;
}

const ensureMezoNetwork = async (eth: any) => {
  const currentChainId: string = await eth.request({ method: "eth_chainId" });
  if (currentChainId?.toLowerCase() === MEZO_TESTNET_CHAIN_HEX) return;
  try {
    await eth.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: MEZO_TESTNET_CHAIN_HEX }],
    });
  } catch (err: any) {
    if (err?.code === 4902) {
      await eth.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: MEZO_TESTNET_CHAIN_HEX,
            chainName: "Mezo Testnet",
            nativeCurrency: { name: "Bitcoin", symbol: "BTC", decimals: 18 },
            rpcUrls: ["https://rpc.test.mezo.org"],
            blockExplorerUrls: ["https://explorer.test.mezo.org"],
          },
        ],
      });
    } else {
      throw err;
    }
  }
};

/**
 * CORE PAYMENT FUNCTION
 * Flow: wallet -> MEZO token contract -> wallet (half as reward)
 */
export const payWithMEZO = async (
  amountWei: bigint
): Promise<PayWithMEZOResult> => {
  const eth = (window as any).ethereum;
  if (!eth) throw new Error("No wallet found. Please install MetaMask.");

  await ensureMezoNetwork(eth);

  const provider = new ethers.BrowserProvider(eth);
  await provider.send("eth_requestAccounts", []);
  const signer = await provider.getSigner();
  const user = await signer.getAddress();

  const mezo = new ethers.Contract(MEZO_TOKEN_ADDRESS, ERC20_ABI, signer);

  // 1. Stake payment: wallet -> MEZO token address
  const stakeTx = await mezo.transfer(MEZO_TOKEN_ADDRESS, amountWei);
  const stakeReceipt = await stakeTx.wait();
  const stakeHash = stakeReceipt?.hash ?? stakeTx.hash;

  // 2. Reward payout: half of payment back to user
  const rewardAmount = amountWei / 2n;
  const rewardHuman = ethers.formatEther(rewardAmount);

  try {
    const rewardTx = await mezo.transfer(user, rewardAmount);
    const rewardReceipt = await rewardTx.wait();

    toast.success(`🎁 ${rewardHuman} MEZO reward sent to your wallet!`, {
      duration: 6000,
    });

    return {
      stakeHash,
      rewardHash: rewardReceipt?.hash ?? rewardTx.hash,
    };
  } catch (err: any) {
    console.error("MEZO reward payout failed:", err);
    toast.warning(
      `Payment confirmed, but reward payout failed: ${
        err?.shortMessage || err?.message || "Unknown error"
      }`
    );
    return {
      stakeHash,
      rewardError:
        err?.shortMessage || err?.message || "Reward payout failed",
    };
  }
};

export const sendMarketplaceMEZOPayment = async (
  amountWei: bigint
): Promise<string> => {
  const { stakeHash } = await payWithMEZO(amountWei);
  return stakeHash;
};
