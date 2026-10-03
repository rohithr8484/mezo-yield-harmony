# 🏗️ Mezo Auth Dev - Infrastructure for Bitcoin DeFi using pay per use with MUSD/MEZO/BTC

Mezo Auth Dev is AWS-like infrastructure for Bitcoin-native Web3 on Mezo, powering an AI API marketplace (text summarization, wallet verification, smart contract simulation & risk analysis), real-time decentralized oracles (BTC/USD, MUSD/USD, cbBTC/USD, live charts, low-latency pricing), and DAO governance infrastructure (proposals, treasury signaling, protocol upgrades) — all settled with MEZO, MUSD, or BTC.

<img width="1774" height="887" alt="image" src="https://github.com/user-attachments/assets/e243ff5f-179c-457b-be80-f655c0fce20c" />

<p align="left">
  <img src="https://img.shields.io/badge/Bitcoin-orange?style=flat-square" />
  <img src="https://img.shields.io/badge/MEZO-blue?style=flat-square" />
  <img src="https://img.shields.io/badge/Infrastructure-green?style=flat-square" />
  <img src="https://img.shields.io/badge/Web3-purple?style=flat-square" />
  <img src="https://img.shields.io/badge/x402-pay%20per%20use-teal?style=flat-square" />
</p>

---

# ✨ Features

## 🔌 AI API Marketplace

Decentralized pay-per-use APIs for analytics, AI, and identity infrastructure — each with 4 free entries per user, then paid on Mezo Testnet.

### Included APIs

- AI-powered text summarization (focus chips: Liquidity, Lending, Wallet behavior, Governance)
- On-chain analytics APIs (liquidity, lending, wallet activity, risk signals)
- Wallet identity verification
- Smart contract simulation & AI risk analysis

---

## 📡 Data Feeds & Oracle Infrastructure

Real-time decentralized oracle infrastructure for Bitcoin DeFi applications. Each feed card carries a `Pay with x402` button; the feed unlocks as soon as the settlement is confirmed, and the button disappears once unlocked.

### Supported Feeds

- BTC/USD
- MUSD/USD
- cbBTC/USD
- Live charts and market data
- Low-latency decentralized pricing

---

## 🏛 Governance Infrastructure

Shape the future of Bitcoin finance through decentralized governance systems.

### Governance Features

- DAO proposals that persist across refresh, with live tallies from recorded votes only
- Treasury signaling systems
- Community-driven protocol upgrades
- 4 free Governance entries per user, then paid on Mezo Testnet
- Transparent community participation (no synthetic percentages or invented statistics)

---

# 🛠 Tech Stack

## Frontend

- **React 18** — Modern UI development
- **TypeScript** — Type-safe applications
- **Vite 5** — Dev server and build (port `8080`)
- **Tailwind CSS** — Utility-first styling
- **Radix UI / shadcn** — Accessible UI primitives

---

## Blockchain & Infrastructure

- **Wagmi + viem** — Web3 React hooks and contract calls
- **RainbowKit** — Wallet connection UI
- **@mezo-org/passport** — Mezo wallet integration
- **@x402/fetch + @x402/evm** — Pay-per-call HTTP payments
- **ethers.js** — Ethereum-compatible interactions
- **Pyth Network** — Oracle price feeds
- **Boar API / Mezo explorer** — Mezo infrastructure and analytics

---

## AI & Backend

- **Lovable Cloud functions** — `ai-summarize`, `governance-chat`, `ai-chat`, `ai-sentiment`, `boar-chat`
- **OpenAI-compatible models** — AI processing behind those functions
- **Browser local store** — proposal persistence, vote counts, free-entry allowances

---

# 🗺 App Map

| **Route** | **Screen** |
| --- | --- |
| `/` | Hero, Wavehack submission card, FAQs |
| `/governance` | Proposal list, token holders, gauge system |
| `/governance/:id` | Proposal detail, vote entry, payment, live results |
| `/developer-services` | API Marketplace, Data Feeds & Oracles |

---

# 🔮 Oracle Data Feeds

## Supported Markets

| **Feed** | **Feed ID** |
| --- | --- |
| **BTC/USD** | `0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43` |
| **MUSD/USD** | `0x0617a9b725011a126a2b9fd53563f4236501f32cf76d877644b943394606c6de` |
| **cbBTC/USD** | `0x2817d7bfe5c64b8ea956e9a26f573ef64e72e4d7891f2d6af9bcc93f7aff9a97` |

---

# 💳 How Payments Actually Work

There are **three separate money paths** in this app. They do not share contracts, and they do not share token addresses.

## Path 1 — MUSD & MEZO buttons (`src/lib/musdPayment.ts`, `src/lib/mezoPayment.ts`)

