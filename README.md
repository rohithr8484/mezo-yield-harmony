# 🏗️ Mezo Auth Dev - Marketplace for developer services using pay per use with MUSD/MEZO/BTC

Mezo Auth Dev is AWS-like infrastructure for Bitcoin-native Web3 on Mezo, powering an AI API marketplace (text summarization, wallet verification, smart contract simulation & risk analysis), real-time decentralized oracles (BTC/USD, MUSD/USD, cbBTC/USD, live charts, low-latency pricing), and DAO governance infrastructure (proposals, treasury signaling, protocol upgrades) — all settled with MEZO, MUSD, or BTC,

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

- AI-powered text summarization
- On-chain analytics APIs
- Wallet identity verification
- Smart contract simulation & risk analysis

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

## 🏛 Governance Infrastructure

Shape the future of Bitcoin finance through decentralized governance systems -  all priced in MEZO/MUSD/BTC

### Governance Features

- DAO proposal voting
- Treasury signaling systems
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
- Execute compute workloads
- Participate in DAO governance

---

# 💳 MUSD Utility

MUSD powers the entire infrastructure economy.

- Pay for API access
- Unlock oracle feeds
- Execute compute workloads
- Participate in DAO governance

---

# Payment amounts (Mezo Testnet)

| Pay with | APIs / data feeds | Governance entry | Proposal vote | Provide your own service |
|---|---:|---:|---:|---:|
| MUSD | 0.2 MUSD | 0.01 MUSD | 0.2 MUSD | 0.2 MUSD (0.0005 MUSD reward returned) |
| MEZO | 0.2 MEZO | 0.01 MEZO | 0.2 MEZO | 0.2 MEZO |
| x402 (MUSD) | 0.001 MUSD | 0.001 MUSD | 0.001 MUSD | - |

Network gas and any first-time token approval are additional; x402 settlement gas is paid by the facilitator. The x402 payment uses a different MUSD token from the regular MUSD buttons.

## Rewards (Mezo Testnet)

| Pay with | APIs / data feeds | Governance entry | Proposal vote | Provide your own service |
|---|---:|---:|---:|---:|
| MUSD | 0.0005 MUSD | 0.0005 MUSD | 0.0005 MUSD | 0.0005 MUSD reward |

For each regular MUSD payment, the app attempts to send this reward from platform `0x21f7C9fdA5ED418AF3a1C7593dec52142350A0F7` back to the paying wallet after the payment confirms. This reward does not apply to x402, MEZO, or BTC payments.

---

# 🌐 Infrastructure Marketplace

## Available Infrastructure Products

| **Product** | **Description** | **Tech Used** |
| --- | --- | --- |
| **AI Text Summarization** | AI-powered document summarization | OpenAI + Compute |
| **On-chain Analytics** | Blockchain transaction analytics | Solidity + APIs |
| **Oracle Data Feeds** | Real-time market pricing infrastructure | Pyth + Mezo |
| **Smart Contract Analysis** | Smart contract simulation engine | AI + Solidity |
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
## **Infrastructure**

| Contract / Component | Address | Description |
|---|---|---|
| **MarketplaceAdmin** | `0x1D462522A9f8fbea6c10122dce01E09432A64dBF` | Marketplace admin and fee controls. |
| **MUSD Governance Treasury** | `0x000000000000000000000000000000000000dEaD` | Governance treasury and payments. |

---

## **Pay-per-Use Infrastructure (Mezo)**

| Contract / Component | Address | Description |
|---|---|---|
| **Mezo Caller/Token** | `0x7B7c000000000000000000000000000000000001` | Executes pay-per-use settlement flows. |
| **MUSD Token** | `0xD88b46ef8444dAA8aa493d714b1124DE75CCa067` | Stablecoin for ecosystem payments. |
| **MUSD Platform/payments** | `0x21f7C9fdA5ED418AF3a1C7593dec52142350A0F7` | Treasury reserve and liquidity manager. |

---

## **x402 usage (Mezo Testnet – Chain 31611)**

| Contract / Component | Address | Description |
|---|---|---|
| **Permit2** | `0x000000000022D473030F116dDEE9F6B43aC78BA3` | Used directly by the browser for the one-time mUSD allowance and as the verifying contract for signed payment authorization. |
| **x402Permit2Proxy** | `0x8dea1b08dc2e1D9b556450f736F19968F367A98d` | Used by the server-side facilitator to settle the signed authorization through Permit2. The browser does not call this contract directly. |
| **MUSD (x402)** | `0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503` | Mezo Testnet MUSD token approved by the user and transferred during x402 settlement. |

Permit2 and MUSD are configured in the browser app. All three addresses are configured consistently across the server-side x402 flow and its supporting guide.

---

## **x402 — How It Is Used**

- The proxy address arrives inside the server's 402 requirements.
- The feed unlocks the moment settlement is confirmed, and the `Pay with x402` button is hidden once the feed is unlocked.
  
### Where the proxy is really called

`starter/facilitator/facilitator.ts` holds the only ABI for it here:

- `POST /verify` — recovers the EIP-712 signer, checks owner / amount / deadline
- `POST /settle` — encodes `settle()`, estimates gas with a **×3 multiplier** (Mezo's `eth_estimateGas` omits the EIP-7623 calldata floor, so an unmultiplied estimate reverts), then sends with `FACILITATOR_PRIVATE_KEY`

Supporting files: `starter/server/humor-server.ts` (returns the 402 with `spender` = proxy and `payTo` = `PAYEE_ADDRESS`, then calls `/verify` and `/settle`), `starter/client/client.ts` (headless payer), `starter/2-server.ts` (package-driven version using `@x402/express` + `@x402/paywall`).

- The server supplies both the proxy spender and payee in its payment requirements. The browser **does** call MUSD directly to read and grant Permit2 allowance, then signs a Permit2 authorization; the facilitator performs settlement through the proxy.
- The app does not run the local facilitator; it uses the live one behind that server. The three-terminal flow only runs when you start `starter/` yourself.
- x402 pays MUSD `0x1189…c503`, while the MUSD/MEZO/BTC buttons use different addresses — two separate money paths inside the same card.

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

**Powering the infrastructure layer for Bitcoin DeFi, Thanks to Hackathon mentors**
