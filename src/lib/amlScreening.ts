import { finiteNumber, type ExplorerTransaction } from "./onchainAnalytics";

export function derivePaymentScreening(address: string, transactions: ExplorerTransaction[]) {
  const wallet = address.toLowerCase();
  const successful = transactions.filter(tx => tx.status === "ok");
  const outgoing = successful.filter(tx => tx.from?.hash?.toLowerCase() === wallet);
  const incoming = successful.filter(tx => tx.to?.hash?.toLowerCase() === wallet && tx.from?.hash?.toLowerCase() !== wallet);
  const peers = new Set<string>();
  for (const tx of successful) {
    const peer = tx.from?.hash?.toLowerCase() === wallet ? tx.to?.hash : tx.from?.hash;
    if (peer && peer.toLowerCase() !== wallet) peers.add(peer.toLowerCase());
  }
  const flows = successful.filter(tx => {
    const value = finiteNumber(tx.value);
    return value !== null && value > 0 && tx.from?.hash && tx.to?.hash && (tx.from.hash.toLowerCase() === wallet || tx.to.hash.toLowerCase() === wallet);
  }).map(tx => ({ hash: tx.hash, from: tx.from?.hash ?? "", to: tx.to?.hash ?? "", value: tx.value, timestamp: tx.timestamp }));
  const totalNative = (list: ExplorerTransaction[]) => {
    if (list.some(tx => finiteNumber(tx.value) === null)) return null;
    return list.reduce((sum, tx) => sum + Number(tx.value) / 1e18, 0);
  };
  return {
    sampled: transactions.length,
    successful: successful.length,
    failed: transactions.filter(tx => tx.status === "error").length,
    pending: transactions.filter(tx => tx.status == null).length,
    outgoing: outgoing.length,
    incoming: incoming.length,
    counterparties: peers.size,
    nativeOut: totalNative(outgoing),
    nativeIn: totalNative(incoming),
    bidirectional: outgoing.length > 0 && incoming.length > 0,
    flows,
  };
}