import { finiteNumber, type ExplorerTransaction } from "./onchainAnalytics";
import type { AMLTransfer } from "./amlExplorer";
import { kmeans } from "ml-kmeans";
import { summarizeObservationScore } from "./observationScore";

export function deriveAMLScreeningScore(observation: ReturnType<typeof deriveAMLPayments>, address: string) {
  const rows = assessAMLBehavior(observation, address);
  const wallet = address.toLowerCase();
  const timedByAsset = new Map<string, Set<string>>();
  for (const flow of observation.flows) {
    if (flow.amount === null || !Number.isFinite(flow.amount) || flow.amount <= 0 || !Number.isFinite(Date.parse(flow.timestamp ?? "")) || flow.asset.startsWith("unknown-") || (flow.from.toLowerCase() !== wallet && flow.to.toLowerCase() !== wallet)) continue;
    const hashes = timedByAsset.get(flow.asset) ?? new Set<string>();
    hashes.add(flow.hash.toLowerCase());
    timedByAsset.set(flow.asset, hashes);
  }
  const canCompare = [...timedByAsset.values()].some(hashes => hashes.size >= 2);
  return summarizeObservationScore([
    { index: 0, weight: 40 }, { index: 1, weight: 25 }, { index: 4, weight: 25 }, { index: 5, weight: 10 },
  ].map(({ index, weight }) => {
    const row = rows[index];
    return { name: row?.name ?? "Unavailable check", weight, available: index === 0 ? row?.status !== "No cluster flagged · limited sample" : canCompare, triggered: row?.status === "Pattern observed" || row?.status === "Review pattern", evidence: row?.evidence ?? "No evidence available." };
  }));
}

