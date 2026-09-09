# Site Copy Audit coverage

## Purpose

Coverage is a second layer after source-first copy export. Normal editorial audits should use the generated source index and must not require a browser.

## Fast path

`copy:check` is the cheap stale-export contract. It should call the source exporter with `--check` and fail when committed `generated/site-copy/**` no longer matches canonical source copy.

This check belongs in the normal fast verification path because it is deterministic, local and does not render pages.

## Deep path

`copy:coverage` is a separate rendered-site audit. It compares visible rendered text with the source index by `route + locale + normalized text` and reports every unmatched rendered location.

The deep path should stay out of ordinary `verify` because it requires a built or running site and Playwright. It is intended for manual, scheduled or release-level checks.

### Rendered snapshot contract

`generated/site-copy/rendered.json` may be temporary or ignored. Its entries should contain only:

```json
{
  "route": "/work/jestei-pool/",
  "locale": "en",
  "locator": "main [data-section-id=\"interface\"] p:nth-of-type(3)",
  "text": "Visible text"
}
```

Do not store screenshots, HTML, CSS, computed styles or media metadata in the copy-audit payload.

### Collector strategy

Reuse the existing Playwright E2E runtime rather than introducing a second browser harness. For each canonical route and locale:

1. open the page through the existing E2E runtime;
2. wait for document readiness using existing helpers;
3. collect visible authored text from the main document;
4. exclude script/style/noscript/template nodes and hidden elements;
5. keep `locator` only as a debugging coordinate;
6. write the lightweight rendered snapshot;
7. run `tools/editorial/check-site-copy-coverage.mjs`.

ARIA labels, loading labels, alt text and other accessibility-only copy should be collected only in an explicit deeper accessibility/editorial mode, not in the default rendered coverage pass.

## Duplicate text

Coverage must not deduplicate rendered locations. The same string can be valid in one location and unindexed in another; reports preserve each locator independently.

## Integration commands

The stable package-level API should be:

```json
{
  "copy:export": "node tools/editorial/export-site-copy.mjs",
  "copy:check": "node tools/editorial/export-site-copy.mjs --check",
  "copy:coverage": "node tools/editorial/check-site-copy-coverage.mjs"
}
```

`copy:export` and `copy:check` are owned by the extractor implementation. `copy:coverage` is the deep comparison command defined here.

## CI policy

- Keep the cheap tooling and matcher contract tests in `fastTests`; they do not execute the exporter or Playwright.
- Add `npm run copy:check` to ordinary verification only after the exporter and committed generated index exist.
- Keep `npm run copy:coverage` outside normal `verify`; run it manually, on a scheduled job, or in a release/deep-audit workflow.
- A missing rendered snapshot is an explicit deep-audit setup error, not proof that source coverage passed.
