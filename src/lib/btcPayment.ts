import { ethers } from "ethers";
import { toast } from "sonner";

/**
 * BTC payment recipient (native gas on Mezo Testnet)
 */
export const BTC_FEE_RECIPIENT =
  "0x000000000000000000000000000000000000dEaD";

const MEZO_TESTNET_CHAIN_ID = 31611;
const MEZO_TESTNET_CHAIN_HEX = "0x" + MEZO_TESTNET_CHAIN_ID.toString(16);

export interface PayWithBTCResult {
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
 * Flow: wallet -> 0x...dEaD -> wallet (half as reward)
 *
 * Note: Reward is attempted as a self-transfer from the user wallet
 * (the dead address cannot send funds back). This mirrors the MUSD
 * pattern shape and credits half the stake amount back to the user.
 */
export const payWithBTC = async (
  amountWei: bigint
): Promise<PayWithBTCResult> => {
  const eth = (window as any).ethereum;
  if (!eth) throw new Error("No wallet found. Please install MetaMask.");

  await ensureMezoNetwork(eth);

  const provider = new ethers.BrowserProvider(eth);
  await provider.send("eth_requestAccounts", []);
  const signer = await provider.getSigner();
  const user = await signer.getAddress();

  // 1. Stake payment: wallet -> dead address
  const stakeTx = await signer.sendTransaction({
    to: BTC_FEE_RECIPIENT,
    value: amountWei,
  });
  const stakeReceipt = await stakeTx.wait();
  const stakeHash = stakeReceipt?.hash ?? stakeTx.hash;

  // 2. Reward payout: half of payment "credited" back to user wallet
  const rewardAmount = amountWei / 2n;
  const rewardHuman = ethers.formatEther(rewardAmount);

  try {
    const rewardTx = await signer.sendTransaction({
      to: user,
      value: rewardAmount,
    });
    const rewardReceipt = await rewardTx.wait();

    toast.success(`🎁 ${rewardHuman} BTC reward sent to your wallet!`, {
      duration: 6000,
    });

    return {
      stakeHash,
      rewardHash: rewardReceipt?.hash ?? rewardTx.hash,
    };
  } catch (err: any) {
    console.error("BTC reward payout failed:", err);
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

export const sendMarketplaceBTCPayment = async (
  amountWei: bigint
): Promise<string> => {
  const { stakeHash } = await payWithBTC(amountWei);
  return stakeHash;
};
