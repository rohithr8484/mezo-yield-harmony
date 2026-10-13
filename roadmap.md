# Current tasks

- [x] Harden MEZO/MUSD sends with the connected wallet, preflight checks and successful receipt recovery; remove the false MEZO self-transfer reward. Eight tests and browser checks pass; a new wallet-authorized payment and the wallet's own failed-history label remain unverified.

- [x] Refine Developer Services presentation with clearer section hierarchy, centered imagery, polished controls and section links; verified centered images, hidden BTC controls, oracle navigation and no narrow-screen overflow; payments and access unchanged.

- [x] Check newly submitted proposals moving to Finished at their saved deadline and retaining recorded results after refresh; five tests pass, closure is persisted, and the Finished filter is no longer obstructed by proposal rows.

- [x] Preserve recorded governance votes per proposal after closure and refresh; four tests pass, browser check retains a recorded vote in final results after reload, and late votes are rejected.

- [x] Rename only the three requested visible service labels and replace service imagery with realistic feature-related scenes; images load on both pages, service links and Analyze remain available, build OK; access, allowances and descriptions unchanged.

- [x] Add an illustrated homepage service explanation, relevant images above each developer service, and rename the homepage heading to Developer services; verified seven homepage illustrations, nine developer-service images, service navigation and unchanged Analyze control; build OK.

- [x] Add transparent out-of-100 observation scores to Analytics and AML and change the app background to light mint-gray; 23 tests pass, real wallet/transaction results verified through free entry, and refresh keeps results gated.

- [x] Rename only the AML flow graph and add evidence-backed ML structuring assessment without changing access or other screening checks; 13 tests pass and real-wallet screening through free entry shows the assessment and renamed graph.

- [x] Assess supported AML payment patterns from loaded observations only; nine tests pass. Real wallet results verified through free entry with evidence-backed behavior rows; sanctions/media remain unperformed and refresh restores input-only access.

- [x] Match AML result references and load native plus token observations; four tests pass. Real wallet screening shows 50 token legs, six counterparties and the 0.0005 MUSD reward; transaction-hash screening stays scoped to its transaction, refresh restores gating, and disconnected sanctions/media remain Not screened.

- [x] Remove legacy paid-unlock bypass for Analytics/AML and require controls on each Analyze/Screen click; verified exhausted allowances and saved paid flags show payment-only controls. Real AML wallet lookup returned 50 sampled transactions and six counterparties; sanctions/media providers remain disconnected.

- [x] Show Analyze/Screen first, then the existing free-entry/payment controls; verified no lookups/results before unlock, automatic results after free entry, and restored gating with usage retained after refresh using controlled explorer fixtures; seven analytics tests pass.

- [x] Restrict AML to the four requested screening sections; verified free-entry refresh parity and saved paid-access parity with AI Text Summarization. Explorer wallet lookup was unavailable during the check; provider-backed sanctions/media remain not screened.

- [x] Rename the wallet service to AML Screening API, add honest screening parameters and an observed transaction flow graph, preserving access allowances; tests and real wallet checks pass on desktop/mobile.

- [x] Enhance On-chain Analytics with behavior-derived metrics for all nine sections, preserving service payments; five tests pass and a real mint transaction was verified through free entry on desktop and mobile.

- [x] Match veMEZO marketplace unlock controls to API services and restore its controls after refresh without resetting free-entry usage or NFT positions.

- [x] Hide only marketplace Boost buttons and replace the unsupported one-minute option with an enabled 2 MEZO one-week lock using the existing approval, simulation, and confirmation flow; expiry remains rounded down to weekly boundaries by the contract.

- [x] Fix only the getProposalsBatch/getProposalsRange invalid-proposal handling; six tests pass and both real contract calls display honest unavailable results. Requested on-chain IDs do not exist; returning actual proposal data requires creating proposals in the linked governance contract.

- [x] Use shared absolute JavaScript deadlines, move expired proposals to Finished, and show their final results (verified with clock-controlled browser checks and vote-store tests; votes remain session-local as requested).

- [x] Unlock the selected data feed immediately after a confirmed x402 settlement.
- [x] Widen the data feed blocks.
- [x] Keep the confirmed x402 settlement hash visible after a feed unlocks.
- [x] Show only fees actually associated with the confirmed x402 settlement.
- [x] Restore feed payment buttons on refresh while retaining the x402 settlement receipt link.
- [x] Check the README pay-per-use address descriptions against the actual payment paths without editing the README.
- [ ] Add the requested 0.005 MUSD platform transfer and 0.0005 MUSD reward transfer — blocked because the external x402 service does not execute them and the browser cannot authorize funds from the specified source address.
- [x] Refine only the UI across Developer Services, Governance, and proposal details without changing behavior.
