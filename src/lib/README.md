# src/lib Tests

One-line description of every test in this folder. Documentation only — no functional behavior is described beyond what each test asserts.

## amlScreening.test.ts
- Scores an observed AML pass-through wallet at 65 of 100 with every check assessed.
- Assesses a single round-figure outgoing payment on the structuring check alone.
- Establishes a single-transaction structuring review without the six-payment minimum.
- Uses deterministic ML clusters to flag repeated same-asset outgoing bursts.
- Flags a two-payment similar-amount interval without clustering.
- Does not combine different assets or duplicate logs as distinct payments.
- Reports no flag for spaced activity without claiming low risk.
- Does not infer structuring from missing timestamps or inbound receipts.
- Observes equal same-asset pass-through within 60 minutes.
- Never matches pass-through across assets or in the same transaction.
- Observes a same-counterparty equal-amount round trip.
- Observes a mint receipt followed by same-asset outgoing activity.
- Keeps unavailable label and reporting checks undetermined.
- Graphs only successful native movements involving the selected wallet.
- Does not turn missing amounts into zero or claim screening.
- Includes token payment legs without combining different assets.
- Excludes failed token transfers and preserves unknown quantities.

## contractFunctionViewer.test.ts
- Lists every declared function including internal functions and overloads, not comments or calls.
- Keeps function bodies as evidence for descriptions.

## governanceAnchor.test.ts
- Encodes all three deployed selectors, rather than an empty-data transfer.
- Saves only the confirmed anchor receipt for the requested contract.
- Does not save an unconfirmed vote as a successful transaction.
- Persists the confirmed finalize receipt.

## homepageNewPayment.test.ts
- Uses only the specified test MUSD token and connected wallet.
- Transfers exactly 0.00002 MUSD and returns its confirmed receipt.
- Requests exactly 0.00001 contract MUSD only after payment confirmation.
- Preserves the payment and never resends when reward authorization fails.
- Does not submit when the wallet lacks the payment amount.

## marketplaceAdminActions.test.ts
- Maps Get Role to grantRole and marks only three actions as writes.
- Passes the chosen role and target wallet to role calls.
- Passes a collection address to each collection call, including the mapping getter.
- Rejects malformed and zero addresses before submission.

## marketplaceAdminReads.test.ts
- Reads FEE_TIMELOCK from the requested admin contract.
- Checks the specified veMEZO collection and preserves a false result.

## mezoPayment.test.ts
- Pays the requested 0.2 MEZO only once and does not send a self-transfer reward.
- Does not submit when the payment wallet lacks 0.2 MEZO.

## musdPayment.test.ts
- Checks and approves 0xD88b MUSD for the platform, never the x402 token.

## onchainAnalytics.test.ts
- Scores observed concerns out of 100 using fixed disclosed weights.
- Does not score missing data as a passed check.
- Returns zero observed points only with explicit assessed coverage.
- Calculates gas, input bytes and method hints from observations.
- Keeps same-symbol assets separate and detects sender direction.
- Does not invent zeros, decimals or pending failures.
- Flags observed failure and unverified contract without a safety score.
- Labels generic deposit as method inference only.

## proposalStore.test.ts
- Returns newly submitted proposals as Finished from the user store when their saved deadline expires.
- Restores each proposal's recorded votes after reload and closure.
- Does not start or reset the existing deadline when a user opens a proposal.
- Finishes at the deadline, keeps the result, and rejects late votes.
- Saves a new proposal deadline at creation instead of first viewing.
- Keeps a new proposal Active after a refresh within the 6-minute window.

## pythHistory.test.ts
- Decodes actual oracle price, confidence and publication time.
- Marks stored prices older than the 3600 second freshness limit stale.
- Reads the requested feed at historical blocks without fabricating movement.
- Omits unavailable archive data rather than replacing it.
- Rejects missing or invalid feed observations.

## sellerServices.test.ts
- Stores a created service with the connected wallet address.
- Does not create a service without a wallet address.
- Does not offer the Custom Developer API template.
- Uses the same Solidity inputs for review and function viewer, not summarization.
- Publishes the function viewer separately from contract review.
- Restores a wallet's deployed services missing from this browser.
- Does not duplicate services already stored in the browser.

## tokenPayment.test.ts
- Returns the confirmed hash when wallet confirmation fails after a successful broadcast.
- Never accepts a failed receipt.
- Does not unlock or encourage a retry when a broadcast has no receipt.
- Adds gas headroom and sends exactly one transaction after simulation.
- Never submits a transfer when the token simulation returns false.
- Distinguishes gas shortages from nested wallet cancellations.

## transactionFlowGraph.test.ts
- Places the root at depth 0, recipients after it and senders before it.
- Aggregates repeated legs but keeps assets separate.
- Keeps unknown amounts unknown instead of zero.

## veMezoLock.test.ts
- Locks exactly 2 MEZO.
- Adds two weeks after the existing options and requests 1,209,600 seconds.

## veMezoWithdrawError.test.ts
- Does not mislabel cancellation as a contract rejection.
- Keeps network and balance errors distinct.
- Handles absent and cyclic errors.
