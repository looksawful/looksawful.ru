# Gallery phase 2 — canonical asset inventory

Issue: #1107  
Parent: #1105  
Source of truth: Media Catalog + contextual usage metadata + Media Desk / Pages CMS.

This document is an inventory/report only. It does **not** create a Gallery database, duplicate media identity, or approve publication by itself.

## Status vocabulary

- **ready-to-curate** — canonical asset exists, ownership is known, and current taxonomy can describe the class well enough for Gallery placement work.
- **inventory-only** — canonical asset exists, but metadata/taxonomy is incomplete or the record is only adjacent to the requested class.
- **blocked** — the requested class has no truthful canonical representation yet.
- **public-now** — already rendered in the current Gallery.

Publication remains an explicit Gallery placement decision. A `ready-to-curate` asset is not automatically owner-approved for publication.

## Requested classes

| Class | Canonical mapping | Representative canonical assets / ownership | Result |
| --- | --- | --- | --- |
| Logos | `workAreaIds: identity/graphic-design`; `deliverableIds: logo`; usually `projectTypeIds: identity-project` | `jestei-logo-source-logo-jestei-pool` → `jestei-brand-system`; `styx-logo-source-styx-logo-volume` → `styx-brand-system`; Sensetique lockups exist but current usages have no project owner | **ready-to-curate** for Jestei/Styx; Sensetique ownership needs cleanup |
| Brandbooks | `deliverableIds: brandbook`; editorial/identity context as applicable | `sensetique-11-source-101-1x1` … `sensetique-11-source-103-1x1` and related records → `sensetique-olovo-brandbook-architecture` | **inventory-only**: current five hits are photography *for* a brandbook, not canonical brandbook-page/document assets |
| Production | `workAreaIds: production`; project/deliverable remains the actual produced work | e.g. `sensetique-11-source-101-1x1` → `sensetique-olovo-brandbook-architecture`; `sensetique-09-source-56-16x9` → `sensetique-krasota-dress-lookbook`; broad production-tagged photo inventory also exists across Sensetique/Styx/Evasha | **ready-to-curate**, but do not invent a generic `production` deliverable |
| Color palettes | identity/graphic-design + brand assets/identity system; no dedicated deliverable today | `jestei-11-source-38-16x9` → `jestei-brand-system`; `jestei-system-logo-source-logo-color-slide` → `jestei-brand-system` | **ready-to-curate**, with a taxonomy gap if palette needs first-class filtering/editorial tooling |
| Generations | Global taxonomy has `workAreaId: ai-and-automation`, but Media Catalog does not currently allow it | no truthful canonical Gallery candidate found in catalog | **blocked**: add Media Catalog support for existing `ai-and-automation` and ingest/tag actual generated works; do not infer “AI-generated” from filenames |
| Design | `workAreaIds: graphic-design` plus the specific deliverable/project type | broad canonical inventory across Styx/Jestei/Sensetique; specific selection must be editorial rather than “all graphic-design” | **ready-to-curate**, but “design” is a broad work area, not a new deliverable |
| Covers | `deliverableIds: cover` or `music-cover`; project ownership from contextual usage | `behance-obladaet-content-covers-001` … `008` → `shootings-obladaet`; additional project/useful covers exist | **ready-to-curate** |
| 3D models | media type `model`; `workAreaIds: 3d`; usually `projectTypeIds: 3d-project` | `device-iphone-17-v30-model`, `device-ipad-pro-11-m5-v6-model`, `device-ipad-pro-13-m5-v6-model`, `device-macbook-pro-14-m5-v1-model` → `awful-studio` / `awful-3d-mockups`; `jestei-theme-organism-model` → `jestei-brand-system` | **ready-to-curate** for canonical models. Current five Jestei Gallery symbol GLBs are **public-now but not canonical Media Catalog records**; #935 owns canonical SVG→GLB output and #1110 must consume validated results |
| Mockups | `deliverableIds: screen-mockup`; may be image or model | device model IDs above are well classified; `awful-mockups-02-monitor`, `awful-mockups-03-phone-fashion` etc. → `awful-mockups` | **mixed**: device models ready-to-curate; Awful Mockups images are canonical but several catalog records have empty work-area/project-type/deliverable metadata and need Media Desk cleanup before broad Gallery curation |
| Videos | media type `video`; normally `workAreaIds: motion`, `projectTypeIds: video-project/motion-project` | `jestei-13-source-01-16x9` → `jestei-track-filter`; `sensetique-09-source-56-16x9` → `sensetique-krasota-dress-lookbook`; other canonical video records exist | **ready-to-curate** |
| Character sheets | no dedicated Media Catalog deliverable; no truthful character-sheet canonical assets found | `shootings-behance-choose-your-character` is photography and must **not** be treated as character-sheet inventory just because “character” appears in the project name | **blocked**: introduce a first-class `character-sheet` deliverable (usable with illustration/3D as appropriate) and ingest the actual approved sheets |