| Step | What happens | On-chain? |
| --- | --- | --- |
| 1 | `allowance` check, then `approve` if needed | Yes |
| 2 | `fundMarket2(amount)` on the market contract | Yes |
| 3 | `adminWithdraw(user, 0.05 MUSD)` reward back | Yes |

- Market contract: `0x21f7C9fdA5ED418AF3a1C7593dec52142350A0F7`
- MUSD used by that helper: `0xD88b46ef8444dAA8aa493d714b1124DE75CCa067`
- MEZO: `0x7B7c000000000000000000000000000000000001` — `transfer` to the token address, then half back as reward
- Reward: **0.05 MUSD** on MUSD payments; half the stake back on MEZO payments

> ⚠️ The MUSD address shown in the UI (`0x94FF830F078eb9c6e77bADe29FB46B1a249A5fd3`) is a **display constant** in `PaymentGate.tsx`, `proposals.ts`, and `mezo.ts`. The MUSD the payment helper actually moves is `0xD88b46…a067`. Aligning the two is a known cleanup item.

## Path 2 — BTC button (`src/lib/btcPayment.ts`)

Native BTC transfer to `0x000000000000000000000000000000000000dEaD`, then a self-transfer of half back to the user as the reward. The dead address is a landing point, not a treasury — it cannot send anything out.

## Path 3 — x402 (see the next section)

## What each payment costs

| **Surface** | **MUSD** | **MEZO** | **BTC** |
| --- | --- | --- | --- |
| API Marketplace services & data feeds | 0.2 | 0.2 | — |
| Governance entries (Developer Services) | 0.01 | 0.01 | 0.01 |
| Proposal vote fee | 0.2 | 0.2 | — |
| x402 per call | 0.001 test mUSD | — | — |

Every user gets **4 free entries per service** and **4 free Governance votes** before any payment is asked for.

---

# 🏛 Governance Contracts — How They Are Used

Three Solidity contracts live in `contracts/`. All three are **read-side or admin-side helpers**; none of them holds user payments.

| Contract | File | Purpose |
| --- | --- | --- |
| **GovernanceDataHelper** | `contracts/governance/GovernanceDataHelper.sol` | Read-only batched proposal view. `getProposalsBatch(ids)` and `getProposalsRange(from, to)` loop over `MezoGovernance.proposals()` + `state()` and return `id, proposer, title, category, forVotes, againstVotes, abstainVotes, state` in one RPC call. |
| **VotingDataHelper** | `contracts/governance/VotingDataHelper.sol` | Read-only vote analytics. `getReceiptsBatch(proposalId, voters)` returns each voter's `hasVoted / voteType / votes`; `getTurnout(proposalId)` returns totals plus For/Against/Abstain shares in basis points. Also `getMUSDBalance()` and `fundMarket(amount)`. |
| **MarketplaceAdmin** | `contracts/MarketplaceAdmin.sol` | Admin controls for the veNFT marketplace: `PAUSER_ROLE`, `FEE_MANAGER_ROLE`, `COLLECTION_MANAGER_ROLE`, emergency pause, collection whitelist, and a 48h timelocked fee change that calls `PaymentRouter.setProtocolFee()`. |

## Deploy wiring (`scripts/deploy.ts`, `scripts/deploy2.ts`)

```text
deploy.ts
  MezoGovernance(governanceToken)
      ├─▶ VotingDataHelper(governance)
      └─▶ GovernanceDataHelper(governance)
  MarketplaceAdmin(deployer, isTestnet)
  MezoLocks(governanceToken, governance)

deploy2.ts   (veNFT marketplace side)
  MezoVeNFTAdapter(veBTC, veMEZO)
  PaymentRouter(feeRecipient, admin, MUSD, feeBps)
  MarketplaceAdmin(admin, isTestnet)  ──▶ owns PaymentRouter admin
  VeNFTMarketplace(adapter, router, admin)
  → writes deployments/testnet.json
```

Each helper receives the governance address in its constructor, which is how it knows where to read from.

## What the live UI does today

- The Governance screens (proposal list, votes, results) run through the **browser local proposal store** (`src/lib/proposalStore.ts`) — proposals persist across refresh and tallies count only recorded votes.
- The two data helpers are the **on-chain layer those screens are designed to plug into**: proposal lists would come from `GovernanceDataHelper`, live tallies from `VotingDataHelper.getTurnout()`.
- Payment buttons and `Pay with x402` do **not** route through any of these contracts.

## Known gaps

