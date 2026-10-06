# Current tasks

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
