# 🏗️ Mezo Auth Dev - Infrastructure for Bitcoin DeFi using pay per use with MUSD/MEZO/BTC

Mezo Auth Dev is AWS-like infrastructure for Bitcoin-native Web3 on Mezo, powering an AI API marketplace (sentiment analysis, text summarization, wallet verification, smart contract simulation & risk analysis), real-time decentralized oracles (BTC/USD, MUSD/USD, cbBTC/USD, live charts, low-latency pricing), a veMEZO marketplace (buy/lock governance positions with escrowless P2P on-chain settlement), and DAO governance infrastructure (proposals, treasury signaling, protocol upgrades) — all settled with MEZO, MUSD, or BTC,

<img width="1774" height="887" alt="image" src="https://github.com/user-attachments/assets/e243ff5f-179c-457b-be80-f655c0fce20c" />

<p align="left">
  <img src="https://img.shields.io/badge/Bitcoin-orange?style=flat-square" />
  <img src="https://img.shields.io/badge/MEZO-blue?style=flat-square" />
  <img src="https://img.shields.io/badge/Infrastructure-green?style=flat-square" />
  <img src="https://img.shields.io/badge/Web3-purple?style=flat-square" />
</p>

---

# ✨ Features

## 🔌 AI API Marketplace

Decentralized pay-per-use APIs for analytics, AI, identity infrastructure — all priced in MEZO/MUSD/BTC.

### Included APIs

- AI sentiment and review analysis
- AI-powered text summarization
- On-chain analytics APIs
- Wallet identity verification
- Smart contract simulation & AI risk analysis

---

## 📡 Data Feeds & Oracle Infrastructure

Real-time decentralized oracle infrastructure for Bitcoin DeFi applications -  all priced in MEZO/MUSD/BTC.

### Supported Feeds

- BTC/USD
- MUSD/USD
- cbBTC/USD
- Live charts and market data
- Low-latency decentralized pricing

---

## 🪙 veMEZO Marketplace

Marketplace for trading and boosting locked veMEZO governance positions across the Mezo ecosystem -  all priced in MEZO/MUSD/BTC

### Marketplace Features

- Buy locked veMEZO positions
- Lock veMEZO for governance power
- Escrowless peer-to-peer settlement
- Fully on-chain transactions

---

## 🏛 Governance Infrastructure

Shape the future of Bitcoin finance through decentralized governance systems -  all priced in MEZO/MUSD/BTC

### Governance Features

- DAO proposal voting
- Treasury signaling systems
- Community-driven protocol upgrades
- Transparent community participation

---

# 🛠 Tech Stack

## Frontend

- **React** — Modern UI development
- **TypeScript** — Type-safe applications
- **Tailwind CSS** — Utility-first styling
- **Radix UI** — Accessible UI primitives

---

## Blockchain & Infrastructure

- **Solidity** — Smart contract development
- **Wagmi** — Web3 React Hooks
- **@mezo-org/passport** - Web3 wallet integration
- **Mezo SDK** — Native Mezo integration
- **Pyth Network** — Oracle infrastructure
- **Boar API** — Mezo infrastructure and analytics integration
- **Ethers.js** — Ethereum-compatible interactions

---

## AI & Compute

- **OpenAI APIs** — AI processing infrastructure
- **AI Runtime Engine** — Smart contract analysis
- **Decentralized Compute Layer** — Simulation execution
- **Indexing Infrastructure** — Blockchain data indexing

---

## Analytics & APIs

- **REST APIs** — API marketplace architecture
- **GraphQL** — Flexible data querying
- **Realtime WebSockets** — Live blockchain updates
- **On-chain Analytics Engine** — Blockchain intelligence

---

## Wallet & Identity

- **Mezo Passport** — Authentication infrastructure
- **Boar Wallet** — Wallet connectivity
- **On-chain Attestations** — Identity verification

---

# 🏗 Technical Architecture

<img width="926" height="630" alt="image" src="https://github.com/user-attachments/assets/26812a46-2b84-4400-af09-512fb0187e71" />


---

# 🔮 Oracle Data Feeds

## Supported Markets

| **Feed** | **Feed ID** |
| --- | --- |
| **BTC/USD** | `0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43` |
| **MUSD/USD** | `0x0617a9b725011a126a2b9fd53563f4236501f32cf76d877644b943394606c6de` |
| **cbBTC/USD** | `0x2817d7bfe5c64b8ea956e9a26f573ef64e72e4d7891f2d6af9bcc93f7aff9a97` |

---

# 💳 MEZO Utility

MEZO powers the entire infrastructure economy.

- Pay for API access
- Unlock oracle feeds
- Lock veMEZO positions
- Execute compute workloads
- Participate in DAO governance

---

# 🌐 Infrastructure Marketplace

## Available Infrastructure Products