- `VotingDataHelper` and `MarketplaceAdmin` hardcode MUSD as `0xbCAD6F09cb93a31a675B2E0156526B99CCdcF5Df` — a **third** MUSD address, different from both the UI display constant and the payment helper's token. It must be aligned before those contracts feed the live payment flow.
- `MarketplaceAdmin`'s `supportedCollections` whitelist is **advisory only** — the marketplace enforces collection support through `MezoVeNFTAdapter.isSupported()`.
- `scripts/deploy.ts` declares `MUSD_ADDRESS` / `LP_TOKEN_ADDRESS` / `FEE_COLLECTOR` but never passes them to a constructor; `MATS_TOKEN_ADDRESS` is `0x0`.
- No Hardhat config or `hardhat` dependency is present in this repo, so the deploy scripts are reference/ops scripts and need a Hardhat project around them to run.

---

# ⚡ x402 — How It Is Used (and How It Isn't)

## The three contracts in the path

| Contract | Address | Role |
| --- | --- | --- |
| **mUSD (x402)** | `0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503` | The ERC-20 being paid. |
| **Permit2** | `0x000000000022D473030F116dDEE9F6B43aC78BA3` | Canonical Uniswap contract that holds the allowance and verifies the signature. |
| **x402Permit2Proxy** | `0x8dea1b08dc2e1D9b556450f736F19968F367A98d` | The spender named in the signature. `settle(permit, transferDetails, owner, signature)` calls Permit2 to move mUSD to the payee. |

**None of these is written or deployed by this repo.** They are already deployed on Mezo Testnet, and no `.sol` file in `contracts/` mentions x402 or Permit2.

## What the app actually does (`src/components/developer/X402Banner.tsx`)

```text
1. read mUSD.allowance(user, Permit2)
2. if allowance == 0  →  mUSD.approve(Permit2, maxUint256)     ← the ONLY tx from your wallet
3. GET https://humor.vativ.io/joke  →  402 + PaymentRequirements
     (asset, amount, payTo, spender = the proxy)
4. ExactEvmScheme signs a PermitTransferFrom EIP-712 message
     domain = Permit2, chainId = 31611, spender = x402Permit2Proxy
5. retry the request with the base64 X-PAYMENT header
6. server's facilitator submits settle() on-chain and pays the gas
7. PAYMENT-RESPONSE header decoded → tx hash + receipt shown in the app
```

Notes:

- The proxy address **never appears in the app source** — it arrives inside the server's 402 requirements.
- The feed unlocks the moment settlement is confirmed (`onPaymentSuccess` → `feed-v2-<feed>`), and the `Pay with x402` button is hidden once the feed is unlocked.
- Step 2 is a real transaction and shows up in wallet activity and the explorer. Every payment after that is **signature only**, which is why the receipt points at the facilitator's settlement transaction rather than one from your wallet.
- No private key ever lives in the browser — the wallet signs; the only keys are server-side.

## Where the proxy is really called

`starter/facilitator/facilitator.ts` holds the only ABI for it in this repo:

