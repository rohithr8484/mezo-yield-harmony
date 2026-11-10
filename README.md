# 🏗️ Mezo Auth Dev - Marketplace for developer services using pay per use with MEZO/MUSD

Mezo Auth Dev is Marketplace for Bitcoin-native Web3 on Mezo, powering an AI API marketplace (text summarization, wallet verification, smart contract simulation ), VeMezo marketplace, real-time decentralized oracles (BTC/USD, MUSD/USD, cbBTC/USD, live charts, low-latency pricing), and DAO governance infrastructure (proposals) — all settled with MEZO, MUSD, x402(MUSD)

<img width="1774" height="887" alt="image" src="https://github.com/user-attachments/assets/e243ff5f-179c-457b-be80-f655c0fce20c" />

<p align="left">
  <img src="https://img.shields.io/badge/Bitcoin-orange?style=flat-square" />
  <img src="https://img.shields.io/badge/MEZO-blue?style=flat-square" />
  <img src="https://img.shields.io/badge/Marketplace/Infrastructure-green?style=flat-square" />
  <img src="https://img.shields.io/badge/Web3-purple?style=flat-square" />
</p>

---

# ✨ Wave 1 Features Of Mezo Auth Dev

## Sellers can provide service 

Decentralized pay-per-use APIs for Smart Contract analytics, AI Text Summarization — priced in MEZO/MUSD.

## Buyers/Developers can use service 

## 🔌 AI API Marketplace

Decentralized pay-per-use APIs for analytics, AI, identity infrastructure — priced in MEZO/MUSD.

### Included APIs

- AI-powered text summarization
- On-chain analytics service
- AML Analytics service
- Smart contract simulation

---

## 📡 Data Feeds & Oracle Infrastructure

Real-time decentralized oracle infrastructure for Bitcoin DeFi applications -  priced in MEZO/MUSD.

### Supported Feeds

- BTC/USD
- MUSD/USD
- cbBTC/USD
- Live charts and market data
- Low-latency decentralized pricing

---

## 🏛 Governance Infrastructure

Shape the future of Bitcoin finance through decentralized governance systems -  priced in MEZO/MUSD

### Governance Features

- DAO proposal voting
- Treasury signaling systems
- Transparent community participation

---

## 🏛 VeMEZO Marketplace

Shape the future of Bitcoin finance through locked MEZO - priced in MEZO/MUSD

### Governance Features

- veMEZO Benefits – Receive veMEZO based on the protocol’s locking mechanism.
- Commitment-Based Benefits – Locking duration may influence the benefits

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
- **Mezo SDK** —  Mezo integration ( Live On Mezo Testnet )
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

<img width="1518" height="1036" alt="image" src="https://github.com/user-attachments/assets/339ef7fd-7a1f-4e36-9124-74f35fad41fa" />
<img width="1535" height="1024" alt="image" src="https://github.com/user-attachments/assets/a5b85547-61e5-41e6-b290-18509cfa01ce" />

---

# 🔮 Oracle Data Feeds

## Supported Markets

Using Contract(Mezo Testnet): **0x2880aB155794e7179c9eE2e38200202908C17B43**

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

