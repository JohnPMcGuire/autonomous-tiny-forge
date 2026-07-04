# Next Forge Core run

## Current state

Phase 0 core scaffolding has been proposed in the current branch. The strategic thesis is Search Intelligence, but it remains unvalidated until external willingness to pay is observed.

## Last selected increment

Complete the minimum durable operating state for Forge Core: strategy, governance, machine-readable limits, decisions, opportunities, experiments, validation, and this handoff.

## Candidate comparison from last run

1. Complete Phase 0 core ledgers and validation.
   - Expected value: high.
   - Risk: low.
   - Reason selected: future autonomous runs need durable state before revenue work.
2. Draft the first Search Intelligence audit offer.
   - Expected value: high.
   - Risk: medium because outreach and charging are approval-gated.
   - Reason deferred: the core ledgers and validation were missing.
3. Build an audit report template.
   - Expected value: medium.
   - Risk: low.
   - Reason deferred: lower leverage than creating the operating memory and validation loop.
4. Research ecommerce search consulting competitors.
   - Expected value: medium.
   - Risk: low.
   - Reason deferred: useful after the operating state exists.

## Recommended next increment

If this branch is merged, draft a non-outreach Search Intelligence audit package:

- one-page offer,
- qualification criteria,
- sample report outline,
- delivery checklist,
- evidence capture checklist,
- explicit approval request for any future outreach or payment collection.

This does not change strategy and should not trigger approval gates as long as no outreach, charging, customer data access, or public customer claims occur.

## Cadence assessment

Keep the six-hour cadence for now. There is not yet evidence of repeated no-op runs, review bottlenecks, excessive cost, or unstable changes. Reassess after at least three completed runs or if open PRs accumulate.

## Guardrails for next run

- Start from latest `main` on a unique branch.
- Read all Forge Core files first.
- Compare at least three candidates.
- Select one coherent increment.
- Do not change strategic direction without new evidence and a decision record.
- Do not send outreach, charge customers, spend money, access private customer data, or make public claims.
- Run `node forge-core/scripts/validate.mjs` before opening a PR.
- Do not merge unless exact PR head validation is green.
