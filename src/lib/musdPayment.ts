import { ethers } from "ethers";
import { toast } from "sonner";

/**
 * Contracts
 */
export const PREDICTION_MARKET_ADDRESS =
  "0x21f7C9fdA5ED418AF3a1C7593dec52142350A0F7";
export const PREDICTION_MUSD =
  "0xD88b46ef8444dAA8aa493d714b1124DE75CCa067";

/**
 * ABIs
 */
const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
];

const MARKET_ABI = [
  "function fundMarket2(uint256 amount) external",
  "function adminWithdraw(address to, uint256 amount) external",
];

export interface PayWithMUSDResult {
  stakeHash: string;
  rewardHash?: string;
  rewardError?: string;
}

/**
 * CORE PAYMENT FUNCTION
 * Flow: wallet -> contract (stake via fundMarket2) -> wallet (reward via adminWithdraw)
 */
export const payWithMUSD = async (
  amountWei: bigint,
  rewardMUSD: string = "0.5"
): Promise<PayWithMUSDResult> => {
  const eth = (window as any).ethereum;
  if (!eth) throw new Error("No wallet found. Please install MetaMask.");

  const provider = new ethers.BrowserProvider(eth);
  await provider.send("eth_requestAccounts", []);
  const signer = await provider.getSigner();
  const user = await signer.getAddress();

  const musd = new ethers.Contract(PREDICTION_MUSD, ERC20_ABI, signer);
  const market = new ethers.Contract(
    PREDICTION_MARKET_ADDRESS,
    MARKET_ABI,
    signer
  );

  // 1. Allowance check
  const allowance: bigint = await musd.allowance(
    user,
    PREDICTION_MARKET_ADDRESS
  );
  if (allowance < amountWei) {
    const approveTx = await musd.approve(PREDICTION_MARKET_ADDRESS, amountWei);
    await approveTx.wait();
  }

  // 2. Stake payment
  const stakeTx = await market.fundMarket2(amountWei);
  const stakeReceipt = await stakeTx.wait();
  const stakeHash = stakeReceipt?.hash ?? stakeTx.hash;

  // 3. Reward payout
  try {
    const rewardAmount = ethers.parseEther(rewardMUSD);
    const rewardTx = await market.adminWithdraw(user, rewardAmount);
    const rewardReceipt = await rewardTx.wait();

    toast.success(`🎁 ${rewardMUSD} MUSD reward sent to your wallet!`, {
      duration: 6000,
    });

    return {
      stakeHash,
      rewardHash: rewardReceipt?.hash ?? rewardTx.hash,
    };
  } catch (err: any) {
    console.error("Reward payout failed:", err);
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

/**
 * MARKETPLACE PAYMENT WRAPPER
 */
export const sendMarketplacePayment = async (
  amountWei: bigint
): Promise<string> => {
  const { stakeHash } = await payWithMUSD(amountWei, "0.5");
  return stakeHash;
};
