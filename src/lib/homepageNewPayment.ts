import { ethers } from "ethers";
import { getPaymentSigner, sendTokenPayment } from "./tokenPayment";

export const HOMEPAGE_PAYMENT_TOKEN = "0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503";
export const HOMEPAGE_PAYMENT_RECIPIENT = "0x21f7C9fdA5ED418AF3a1C7593dec52142350A0F7";
export const HOMEPAGE_PAYMENT_AMOUNT = "5";

const ABI = [
  "function decimals() view returns (uint8)",
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
];

/** Standalone reference transfer; no service unlock, approval, or reward. */
export async function payHomepageNew(walletProvider: ethers.Eip1193Provider): Promise<string> {
  const signer = await getPaymentSigner(walletProvider);
  const user = await signer.getAddress();
  const token = new ethers.Contract(HOMEPAGE_PAYMENT_TOKEN, ABI, signer);
  const decimals = Number(await token.decimals());
  if (decimals !== 18) throw new Error("Payment token decimals differ from the reference. No transfer submitted.");
  const amount = ethers.parseUnits(HOMEPAGE_PAYMENT_AMOUNT, decimals);
  const balance: bigint = await token.balanceOf(user);
  if (balance < amount) throw new Error(`PAY(NEW) needs 5 test MUSD; this wallet has ${ethers.formatUnits(balance, decimals)} test MUSD in the selected token on Mezo Testnet. Other MUSD tokens do not count. No transfer submitted.`);
  return sendTokenPayment(token.transfer, [HOMEPAGE_PAYMENT_RECIPIENT, amount]);
}