# src/html partial baseline

This folder is a source-level baseline for the remaining refactor.

The current live page is still `index.html`. Step 4 intentionally does not rewrite the production root file. It creates a snapshot and extracts stable partials that can be compared before the later destructive cleanup pass.

## files

- `pages/index.snapshot.html` — exact snapshot of the live root page at extraction time.
- `partials/policy/policy-book.html` — extracted policy book organism.
- `partials/pets/pets-preview-section.html` — extracted pets section.
- `partials/pets/*.html` — extracted pet preview articles.
- `partials.manifest.json` — extraction manifest and counts.

## rule

Do not make `scripts/build-html.mjs --write` overwrite `index.html` until parity checks and visual QA are complete.
