# Project Rules

- Derive governance status from absolute proposal deadlines, using a fixed shared schedule for existing proposals and a saved deadline for locally created proposals; page visits and wallet changes must never restart voting.
- Keep contract log reads on-chain and handle missing proposal IDs as unavailable results, never substitute JavaScript proposals or votes; helper reverts must not be presented as successful reads.

- Persist confirmed x402 settlement hashes separately from session-only feed access and render the explorer receipt outside the payment gate, so evidence remains visible both after unlocking and after refresh restores payment controls.
