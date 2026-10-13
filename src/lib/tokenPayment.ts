import { ethers } from "ethers";

export const PAYMENT_CHAIN_ID = 31611;
const PAYMENT_RPC = "https://rpc.test.mezo.org";

export async function getPaymentSigner(walletProvider?: ethers.Eip1193Provider) {
  const injected = (window as Window & { ethereum?: ethers.Eip1193Provider }).ethereum;
  const wallet = walletProvider ?? injected;
  if (!wallet) throw new Error("Connect a wallet before paying.");
  const chainHex = ethers.toQuantity(PAYMENT_CHAIN_ID);
  if (Number(await wallet.request({ method: "eth_chainId" })) !== PAYMENT_CHAIN_ID) {
    await wallet.request({ method: "wallet_switchEthereumChain", params: [{ chainId: chainHex }] });
  }
  if (Number(await wallet.request({ method: "eth_chainId" })) !== PAYMENT_CHAIN_ID) {
    throw new Error("Switch your payment wallet to Mezo Testnet before paying.");
  }
  const provider = new ethers.BrowserProvider(wallet);
  await provider.send("eth_requestAccounts", []);
  return provider.getSigner();
}

interface Receipt {
  status: number | null;
  hash: string;
}

interface SentTransaction {
  hash: string;
  wait: () => Promise<Receipt | null>;
}

/** A wallet history label is not a receipt; unlock only on a successful receipt. */
export async function confirmPaymentTransaction(
  transaction: SentTransaction,
  readReceipt: (hash: string) => Promise<Receipt | null> = async (hash) => {
    const rpc = new ethers.JsonRpcProvider(PAYMENT_RPC, PAYMENT_CHAIN_ID, { staticNetwork: true });
    try {
      return await rpc.getTransactionReceipt(hash);
    } finally {
      rpc.destroy();
    }
  },
): Promise<string> {
  let receipt: Receipt | null;
  try {
    receipt = await transaction.wait();
  } catch (error) {
    // Wallet RPCs can fail after broadcasting. Never resend an already confirmed payment.
    receipt = await readReceipt(transaction.hash).catch(() => null);
    if (!receipt) {
      if (ethers.isError(error, "TRANSACTION_REPLACED")) {
        if (error.cancelled) throw new Error("Payment transaction was cancelled or replaced. No access was unlocked.");
        receipt = error.receipt;
      } else {
        throw new Error(`Payment confirmation is unavailable. Check transaction ${transaction.hash} in the explorer before paying again.`);
      }
    }
  }
  if (!receipt) throw new Error(`Payment is not confirmed yet. Check transaction ${transaction.hash} before paying again.`);
  if (receipt.status !== 1) throw new Error(`Payment reverted on-chain. Transaction: ${receipt.hash}`);
  return receipt.hash;
}

/** Simulate before requesting a signature and leave headroom above the RPC estimate. */
export async function sendTokenPayment(method: ethers.BaseContractMethod, args: unknown[]): Promise<string> {
  const result = await method.staticCall(...args);
  if (result === false) throw new Error("The token rejected this payment. No transfer was submitted.");
  const estimate: bigint = await method.estimateGas(...args);
  const transaction = await method(...args, { gasLimit: (estimate * 130n + 99n) / 100n });
  return confirmPaymentTransaction(transaction);
}

export function getTokenPaymentError(error: unknown): string {
  const messages: string[] = [];
  const codes: unknown[] = [];
  const seen = new Set<unknown>();
  const visit = (value: unknown) => {
    if (!value || typeof value !== "object" || seen.has(value)) return;
    seen.add(value);
    const record = value as Record<string, unknown>;
    codes.push(record.code);
    for (const key of ["reason", "shortMessage", "message"]) {
      if (typeof record[key] === "string") messages.push(record[key]);
    }
    for (const key of ["cause", "error", "info", "data"]) visit(record[key]);
  };
  visit(error);
  const text = messages.join(" ").toLowerCase();
  if (codes.includes(4001) || codes.includes("ACTION_REJECTED") || /rejected|denied|cancelled/.test(text)) return "Payment cancelled in your wallet.";
  if (codes.includes("INSUFFICIENT_FUNDS") || /insufficient funds|insufficient.*gas/.test(text)) return "Your payment wallet needs test BTC for transaction fees, even when paying with MEZO or MUSD.";
  if (/insufficient.*balance|exceeds balance/.test(text)) return "Your payment wallet does not have enough of this exact token on Mezo Testnet.";
  if (/allowance/.test(text)) return "Token approval is insufficient. Confirm approval for this payment wallet on Mezo Testnet.";
  return messages.find((message) => /confirmation|confirmed|transaction|switch|connect|token rejected|balance/.test(message.toLowerCase())) ?? messages[0] ?? "Payment failed. Check your wallet’s transaction details before trying again.";
}