# CMS Media Catalog — Design

## Goal

Add a working repository-backed media catalog to the existing Pages CMS so the owner can:

- find every registered photo, video or 3D asset by a stable ID;
- correct catalog metadata without changing presentation code or usage-specific captions;
- add free tags and controlled taxonomy values;
- upload new photos and videos;
- associate one asset with multiple projects and work types;
- reuse the same asset record in a future public catalog of works.

The feature extends the current `MediaAsset -> MediaEntry -> typed content/templates` architecture. It does not replace the media registry, duplicate routes or move layout controls into the CMS.

## Observable outcome

The finished flow is:

```text
registered MediaAsset
  -> one searchable CMS catalog record
  -> editable editorial metadata and taxonomy
  -> typed MediaCatalogItem
  -> reusable catalog query API

Pages CMS upload
  -> source file under public/media/catalog
  -> one CMS upload record
  -> automatic technical metadata sync
  -> registered MediaAsset + typed MediaCatalogItem
```

All 639 media assets that exist at the start of this migration receive a catalog record and a semantic first-pass classification. New CMS uploads join the same runtime catalog and the same asset lookup API.

## Source-of-truth boundaries

### Existing registered assets

The existing TypeScript modules under `src/data/media/assets/` remain the source of truth for physical identity and delivery properties:

- stable asset ID;
- media type;
- source and delivery paths;
- width and height when already known;
- video source master;
- model MIME type and byte length.

Their CMS records may edit catalog metadata but may not silently replace the registered source path or media type. This protects all current pages and renderers.

### New CMS uploads

Files uploaded through the new Pages CMS media source are stored under `public/media/catalog/`. Their records under `src/content/media-catalog/uploads/` are the authored source of truth.

A deterministic synchronization tool probes uploaded files, persists technical metadata and regenerates the static JSON import index before type checking and media generation. Uploaded records then become ordinary `MediaAsset` values and can be resolved with the existing media API.

### Usage-specific content

`MediaEntry` remains the source of truth for a particular use of an asset:

- per-placement alt text;
- caption title, text and meta;
- poster asset ID;
- project-specific purpose;
- presentation-owned composition around the entry.

Catalog title, description and default alt are reusable defaults. This first version does not overwrite current page captions or visible text, so the migration cannot accidentally change authored copy.

## Canonical taxonomy

The repository already has suitable canonical taxonomies in `work-areas.ts`, `project-types.ts` and `deliverables.ts`. The media catalog exposes curated subsets of those IDs instead of creating a second vocabulary.

| Requested concept | Canonical facet | Stable ID |
| --- | --- | --- |
| Фото | work area | `photography` |
| Продакшен | work area | `production` |
| Иллюстрации | work area | `illustration` |
| Графический дизайн | work area | `graphic-design` |
| Айдентика | work area | `identity` |
| Моушен | work area | `motion` |
| 3D | work area | `3d` |
| Сканография | project type | `scanography-project` |
| Книжный дизайн | project type | `book-design` |
| Музыкальная съёмка | project type | `music-shooting` |
| Лукбук | project type | `lookbook` |
| Каталог | project type | `catalog` |
| Кампейн | project type | `campaign-shooting` |
| Эдиториал | project type | `editorial` |
| Макет экрана | deliverable | `screen-mockup` |
| Обложка для музыканта | deliverable | `music-cover` |

The deliverable vocabulary is extended with the requested physical and digital formats that are not already present: business card, banner, social post, advertising creative, cover, certificate, poster, sticker, booklet, T-shirt, screen mockup and music cover. Existing IDs such as `brandbook`, `logo`, `packaging`, `print-materials`, `catalog`, `lookbook` and `book` are reused.

`src/data/taxonomy/media-taxonomy.ts` is a curated view over the canonical arrays. It owns hierarchy and CMS-facing option order, but not duplicate labels or competing IDs.

## CMS records

### Registered catalog

Path: `src/content/media-catalog/registered/*.json`

One file exists for every pre-existing `MediaAsset`. Pages CMS presents the directory as a searchable collection. Create, rename and delete are disabled; the stable asset ID and technical source properties are readonly.

Editable fields:

- catalog title;
- default alt;
- description;
- date or period;
- project IDs;
- work-area IDs;
- project-type IDs, including all shooting categories;
- deliverable IDs;
- free tags;
- credits;
- reusable flag;
- archived flag.

### Upload catalog

Path: `src/content/media-catalog/uploads/*.json`

Pages CMS may create and delete upload records. A UUID becomes the stable asset ID and filename. The owner selects or uploads a photo/video source and may optionally add a video poster.

In addition to the shared editable fields, upload records contain:

- source file;
- media type (`image` or `video`);
- synchronized width and height;
- synchronized duration for video;
- synchronized byte length and MIME type;
- synchronized delivery path when video optimization is required.

Technical values are readonly in the CMS and maintained by the sync tool.

## Automatic first-pass classification

Initial records are generated deterministically from existing data without altering visible copy.

Classification precedence:

1. collect every `MediaEntry` that references the asset;
2. collect its resolved project IDs;
3. inherit canonical project work areas, project types and deliverables;
4. infer missing shooting types from the registered project, collection, industry and authored caption vocabulary;
5. apply narrow family rules for Sensetique production, music shootings, Styx scanography, Jestei interface/mockup work and video/motion assets;
6. use a conservative media-type fallback so no existing asset is left structurally uncategorized.

An asset may have multiple values. In particular, Sensetique material can be both `production` and a `lookbook`, `campaign-shooting` or `editorial`; music imagery can be both `photography` and `music-shooting`.

The generated values become normal CMS data after migration. Future manual corrections are preserved; routine synchronization only updates technical fields and the generated import index.

## Runtime API

The catalog exports:

- `mediaCatalogItems`;
- `getMediaCatalogItem(assetId)`;
- `findMediaCatalogItems(filters)`;
- curated media taxonomy option arrays;
- uploaded assets for inclusion in the existing `mediaAssets` registry.

Filters support media type, project, work area, project type, deliverable, tag, reusable and archived state. Multiple filters are combined as intersections; multiple values inside one facet are matched as any-of.

## Validation and failure behavior

Strict adapters reject:

- unknown or missing fields;
- duplicate record IDs or duplicate source paths;
- a registered record that does not match a real existing asset;
- an upload record whose file is missing;
- unsupported media types or extensions;
- unknown project or taxonomy IDs;
- whitespace-only titles, tags or credits;
- invalid technical numbers;
- an ID/filename mismatch;
- architecture or presentation keys such as route, renderer, layout, class names or lightbox settings.

Bad CMS data fails on `dev` before publication. Existing pages continue to use their current registry and entries, so the catalog feature cannot silently rewrite routes, layouts or visible captions.

## Verification and publication

Focused tests cover taxonomy completeness, all-existing-asset coverage, semantic examples, strict parsing, query behavior, upload-to-asset conversion, CMS field exposure and generated-index freshness.

The repository then runs its normal typecheck, core tests, build and browser verification. Integration follows the existing reviewed path:

```text
feature branch -> pull request to dev -> verified dev -> pull request to prod -> GitHub Pages
```
