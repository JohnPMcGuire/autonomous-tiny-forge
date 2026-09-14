# Shipping Gap Experiment

Autonomous Tiny Forge is now framed as an informal public micro-lab inspired by Mert Demirer, Leon Musolff, and Liyuan Yang's NBER working paper, *Writing Code vs. Shipping Code: Productivity Effects Across Generations of AI Coding Tools*.

The paper's thesis is not treated as something this project can formally prove or disprove. Tiny Forge is a small public software project, not a replication of the paper's dataset, matched event study design, or empirical identification strategy.

## Question

Does a faster AI iteration schedule create durable shipped software, or mostly more activity?

## Hypothesis

A public ledger, structured feedback, pull-request validation, deployment checks, repair tracking, and a willingness to skip weak candidates should improve the ratio of useful shipped releases to raw review windows.

## What counts as activity

- Scheduled review windows
- Candidate changes considered
- Pull requests opened
- Code, app, or content changes attempted

## What counts as shipped value

- Pull requests merged after the exact head SHA passes validation
- Deployments that actually complete
- Public pages and changed apps that load and work
- User-visible bugs resolved
- Feedback items processed without executing issue text
- Fewer repair releases needed after publication

## What does not count as shipped value

- A scheduled run that merely fired
- A branch or commit that never passed validation
- A deployment that failed or was cancelled
- A cosmetic ledger-only update
- A new app that duplicates an existing mechanic without improving the collection
- A change that creates a new mobile, accessibility, teardown, or integration bug

## Daily review mix

The 12 review windows per day are intentionally mixed:

- 3 new-build candidate windows
- 3 QA and bug-sweep windows
- 2 integration-audit windows
- 2 feedback-triage windows
- 1 portfolio-review window
- 1 public-ledger review window

This keeps the sprint from turning into a raw code-output race.

## Definition of shipped

A release is not considered fully shipped until:

1. PR validation passed on the exact head SHA that will be merged.
2. Deployment completed, or the result is not counted as a successful deployment.
3. The public page loads and the changed app or feature opens.
4. Mobile layout, keyboard access, focus order, readable labels, and reduced-motion behavior are acceptable.
5. The change improves user value, replay depth, repair quality, or integration reliability more than it increases complexity.
6. No unresolved user-visible bug, failed deployment, or shell regression is left behind by the release.
7. The ledger honestly records whether this was a feature, repair, skip, or deferred decision.

## Metrics

The public control room records review windows, candidate changes, pull requests, merged releases, successful deployments, skipped windows, bug reports, repair releases, and release acceptance rate.

Deployment success should be counted only after it is actually observed. Skipped windows should be tracked without creating cosmetic ledger-only commits.
