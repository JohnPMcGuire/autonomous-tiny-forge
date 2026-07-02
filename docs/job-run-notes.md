# Job run notes

The expansion sprint must never publish a feature through multiple direct pushes to `main`.

A complete candidate belongs on one branch and one pull request. The app code, public-page wiring, validator changes, and forge ledger update must be validated together. Only the exact green pull-request head may be squash-merged.

This avoids intermediate deployments, cancelled Pages jobs, and temporary states where the ledger, page shell, and app assets disagree.
