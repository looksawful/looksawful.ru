# Media Normalization and Lossless Dedupe Completion Design

## Status

- Repository: `looksawful/looksawful.ru`
- Working branch: `agent/media-normalization-dedupe-20260903`
- Design snapshot HEAD before this document: `0985fb9f407e2c421ded9b0652cac335e2571986`
- This work must not modify `dev` or `prod`, open a PR, run GitHub Actions, or force-push.
- Physical source deletion remains forbidden until every lossless safety gate in this document passes.

## Goal

Finish the media normalization and dedupe project without changing current production semantics.

The target invariant is:

> one logical source image = one canonical `MediaAsset` = one canonical physical source file, with any number of contextual uses represented by `MediaEntry`.

Generated responsive derivatives do not count as source duplicates.

## Problem

The legacy media model mixes two different responsibilities:

1. `MediaAsset` / registered catalog data describe media identity and technical source properties.
2. The same catalog records also hold contextual semantics such as title, alt text, project membership, taxonomy, credits, and date.

That makes a seemingly harmless duplicate-asset retarget capable of changing project membership or other user-visible metadata. Stage 4 therefore found 21 dedupe components where physical identity is safe to unify but contextual metadata differs.

The project must remove that coupling before deleting logical assets or physical files.

## Current branch state

The branch already contains the migration scaffolding required to separate identity from usage:

- `src/types/media.ts` defines optional `MediaUsageMetadata` and lets `MediaEntryData` carry contextual metadata.
- `src/data/media/usage.ts` resolves usage metadata with legacy catalog fallback. Only `undefined` falls back; explicit empty strings and arrays are preserved.
- `src/content/media-usages/registered.json` records contextual metadata needed when an entry is retargeted from a retired duplicate asset to its canonical asset.
- `src/data/media/usage-records.ts` validates those migration records, taxonomy IDs, and evidence component IDs.
- `src/data/media/asset-aliases.json` records 24 reviewed retired logical asset IDs and their canonical IDs.
- `src/data/media/assets/registered.ts` still exposes the complete legacy registry for migration tooling, but also builds `canonicalRegisteredMediaAssets` with those 24 retired IDs filtered out.
- `src/data/media/assets/index.ts` exposes only the canonical registered assets plus uploaded CMS assets to runtime consumers.
- `src/data/media/entries/index.ts` applies usage metadata, canonicalizes retired asset IDs, and preserves explicit project membership before exposing runtime entries.
- `src/data/media/project-assignments.ts` treats `MediaEntry.projectIds` as authoritative and no longer derives project membership from asset/catalog metadata.
- `src/data/media/catalog-view.ts` exposes a read-only catalog projection. Context is derived from usages when every usage defines a field; legacy catalog metadata remains a compatibility fallback while migration is incomplete.
- `test/media-retired-assets.test.mjs` independently checks the reviewed logical migration manifest against runtime assets and entries, proving that all 24 retired IDs are absent from the runtime asset set and no runtime entry resolves to them.
- `tools/media/live-semantic-snapshot.mjs` has been decoupled from runtime migration aliases so the semantic verifier can independently test the migration rather than proving itself with the same scaffolding it is meant to verify.
- `tools/media/normalize-media-source.mjs` already uses image-scoped regeneration steps (`media:catalog:sync`, `media:build`, and media-dev-state refresh) instead of the broader `media:sync`, reducing the risk of touching unrelated video inventory state during image normalization.

This means logical retirement is already effective in the runtime projection, but the legacy source records, raw references, aliases, and physical duplicate files still need a controlled one-shot cleanup. The scaffolding is transitional and is not the final source-of-truth layout.

## Source-of-truth ownership

### `MediaAsset`: canonical media identity

`MediaAsset` owns only data that is intrinsic to the canonical media object or its storage/delivery representation:

- `id`
- `type`
- `src`
- `width`
- `height`
- `sourceSrc` for video masters
- media MIME/byte-length data where the asset type needs them
- `rating`
- `reusable`
- `archived`

Legacy asset-level/contextual `date` is transitional and must not be used to determine a contextual usage once migration is complete.

### `MediaEntry`: contextual usage

Each `MediaEntry` represents one use of one canonical asset and owns contextual semantics:

- `id`
- `assetId`
- `title`
- `alt`
- `description`
- `date`
- `projectIds`
- `workAreaIds`
- `projectTypeIds`
- `deliverableIds`
- `tags`
- `credits`
- `creditId`
- `caption`
- `purpose`
- `posterAssetId`

A single canonical asset may therefore have multiple entries with different project membership, title, date, credits, taxonomy, captions, or purpose. Those differences are valid context, not duplicate-media conflicts.

### Media catalog: derived browsing projection

The catalog is not a third semantic source of truth.

Its final role is to provide a stable asset-centric browsing/filtering projection derived from:

1. canonical `MediaAsset` data;
2. the set of contextual `MediaEntry` usages for that asset;
3. asset-level library state such as `reusable` and `archived`.

