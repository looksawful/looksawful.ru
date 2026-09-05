# Production health

## Contract

`.github/workflows/production-health.yml` is the recurring post-deploy health monitor for `https://www.looksawful.ru/`.

It checks:

- the live deployment reports the current `prod` SHA through `deploy-version.txt`;
- homepage, favicon, robots and sitemap through the existing `tools/check-production.mjs` contract;
- `/cv/` availability;
- representative project route `/work/jestei-pool/`;
- CSS and JavaScript assets referenced by the live homepage.

## Cadence and cost

The workflow runs at minute 17 every six hours and can also be started manually. It uses Node and `curl` only. It does not install project dependencies, run Playwright or Lighthouse, regenerate media, or perform a site build. The job timeout is five minutes.

## Failure signal and ownership

A failed GitHub Actions run is the alert. Dedicated step names identify CV, representative-project and built-asset failures; the shared production checker reports the failing production URL or contract for homepage/discovery/SHA failures. Routine performance metrics are deliberately excluded.

Repository operations owns triage. Compare a failure with the current `prod` head and the latest GitHub Pages deployment before changing production code.

## Relationship to release and nightly checks

This workflow is not a release gate. `.github/workflows/pages.yml` verifies the exact deployment immediately after publishing. Nightly and quality workflows provide deeper regression coverage. Production Health is the cheap recurring layer intended to catch breakage that appears after those one-time or deeper checks have finished.
