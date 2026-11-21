---
name: looksawful-media-cms
description: Use for manual authored content, Media Catalog, media uploads/derivatives and content ownership in looksawful.ru.
---

# Looksawful media and CMS

Use the canonical architecture and live branch policy, not assumptions from an older roadmap.

## Read first

- `docs/site-operations.md`
- `AGENTS.md`
- the relevant typed parser/registry/builder and tests

## Classify ownership before editing

Classify the requested change as one of:

- **DOMAIN**: stable identity and relations. TypeScript/code owns it.
- **EDITORIAL**: authored copy/metadata exposed by an explicit CMS model.
- **PRESENTATION**: layout, ratios, fit/position, animation, gallery/lightbox/deck behavior. Code owns it unless a typed editorial control was deliberately designed.
- **ARCHITECTURE**: routes, renderer identity, canonical URLs, Vite inputs, publication policy. Code owns it.
- **GENERATED**: deterministic derived state. Tooling owns it.

Do not turn Pages CMS into a generic page builder.

## Media Catalog

- Registered assets and CMS uploads are two authored entry paths into one typed Media Catalog, not parallel registries.
- Preserve stable media identity.
- Source masters are preserved; delivery assets are optimized browser-facing outputs.
- Placement-specific captions, alt text, fit/position and presentation remain with the placement model when that is the current contract.
- Generated responsive/video assets and generated TypeScript indexes are never hand-edited.
- Do not create placeholder media to satisfy validation.

## Manual editing and release boundary

- Keep `dev` and `prod` as the permanent operational branches. Manually edit code/content in `dev`; private Lab/Storybook uses `dev`; public production uses the separately authorized protected `prod` release.
- Pages CMS, Content Desk and Media Desk write interfaces are retired. Do not invoke removed launchers, topology tools or workflows. Old `content/text-cms` references are recovery/history.
- Preserve parsers, schemas, media identities and validation. Historical CMS asset vocabulary is compatibility data; do not rename it as cleanup.
- Keep media preparation, usage snapshots, deterministic builders, exact-cache checks and writeback SHA/path guards.
- External Worker/domain removal requires separate dependency review and authorization.
- Review workflow permissions, testing/release guards and publication-policy changes explicitly.

## Validation

Choose the narrowest sufficient checks:

- Usage snapshots: `npm run media:page-usage:check` and `npm run media:static-usage:check`
- Media Catalog consistency: `npm run media:catalog:check`
- Media contract changes: the existing media contract/affected checks
- Generated outputs: regenerate with the owning tool and verify an unchanged second run does not rewrite output

Follow `docs/testing-policy.md`; temporary migration/debug tests do not become permanent automatically.
