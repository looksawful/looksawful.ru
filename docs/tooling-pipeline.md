# Tooling pipeline

This document records the small command/workflow surface used for routine development and CMS operation.

## Local development

Use Node 24.

Core commands:

- `npm run dev` — Vite development server;
- `npm run desk` — Content Desk with media state preparation;
- `npm run typecheck` — TypeScript check;
- `npm run build` — CMS option check, Vite production build, CV content application, sitemap generation and local site validation;
- `npm run preview` — preview built site.

## CMS configuration

- `npm run cms:generate` updates generated Pages CMS options;
- `npm run cms:check` verifies generated Pages CMS options are current.

## Media

- `npm run media:sync` builds the canonical catalog/video/responsive/generated state;
- `npm run media:ensure` prepares the required local media state without a full derivative rebuild;
- `npm run media:check` verifies catalog stability, derivative contracts, data integrity and permanent media integrity.

`.github/workflows/cms-media.yml` owns automatic media mutation on `dev`. It may persist only explicit deterministic generated metadata and refuses to overwrite an advanced `dev` branch.

## Fast CI

`.github/workflows/ci-fast.yml` is intentionally small:

- `npm ci`;
- exact generated-media cache restore/verify;
- `npm run typecheck`;
- `npm run build`.

It does not run a generic test suite and does not regenerate missing media. A missing exact media cache is a hard failure that must be repaired through the media pipeline.

Pages CMS `Проверить сайт` actions may dispatch Fast CI explicitly on `dev`.

## Production

`.github/workflows/pages.yml` is tied explicitly to `prod` and publishes only the exact checked-out production SHA.

Before deploy it requires exact media cache integrity, typecheck, build, production CV preparation and the compact production browser smoke. After deploy it verifies the published SHA, root page, CV and built CSS/JS assets.

`npm run test:e2e:production` is the only package-level E2E command kept as a permanent deployment gate.

## Publication

Editing happens on `dev`; production deployment happens from `prod`. The current Pages CMS publication helper, where retained, may only prepare/reuse a `dev -> prod` PR and must never merge or deploy automatically.

Dependabot and development automation should continue to target `dev` explicitly rather than relying on the repository default branch.
