# CMS media catalog handoff

Status: implementation complete and ready for release. This document separates the shipped foundation from follow-up product work so another agent can continue without reconstructing the architecture.

## What is implemented

- Pages CMS has two media collections:
  - `registered-media-catalog` for metadata of every existing registered asset;
  - `uploaded-media-catalog` for creating new photo/video assets in `public/media/catalog/`.
- All 639 existing `MediaAsset` records have one searchable JSON catalog record in `src/content/media-catalog/registered/`.
- Existing media received an automated first-pass semantic classification. No asset is left without a work area.
- Photo/video properties are editable: title, alt text, description, date, projects, work areas, project types, deliverables, tags, credits, reusable/archive flags.
- Technical identity and probed properties are protected from accidental CMS edits.
- New upload records become typed `MediaAsset` objects and enter the same `MediaAsset -> MediaEntry -> typed content/template` architecture.
- The catalog exposes typed query functions for media type, project, work area, project type, deliverable, tag, reuse and archive status.
- Catalog synchronization probes technical media metadata, preserves authored fields, generates a deterministic TypeScript import index and participates in every CI media workflow.

## Canonical taxonomy

The implementation reuses canonical IDs instead of creating a second taxonomy. CMS labels include the owner's requested Russian names.

- Work areas: Фото, Продакшен, Иллюстрации, Графический дизайн, Айдентика, Сканография, Моушен, Макеты экранов, 3D, Книги / дизайн книг, Обложки для музыкантов.
- Shooting types: Музыка, Лукбук, Каталог, Кампейн, Эдиториал.
- Deliverables include business cards, banners, posts, advertising, covers, brand books, logos, printed materials, certificates, posters, stickers, booklets, T-shirts, packaging, screen mockups and music covers.

Canonical definitions live in:

- `src/data/taxonomy/media-taxonomy.ts`
- `src/data/taxonomy/work-areas.ts`
- `src/data/taxonomy/project-types.ts`
- `src/data/taxonomy/deliverables.ts`

## Source-of-truth contract

1. Physical/technical asset: `src/data/media/assets/registered.ts` or an uploaded catalog record.
2. Reusable metadata: `src/content/media-catalog/**/*.json`.
3. Generated imports: `src/data/media/catalog-records.generated.ts`.
4. Typed catalog/query layer: `src/data/media/catalog.ts`.
5. Usage-specific caption, alt and layout: existing `MediaEntry` and typed project content.

Catalog metadata deliberately does not overwrite existing usage-specific authored captions or visible project copy.

## Operator commands

```bash
npm run media:catalog:sync
npm run media:catalog:check
node --test test/media-catalog-cms.test.mjs test/media-catalog-sync.test.mjs
npm run verify
```

An unchanged sync must report zero changed files. Commit uploaded originals, their JSON records, the generated import index and deterministic media manifests together. The `dev` workflow is allowed to persist only these scoped CMS/media changes and rejects unrelated source edits.

## Fresh verification evidence

- Catalog sync: 639 registered, 0 uploaded, 0 changed on the second run.
- Focused catalog tests: 8/8 passing.
- Selected catalog/workflow/tooling verification: 27/27 tests passing. A broader project-card suite additionally reached its media assertion and failed only because the workspace sparse checkout excludes the referenced project-cover binary, not because of catalog behavior.
- `.pages.yml` parses as valid YAML and exposes both catalog collections plus shared taxonomy components.

## Deferred work, in priority order

### P1 — authenticated CMS acceptance test

Requires a repository-owner GitHub session, which is not available to automation.

Acceptance criteria:

1. Open Pages CMS on `dev`.
2. Edit tags/title on one registered photo and save.
3. Upload one photo and one video, fill taxonomy, save and wait for the `dev` workflow.
4. Confirm the workflow commits probed dimensions/duration and generated indexes without touching authored fields.
5. Confirm both assets are returned by `queryMediaCatalog()` after checkout.

### P1 — review first real upload lifecycle

Use real production media rather than fixtures. Verify responsive image generation, compatible/incompatible video handling, poster behavior, deletion/archive policy and Pages deployment size. Do not delete masters during optimization.

### P2 — editorial taxonomy review

Automated classification is intentionally conservative. Review ambiguous records, especially assets without an explicit project link, and refine tags/credits/categories in CMS. Do not change the canonical IDs when only labels or assignments need correction.

### P2 — future public works catalog

Build the public catalog/search UI on `mediaCatalogItems` and `queryMediaCatalog()`; do not scan folders or parse CMS JSON from components. Define whether archived assets stay hidden and whether project-specific captions or catalog descriptions are shown in each context.

### P3 — optional bulk editing

If 639 individual CMS records become cumbersome, add a safe bulk metadata action with preview, explicit selected IDs and a deterministic diff. It must preserve technical fields and authored project copy.

## Guardrails for future agents

- Do not introduce direct media markup when a typed registry-backed renderer exists.
- Do not treat generated files as authored sources.
- Do not rewrite existing captions, credits, names or project copy during catalog work.
- Keep upload paths scoped to `public/media/catalog/`.
- Reject unknown taxonomy IDs and unknown JSON fields rather than silently accepting drift.
- Keep registered asset IDs stable; new uploads use `cms-<uuid>` IDs.