export function assessStructuringRisk(observation: ReturnType<typeof deriveAMLPayments>, address: string) {
  const wallet = address.toLowerCase();
  const groups = new Map<string, typeof observation.flows>();
  for (const flow of observation.flows) {
    if (flow.from.toLowerCase() !== wallet || flow.to.toLowerCase() === wallet || flow.to.toLowerCase() === "0x0000000000000000000000000000000000000000" || flow.amount === null || !Number.isFinite(flow.amount) || flow.amount <= 0 || !Number.isFinite(Date.parse(flow.timestamp ?? "")) || flow.asset.startsWith("unknown-")) continue;
    const group = groups.get(flow.asset) ?? [];
    group.push(flow);
    groups.set(flow.asset, group);
  }
  let assessed = 0;
  let burstCandidate: typeof observation.flows = [];
  let pairCandidate: typeof observation.flows = [];
  let singleCandidate: typeof observation.flows = [];
  // Fixed round-figure heuristic: an amount with at most two significant digits (0.2, 1.5, 0.001…).
  const significantFigures = (value: number) => {
    const mantissa = Math.abs(value).toExponential().split("e")[0].replace(/[-.]/g, "").replace(/0+$/, "");
    return mantissa.length || 1;
  };
  for (const asset of [...groups.keys()].sort()) {
    // One point per transaction: multiple logs from a single payment are not a burst.
    const distinct = [...new Map(groups.get(asset)!.map(flow => [flow.hash.toLowerCase(), flow])).values()]
      .sort((a, b) => Date.parse(a.timestamp ?? "") - Date.parse(b.timestamp ?? "") || a.hash.localeCompare(b.hash));
    assessed++;
    const amounts = distinct.map(flow => Math.log10(flow.amount ?? 1));
    const times = distinct.map(flow => Date.parse(flow.timestamp ?? ""));
    const scale = (values: number[]) => {
      const min = Math.min(...values), range = Math.max(...values) - min;
      return values.map(value => range > 0 ? (value - min) / range : 0);
    };
    const scaledAmounts = scale(amounts), scaledTimes = scale(times);
    const points = distinct.map((_, i) => [scaledAmounts[i], scaledTimes[i]]);
    const uniquePoints = new Set(points.map(point => point.join(","))).size;
    const assignments = uniquePoints > 1 ? kmeans(points, Math.min(2, uniquePoints), { seed: 42, maxIterations: 50 }).clusters : points.map(() => 0);
    for (const cluster of new Set(assignments)) {
      const members = distinct.filter((_, i) => assignments[i] === cluster);
      for (const start of members) {
        const burst = members.filter(flow => {
          const elapsed = Date.parse(flow.timestamp ?? "") - Date.parse(start.timestamp ?? "");
          const ratio = (flow.amount ?? 0) / (start.amount ?? 1);
          return elapsed >= 0 && elapsed <= 3600000 && ratio >= 0.9 && ratio <= 1.1;
        });
        if (burst.length >= 3 && new Set(burst.map(flow => flow.to.toLowerCase())).size >= 2 && burst.length > burstCandidate.length) burstCandidate = burst;
      }
    }
    for (let i = 0; i < distinct.length && !pairCandidate.length; i++) {
      for (let j = i + 1; j < distinct.length; j++) {
        const a = distinct[i], b = distinct[j];
        const elapsed = Date.parse(b.timestamp ?? "") - Date.parse(a.timestamp ?? "");
        const ratio = (b.amount ?? 0) / (a.amount ?? 1);
        if (elapsed >= 0 && elapsed <= 3600000 && ratio >= 0.9 && ratio <= 1.1 && a.to.toLowerCase() !== b.to.toLowerCase()) {
          pairCandidate = [a, b];
          break;
        }
      }
    }
    if (distinct.length === 1 && significantFigures(distinct[0].amount ?? 0) <= 2) singleCandidate = distinct;
  }
  const candidate = burstCandidate.length ? burstCandidate : pairCandidate.length ? pairCandidate : singleCandidate;
  const limits = "Exploratory unsupervised ML (k-means) plus fixed round-figure and interval heuristics, not a calibrated laundering probability. No fiat reporting threshold or jurisdiction supplied; repeated or round-figure payments can be legitimate. Recent loaded records only; missing amounts/times and same-transaction logs are excluded.";
  const status = candidate.length ? "Review pattern" : assessed ? "No cluster flagged" : "No cluster flagged · limited sample";
  const evidence = burstCandidate.length
    ? `${burstCandidate.length} distinct outgoing ${burstCandidate[0]?.symbol ?? "asset"} transactions in an ML cluster have similar amounts (±10%) within 60 minutes to ${new Set(burstCandidate.map(flow => flow.to.toLowerCase())).size} recipients.`
    : pairCandidate.length
      ? `${pairCandidate.length} distinct outgoing ${pairCandidate[0]?.symbol ?? "asset"} transactions have similar amounts (±10%) within 60 minutes to different recipients.`
      : singleCandidate.length
        ? `Single outgoing ${singleCandidate[0]?.symbol ?? "asset"} transaction of ${singleCandidate[0]?.amount ?? "an unknown amount"} flagged for review under the fixed round-figure single-payment check.`
        : assessed
          ? `${assessed} asset sample(s) assessed; no ML cluster or review heuristic was met. This does not establish low risk.`
          : "No outgoing transactions with known amounts, timestamps and a recognized asset were loaded for this wallet.";
  return { status, evidence, limits, hashes: candidate.map(flow => flow.hash), assessedAssets: assessed };
}

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

