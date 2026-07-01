# Public build transparency

The public site renders `registry/forge-ledger.json` as the Forge Control Room.

## What the ledger shows

- The active review sprint, cadence, timezone, start and end dates
- The distinction between a scheduled review window and a published release
- The one-change-per-window boundary
- The inspection, comparison, build, validation, and publish-or-skip method
- The current candidate queue, including deferred ideas and their reasons
- The quality and security gates that block publication
- Recent published decisions and the checks associated with them

## Maintenance contract

When an autonomous run publishes a change, it must update the ledger in the same pull request or commit:

1. Set `updatedAt` to the publication candidate time.
2. Add one concise entry to `recentDecisions`.
3. Update queue positions or statuses when the published change affects the visible build list.
4. Keep deferred ideas visible when their blocker still applies.
5. Keep no more than 12 recent decision entries and 12 queue items.

A skipped review window should not create a ledger-only commit. The page therefore records releases and the planned review cadence, while GitHub workflow history remains the source for execution-level logs.

The bounded manifest workflow in `scripts/forge.mjs` automatically adds a recent decision when it creates or improves an approved declarative app. Its workflow commits `registry/apps.json` and `registry/forge-ledger.json` together only after validation passes.

## Safety boundary

The ledger is static, repository-owned JSON. It does not call the GitHub API, expose tokens, collect user data, or execute feedback. External links go only to the public repository history and workflow pages.