Facet fields such as project, work area, project type, deliverable, tags, and credits may be unioned for browsing because that union is derived output, not persisted ownership.

For scalar display fields such as title, alt, description, and date, the projection may expose one deterministic display value, but that value must never be written back as the contextual value for every usage.

## Compatibility rule during migration

Until all production usage metadata is materialized, a contextual field resolves as:

1. explicit value on the usage, if the value is not `undefined`;
2. otherwise the legacy catalog value for the contextual asset.

Explicit `""` and `[]` are authoritative values and must never trigger fallback.

This rule is temporary and exists only to make the migration incremental and behavior-preserving.

## Dedupe evidence and authority

The Stage 1–4 analysis and the user's visual review are the evidence base for dedupe decisions.

- Stage 4 contains 85 approved same-image components covering 180 physical paths.
- 64 components do not require semantic conflict resolution under the new contextual model.
- 21 components require contextual metadata to remain distinct at the `MediaEntry` level while their logical assets converge.
- Stage 4 identified 95 potentially removable physical paths, but this is a migration map, not a deletion list.
- The 24 retired logical assets already represented in `asset-aliases.json` are the registered logical-identity migration set.
- User visual decisions are authoritative over heuristic detectors.

The following unique pairs/components remain permanent no-merge constraints because they are DIFFERENT or VARIANT rather than the same logical image:

- C10: Jestei 95 vs 97, DIFFERENT.
- C21 / R05: Styx source 03 vs 05, VARIANT.
- C24: Sensetique low-resolution vs high-resolution variant, VARIANT.
- C25: Sensetique low-resolution vs high-resolution variant, VARIANT.
- C26: Sensetique low-resolution vs high-resolution variant, VARIANT.
- R09: OBLADAET shooting image vs Behance source 006, VARIANT.

No automated or future near-duplicate detector may override these decisions.

## Migration sequence

### Phase 1: freeze and independently verify semantics

Before source deletion or legacy catalog-record removal:

- keep the semantic golden baseline immutable;
- generate a live semantic snapshot independently of runtime alias/usage scaffolding;
- compare baseline and live records for every production `MediaEntry`;
- fail on any mismatch.

The snapshot must include at least:

- entry ID;
- resolved canonical asset/source identity;
- project membership;
- title;
- alt;
- description;
- date;
- work-area, project-type, deliverable, and tag facets;
- credits and `creditId`;
- caption;
- purpose;
- poster relation.

### Phase 2: finish contextual materialization

For every entry whose legacy logical asset will be removed from source data, materialize exactly the contextual values required to make its behavior independent of the retired asset's catalog record.

Rules:

- never invent or normalize content;
- preserve explicit empty values;
- preserve every `MediaEntry.id`;
- preserve entry-specific captions, credits, project membership, purpose, and poster relations;
- do not merge entries merely because they point to the same canonical asset.

When a contextual value already matches the canonical asset's compatibility default, it may remain omitted only while that fallback is intentionally part of the migration contract. Before legacy catalog context is removed, every required contextual field must become explicit or be provided by a new non-legacy source whose ownership is defined in this design.

### Phase 3: make runtime consumers usage-first

All runtime consumers that need contextual semantics must read them from `MediaEntry` / resolved usage context rather than from `MediaAsset` or legacy catalog metadata.

This includes at least:

- project assignment;
- project/media rendering consumers;
- Media Desk metadata editing paths;
- catalog browsing/filtering projection;
- any code that derives captions, credits, taxonomy, title, alt, description, or date for a concrete usage.

A concrete usage must never gain project membership merely because its canonical `MediaAsset` is used by another project.

### Phase 4: materialize logical retirement in source data

Runtime already excludes the 24 reviewed duplicate asset IDs. The remaining task is to make source data match that runtime state so aliases are no longer required.

After semantic equivalence is green:

- rewrite raw affected `MediaEntry.assetId` values to canonical `MediaAsset` IDs;
- remove the 24 retired duplicate `MediaAsset` source records;
- remove their registered catalog records;
- verify no runtime/content source contains a retired asset ID;
- then remove runtime asset aliases and dedupe-only alias filtering;
- keep reviewed migration evidence/manifests under tooling/docs for auditability if still useful.

Logical retirement and physical source deletion are separate operations and must remain separately reviewable.

### Phase 5: rewrite genuine direct physical references

Only real production references to a removed physical path are rewritten.

Do not treat these as production runtime references:

- temporary Stage 1–4 review tools;
- generated responsive-manifest references that will be regenerated;
- registry/catalog references that disappear when the retired logical record is removed.

Known true direct-production path cases from Stage 4 include Behance manifests and the Awful Cases atlas JavaScript reference. Each must be resolved before its old physical path can be deleted.

### Phase 6: apply safe physical dedupe

A physical source file may be deleted only if all of these are true:

1. The component is user-approved SAME, exact-byte-identical, or pixel-identical under the accepted evidence policy.
2. It is not part of any permanent no-merge constraint.
3. The canonical source file exists and decodes successfully.
4. All runtime/content references to the removed path have been rewritten or intentionally removed.
5. Repository reference scan reports zero unresolved source references to the removed path, excluding generated outputs scheduled for regeneration in the same change.
6. Semantic snapshot remains exactly equivalent.
7. The planned removal is represented in the reviewed migration manifest.

No crop, retouch, color-grade variant, before/after image, series neighbor, text-overlay variant, or composite may be auto-merged.

### Phase 7: quality promotion cases

The two approved quality-promotion components remain separate from ordinary deletions:

- Sensetique component where the established canonical URL should receive the higher-resolution bytes.
- Berry/shootings component where the established canonical URL should receive the higher-resolution bytes.

For each promotion:

- keep the established canonical URL when the format is compatible;
- replace only the canonical source bytes with the reviewed higher-quality source;
- update width, height, byte length, hashes, and generated derivatives from the new canonical source;
- verify that aspect/crop/content identity is unchanged;
- run the same semantic and reference gates as ordinary dedupe.

### Phase 8: regenerate generated media metadata

Generated responsive manifests and derivatives must be regenerated from canonical image sources after source changes.

The normalization path must remain image-scoped. It must use the current `media:catalog:sync` + `media:build` + media-dev-state refresh sequence rather than broad `media:sync`, so unrelated video inventory state is not regenerated as a side effect.

Generated outputs must not be hand-edited as the primary migration mechanism.

The pre-existing unrelated `public/media/generated/video-inventory.json` working-tree change must remain outside the dedupe commit unless its origin has been explicitly resolved.

### Phase 9: remove migration scaffolding

After all retired asset records and removable physical paths are gone and every usage is independent of legacy context:

- remove runtime asset aliases and canonical filtering based on those aliases;
- remove dedupe-only usage evidence plumbing from runtime paths;
- keep or move audit manifests under tooling/docs if historical evidence is still required;
- remove temporary Stage 1–4 scripts and review helpers;
- remove catalog-context fallback for fields that are fully usage-owned;
- simplify the catalog into a pure derived projection.

The final runtime must not need dedupe evidence files in order to resolve ordinary media entries.

## Permanent integrity guards

After cleanup, repository verification must fail on:

- duplicate `MediaAsset.src` values for canonical source assets;
- byte-identical source images represented by multiple canonical `MediaAsset` records;
- pixel-identical source images represented by multiple canonical `MediaAsset` records, unless explicitly allow-listed as a justified exception;
- `MediaEntry.assetId` that does not resolve to a canonical asset;
- dangling `posterAssetId`;
- missing canonical source paths;
- duplicate `MediaEntry.id`;
- runtime references to retired asset IDs;
- runtime references to removed physical source paths;
- semantic-baseline mismatch during the migration window.

Near-duplicate detection remains a warning/review mechanism, never an automatic merge command.

Upload/import tooling should hash and reuse an existing canonical asset before creating another source asset when an exact match is found.

## Behavioral equivalence gates

The migration is lossless only when all of the following remain true before and after each logical/physical dedupe batch:

- same production `MediaEntry` count;
- same set of `MediaEntry.id` values;
- same resolved project membership for every entry;
- same title, alt, description, date, taxonomy, tags, credits, caption, purpose, and poster relation for every entry;
- same library visibility semantics for `reusable` and `archived`;
- no missing or undecodable canonical source media;
- no unresolved references to removed IDs or paths;
- no user-approved VARIANT/DIFFERENT pair collapsed;
- generated manifests rebuilt successfully from canonical image source state without unrelated video regeneration.

Changing only the physical URL of an entry to the reviewed canonical source for the same logical image is permitted. Changing its contextual meaning is not.

## Commit and review boundaries

The remaining implementation should be split into independently verifiable commits rather than one destructive batch:

1. semantic/context completion and tests;
2. usage-first consumer completion;
3. source-level logical asset/catalog retirement;
4. direct-production reference rewrites;
5. ordinary physical dedupe;
6. quality promotions;
7. image-scoped generated-media regeneration;
8. removal of migration scaffolding and temporary tools;
9. permanent integrity guards and final verification.

Each destructive commit must be preceded by a clean dry-run report and followed by the semantic/reference verification gates.

## Success criteria

The project is complete when:

- one logical source image has one canonical `MediaAsset` and one canonical physical source file;
- multiple contextual uses are represented only as multiple `MediaEntry` records;
- the catalog is a derived browsing/library projection rather than a semantic source of truth;
- all approved SAME duplicates are normalized where safe;
- all VARIANT/DIFFERENT constraints are preserved;
- no content, project membership, metadata, credits, captions, purpose, or poster relations are lost;
- generated image media is rebuilt from canonical sources without unrelated video regeneration;
- temporary migration scaffolding is no longer required at runtime;
- permanent integrity checks prevent the same class of duplication from silently returning.
