---
name: looksawful-media-cms
description: Use for Pages CMS models, Media Catalog, media uploads/derivatives, content ownership, Media Desk, and CMS integration work in looksawful.ru.
---

# Looksawful media and CMS

Use the canonical architecture and current branch contract, not assumptions from older roadmaps or stale workflows.

## Branch contract first

- `prod` is the active working / integration / production / deployment source-of-truth branch.
- `dev` is archive only. Do not use it for current development, CMS authoring, Media Desk writes, preview, release or deployment.
- Any writable editorial task uses a temporary `content/*` branch or isolated worktree created from fresh `origin/prod`.
- Never write directly to `prod` from CMS/Media Desk.
- Do not introduce or depend on a permanent content authoring branch.
- Finished authoring work is validated at its exact SHA and returns through a reviewed PR targeting `prod` after explicit user readiness.

If existing workflows still encode the historical branch topology, treat that as migration debt. Do not copy those assumptions into new code or documentation.

## Read first

- `docs/cms-architecture.md`
- `docs/cms-handbook.md`
- `docs/site-operations.md`
- `AGENTS.md`
- the relevant typed parser/registry/builder and tests

## Classify ownership before editing

Classify the requested change as one of:

- **DOMAIN**: stable identity and relations. TypeScript/code owns it.
- **EDITORIAL**: authored copy/metadata exposed by an explicit CMS model.
- **PRESENTATION**: layout, ratios, fit/position, animation, gallery/lightbox/deck behavior. Code owns it unless a typed editorial control was deliberately designed.
- **ARCHITECTURE**: routes, renderer identity, canonical URLs, Vite inputs, integration policy. Code owns it.
- **GENERATED**: deterministic derived state. Tooling owns it.

Do not turn Pages CMS into a generic page builder.

## Media Catalog

- Registered assets and CMS uploads are two authored entry paths into one typed Media Catalog, not parallel registries.
- Preserve stable media identity.
- Source masters are preserved; delivery assets are optimized browser-facing outputs.
- Placement-specific captions, alt text, fit/position and presentation remain with the placement model when that is the current contract.
- Generated responsive/video assets and generated TypeScript indexes are never hand-edited.
- Do not create placeholder media to satisfy validation.

## Media Desk boundary

- Media Desk is an operator UI over the canonical CMS/media boundary, not a second CMS.
- Ordinary Desk launch is read-only and side-effect-free.
- A future write-capable mode must prove it is operating in an allowed temporary `content/*` branch/worktree from fresh `origin/prod` before exposing mutations.
- Never let Desk bypass canonical validators or directly invent a second media store.
- Protected technical media fields remain tooling-owned.

## Integration boundary

- Scope/integration authorization and classifiers are protected policy surfaces.
- `ENGINEERING`, `UNKNOWN`, mixed scope, stale provenance, or an unauthorized branch/worktree must block integration.
- Do not add an override to bypass this.
- Do not change `.pages.yml`, workflows, scope tools, branch guards or integration semantics as a side effect of an ordinary content/media task.
- Authoring branches have no deployment authority.

## Validation

Choose the narrowest sufficient checks:

- CMS schema/options: `npm run cms:check`
- Media Catalog consistency: `npm run media:catalog:check`
- Media contract changes: the existing media contract/affected checks
- Generated outputs: regenerate with the owning tool and verify an unchanged second run does not rewrite output
- Before integration: exact-SHA repository gates required by the candidate PR

Follow `docs/testing-policy.md`; temporary migration/debug tests do not become permanent automatically.
