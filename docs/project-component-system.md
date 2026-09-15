# Project component system

This document defines the source-of-truth boundary for project pages, project cards, Storybook/Lab, CMS content and the media catalog.

## Canonical production ownership

Production renderers, contracts and data in `src/` are the canonical implementation. Storybook/Lab is an approval and inspection surface; it must reuse production renderers, data contracts and CSS instead of reimplementing them.

The machine-readable inventory lives in `src/content/contracts/project-component-surfaces.ts`. Every registered production surface requires Storybook coverage and explicitly records CMS, media and interaction ownership.

## CMS ownership

CMS may own authored editorial strings and other explicitly safe authoring fields. It must not own routes, publication state, release gates, renderer selection, runtime behavior or arbitrary media paths.

Release state remains code-owned. In particular, Storybook coverage must never publish a gated project.

## Media ownership

Media-bearing production components should resolve media through canonical `MediaEntryId` catalog records and the generated responsive/video delivery pipeline.

Current exception: homepage `project-card` covers still use authored paths in `src/content/projects.json`. The registry marks this family as `legacy-path` until it is migrated to MediaEntryId. Pet-project and subproject cards already use catalog-backed entry IDs.

External media is allowed only when it is an intentional runtime dependency and is recorded as such. Berserk Timer audio is currently an explicit external dependency on its tagged release assets.

## Visibility and release-gating audit

Visibility has four different meanings and they must not be mixed:

1. **Authored-content visibility**: enabled entity pages must render their canonical authored intro. `showIntro: false` is not allowed for enabled entity pages. Accessibility-only text belongs in explicit accessibility primitives, not as a substitute for authored content.
2. **Discovery visibility**: `listed` and `indexable` control navigation/search discovery only. They do not remove authored page content.
3. **Release gating**: `enabled: false` prevents a page from being publicly routable. AWFUL STUDIO remains disabled, unlisted and non-indexable until separately approved.
4. **Responsive/component visibility**: breakpoint-specific hiding is a presentation concern and must not delete source content or change release state.

Current project-page classification:

| Page | Enabled | Listed | Indexable | Canonical intro |
| --- | --- | --- | --- | --- |
| Jestei Pool | yes | yes | yes | visible |
| Styx Jewel | yes | yes | yes | visible |
| Sensetique | yes | yes | yes | visible |
| Music photography / Shootings | yes | yes | yes | visible |
| Awful Cases | yes | no | no | visible |
| Moves Awful | yes | no | no | visible |
| Berserk Timer | yes | no | no | visible |
| Berry social content | yes | no | no | visible |
| AWFUL STUDIO | no | no | no | gated |

Fast CI enforces that enabled entity pages cannot suppress the canonical intro.

## Storybook/Lab contract

Every registry surface is `storybook: required`. Lab may contain additional experiments, but production coverage must not depend on branch ancestry because `prod` and `lab` are intentionally divergent histories.

The Lab parity work must therefore copy/sync the canonical production surface deliberately and verify:

- renderer parity;
- production CSS parity;
- representative states;
- responsive states where relevant;
- controls and accessibility for interactive surfaces;
- media-catalog bindings;
- no raw implementation labels leaking into UI.

A future Lab CI guard should compare Storybook coverage against the same surface registry rather than maintain a second handwritten allowlist.

## Card families

- `project-card`: homepage portfolio card; CMS/editorial + code ownership, media migration still required.
- `subproject-card`: reusable catalog-backed card.
- `pet-project-card`: catalog-backed card with typed `live` / `coming-soon` state. CMS must not be able to change release state or href gating.

## Change rule

Adding a new project-facing UI surface requires, in the same workstream:

1. canonical contract/renderer;
2. registry entry;
3. Storybook approval surface;
4. explicit CMS ownership;
5. explicit media ownership;
6. automated contract coverage;
7. browser coverage when the surface owns interaction.

If one of these is intentionally absent, the exception must be documented next to the registry entry instead of being inferred from missing files.
