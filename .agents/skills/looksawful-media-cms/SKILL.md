---
name: looksawful-media-cms
description: Use for Pages CMS models, Media Catalog, media uploads/derivatives, content ownership, and CMS publication-related implementation in looksawful.ru.
---

# Looksawful media and CMS

Use the canonical architecture, not assumptions from an older roadmap.

## Read first

- `docs/cms-architecture.md`
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

## CMS publication and authoring boundary

- CMS publication authorization and classifiers are protected policy surfaces.
- **CURRENT Pages CMS topology:** `dev` is the working/integration source for ordinary Pages CMS edits; trusted publication policy is executed from `prod`; production deployment remains `prod`.
- **CURRENT local Desk topology:** `npm run desk` is write-capable and operates on the current checkout. Its write endpoints are mounted only when `CONTENT_DESK_WRITE=1`; startup currently runs `media:ensure`, which may synchronize derived media state before the UI opens. Treat it as an operator write tool, not a read-only browser.
- **TARGET, not current:** GitHub #451/#452/#453 track isolated `content/*` authoring worktrees, read-only-by-default Desk inspection, deliberate guarded write activation, stronger source authorization, revision-aware conflict handling and atomic/rollback-safe persistence. Do not instruct agents as though those protections already exist.
- `ENGINEERING`, `UNKNOWN`, mixed scope, or unsafe topology must block publication. Do not add an override to bypass this.
- Do not change `.pages.yml`, workflows, scope/topology tools or publication semantics as a side effect of an ordinary content/media task.

## Validation

Choose the narrowest sufficient checks:

- CMS schema/options: `npm run cms:check`
- Media Catalog consistency: `npm run media:catalog:check`
- Media contract changes: the existing media contract/affected checks
- Generated outputs: regenerate with the owning tool and verify an unchanged second run does not rewrite output

Follow `docs/testing-policy.md`; temporary migration/debug tests do not become permanent automatically.
