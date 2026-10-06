# Project Rules

- Keep the one-minute veMEZO lock action disabled while the deployed implementation rounds expiry down to weeks; do not submit misleading short-duration locks.

- Normalize veMEZO withdrawal reverts through a shared error formatter, including nested wallet errors; keep cancellation and network failures distinct so rejection explanations remain consistent across NFT IDs.

- Derive governance status from absolute proposal deadlines, using a fixed shared schedule for existing proposals and a saved deadline for locally created proposals; page visits and wallet changes must never restart voting.
- Keep contract log reads on-chain and handle missing proposal IDs as unavailable results, never substitute JavaScript proposals or votes; helper reverts must not be presented as successful reads.

- Persist confirmed x402 settlement hashes separately from session-only feed access and render the explorer receipt outside the payment gate, so evidence remains visible both after unlocking and after refresh restores payment controls.
