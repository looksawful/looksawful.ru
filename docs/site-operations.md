# Site operations

Status: CURRENT operator reference. See `docs/README.md` for documentation authority.

## Branches and manual content

The only permanent operational branches are `dev` (code, manually authored content and private Lab/Storybook) and `prod` (protected public release). Edit authored files in `dev`; validate the exact candidate before integration. Production publication requires its separately authorized release and required GitHub checks. Never force-push or bypass protections.

Pages CMS, local Content Desk and Cloudflare Media Desk source, launchers and repository deployment workflows are retired. No local content-write HTTP interface is part of the site or Lab. Old `content/text-cms` refs are recovery/history, not an authoring lane. Do not delete legacy refs or unique work without preservation and dependency review.

## Ownership

Manually authored copy and metadata live under `src/content/**`. Typed parsers still validate them. TypeScript owns stable domain identity, relations, routes, rendering and presentation semantics. Structural work must not alter authored copy, credits, captions or names.

Registered records under `src/content/media-catalog/registered/` and upload records under `src/content/media-catalog/uploads/` converge in the existing typed Media Catalog. Historical `origin: "cms"` and `cms-` IDs are compatibility data; do not rename identities during editor retirement. `MediaEntry` remains placement-specific.

## Media preparation and validation

Preserve source/master files. Video `src` is browser delivery; optional `sourceSrc` retains the source master. Never invent placeholder media.

- `npm run media:catalog:check` validates deterministic normalization.
- `npm run media:sync` prepares catalog metadata and video/image derivatives.
- `npm run media:page-usage:check` and `npm run media:static-usage:check` reject stale usage snapshots.
- `npm run test:media:contract` and `npm run test:media:checks` validate live media contracts, integrity and deduplication.

Builders own generated media, manifests and TypeScript indexes. Review generated diffs; unchanged reruns must not rewrite or retranscode output. See `docs/media-upload-policy.md`.

`.github/workflows/media-preparation.yml` prepares explicit `dev` source changes. It retains exact-cache verification, affected-only images, allowed metadata paths and a non-force writeback that refuses an advanced `origin/dev`. It never authorizes production.

## Site and private Lab

Validate with `npm ci`, `npm run typecheck`, `npm run test:fast` and `npm run build:site`. Use `npm run lab:build` for private Lab, integrated Storybook and inventory. Lab remains read-only, private, OAuth-protected and non-indexable; it must not enter the public build. See `docs/private-lab.md`.

Production deployment remains explicitly scoped to `prod` in `.github/workflows/pages.yml`. Verify live rules and exact SHAs before relying on protection or claiming deployment.

## External retirement and preservation

Repository removal does not remove the deployed Cloudflare Worker or domain. Keep external resources until consumers, routes, authentication and domain dependencies have been separately checked and removal explicitly authorized.

Preserve dirty originals, source media, archives and patches. Stop integration when required checks or permissions are missing. Record blockers and evidence in existing issue #1009; do not create parallel trackers.
