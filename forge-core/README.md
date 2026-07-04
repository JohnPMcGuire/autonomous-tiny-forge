# Forge Core

Forge Core is the bounded operating system for an autonomous venture studio. Its purpose is not to maximize output. Its purpose is to repeatedly identify, validate, build, operate, and retire business experiments without losing strategic intent.

## Current phase

Phase 0: establish the operating loop, governance, ledgers, and validation before granting the system financial or customer-impacting authority.

## Operating loop

1. Observe new evidence.
2. Compare at least three candidate actions.
3. Select one coherent increment using expected value, risk, reversibility, and strategic fit.
4. Implement on a unique branch from the latest `main`.
5. Validate the complete change.
6. Record the decision, evidence, cost, result, and next review.
7. Merge only the exact validated head.
8. Reassess direction and cadence without changing either unless evidence justifies it.

A run may deliberately produce no release.

## Principles

- Revenue before unnecessary code.
- Evidence before opinion.
- One experiment or coherent increment at a time.
- Every meaningful action updates institutional memory.
- Strategy changes are explicit decisions, not gradual drift.
- Reversible low-risk work may be autonomous.
- Money, legal commitments, sensitive data, and customer-impacting actions remain approval-gated until explicitly delegated.

## Structure

- `STRATEGY.md`: current thesis, scope, roadmap, and change protocol.
- `GOVERNANCE.md`: human-readable autonomy boundaries.
- `config/governance.json`: machine-readable operating limits.
- `ledger/decisions.json`: strategic and operational decisions.
- `ledger/opportunities.json`: scored business opportunities.
- `ledger/experiments.json`: proposed, active, completed, and killed experiments.
- `scripts/validate.mjs`: deterministic validation of the core state.
- `NEXT_RUN.md`: exact handoff for the next iteration.

## Validate locally

```bash
node forge-core/scripts/validate.mjs
```

## Initial business thesis

The leading opportunity is a Search Intelligence business that audits ecommerce search, product listing pages, catalog quality, and merchandising behavior. This is a thesis, not a permanent commitment. The first revenue experiment must validate willingness to pay before substantial product automation is built.
