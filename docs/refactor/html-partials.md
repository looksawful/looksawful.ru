# remaining refactor step 4 — html partial baseline

## goal

Create a source-level HTML partial baseline without changing the live page. This closes the missing master-plan item: HTML partial pipeline, policy book partial extraction and pet preview source partials.

## what changed

- Added `scripts/build-html.mjs` as a parity/check script.
- Added `src/html/pages/index.snapshot.html`.
- Added `src/html/partials/policy/policy-book.html`.
- Added `src/html/partials/pets/pets-preview-section.html`.
- Added per-pet preview partial files.
- Added `src/html/partials.manifest.json`.

## safety model

The live `index.html` is not rewritten in this step. The build pipeline checks extracted source fragments and creates a parity report. A later cleanup pass may switch the root page to generated output only after the snapshot, policy book and pet preview fragments are proven equivalent.

## next step

Step 5 may delete aliases, archive legacy folders and add browser QA, but only after this source baseline is committed.