export function assessAMLBehavior(observation: ReturnType<typeof deriveAMLPayments>, address: string) {
  const wallet = address.toLowerCase();
  const timed = observation.flows.filter(f => f.amount !== null && f.amount > 0 && Number.isFinite(Date.parse(f.timestamp ?? "")));
  const time = (f: typeof timed[number]) => Date.parse(f.timestamp ?? "");
  const paired = (a: typeof timed[number], b: typeof timed[number]) => a.asset === b.asset && a.hash !== b.hash && time(b) >= time(a) && time(b) - time(a) <= 3600000;
  const incoming = timed.filter(f => f.to.toLowerCase() === wallet && f.from.toLowerCase() !== wallet);
  const outgoing = timed.filter(f => f.from.toLowerCase() === wallet && f.to.toLowerCase() !== wallet);
  const passThrough = incoming.filter(a => outgoing.some(b => paired(a, b) && a.amount === b.amount)).length;
  const roundTrips = outgoing.filter(a => incoming.some(b => paired(a, b) && a.to.toLowerCase() === b.from.toLowerCase() && a.amount === b.amount)).length;
  const zero = "0x0000000000000000000000000000000000000000";
  const mints = incoming.filter(f => f.kind === "token" && f.from.toLowerCase() === zero);
  const dispersals = mints.filter(a => outgoing.some(b => paired(a, b))).length;
  const outcome = (count: number) => count > 0 ? "Pattern observed" : timed.length > 1 ? "No matching pattern in sample" : "No matching pattern · limited sample";
  const structuring = assessStructuringRisk(observation, address);
  return [
    { name: "Structuring (smurfing) below reporting threshold", status: structuring.status, evidence: `${structuring.evidence} Below-threshold intent cannot be determined without fiat valuation and jurisdiction.` },
    { name: "Rapid pass-through / peeling chain", status: outcome(passThrough), evidence: `${passThrough} incoming leg(s) followed by an equal-amount outgoing leg of the same asset within 60 minutes. A peeling chain is not established.` },
    { name: "Mixer / tumbler exposure", status: "Cannot determine", evidence: "No verified mixer-address labels or downstream tracing available." },
    { name: "Cross-chain bridge layering", status: "Cannot determine", evidence: "No verified bridge labels or cross-chain records; contract interaction alone does not establish layering." },
    { name: "High-velocity round-trip transfers", status: outcome(roundTrips), evidence: `${roundTrips} outgoing leg(s) followed by an equal-amount return from the same counterparty in the same asset within 60 minutes; not proof of laundering.` },
    { name: "Token minting → instant dispersal", status: outcome(dispersals), evidence: `${dispersals} zero-address token receipt(s) followed by an outgoing leg of that asset within 60 minutes; not traced provenance or proof of abuse.` },
  ];
}

export function deriveAMLPayments(address: string, transactions: ExplorerTransaction[], transfers: AMLTransfer[]) {
  const native = derivePaymentScreening(address, transactions);
  const failedHashes = new Set(transactions.filter(t => t.status !== "ok").map(t => t.hash.toLowerCase()));
  const tokenFlows = transfers.filter(t => t.from?.hash && t.to?.hash && t.transaction_hash && !failedHashes.has(t.transaction_hash.toLowerCase())).map((t, index) => {
    const raw = finiteNumber(t.total?.value);
    const decimals = finiteNumber(t.total?.decimals ?? t.token?.decimals);
    return { id: `${t.transaction_hash}-${t.log_index ?? index}`, hash: t.transaction_hash ?? "", from: t.from?.hash ?? "", to: t.to?.hash ?? "", fromContract: Boolean(t.from?.is_contract), toContract: Boolean(t.to?.is_contract), asset: t.token?.address_hash ?? t.token?.address ?? `unknown-${index}`, symbol: t.token?.symbol ?? "Unknown token", amount: raw !== null && decimals !== null && decimals <= 255 ? raw / 10 ** decimals : null, timestamp: t.timestamp, kind: "token" as const };
  });
  const flows = [...native.flows.map(t => ({ ...t, id: t.hash, fromContract: Boolean(transactions.find(tx => tx.hash === t.hash)?.from?.is_contract), toContract: Boolean(transactions.find(tx => tx.hash === t.hash)?.to?.is_contract), asset: "native-btc", symbol: "BTC", amount: Number(t.value) / 1e18, kind: "native" as const })), ...tokenFlows];
  const assets = new Map<string, { asset: string; symbol: string; total: number; count: number; known: boolean }>();
  for (const flow of flows) {
    const asset = assets.get(flow.asset) ?? { asset: flow.asset, symbol: flow.symbol, total: 0, count: 0, known: true };
    asset.count++;
    if (flow.amount === null) asset.known = false;
    else asset.total += flow.amount;
    assets.set(flow.asset, asset);
  }
  const times = transactions.filter(t => t.status === "ok" && t.timestamp).map(t => Date.parse(t.timestamp ?? "")).filter(Number.isFinite);
  const spanHours = times.length > 1 ? (Math.max(...times) - Math.min(...times)) / 3600000 : 0;
  const uniqueTransactions = new Set([...transactions.map(t => t.hash), ...tokenFlows.map(t => t.hash)]);
  const counterparties = new Set(flows.flatMap(t => [t.from.toLowerCase(), t.to.toLowerCase()]).filter(a => a !== address.toLowerCase()));
  return { ...native, flows, assets: [...assets.values()], tokenCount: tokenFlows.length, transactionCount: uniqueTransactions.size, flowCounterparties: counterparties.size, hourlyRate: spanHours > 0 ? times.length / spanHours : null };
}