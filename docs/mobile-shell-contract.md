# Mobile shell contract

The public page depends on a small set of structural class contracts shared by `index.html`, `styles.css`, `forge-ledger.css`, `gallery-preview.js`, and each standalone app script.

- App card metadata and the open label must remain inside one `.app-card-button` so the entire visual card is one keyboard- and touch-operable control.
- The app dialog must use `.dialog-frame`, which supplies the header/content/footer grid and viewport-safe height.
- The transparency section must use `.forge-ledger-section`, and `#forge-ledger-root` must use `.forge-ledger-root` rather than retaining the loading-state class after content renders.
- Every script loaded by `index.html` must also appear in the required-file and asset-wiring validation lists.

`tests/mobile-shell-contract.test.mjs` and `scripts/validate.mjs` enforce these rules before a pull request or deployment can pass.
