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

Provides secure administrative controls for the veNFT marketplace.

**File:** `MarketplaceAdmin.sol`

### Features

- Role-based access control and emergency pause.
- Fee management with a timelock.
- veNFT collection whitelist management.
- Payment router administration.
- MUSD balance tracking and funding.

**Technology:** Solidity ^0.8.20, OpenZeppelin AccessControl, Pausable, and IERC20.
