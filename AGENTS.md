# Project Rules

- Derive observation scores in pure modules using disclosed fixed weights, assessed-check counts and unresolved-weight bounds; missing data is never a passed check and scores never imply calibrated probability or compliance clearance.
- AML screening must distinguish public wallet observations from provider-backed compliance checks; disconnected sanctions and adverse-media providers show not screened. Derive payment metrics and graphs from loaded native movements and token events, separate assets by contract, and label incomplete coverage; transaction-hash queries stay scoped to that transaction, never traced funds or full AML clearance.
- Keep AML access on the shared PaymentGate, preserving the legacy allowance key so renaming does not reset usage.
- Derive AML behavior checks in the shared pure observations module with explicit evidence and data limits; this keeps heuristic patterns distinct from provider-backed compliance determinations.
- Keep ML structuring assessment in the shared pure observations module using deterministic per-asset unsupervised clustering and transaction evidence; exploratory patterns are not calibrated laundering probabilities, and missing samples must remain insufficient data.
- Analytics and AML render inputs before access controls; each valid Analyze/Screen submission mounts a fresh AnalysisAccessGate requiring PaymentGate unlock before lookups/results. Never use persisted API paid flags to bypass these per-request gates; preserve payment logic and allowance keys.

- Derive transaction analytics from explorer observations in a shared pure module; label method-based inferences and incomplete or unavailable data, and never aggregate quantities across different tokens or present heuristics as proven safety.

- Route both supported veMEZO lock durations through the same approval, simulation, and confirmation flow; respect the deployed contract's weekly expiry rounding and never submit one-minute locks.

- Normalize veMEZO withdrawal reverts through a shared error formatter, including nested wallet errors; keep cancellation and network failures distinct so rejection explanations remain consistent across NFT IDs.

- Derive governance status from absolute proposal deadlines, using a fixed shared schedule for existing proposals and a saved deadline for locally created proposals; page visits and wallet changes must never restart voting.
- Keep governance votes per proposal in the JavaScript store backed by browser storage, so recorded live votes remain final results after closure and refresh; never substitute sample totals or claim browser records are shared on-chain votes.
- Keep contract log reads on-chain and handle missing proposal IDs as unavailable results, never substitute JavaScript proposals or votes; helper reverts must not be presented as successful reads.

- Persist confirmed x402 settlement hashes separately from session-only feed access and render the explorer receipt outside the payment gate, so evidence remains visible both after unlocking and after refresh restores payment controls.
- Keep veMEZO marketplace access session-only through the shared service payment gate; persist free-entry usage and NFT positions, but restore unlock controls on refresh.
- Use a shared ServiceImage component for homepage and developer-service illustrations so the same service keeps consistent imagery without affecting its access controls.
- Apply presentation-only motion through the shared page layout and global styles, with reduced-motion overrides; access and result visibility must never depend on animation completion.
