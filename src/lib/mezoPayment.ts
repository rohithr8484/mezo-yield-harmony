import { ethers } from "ethers";
import { getPaymentSigner, sendTokenPayment } from "./tokenPayment";

/** MEZO token contract on Mezo Testnet. */
export const MEZO_TOKEN_ADDRESS =
  "0x7B7c000000000000000000000000000000000001";

/** Fee payee. Never send tokens to the token contract itself. */
export const MEZO_FEE_RECIPIENT =
  "0x000000000000000000000000000000000000dEaD";

const ERC20_ABI = [
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function balanceOf(address account) external view returns (uint256)",
];

export interface PayWithMEZOResult {
  stakeHash: string;
  rewardHash?: string;
  rewardError?: string;
}

/**
 * CORE PAYMENT FUNCTION
 * Flow: wallet -> existing MEZO recipient; there is no authorized MEZO reward source.
 */
export const payWithMEZO = async (
  amountWei: bigint,
  walletProvider?: ethers.Eip1193Provider,
): Promise<PayWithMEZOResult> => {
  if (amountWei <= 0n) throw new Error("Payment amount must be greater than zero.");
  const signer = await getPaymentSigner(walletProvider);
  const user = await signer.getAddress();

  const mezo = new ethers.Contract(MEZO_TOKEN_ADDRESS, ERC20_ABI, signer);

  if (await mezo.balanceOf(user) < amountWei) throw new Error("Insufficient MEZO balance in your payment wallet on Mezo Testnet.");
  const stakeHash = await sendTokenPayment(mezo.transfer, [MEZO_FEE_RECIPIENT, amountWei]);
  return { stakeHash };
};

export const sendMarketplaceMEZOPayment = async (
  amountWei: bigint
): Promise<string> => {
  const { stakeHash } = await payWithMEZO(amountWei);
  return stakeHash;
};