## Confirmed taxonomy gaps

1. **Generations** — `ai-and-automation` already exists globally but is absent from `MEDIA_CATALOG_WORK_AREA_IDS`. Reuse that ID; do not create an AI/generation synonym.
2. **Character sheets** — no truthful first-class deliverable exists. Add `character-sheet` only when the real assets are being registered.
3. **Color palettes** — current assets are representable through identity/brand-assets, but there is no dedicated `color-palette` deliverable. This is optional: add it only if Media Desk filtering/editorial placement needs first-class palette semantics.
4. **Brandbooks** — `brandbook` exists, but the current catalog hits are source photography used by a brandbook, not brandbook-page/document assets. The gap is asset registration/semantics, not the taxonomy ID itself.
5. **Jestei 3D symbols** — current Gallery GLBs are hard-coded production assets outside canonical Media Catalog identity. #935/#1110 must eliminate that special-case ownership for phase 2.

## Metadata / integrity findings

- Duplicate status: no class-specific duplicate canonical IDs were found among the representative candidates in this pass. Canonical catalog normalization already rejects duplicate asset IDs and duplicate source paths; Gallery curation must continue to reference those canonical IDs rather than copy assets.
- Technical-property status: representative image candidates resolve through registered assets with intrinsic dimensions; canonical video candidates use the existing poster/delivery pipeline; canonical device models declare GLB MIME type and byte length in the asset registry. The hard-coded Jestei symbol GLBs are the notable exception because they are outside Media Catalog, so their technical metadata is not catalog-owned until #935/#1110 canonicalize them.
- Several Awful Mockups assets are canonical and have contextual project ownership but their catalog classification arrays are empty. They must be corrected through the existing Media Desk / catalog source before being selected by class.
- Sensetique logo lockups are canonical, but the current contextual usages shown in the inventory have empty `projectIds`; do not silently assign ownership during Gallery work.
- `showInCatalog` remains an existing coarse publication flag, but phase 2 placement metadata (series/order/featured/crop) belongs to the Gallery curation contract from #1108. It must not mutate canonical Media Catalog identity.
- Keyword/name matches are not classification. In particular, `Choose your character` is not evidence of a character-sheet asset class.

## Actionable next steps

1. #1108 defines the typed Gallery placement/series contract over canonical asset IDs.
2. Use Media Desk / Pages CMS to repair missing classification on selected mockups and ownership gaps before publication.
3. Extend Media Catalog with the existing `ai-and-automation` work area only when ingesting real generation assets.
4. Add `character-sheet` deliverable together with actual character-sheet registration, not as empty speculative taxonomy.
5. #1110 consumes validated #935 Jestei 3D outputs as canonical model assets instead of retaining the hard-coded Gallery-only model list.
6. Specific public selection remains editorial. This inventory intentionally does not mark every discovered asset `showInCatalog=true`.
