# Round 3 #1192 — Home / global UI / Gallery / 404 coverage note

Date: 2026-09-28
Scope: GitHub issue #1192 only.

## Current source baseline

- Round 2 owner-approved application point: `19375b94`.
- Current `dev` baseline before this pass: `9ec9550c`.
- Home, global UI and 404 authored sources did not change after `19375b94`.
- Gallery runtime still resolves 96 image items plus 5 Jestei 3D model items.

## Finding: approved Round 2 Gallery credits were only partially applied

A red-capable runtime check against `getGalleryItems()` showed that nine previously rejected Round 2 credit variants were still present in current Gallery output.

Root cause: the Round 2 application updated presentation entries, but the Gallery reads canonical Media Catalog / registered usage credit data. Stale credits remained in `src/content/media-catalog/registered/*.json` and `src/content/media-usages/registered.json`, so the contextual catalog kept emitting old wording.

The correction in this pass changes only wording already approved in Round 2. It does not invent or reopen editorial decisions.

Verification after correction:

- stale rejected Gallery credit variants in `getGalleryItems()`: 0
- `npm run typecheck`: PASS
- `npm run media:catalog:check`: PASS (`660 registered`, `0 synchronized files`)
- `test/text-review-v3-contract.test.mjs`: PASS (7/7)
- `test:media:contract`: not usable in this sparse worktree because generated physical media files are absent; failures are ENOENT on generated image/video artifacts, not content-contract failures.
- `test/round2-human-selections.test.mjs` currently has two pre-existing CV assertions failing on `dev`; this pass does not touch CV.

## Remaining Gallery fact conflicts

Current Gallery still contains 18 slash-only credits that cannot be repaired by inference:

- `/ 2021.`: 1 occurrence
- `/ 2022.`: 1 occurrence
- `/ 2023.`: 11 occurrences
- `/ 2024.`: 5 occurrences

These remain Fact-check work. They are not rewritten in this pass.

## Production drift

The public/prod Gallery still exposes the old credit variants and the same unresolved slash-only credits until this already-approved Round 2 correction is shipped.

## Round 3 classification consequence

- Home: previously reviewed corpus remains structurally current; no new authored-copy occurrence was introduced after the Round 2 apply point.
- Global UI: same.
- 404: same.
- Gallery: old editorial choices stay locked; incomplete application is treated as technical drift, while the 18 slash-only credits stay explicit fact conflicts.
- Embedded image/video text remains excluded from authored-site review.

## Round 3 exact fact items

The private Round 3 corpus now contains 18 exact Gallery fact items, one per unresolved occurrence. Distribution: 2021 = 1, 2022 = 1, 2023 = 11, 2024 = 5. All 18 are `authorship_missing`, unresolved, and point back to the corresponding Round 2 fact decision. RLS remains enabled; `anon` and `authenticated` cannot select the table; `service_role` can.

Content correction commit: `6da7e52c`.