| **Product** | **Description** | **Tech Used** |
| --- | --- | --- |
| **AI Sentiment Analyzer** | AI review scoring and sentiment extraction | AI + APIs |
| **Text Summarization API** | AI-powered document summarization | OpenAI + Compute |
| **On-chain Analytics API** | Blockchain transaction analytics | Solidity + APIs |
| **Identity Verification API** | Wallet verification infrastructure | Attestations + Web3 |
| **Oracle Data Feeds** | Real-time market pricing infrastructure | Pyth + Mezo |
| **Compute Runtime** | Smart contract simulation engine | AI + Solidity |
| **veMEZO Marketplace** | Governance position marketplace | Solidity Smart Contracts |
| **DAO Governance** | Proposal and voting infrastructure | Solidity + Javascript |

---

# 🔐 Wallet Integration

Seamless onboarding and wallet infrastructure.

### Wallet Features

- Multi-wallet support
- Bitcoin wallet integrations
- Mezo Passport authentication
- Secure MEZO payments
- Cross-chain wallet connectivity

---

## Mezo Network Configuration

Connect your wallet to Mezo Testnet (RPC: https://rpc.test.mezo.org, chain ID 31611).

Get BTC + MEZO from faucet ( https://faucet.test.mezo.org/ )

Open Mezo website (testnet)

Deposit testnet BTC as collateral

Borrow → Mint MUSD

MUSD appears in your wallet

- **Network:** Mezo Testnet    **Chain ID:** `31611`


**Native Currency:** MUSD 



**Explorer:**

https://explorer.mezo.org

---

# 🚀 Quick Start

## Installation

```bash
# Clone repository
git clone https://github.com/rohithr8484/mezo-yield-harmony.git

# Enter project folder
cd src

# Install dependencies
npm install

# Start development server
npm run dev
```

Open browser at:

```bash
http://localhost:5173
```

---

# ⚙️ Environment Variables

VITE_SUPABASE_PROJECT_ID=

VITE_SUPABASE_PUBLISHABLE_KEY=

VITE_SUPABASE_URL=

---

# 📁 Folder Structure

<img width="172" height="797" alt="image" src="https://github.com/user-attachments/assets/b5bd4463-56f2-414f-aec7-110e69139ef7" />


---
## **Smart Contracts Modules**
## **Governance Infrastructure**

| Contract / Component | Address | Description |
|---|---|---|
| **GovernanceDataHelper** | `0xE58329AE4803E2aa9594912066A5cB087C68f88c` | Proposal summaries and governance analytics. |
| **VotingDataHelper** | `0xD0AEc8C123add8aFBf64bdB58cB1adc6CC3f9D15` | Voting receipts and turnout tracking. |
| **MarketplaceAdmin** | `0x1D462522A9f8fbea6c10122dce01E09432A64dBF` | Marketplace admin and fee controls. |
| **MUSD Governance Treasury** | `0x000000000000000000000000000000000000dEaD` | Governance treasury and payments. |

---

## **Pay-per-Use Infrastructure (Mezo)**

| Contract / Component | Address | Description |
|---|---|---|
| **Mezo Caller** | `0x7B7c000000000000000000000000000000000001` | Executes pay-per-use settlement flows. |
| **MUSD** | `0xD88b46ef8444dAA8aa493d714b1124DE75CCa067` | Stablecoin for ecosystem payments. |
| **MUSD Treasury** | `0x21f7C9fdA5ED418AF3a1C7593dec52142350A0F7` | Treasury reserve and liquidity manager. |

---

## **veMEZO Marketplace**

| Contract / Component | Address | Description |
|---|---|---|
| **veMEZO Contract** | `0xaCE816CA2bcc9b12C59799dcC5A959Fb9b98111b` | veMEZO staking and governance contract. |
| **Boost Voter** | `0x21d7bDF5a5929AD179F8cA0c9014A0B62ae6Bfd1` | Voting boost and incentive manager. |

---

## **x402 usage (Mezo Testnet – Chain 31611)**

| Contract / Component | Address | Description |
|---|---|---|
| **Permit2** | `0x000000000022D473030F116dDEE9F6B43aC78BA3` | Token approval and delegation contract. |
| **x402Permit2Proxy** | `0x8dea1b08dc2e1D9b556450f736F19968F367A98d` | Permit2 integration proxy. |
| **mUSD (x402)** | `0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503` | Testnet MUSD settlement token. |

---

## **x402 Wallet Roles & Funding Requirements**

| Wallet | Purpose | Funding Needed |
|---|---|---|
| **Facilitator** | Executes `settle()` calls | Testnet BTC |
| **Payee** | Receives MUSD payments | None |
| **Client** | Signs Permit2 approvals | Testnet MUSD + BTC |
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

**Powering the infrastructure layer for Bitcoin DeFi, Thanks to Mezo Hackathon mentors**
