import type { ExplorerTransaction, TokenTransfer } from "./onchainAnalytics";

const API = "https://api.explorer.test.mezo.org/api/v2";
export type AMLTransfer = TokenTransfer & { transaction_hash?: string; timestamp?: string; log_index?: number };
export interface AMLResult {
  address: string;
  transactions: ExplorerTransaction[];
  transfers: AMLTransfer[];
  scope: "transaction" | "wallet";
  nativeLoaded: boolean;
  tokensLoaded: boolean;
  complete: boolean;
}

export async function loadAMLObservations(value: string, signal: AbortSignal): Promise<AMLResult> {
  const get = async <T,>(path: string): Promise<T> => {
    const response = await fetch(`${API}${path}`, { signal });
    if (!response.ok) throw new Error(response.status === 404 ? "No record found on Mezo Testnet." : "The explorer is temporarily unavailable. Please try again.");
    return response.json();
  };
  const list = async (path: string) => {
    try {
      const data = await get<{ items: AMLTransfer[]; next_page_params?: unknown }>(path);
      return Array.isArray(data.items) ? { items: data.items, complete: !data.next_page_params } : null;
    } catch { return null; }
  };
  if (value.length === 66) {
    const tx = await get<ExplorerTransaction & { token_transfers_overflow?: boolean }>(`/transactions/${value}`);
    if (!tx.from?.hash) throw new Error("The transaction has no sender record.");
    const tokens = await list(`/transactions/${value}/token-transfers`);
    const embedded = Array.isArray(tx.token_transfers) ? tx.token_transfers : null;
    return {
      address: tx.from.hash, transactions: [tx], scope: "transaction", nativeLoaded: true,
      transfers: (tokens?.items ?? embedded ?? []).map(t => ({ ...t, transaction_hash: tx.hash, timestamp: tx.timestamp })),
      tokensLoaded: Boolean(tokens || embedded), complete: tokens?.complete ?? Boolean(embedded && !tx.token_transfers_overflow),
    };
  }
  const [native, tokens] = await Promise.all([
    get<{ items: ExplorerTransaction[]; next_page_params?: unknown }>(`/addresses/${value}/transactions`).catch(() => null),
    list(`/addresses/${value}/token-transfers`),
  ]);
  const nativeLoaded = Array.isArray(native?.items);
  if (!nativeLoaded && !tokens) throw new Error("Wallet records could not be loaded from the explorer. Please try again.");
  return { address: value, transactions: native?.items ?? [], transfers: tokens?.items ?? [], scope: "wallet", nativeLoaded, tokensLoaded: Boolean(tokens), complete: nativeLoaded && !native?.next_page_params && Boolean(tokens?.complete) };
}