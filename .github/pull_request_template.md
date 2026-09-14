## Change type

- [ ] New app or feature
- [ ] Repair / regression fix
- [ ] QA, validation, or integration improvement
- [ ] Documentation or transparency update

## Shipping score

Rate each item from 0 to 2. A release should normally score at least 10 / 14 and have no blocker.

| Dimension | Score | Notes |
|---|---:|---|
| User value |  |  |
| Interaction depth or repair value |  |  |
| Mobile quality |  |  |
| Accessibility and reduced motion |  |  |
| Replay value or repeated-use value |  |  |
| Integration risk |  |  |
| Maintenance cost |  |  |

Total: `__/14`

## Definition of shipped

- [ ] Validation passed on the exact PR head SHA being merged.
- [ ] Deployment result will be verified before counting this as a successful deployment.
- [ ] Public page and changed app/feature load path has been considered.
- [ ] Mobile, keyboard, focus, labels, and reduced motion have been considered.
- [ ] No unresolved user-visible bug or failed deployment is left behind.
- [ ] `registry/forge-ledger.json` is updated when this changes the experiment, queue, metrics, or recent decisions.

## Paper lens

This project is an informal micro-lab inspired by Demirer, Musolff, and Yang's *Writing Code vs. Shipping Code*. Explain why this change improves shipped value rather than only increasing code activity.

## Validation

List the checks run or expected to run in CI.
