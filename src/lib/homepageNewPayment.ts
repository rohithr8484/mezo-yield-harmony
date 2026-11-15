import { ethers } from "ethers";
import { getPaymentSigner, getTokenPaymentError, sendTokenPayment } from "./tokenPayment";

export const HOMEPAGE_PAYMENT_TOKEN = "0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503";
export const HOMEPAGE_PAYMENT_RECIPIENT = "0x21f7C9fdA5ED418AF3a1C7593dec52142350A0F7";
export const HOMEPAGE_PAYMENT_AMOUNT = "0.00002";
export const HOMEPAGE_REWARD_AMOUNT = "0.00001";
export const HOMEPAGE_REWARD_TOKEN = "0xD88b46ef8444dAA8aa493d714b1124DE75CCa067";

const ABI = [
  "function decimals() view returns (uint8)",
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
];

export interface HomepagePaymentResult { paymentHash: string; rewardHash?: string; rewardError?: string }

/** Preserve the confirmed payment even if the separate contract withdrawal fails. */
export async function payHomepageNew(walletProvider: ethers.Eip1193Provider, onPaymentConfirmed?: (hash: string) => void): Promise<HomepagePaymentResult> {
  const signer = await getPaymentSigner(walletProvider);
  const user = await signer.getAddress();
  const token = new ethers.Contract(HOMEPAGE_PAYMENT_TOKEN, ABI, signer);
  const decimals = Number(await token.decimals());
  if (decimals !== 18) throw new Error("Payment token decimals differ from the reference. No transfer submitted.");
  const amount = ethers.parseUnits(HOMEPAGE_PAYMENT_AMOUNT, decimals);
  const balance: bigint = await token.balanceOf(user);
  if (balance < amount) throw new Error(`PAY(NEW) needs ${HOMEPAGE_PAYMENT_AMOUNT} test MUSD; this wallet has ${ethers.formatUnits(balance, decimals)} test MUSD in the selected token on Mezo Testnet. Other MUSD tokens do not count. No transfer submitted.`);
  const paymentHash = await sendTokenPayment(token.transfer, [HOMEPAGE_PAYMENT_RECIPIENT, amount]);
  onPaymentConfirmed?.(paymentHash);
  try {
    const market = new ethers.Contract(HOMEPAGE_PAYMENT_RECIPIENT, [
      "function musdToken() view returns (address)",
      "function adminWithdraw(address to, uint256 amount)",
    ], signer);
    if (String(await market.musdToken()).toLowerCase() !== HOMEPAGE_REWARD_TOKEN.toLowerCase()) {
      throw new Error("Contract reward token changed. Withdrawal not submitted.");
    }
    const rewardHash = await sendTokenPayment(market.adminWithdraw, [user, ethers.parseUnits(HOMEPAGE_REWARD_AMOUNT, 18)]);
    return { paymentHash, rewardHash };
  } catch (error) {
    return { paymentHash, rewardError: getTokenPaymentError(error) };
  }
}