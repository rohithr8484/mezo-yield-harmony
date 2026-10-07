# Project Rules

- AML screening must distinguish public wallet observations from provider-backed compliance checks; disconnected sanctions and adverse-media providers show not screened, and the transaction graph covers only loaded native-value records, not traced funds or full AML clearance.

- Derive transaction analytics from explorer observations in a shared pure module; label method-based inferences and incomplete or unavailable data, and never aggregate quantities across different tokens or present heuristics as proven safety.

- Route both supported veMEZO lock durations through the same approval, simulation, and confirmation flow; respect the deployed contract's weekly expiry rounding and never submit one-minute locks.

- Normalize veMEZO withdrawal reverts through a shared error formatter, including nested wallet errors; keep cancellation and network failures distinct so rejection explanations remain consistent across NFT IDs.

- Derive governance status from absolute proposal deadlines, using a fixed shared schedule for existing proposals and a saved deadline for locally created proposals; page visits and wallet changes must never restart voting.
- Keep contract log reads on-chain and handle missing proposal IDs as unavailable results, never substitute JavaScript proposals or votes; helper reverts must not be presented as successful reads.

- Persist confirmed x402 settlement hashes separately from session-only feed access and render the explorer receipt outside the payment gate, so evidence remains visible both after unlocking and after refresh restores payment controls.
- Keep veMEZO marketplace access session-only through the shared service payment gate; persist free-entry usage and NFT positions, but restore unlock controls on refresh.
