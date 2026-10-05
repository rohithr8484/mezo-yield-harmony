# Developer Services and Governance UI refinement

## Goal
Unify both areas into a clearer, more polished Mezo infrastructure interface without changing payments, free-entry limits, proposal data, contract logic, routes, or hidden features.

## UI changes
- Refine the Developer Services introduction, service registry, payment areas, oracle feed rows, receipts, and Governance entry area with stronger hierarchy and alignment.
- Refine the Governance introduction, filters, proposal rows, submission form, informational sections, proposal details, voting controls, and live-results presentation.
- Preserve the existing light background and Deep Indigo/Teal identity while reducing visual noise, improving contrast, and keeping mobile layouts usable.
- Use existing semantic colors and shared controls; add only reusable visual styles needed by both pages.
- Keep every current label, amount, address, data source, free-entry rule, and interaction unchanged.

## Verification
- Check Developer Services, Governance, and a proposal detail page at desktop and mobile widths.
- Confirm payment buttons, x402 visibility, search/filtering, proposal navigation, proposal submission controls, and voting controls still behave as before.
- Confirm the preview builds without errors.

## Technical note
This is presentation-only. The governance screens remain browser-stored until the separate contract integration described in chat is implemented.