# Smart Contract Security
- **Role-Based Access**: Only approved accounts can perform specific administrative actions.
- **X402 Payment Authorization**: Uses Permit2 and x402 to support signed payment authorization and token settlement.
- **On-Chain Traceability**: Enables transaction verification and transparent activity records.
- **Smart Contract Audit Report** : performed overall | [`smart-contract-audit`](https://github.com/rohithr8484/mezo-yield-harmony/blob/main/Smart_Contract_Security_Review_Technical_Findings_F08_F10.pdf) |
  
# Code Quality
- **Modular Architecture**: Separates marketplace administration, payments, token handling, and governance.
- **Reusable Security Libraries**: Uses established OpenZeppelin components for access control and pause functionality.
- **Maintainable Governance**: Uses structured fee proposals, custom errors, and events for clearer administration.
- **Testing**: Execution of tests for VeMEZO marketplace | [`test-file`](https://github.com/rohithr8484/mezo-yield-harmony/blob/main/contracts/RealVeMEZOCreate.test.ts.) |
- **Testing** : Execution of tests as shown below for Test Cases Summary (60 tests)
---

# Business model - Pay Per use - amounts (Mezo Testnet)

| Pay with | Services / data feeds | Governance entry | Proposal vote | Provide your own service |
|---|---:|---:|---:|---:|
| MUSD | 0.2 MUSD | 0.01 MUSD | 0.2 MUSD | 0.2 MUSD (0.0005 MUSD reward returned) |
| MEZO | 0.2 MEZO | 0.01 MEZO | 0.2 MEZO | 0.2 MEZO |
| x402 (MUSD) | 0.001 MUSD | 0.001 MUSD | 0.001 MUSD | - |

Network gas and any first-time token approval are additional; x402 settlement gas is paid by the facilitator. The x402 payment uses a different MUSD token from the regular MUSD buttons.

## Rewards (Mezo Testnet)

| Pay with | Services / data feeds | Governance entry | Proposal vote | Provide your own service |
|---|---:|---:|---:|---:|
| MUSD | 0.0005 MUSD | 0.0005 MUSD | 0.0005 MUSD | 0.0005 MUSD reward |

For each regular MUSD payment, the app attempts to send this reward from platform `0x21f7C9fdA5ED418AF3a1C7593dec52142350A0F7` back to the paying wallet after the payment confirms. This reward does not apply to x402, MEZO payments.


## Transactions involving MUSD/MEZO

#### 🧪 Testnet — Mezo Matsnet Testnet

|      Token         | Transaction Hash                                  |  Activity Type |       link   | 
| --------------------- | -------------------------------------------- | ----------------------| ---------------------- |
| MUSD            | `0x274349523ae3b5bc6977ce926a95406e6ee18f298c0f7875ff798fa21bbef27c` | approve MUSD | [`Transaction`](https://explorer.test.mezo.org/tx/0x274349523ae3b5bc6977ce926a95406e6ee18f298c0f7875ff798fa21bbef27c)   |
| MUSD            | `0x8b8dc03cdb7f20ccd8613ca5d4e998cde5d94b4ad50e47d2f1e95985209ac98d` | MUSD payment From wallet | [`Transaction`](https://explorer.test.mezo.org/tx/0x8b8dc03cdb7f20ccd8613ca5d4e998cde5d94b4ad50e47d2f1e95985209ac98d)  |
| MUSD            | `0xa8c548a65b008b915b3dee1fb153cb011abfdd7345e7e8f20dba9eccbfd34be4` | Reward MUSD to wallet | [`Transaction`](https://explorer.test.mezo.org/tx/0xa8c548a65b008b915b3dee1fb153cb011abfdd7345e7e8f20dba9eccbfd34be4)   |
| MUSD            | `0x4868636cab6659be076de1becd48de4f2cafade6377d79e27f321fc5d5a07ceab` | X402 MUSD payment | [`Transaction`](https://explorer.test.mezo.org/tx/0x4868636cab6659be076de1becd48de4f2cafade6377d79e27f321fc5d5a07cea)  |
| MEZO            | `0x14bff02771937faa89e9f7b669053355f2ef6f2570900684417656a617be45c4` | approve MEZO |  [`Transaction`](https://explorer.test.mezo.org/tx/0x14bff02771937faa89e9f7b669053355f2ef6f2570900684417656a617be45c4)  |
| MEZO            | `0xda74196200e4d2489ee18feaf232cf1c1a621e9bb50d6a80cad42a6a3430d5a2` | MEZO payment from wallet | [`Transaction`](https://explorer.test.mezo.org/tx/0xda74196200e4d2489ee18feaf232cf1c1a621e9bb50d6a80cad42a6a3430d5a2)  |
| VEMEZO          | `0xc2fe5e841e9172a290f3a95e2c999e7ab64a074cf8d330948308a99948d4c06a` |  createLock of VEMEZO | [`Transaction`](https://explorer.test.mezo.org/tx/0xc2fe5e841e9172a290f3a95e2c999e7ab64a074cf8d330948308a99948d4c06a)  |
| VEMEZO          | `0xfdcf48b6620f9e91eb3784bcbfc88be71372dac23cbc90e1b937357ded24a751` | withdraw of MEZO | [`Transaction`](https://explorer.test.mezo.org/tx/0xfdcf48b6620f9e91eb3784bcbfc88be71372dac23cbc90e1b937357ded24a751)   |
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
/ 

Add MUSD token (0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503)

& (0xD88b46ef8444dAA8aa493d714b1124DE75CCa067) 

Add MEZO token (0x7B7c000000000000000000000000000000000001)

- **Network:** Mezo Testnet    **Chain ID:** `31611`


**Native Currency:** MUSD 


**Explorer:**

https://explorer.test.mezo.org/

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

<img width="160" height="857" alt="image" src="https://github.com/user-attachments/assets/63a20a00-52ad-4e61-a26d-26d9e95f4af9" />


---
## **Smart Contracts Modules**
## **Infrastructure**

| Contract / Component | Address | Description |
|---|---|---|
| **VEMEZO token** | `0xaCE816CA2bcc9b12C59799dcC5A959Fb9b98111b` | for VEMEZO NFT creation |
| **MarketplaceAdmin** | `0x1D462522A9f8fbea6c10122dce01E09432A64dBF` | Marketplace roles and fee controls. |
| **Mezo Governance Treasury** | `0x2Db34b3aBb62Ffcfe7F6927Cfa4F52C16D649694` | Governance treasury and payments. |

---

## **Pay-per-Use Infrastructure (Mezo)**

| Contract / Component | Address | Description |
|---|---|---|
| **Mezo Caller/Token** | `0x7B7c000000000000000000000000000000000001` | Executes pay-per-use settlement flows. |
| **MUSD Token** | `0xD88b46ef8444dAA8aa493d714b1124DE75CCa067` | Mezo USD Stablecoin to be added by user for payments. |
| **MUSD Platform/payments** | `0x21f7C9fdA5ED418AF3a1C7593dec52142350A0F7` | Treasury reserve and liquidity manager. |

---

## **x402 usage (Mezo Testnet – Chain 31611)**

| Contract / Component | Address | Description |
|---|---|---|
| **Permit2** | `0x000000000022D473030F116dDEE9F6B43aC78BA3` | Used directly by the browser for the one-time mUSD allowance and as the verifying contract for signed payment authorization. |
| **x402Permit2Proxy** | `0x8dea1b08dc2e1D9b556450f736F19968F367A98d` | Used by the server-side facilitator to settle the signed authorization through Permit2. The browser does not call this contract directly. |
|**Settlement proxy**| `0x402085c248EeA27D92E8b30b2C58ed07f9E20001` | x402 Settlement Proxy | 
| **MUSD (x402)** | `0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503` | Mezo Testnet MUSD token approved by the user during x402 settlement. |

Permit2 and MUSD are configured in the browser app. All three addresses are configured consistently across the server-side x402 flow and its supporting guide.

---

## **x402(MUSD) — How It Is Used**

- The proxy address arrives inside the server's 402 requirements.
- x402 pays MUSD `0x1189…c503`, while the MUSD/MEZO buttons use different addresses — two separate money paths inside the same card.
- The feed unlocks the moment settlement is confirmed, and the `Pay with x402` button is hidden once the feed is unlocked.

  
---

## **x402 (MUSD) Wallet Roles & Funding Requirements**

| Wallet | Purpose | Funding Needed |
|---|---|---|
| **Facilitator** | Executes `settle()` calls | Testnet BTC |
| **Payee** | Receives MUSD payments | None |
| **Client** | Signs Permit2 approvals | Testnet MUSD + BTC |
---

## **Test Cases Summary**

## Total Test Cases: 60

## 1. MUSD Payments (1)

- Contract: 0xD88b46ef8444dAA8aa493d714b1124DE75CCa067

### Test Case	Why It Passes
- 1	Checks and approves 0xD88b MUSD, never the x402 token	The approval and payment always use the regular MUSD address.

## 2. MEZO Payments (2)

- Payee: 0x2Db34b3aBb62Ffcfe7F6927Cfa4F52C16D649694

### Test Case	Why It Passes

- 2	Pays 0.2 MEZO only once, no self-transfer reward	Exactly one transfer is sent to the payee, and no transfer goes back to your own wallet.
- 3	Does not submit when the wallet lacks 0.2 MEZO	The balance check stops the payment before the wallet is asked to sign.

## 3. Shared Payment Flow (MUSD + MEZO) (6)

### Test Case	Why It Passes

- 4	Returns the confirmed hash if the wallet errors after broadcast	The app recovers the receipt from the chain instead of sending again.
- 5	Never accepts a failed receipt	A failed receipt is treated as failed, so nothing unlocks.
- 6	No unlock or retry when a broadcast has no receipt	Without a confirmation the service stays locked, and you aren't pushed to pay twice.
- 7	Adds gas headroom, sends exactly one transaction after simulation	Extra gas is added to the estimate, and only one transaction is sent after the dry run.
- 8	Never transfers if the token simulation returns false	A rejected dry run stops the payment before sending.
- 9	Distinguishes gas shortage from wallet cancellation	Each error type gets its own message.

## 4. Governance Contract (7)

Contract: 0x82531Fc1b2eB804D7484b1346fb0FE503F81c75a

### Test Case	Why It Passes

- 10	Encodes all three function codes (anchorProposal, vote, finalize)	Each call carries its real function code, never an empty transfer.
- 11	Saves only confirmed anchor receipts for this contract	A receipt is stored only after confirmation, and only for this contract address.
- 12	FOR encoding kept	Yes is sent as 0.
- 13	AGAINST encoding kept	No is sent as 1.
- 14	ABSTAIN encoding kept	Abstain is sent as 2.
- 15	Unconfirmed vote not saved as success	A vote with no receipt is not shown as recorded.
- 16	Persists confirmed finalize receipt	The finalize receipt is still there after refresh.

## 5. Proposal Store (Browser Storage) (6)

#### Test Case	Why It Passes

- 17	New proposal shows Finished when its saved deadline expires	Status is worked out from the saved deadline every time the list is read.
- 18	Restores recorded votes after reload and closure	Tallies are saved per proposal in the browser.
- 19	Opening a proposal doesn't reset its deadline	The deadline is set once and never rewritten.
- 20	Finishes at the deadline, keeps results, rejects late votes	Votes after the deadline are refused.
- 21	Deadline saved at creation, not first view	The deadline is written when you submit the proposal.
- 22	Stays Active after refresh within 6 minutes	The saved deadline survives a refresh.

## 6. Governance Log Reads (On-chain Proposal Reads) (6)

### Test Case	Why It Passes

- 23	Missing IDs in getProposalsBatch explained, not shown as success	Contract errors show as "unavailable."
- 24	Missing IDs in getProposalsRange explained, not shown as success	Same rule for range reads.
- 25	Successful on-chain results kept	Real results are shown as returned.
- 26	Reversed range rejected before calling the contract	The input is checked first.
- 27	Invalid batch IDs rejected before calling the contract	The input is checked first.
- 28	Network errors not hidden as empty results	A network error shows as an error, not "no data."

## 7. MarketplaceAdmin Actions (2)

Contract: 0x1D462522A9f8fbea6c10122dce01E09432A64dBF

### Test Case	Why It Passes

- 29	Get Role maps to grantRole; only 3 actions are writes	Each button is tied to its function, with reads and writes marked.
- 30	Passes the chosen role and wallet to role calls	Your inputs reach the function unchanged.

## 8. veMEZO Lock (2)

Contract: 0xaCE816CA2bcc9b12C59799dcC5A959Fb9b98111b

### Test Case	Why It Passes

- 31	Locks exactly 2 MEZO	The amount is fixed in the shared lock settings.
- 32	Two-week option listed after the existing ones, 1,209,600 seconds	14 days × 86,400 seconds per day = 1,209,600 seconds.

## 9. veMEZO Withdraw Errors (4)

Same veMEZO contract.

### Test Case	Why It Passes

- 33	5 contract-rejection shapes (no reason, not owner, "execution reverted", nested wallet error, "Lock not expired")	One shared formatter finds the rejection however deeply the wallet wraps it, so every NFT ID gets the same explanation.
- 34	Cancellation not mislabeled as a rejection	Cancelling in your wallet gets its own message.
- 35	Network and balance errors kept distinct	Each has its own message.
- 36	Handles absent and looping errors	The formatter never crashes.

## 10. On-chain Analytics (Explorer Data) (8)

### Test Case	Why It Passes

- 37	Scores concerns out of 100 with fixed, disclosed weights	The scoring is deterministic: the same input always gives the same score.
- 38	Missing data not counted as a passed check	Missing data is marked unassessed.
- 39	Zero points only when coverage is explicit	A clean result needs real checks behind it.
- 40	Calculates gas, input size and method hints	Read straight from the transaction data.
- 41	Same-symbol tokens kept separate; sender direction detected	Tokens are grouped by contract address, not by name.
- 42	No invented zeros, decimals or pending failures	Unknown values stay unknown.
- 43	Flags failures and unverified contracts without a safety score	Problems are shown without claiming the transaction is safe.
- 44	Generic deposit labeled as an inference only	Guesses based on the method name are labeled as guesses.

## 11. AML Screening (Screening Rules) (17)

### Test Case	Why It Passes

- 45	Pass-through Risk Score with all checks assessed	The weights are fixed.
- 46	Single round-figure payment checked for structuring	A single-payment rule applies.
- 47	Single-transaction structuring review without the 6-payment minimum	No minimum count is needed for that rule.
- 48	Repeated same-asset bursts flagged by deterministic clustering	The grouping step gives the same result every run.
- 49	Two similar payments at an interval flagged without clustering	A direct pattern check.
- 50	Different assets and duplicate logs not merged	Grouped by contract, with duplicates removed.
- 51	Spaced activity: no flag, but no low-risk claim	Absence of a flag is not called "safe."
- 52	No structuring inferred from missing times or incoming payments	Only outgoing payments with timestamps count.
- 53	Equal same-asset pass-through within 60 minutes observed	A time-window match.
- 54	No pass-through matched across assets or within one transaction	Strict matching.
- 55	Same-counterparty equal-amount round trip observed	Matches money going out and back with the same wallet.
- 56	Mint followed by same-asset outgoing activity observed	A sequence check.
- 57	Unavailable label and reporting checks stay undetermined	No provider is connected, so they show "not screened."
- 58	Graph includes only successful native movements for the selected wallet	Failed and unrelated movements are filtered out.
- 59	Missing amounts not turned into zero; no screening claimed	Unknown values are kept.
- 60	Token payment legs included without merging assets	Each token stays separate.
- 61	Failed token transfers excluded; unknown amounts preserved	Filtered on the receipt status.

## 12. Seller Services (Backend Registry) (3)

### Test Case	Why It Passes

- 62	Created service stores the connected wallet	Each listing is tied to your wallet.
- 63	No service created without a wallet	Creation is blocked without a wallet.
- 64	Custom Developer API template not offered	It was removed from the template list.

---
# 🤝 Contributing

Contributions are welcome.

- Submit pull requests
- Improve infrastructure modules
- Expand Bitcoin DeFi tooling
- Add new APIs and oracle integrations

---

# 📄 App UI images

<img width="624" height="381" alt="image" src="https://github.com/user-attachments/assets/0795cd49-73f0-4345-a23d-000168902e39" />
<img width="624" height="399" alt="image" src="https://github.com/user-attachments/assets/6f327cc8-36ab-4e85-9e17-f63356a2ec50" />
<img width="624" height="498" alt="image" src="https://github.com/user-attachments/assets/88a2f871-f831-4644-b72f-7e2febef4012" />
<img width="606" height="686" alt="image" src="https://github.com/user-attachments/assets/4acd67a1-9bbf-49c4-905d-b34e17dfba9d" />
<img width="624" height="449" alt="image" src="https://github.com/user-attachments/assets/b01f7cb6-67bf-498e-bc84-ffa49b1231ac" />
<img width="624" height="358" alt="image" src="https://github.com/user-attachments/assets/869590d4-4485-47c1-9af5-5a64c35da87a" />


---

# 📄 License

Please contact the maintainer for access.

---

# ⚡ Vision

Build the marketplace/infrastructure layer powering Bitcoin DeFi.

From APIs and AI tooling to governance — Mezo Auth Dev enables developers to run scalable Bitcoin-native applications fully powered by MUSD/MEZO.

---

## 🚀 Mezo Auth Dev

**Powering the infrastructure layer for Bitcoin DeFi, Thanks to Hackathon mentors**