- `POST /verify` — recovers the EIP-712 signer, checks owner / amount / deadline
- `POST /settle` — encodes `settle()`, estimates gas with a **×3 multiplier** (Mezo's `eth_estimateGas` omits the EIP-7623 calldata floor, so an unmultiplied estimate reverts), then sends with `FACILITATOR_PRIVATE_KEY`

Supporting files: `starter/server/humor-server.ts` (returns the 402 with `spender` = proxy and `payTo` = `PAYEE_ADDRESS`, then calls `/verify` and `/settle`), `starter/client/client.ts` (headless payer), `starter/2-server.ts` (package-driven version using `@x402/express` + `@x402/paywall`).

## What x402 does NOT do here

- No x402 contract was written or deployed for this project.
- The app never calls `proxy.settle()` or Permit2 directly, and never picks the payee — the `humor.vativ.io` server names it.
- The app does not run the local facilitator; it uses the live one behind that server. The three-terminal flow only runs when you start `starter/` yourself.
- x402 pays mUSD `0x1189…c503`, while the MUSD/MEZO/BTC buttons use different addresses — two separate money paths inside the same card.
- The governance contracts stay out of it entirely.

---

# 🌐 Infrastructure Marketplace

| **Product** | **Description** | **Tech Used** |
| --- | --- | --- |
| **AI Text Summarization API** | AI-powered document summarization with focus modes | Cloud function + AI model |
| **On-chain Analytics API** | Liquidity, lending, wallet activity, risk signals | Mezo explorer + APIs |
| **Identity Verification API** | Wallet verification infrastructure | Attestations + Web3 |
| **Smart Contract Analysis** | Simulation & AI risk analysis | AI + Solidity |
| **Oracle Data Feeds** | Real-time market pricing, x402 unlocked | Pyth + x402 + Permit2 |
| **DAO Governance** | Proposal and voting infrastructure | Solidity + React |

---

# 🔐 Wallet Integration

### Wallet Features

- Single `Connect Wallet` entry point
- Mezo Passport, RainbowKit, and injected EVM wallets
- Automatic switch to Mezo Testnet before any payment
- MUSD / MEZO / native BTC payment options
- Gasless x402 signing after a one-time approval

## Mezo Network Configuration

Connect your wallet to Mezo Testnet (RPC: https://rpc.test.mezo.org, chain ID 31611).

Get BTC + MEZO from faucet ( https://faucet.test.mezo.org/ )

Open Mezo website (testnet)

Deposit testnet BTC as collateral

Borrow → Mint MUSD

MUSD appears in your wallet

- **Network:** Mezo Testnet    **Chain ID:** `31611`
- **Gas token:** BTC
- **Explorer:** https://explorer.test.mezo.org

---

# 🚀 Quick Start

## App

```bash
# Clone repository
git clone https://github.com/rohithr8484/mezo-yield-harmony.git
cd mezo-yield-harmony

# Install dependencies
npm install

# Start development server
npm run dev
```

Open browser at:

```bash
http://localhost:8080
```

## x402 reference stack (optional)

```bash
cd starter
cp .env.example .env     # set PAYEE_ADDRESS

pnpm install
pnpm dev                 # step 1: free joke API
pnpm x402                # step 2: same API behind an x402 paywall
```

The full three-terminal flow (facilitator + humor server + client) is documented in `starter/README.md` and `starter/PERMIT2_FLOW.md`.

---

# ⚙️ Environment Variables

```
VITE_SUPABASE_PROJECT_ID=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_SUPABASE_URL=
```

`starter/` keeps its own `.env` files: `PAYEE_ADDRESS`, `FACILITATOR_PRIVATE_KEY`, `CLIENT_PRIVATE_KEY` — all server-side, never in the app.

---

# 📁 Folder Structure

| **Path** | **Contents** |
| --- | --- |
| `src/pages/` | `Index`, `Governance`, `ProposalDetail`, `DeveloperServices` |
| `src/components/developer/` | `PaymentGate`, `X402Banner`, `OnchainAnalytics`, `IdentityVerification`, `VeNFTMarketplace` |
| `src/lib/` | `proposalStore`, `proposals`, `musdPayment`, `mezoPayment`, `btcPayment`, `mezo` |
| `supabase/functions/` | `ai-summarize`, `governance-chat`, `ai-chat`, `ai-sentiment`, `boar-chat` |
| `contracts/` | `MarketplaceAdmin.sol`, `governance/GovernanceDataHelper.sol`, `governance/VotingDataHelper.sol` |
| `scripts/` | `deploy.ts`, `deploy2.ts` |
| `starter/` | x402 facilitator, humor server, headless client, Permit2 flow docs |

---

# 🧪 State & Persistence

| **What** | **Where** | **Key** |
| --- | --- | --- |
| Proposals & recorded votes | Browser local store | proposal store (`src/lib/proposalStore.ts`) |
| Paid / unlocked feeds | `localStorage` | `developer_paid_services` → `feed-v2-<feed>` |
| Free API entries (4/user/service) | `localStorage` | `developer_free_entries_v1:<address>:<service>` |
| Free Governance votes (4/user) | `localStorage` | `governance_free_votes_v1:<address>` |

Free-entry allowances and unlock state are **per browser, per wallet address** — they are convenience gates, not server-enforced entitlements. Clearing site data or switching wallets resets them.

---

# 🧊 Hidden / Removed For Now

| **Item** | **Status** |
| --- | --- |
| veMEZO Marketplace | Hidden (`display: none`, `id="venft-marketplace"`) — to be restored later |
| veMEZO Lockers | Removed from the Governance screen |
| Staking, Locks, Liquidity, Bridge, Gauge Voting | Removed from navigation |
| Vote buttons on proposals | Removed; voting runs through the pay entry |
| Borrow-with-Bitcoin cards | Removed |
| Synthetic analytics, invented vote percentages, fake statistics | Removed |

---

# 🤝 Contributing

Contributions are welcome.

- Submit pull requests
- Improve infrastructure modules
- Expand Bitcoin DeFi tooling
- Add new APIs and oracle integrations

---

# 📄 License

This project is private.  
Please contact the maintainer for access.

---

# ⚡ Vision

Build the infrastructure layer powering Bitcoin DeFi.

From APIs and AI tooling to governance and decentralized compute — Mezo Auth Dev enables developers to build scalable Bitcoin-native applications fully powered by MEZO.

---

## 🚀 Mezo Auth Dev

**Powering the infrastructure layer for Bitcoin DeFi, Thanks to Hackathon mentors**
