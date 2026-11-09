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

## MarketplaceAdmin Contract

Provides secure custom controls for the veNFT marketplace.

**File:** `MarketplaceAdmin.sol`

### Features

- Role-based access control and emergency pause.
- Fee management with a timelock.
- veNFT collection whitelist management.
- Payment router administration.
- MUSD balance tracking and funding.

**Technology:** Solidity ^0.8.20, OpenZeppelin AccessControl, Pausable, and IERC20.

---

## Governance Records Contract

Provides on-chain anchoring of governance proposals and voting results.

**File:** `Governance-records.sol`

### Features

- Anchors a proposal once with its content identifier.
- Records one vote per wallet as Yes, No, or Abstain.
- Keeps separate Yes, No, and Abstain tallies for every proposal.
- Emits events for anchoring, vote casting, and finalization.

**Technology:** Solidity ^0.8.24, plain Solidity mappings and events with no external dependencies.
