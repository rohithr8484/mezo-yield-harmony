export type ProposalStatus = "Open for voting" | "Passed" | "Executed" | "Failed";

export interface TopVoter {
  address: string;
  displayName: string;
  vote: "YAE" | "NAY";
  amount: number;
}

export interface Proposal {
  id: string;
  title: string;
  author: string;
  summary: string;
  motivation: string;
  specification: string;
  status: ProposalStatus;
  yae: number;
  yaePct: number;
  nay: number;
  nayPct: number;
  token: string;
  quorum: number;
  quorumRequired: number;
  differential: number;
  differentialRequired: number;
  topVoters: TopVoter[];
}

export const proposals: Proposal[] = [
  {
    id: "MIP-045",
    title: "Increase BTC collateral ratio to 150% for enhanced protocol safety",
    author: "Mezo Core (@mezocore)",
    summary: "This proposal increases the BTC collateral ratio from 130% to 150% to provide additional safety margins during periods of high volatility, protecting MUSD peg stability.",
    motivation: "Following recent market turbulence and liquidation cascades across DeFi protocols, it has become clear that a higher collateral ratio is needed to ensure the protocol can withstand extreme volatility. The current 130% ratio, while functional under normal conditions, leaves insufficient margin during black swan events. By increasing to 150%, we provide a larger buffer that protects both borrowers and the MUSD peg.",
    specification: "Update the BTC collateral ratio parameter in the Mezo Vault contract from 130% to 150%. This change affects new positions only — existing positions will be grandfathered at the current ratio for a 30-day migration period. The liquidation threshold will be adjusted accordingly from 115% to 125%.",
    status: "Open for voting",
    yae: 245000,
    yaePct: 87.3,
    nay: 35600,
    nayPct: 12.7,
    token: "MEZO",
    quorum: 280600,
    quorumRequired: 200000,
    differential: 209400,
    differentialRequired: 80000,
    topVoters: [
      { address: "0xae3f...c4d2", displayName: "mezocore.eth", vote: "YAE", amount: 89200 },
      { address: "0x12ab...9f31", displayName: "defiwhale.eth", vote: "YAE", amount: 52100 },
      { address: "0x8c4e...a1b7", displayName: "0x8c4e...a1b7", vote: "YAE", amount: 34500 },
      { address: "0xf291...3e8c", displayName: "btcmaxi.eth", vote: "NAY", amount: 21300 },
      { address: "0x5d7a...b2f0", displayName: "0x5d7a...b2f0", vote: "YAE", amount: 18900 },
    ],
  },
  {
    id: "MIP-044",
    title: "Add wstETH as collateral asset on Mezo",
    author: "DeFi Committee (@deficommittee)",
    summary: "Proposal to add Lido's wrapped staked ETH (wstETH) as an accepted collateral type, expanding the range of assets that can back MUSD minting.",
    motivation: "Expanding collateral types beyond BTC increases protocol utility and attracts a broader user base. wstETH is a battle-tested, yield-bearing asset with deep liquidity and robust price feeds. Adding it as collateral allows ETH stakers to access MUSD liquidity without unwinding their staking positions.",
    specification: "Deploy a new wstETH Vault contract with initial parameters: collateral ratio 160%, liquidation threshold 135%, stability fee 2.5% APR. Integrate Chainlink wstETH/USD price feed. Set initial debt ceiling at 5M MUSD.",
    status: "Passed",
    yae: 373000,
    yaePct: 100,
    nay: 0,
    nayPct: 0,
    token: "MEZO",
    quorum: 373000,
    quorumRequired: 200000,
    differential: 373000,
    differentialRequired: 80000,
    topVoters: [
      { address: "0xae3f...c4d2", displayName: "mezocore.eth", vote: "YAE", amount: 112000 },
      { address: "0x7b2c...d4e1", displayName: "lidodao.eth", vote: "YAE", amount: 87500 },
      { address: "0x12ab...9f31", displayName: "defiwhale.eth", vote: "YAE", amount: 65200 },
      { address: "0x3f8e...c2a9", displayName: "0x3f8e...c2a9", vote: "YAE", amount: 41800 },
      { address: "0x9d1b...7f3e", displayName: "ethmaxi.eth", vote: "YAE", amount: 33200 },
    ],
  },
  {
    id: "MIP-043",
    title: "Treasury allocation for Q2 ecosystem grants program",
    author: "Grants Council (@grantcouncil)",
    summary: "Allocate 2M MEZO from the community treasury to fund Q2 ecosystem grants, supporting developer tooling, integrations, and community initiatives.",
    motivation: "The Q1 grants program successfully funded 12 projects that contributed to protocol growth, including 3 new integrations and 5 developer tools. Continuing this momentum requires renewed funding. The 2M MEZO allocation represents approximately 0.2% of the total supply and is expected to generate significant ROI through ecosystem expansion.",
    specification: "Transfer 2,000,000 MEZO from the Community Treasury multisig to the Grants Council multisig (0x7a2b...e4f1). Funds to be distributed across 4 categories: Developer Tooling (800K), Integrations (500K), Community Initiatives (400K), Security Audits (300K). Unspent funds roll over to Q3.",
    status: "Executed",
    yae: 559000,
    yaePct: 100,
    nay: 0,
    nayPct: 0,
    token: "MEZO",
    quorum: 559000,
    quorumRequired: 200000,
    differential: 559000,
    differentialRequired: 80000,
    topVoters: [
      { address: "0xae3f...c4d2", displayName: "mezocore.eth", vote: "YAE", amount: 156000 },
      { address: "0x12ab...9f31", displayName: "defiwhale.eth", vote: "YAE", amount: 98700 },
      { address: "0x7b2c...d4e1", displayName: "grantcouncil.eth", vote: "YAE", amount: 75000 },
      { address: "0x5d7a...b2f0", displayName: "0x5d7a...b2f0", vote: "YAE", amount: 62400 },
      { address: "0x8c4e...a1b7", displayName: "0x8c4e...a1b7", vote: "YAE", amount: 48300 },
    ],
  },
  {
    id: "MIP-042",
    title: "Reduce protocol swap fees from 0.30% to 0.25%",
    author: "TokenLogic (@tokenlogic)",
    summary: "Lower the base swap fee on the MUSD/BTC pool to increase volume and competitiveness against other DEX protocols on Mezo.",
    motivation: "Competitive analysis shows that rival DEXs on Mezo are offering swap fees as low as 0.20%. Our current 0.30% fee is resulting in volume leakage, with approximately 35% of potential swaps being routed through competitors. A reduction to 0.25% would recapture an estimated 15-20% of lost volume while maintaining healthy protocol revenue.",
    specification: "Update the swapFee parameter on the MUSD/BTC Pool contract (0x52e6...cefb) from 30 bps to 25 bps. This change takes effect immediately upon execution. Monitor volume metrics for 30 days post-implementation to assess impact.",
    status: "Open for voting",
    yae: 189000,
    yaePct: 73.5,
    nay: 68200,
    nayPct: 26.5,
    token: "MEZO",
    quorum: 257200,
    quorumRequired: 200000,
    differential: 120800,
    differentialRequired: 80000,
    topVoters: [
      { address: "0x3f8e...c2a9", displayName: "tokenlogic.eth", vote: "YAE", amount: 64000 },
      { address: "0xf291...3e8c", displayName: "btcmaxi.eth", vote: "NAY", amount: 45200 },
      { address: "0x12ab...9f31", displayName: "defiwhale.eth", vote: "YAE", amount: 38700 },
      { address: "0x9d1b...7f3e", displayName: "0x9d1b...7f3e", vote: "NAY", amount: 23000 },
      { address: "0xae3f...c4d2", displayName: "mezocore.eth", vote: "YAE", amount: 19800 },
    ],
  },
  {
    id: "MIP-041",
    title: "Deploy Mezo Gauge Controller v2 with veBoost integration",
    author: "Mezo Labs (@mezolabs)",
    summary: "Upgrade the gauge controller to v2 which integrates veBoost mechanics, allowing veMEZO lockers to receive amplified gauge voting power based on lock duration.",
    motivation: "The current gauge controller lacks incentive alignment between long-term lockers and short-term participants. By integrating veBoost mechanics, we create a system where users who commit to longer lock durations receive proportionally greater influence over gauge weight allocation. This aligns individual incentives with long-term protocol health.",
    specification: "Deploy GaugeControllerV2 contract with veBoost multipliers: 1 year lock = 1x, 2 years = 1.5x, 3 years = 2x, 4 years = 3x boost. Migrate all existing gauge weights to the new controller. Deprecate GaugeControllerV1 after a 14-day migration window.",
    status: "Passed",
    yae: 412000,
    yaePct: 96.8,
    nay: 13600,
    nayPct: 3.2,
    token: "MEZO",
    quorum: 425600,
    quorumRequired: 200000,
    differential: 398400,
    differentialRequired: 80000,
    topVoters: [
      { address: "0xae3f...c4d2", displayName: "mezolabs.eth", vote: "YAE", amount: 134000 },
      { address: "0x12ab...9f31", displayName: "defiwhale.eth", vote: "YAE", amount: 89300 },
      { address: "0x7b2c...d4e1", displayName: "0x7b2c...d4e1", vote: "YAE", amount: 56700 },
      { address: "0x5d7a...b2f0", displayName: "0x5d7a...b2f0", vote: "YAE", amount: 42100 },
      { address: "0xf291...3e8c", displayName: "btcmaxi.eth", vote: "NAY", amount: 13600 },
    ],
  },
  {
    id: "MIP-040",
    title: "Emergency parameter adjustment for MUSD stability module",
    author: "Risk Team (@riskteam)",
    summary: "Emergency proposal to adjust the MUSD Peg Stability Module parameters in response to recent market conditions, ensuring the stablecoin remains tightly pegged.",
    motivation: "Over the past 72 hours, MUSD has traded at a persistent discount of 0.3-0.5% below peg due to a large redemption event. The current PSM parameters are insufficient to restore peg in a timely manner. Adjusting the PSM fee structure and increasing the buffer size will enable faster peg restoration and prevent similar depegging events.",
    specification: "Update PSM parameters: reduce mint fee from 0.1% to 0.05%, increase redemption fee from 0.1% to 0.15%, increase PSM buffer from 1M MUSD to 3M MUSD. These changes aim to incentivize minting (increasing supply) while slightly discouraging redemptions during the recovery period.",
    status: "Failed",
    yae: 98000,
    yaePct: 34.2,
    nay: 188500,
    nayPct: 65.8,
    token: "MEZO",
    quorum: 286500,
    quorumRequired: 200000,
    differential: 90500,
    differentialRequired: 80000,
    topVoters: [
      { address: "0xf291...3e8c", displayName: "btcmaxi.eth", vote: "NAY", amount: 78200 },
      { address: "0x9d1b...7f3e", displayName: "0x9d1b...7f3e", vote: "NAY", amount: 54300 },
      { address: "0xae3f...c4d2", displayName: "riskteam.eth", vote: "YAE", amount: 45000 },
      { address: "0x12ab...9f31", displayName: "defiwhale.eth", vote: "NAY", amount: 38900 },
      { address: "0x3f8e...c2a9", displayName: "0x3f8e...c2a9", vote: "YAE", amount: 28700 },
    ],
  },
];

export const statusStyles: Record<ProposalStatus, string> = {
  "Open for voting": "border-emerald-500/40 text-emerald-600 bg-emerald-500/5",
  "Passed": "border-emerald-500/40 text-emerald-600 bg-emerald-500/5",
  "Executed": "border-emerald-500/40 text-emerald-600 bg-emerald-500/5",
  "Failed": "border-destructive/40 text-destructive bg-destructive/5",
};

export function formatVotes(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  return n.toString();
}
