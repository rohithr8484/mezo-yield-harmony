## veMEZO NFT Scanner Test

Demonstrates on-chain veMEZO NFT ownership scanning using Hardhat.

**File:** `RealVeMEZOCreate.test.ts.`

### Features

- Scans token IDs from 1 to 680.
- Identifies NFT owners and wallet balances.
- Retrieves locked amounts, unlock timestamps, and voting power when available.
- Groups exact token IDs by wallet address.

### Run the Test

```bash
npx hardhat test RealVeMEZOCreate.test.ts --network mezoMats
```
---

## MarketplaceAdmin Contract - [`0x1D462522A9f8fbea6c10122dce01E09432A64dBF`](https://explorer.test.mezo.org/address/0x1D462522A9f8fbea6c10122dce01E09432A64dBF) 

Provides secure custom controls for the veNFT marketplace.

**File:** `MarketplaceAdmin.sol`

### Features

- Role-based access control and emergency pause.
- veNFT collection whitelist management.
- Payment router administration.
- MUSD balance tracking and funding.

**Technology:** Solidity ^0.8.20, OpenZeppelin AccessControl, Pausable, and IERC20.

---

## Governance Records Contract - [`0x82531Fc1b2eB804D7484b1346fb0FE503F81c75a`](https://explorer.test.mezo.org/address/0x82531Fc1b2eB804D7484b1346fb0FE503F81c75a) 

Provides on-chain anchoring of governance proposals and voting results.

**File:** `Governance-records.sol`

### Features

- Anchors a proposal once with its content identifier.
- Records one vote per wallet as Yes, No, or Abstain.
- Keeps separate Yes, No, and Abstain tallies for every proposal.
- Emits events for anchoring, vote casting, and finalization.

**Technology:** Solidity ^0.8.24, plain Solidity mappings and events with no external dependencies.

---

## MEZO Treasury Contract - [`0x2Db34b3aBb62Ffcfe7F6927Cfa4F52C16D649694`](https://explorer.test.mezo.org/address/0x2Db34b3aBb62Ffcfe7F6927Cfa4F52C16D649694) 

Provides a self-custody deposit vault for holding user MEZO on-chain.

**File:** `MEZO-Treasury.sol`

### Features

- Accepts MEZO deposits from users after a direct token approval.
- Lets each wallet withdraw only its own recorded deposit.
- Verifies the MEZO amount actually received before crediting a deposit.
- Reports the configured MEZO address, per-wallet claims, total deposits, and the live token balance held by the vault.
- Emits events for deposits and withdrawals.

**Technology:** Solidity ^0.8.24, OpenZeppelin IERC20, SafeERC20, and ReentrancyGuard.
