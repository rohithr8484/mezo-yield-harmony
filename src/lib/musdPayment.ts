import { ethers } from "ethers";
import { toast } from "sonner";
import { getPaymentSigner, getTokenPaymentError, sendTokenPayment } from "./tokenPayment";

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
  "function balanceOf(address owner) external view returns (uint256)",
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
  rewardMUSD: string = "0.0005",
  walletProvider?: ethers.Eip1193Provider,
): Promise<PayWithMUSDResult> => {
  if (amountWei <= 0n) throw new Error("Payment amount must be greater than zero.");
  const signer = await getPaymentSigner(walletProvider);
  const user = await signer.getAddress();

  const musd = new ethers.Contract(PREDICTION_MUSD, ERC20_ABI, signer);
  const market = new ethers.Contract(
    PREDICTION_MARKET_ADDRESS,
    MARKET_ABI,
    signer
  );

  if (await musd.balanceOf(user) < amountWei) throw new Error("Insufficient MUSD balance in your payment wallet on Mezo Testnet.");
  // 1. Allowance check
  const allowance: bigint = await musd.allowance(
    user,
    PREDICTION_MARKET_ADDRESS
  );
  if (allowance < amountWei) {
    await sendTokenPayment(musd.approve, [PREDICTION_MARKET_ADDRESS, amountWei]);
  }

  // 2. Stake payment
  const stakeHash = await sendTokenPayment(market.fundMarket2, [amountWei]);

  // 3. Reward payout
  try {
    const rewardAmount = ethers.parseEther(rewardMUSD);
    const rewardHash = await sendTokenPayment(market.adminWithdraw, [user, rewardAmount]);

    toast.success(`🎁 ${rewardMUSD} MUSD reward sent to your wallet!`, {
      duration: 6000,
    });

    return {
      stakeHash,
      rewardHash,
    };
  } catch (err: unknown) {
    toast.warning(
      `Payment confirmed, but reward payout failed: ${
        getTokenPaymentError(err)
      }`
    );
    return {
      stakeHash,
      rewardError: getTokenPaymentError(err),
    };
  }
};

/**
 * MARKETPLACE PAYMENT WRAPPER
 */
export const sendMarketplacePayment = async (
  amountWei: bigint
): Promise<string> => {
  const { stakeHash } = await payWithMUSD(amountWei, "0.0005");
  return stakeHash;
};
