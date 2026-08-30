# CMS content ownership map

This document is the Stage 2 inventory required by `docs/cms-roadmap.md` before another large Case schema is moved into Pages CMS.

It records the current authored sources and render slots. It does **not** change rendering, routes, layout, media ordering or runtime behavior.

## Ownership legend

### EDITORIAL

Safe to expose through a dedicated validated CMS contract when the relevant content model is migrated.

Examples:

- authored headings and paragraphs;
- project role / period / summary / lead copy;
- credits and editorial notes;
- publication labels and validated external URLs;
- media alt text and caption `title` / `text` / `meta`;
- explicit visibility controls where a render contract exists;
- explicit caption-view / lightbox controls only through the existing typed enums/booleans.

### PRESENTATION

Stays typed and code-owned unless a dedicated, tested presentation contract is designed.

Examples:

- `layout`, `mode`, `columns`, `mobileColumns`;
- `className`, `bodyClassName`, `surfaceClassName`, `captionClassName`, `mediaClassName`;
- device/mockup theme/role;
- surface ratio, fit, position and grid start/span;
- reel duration and item sizing;
- video autoplay / loop / muted / preload options;
- PageFlip densities and special component presentation;
- `data-caption-view` rendering mechanics. The authored choice may later be CMS-controlled, but the attribute remains a renderer contract.

### ARCHITECTURE

Never ordinary CMS content.

Examples:

- route / slug / managed `href`;
- canonical URL;
- `listed`, `indexable`, `enabled`, `pageType`;
- renderer names and slot-marker names;
- Vite inputs;
- `entryId`, logo usage IDs and other registry identities;
- DOM selectors and wrapper IDs/classes used by runtime;
- Jestei filter structure, selectors and interaction logic;
- GSAP, Three.js, Canvas, PageFlip and lightbox implementations;
- sitemap and SEO infrastructure.

### GENERATED

Never manually edited.

Examples:

- generated responsive image derivatives;
- generated video delivery files;
- responsive manifest / generated responsive catalog produced by builders;
- generated video inventory;
- build output under `dist`.

## Cross-cutting field map

| Current model / field | Ownership | CMS direction |
| --- | --- | --- |
| `ProjectIntroData.role`, `period`, `summary`, `lead`, `linksLabel` | EDITORIAL | Safe after Case migration. |
| text-valued `ProjectIntroData.title` / `head.text` | EDITORIAL | Safe when the title is text. Logo IDs remain code-owned. |
| `ProjectIntroLinkData.label` | EDITORIAL | Safe. |
| external publication/resource URL | EDITORIAL with URL validation | May be exposed only through a dedicated external-link contract. |
| managed route/page `href` | ARCHITECTURE | Never expose. Resolve from manifest/code. |
| `ProjectIntroData.head.logoUsageId`, `title.logoUsageId`, `wrapper` | ARCHITECTURE / PRESENTATION | Keep in TypeScript. |
| `SectionIntroData.title`, `paragraphs` | EDITORIAL | Primary Case-copy pilot fields. |
| `SectionIntroData.bodyClassName` | PRESENTATION | Keep in TypeScript. |
| media/group `head.credits.title`, `head.credits.lines`, `head.note.text` | EDITORIAL | Structured editorial data. |
| `surfaceOverlay.text` | EDITORIAL | Text may migrate; overlay wiring/class stays code-owned. |
| MediaEntry caption `title`, `text`, `meta` | EDITORIAL | Future media-CMS contract. |
| media alt text | EDITORIAL / accessibility | Future validated media-CMS field. |
| `captionView` | PRESENTATION with future dedicated editorial control | If exposed, write only `full`, `summary`, `overlay`, `lightbox-only`; renderer still owns `data-caption-view`. |
| `lightbox` | PRESENTATION with future dedicated editorial control | If exposed, map to existing typed boolean; never expose raw `data-lightbox`. |
| `entryId`, source asset IDs, logo IDs | ARCHITECTURE | Stable typed identity, readonly. |
| `layout`, `mode`, class names, columns, ratios, device, theme, item spans | PRESENTATION | Keep in TypeScript. |
| video autoplay/loop/muted/preload, deck autoplay/advance behavior | PRESENTATION | Keep in TypeScript in initial migrations. |
| route, canonical, listed, indexable, pageType, renderer | ARCHITECTURE | Never ordinary CMS fields. |
| responsive/generated media paths and `srcset` | GENERATED | Builder-owned only. |

## Inline authored HTML still outside typed Case data

These are migration candidates because the copy is currently authored directly in `index.html`, while their wrappers and link mechanics remain code-owned.

- Jestei `#jestei-editorial`: resource-row explanatory copy plus `Почитать` / `Скачать` labels. The managed documentation paths and `download`/`target` mechanics remain code-owned unless a dedicated validated external-resource contract is introduced.
- Jestei `#jestei-landings`: the `group-note` paragraph following `JESTEI_LANDINGS_INTRO`.
- Styx production mockup-deck wrapper: inline explanatory `group-note` copy.
- Styx social-instruction wrapper: inline credits title and repeated `group-note` copy surrounding `STYX_SOCIAL_INSTRUCTION_MOCKUP_DECK`.
- Sensetique `#sensetique-studio`: `Оборудование` heading, equipment explanatory copy, link label and external PDF URL. Layout and resource-row markup stay code-owned.
- Sensetique `#sensetique-production`: inline editorial notes and some inline credit wrappers surrounding typed media slots.
- Sensetique trailing studio/community block after the production wrapper: masterclass/intensive editorial note.
- Shootings ESMI wrapper: inline photographer credits around `SHOOTINGS_ESMI_BANNER`.

These values must not be silently rewritten during migration. Default CMS data must reproduce the existing output.

## Jestei Pool

Current authored module: `src/data/content/jestei-pool.ts`.

### Logical section inventory

| SECTION ID / current identity | CURRENT HTML WRAPPER | INTRO EXPORT | BLOCK EXPORTS | SLOT MARKERS | SPECIAL RUNTIME | CMS MANAGED |
| --- | --- | --- | --- | --- | --- | --- |
| project intro | `article#project-jestei` | `jesteiIntro` | — | `JESTEI_INTRO` | project navigation/theme shell | No; editorial fields are future candidates. |
| no current id — featured banner | anonymous `section.project__section` | — | `jesteiFeaturedMedia` | `JESTEI_FEATURED_MEDIA` | ordinary media figure/lightbox | No. |
| `jestei-home` | `section#jestei-home` | `jesteiHomeIntro` | `jesteiHomeMockup` | `JESTEI_HOME_INTRO`, `JESTEI_HOME_MOCKUP` | desktop mockup | No. |
| `jestei-brand` | `section#jestei-brand` | `jesteiBrandIntro` | `jesteiThemeOrganismMockup`, `jesteiBrandSystemGroup` | `JESTEI_BRAND_INTRO`, `JESTEI_THEME_ORGANISM_MOCKUP`, `JESTEI_BRAND_SYSTEM_GROUP` | theme-organism special renderer | No. |
| `jestei-interface` | `section#jestei-interface` | `jesteiInterfaceIntro` | `jesteiInterfaceGroup` | `JESTEI_INTERFACE_INTRO`, `JESTEI_INTERFACE_GROUP` | ordinary typed group | No. |
| `jestei-editorial` | `section#jestei-editorial` | `jesteiEditorialIntro` | `jesteiRedpolitikaMockup` + inline resource row | `JESTEI_EDITORIAL_INTRO`, `JESTEI_REDPOLITIKA_MOCKUP` | resource download/link mechanics | No. |
| `jestei-event` | `section#jestei-event` | `jesteiEventIntro` | `jesteiEventGroup` | `JESTEI_EVENT_INTRO`, `JESTEI_EVENT_GROUP` | embedded media deck / video progression | No. |
| no current id — Instagram strip | anonymous outer project section | — | `jesteiInstagramPlayerStrip` | `JESTEI_INSTAGRAM_PLAYER_STRIP` | infinite reel | No. |
| `jestei-landings` | nested `section#jestei-landings` | `jesteiLandingsIntro` | `jesteiLandingsMockup` + inline group note | `JESTEI_LANDINGS_INTRO`, `JESTEI_LANDINGS_MOCKUP` | video mockup | No. |
| no current id — Jestei filter | `section.jestei-filter-section` | — | inline custom filter UI | no CMS slot | **Jestei filter** web component/runtime | Never ordinary CMS content. |
| no current id — subscription comparison | `section.jestei-before-after-section` | — | `jesteiSubscriptionBeforeAfter` | `JESTEI_SUBSCRIPTION_BEFORE_AFTER` | before/after interaction | No; structure/reorder remains restricted. |
| `jestei-promo` | `section#jestei-promo` | `jesteiPromoIntro` | `jesteiPromoSequence` | `JESTEI_PROMO_INTRO`, `JESTEI_PROMO_SEQUENCE` | sequence leading/middle/trailing contract | No; sequence roles remain code-owned. |

### Slot inventory

| Marker | Current export / renderer | Ownership note |
| --- | --- | --- |
| `JESTEI_INTRO` | `jesteiIntro` / project intro | role/period/lead EDITORIAL; logo identity/wrapper ARCHITECTURE/PRESENTATION. |
| `JESTEI_FEATURED_MEDIA` | `jesteiFeaturedMedia` / media figure | media identity ARCHITECTURE; caption/alt future EDITORIAL; presentation code-owned. |
| `JESTEI_HOME_INTRO` | `jesteiHomeIntro` | title/paragraphs EDITORIAL. |
| `JESTEI_HOME_MOCKUP` | `jesteiHomeMockup` | PRESENTATION + typed media identity. |
| `JESTEI_BRAND_INTRO` | `jesteiBrandIntro` | title/paragraphs EDITORIAL; `bodyClassName` PRESENTATION. |
| `JESTEI_THEME_ORGANISM_MOCKUP` | theme-organism renderer | special runtime/PRESENTATION; do not genericize. |
| `JESTEI_BRAND_SYSTEM_GROUP` | `jesteiBrandSystemGroup` | overlay copy/credits EDITORIAL candidates; grid/deck settings PRESENTATION. |
| `JESTEI_INTERFACE_INTRO` | `jesteiInterfaceIntro` | title/paragraphs EDITORIAL. |
| `JESTEI_INTERFACE_GROUP` | `jesteiInterfaceGroup` | editorial overlays/captions separable from PRESENTATION. |
| `JESTEI_EDITORIAL_INTRO` | `jesteiEditorialIntro` | title/paragraphs EDITORIAL. |
| `JESTEI_REDPOLITIKA_MOCKUP` | `jesteiRedpolitikaMockup` | PRESENTATION + typed media identity. |
| `JESTEI_EVENT_INTRO` | `jesteiEventIntro` | title/paragraphs EDITORIAL. |
| `JESTEI_EVENT_GROUP` | `jesteiEventGroup` | overlay text EDITORIAL; embedded deck/video behavior PRESENTATION. |
| `JESTEI_INSTAGRAM_PLAYER_STRIP` | `jesteiInstagramPlayerStrip` | media composition PRESENTATION; item identity ARCHITECTURE. |
| `JESTEI_LANDINGS_INTRO` | `jesteiLandingsIntro` | title/paragraphs EDITORIAL. |
| `JESTEI_LANDINGS_MOCKUP` | `jesteiLandingsMockup` | PRESENTATION + typed media identity. |
| `JESTEI_PROMO_INTRO` | `jesteiPromoIntro` | title/paragraphs EDITORIAL. |
| `JESTEI_SUBSCRIPTION_BEFORE_AFTER` | `jesteiSubscriptionBeforeAfter` | labels/captions may be EDITORIAL; before/after structure/runtime PRESENTATION. |
| `JESTEI_PROMO_SEQUENCE` | `jesteiPromoSequence` | sequence composition PRESENTATION/ARCHITECTURE; future per-item editorial controls need a dedicated contract. |

## Styx

Current authored module: `src/data/content/styx.ts`.

### Logical section inventory

| SECTION ID / current identity | CURRENT HTML WRAPPER | INTRO EXPORT | BLOCK EXPORTS | SLOT MARKERS | SPECIAL RUNTIME | CMS MANAGED |
| --- | --- | --- | --- | --- | --- | --- |
| project intro | `article#project-styx` | `styxIntro` | — | `STYX_INTRO` | project shell | No. |
| `styx-brand` | `section#styx-brand` | `styxBrandIntro` | — | `STYX_BRAND_INTRO` | none | No. |
| no current id — logo banner | anonymous project section | — | `styxLogoBanner` | `STYX_LOGO_BANNER` | ordinary figure | No. |
| no current id — production mockup intro | anonymous project section | — | `styxProductionMockupDeck` + inline group note | `STYX_PRODUCTION_MOCKUP_DECK` | mockup deck | No. |
| `styx-production` | `section#styx-production` plus following typed group | `styxProductionIntro` | `styxProductionMediaGroup` | `STYX_PRODUCTION_INTRO`, `STYX_PRODUCTION_MEDIA_GROUP` | ordinary group | No. |
| `styx-scanography` | `section#styx-scanography` plus adjacent media blocks | `styxScanographyIntro` | `styxScanographyGroup`, `styxPrintLinksGroup`, `styxScanographyCampaignGroup`, `styxCatalogMockup`, `styxScanographyStrip` | `STYX_SCANOGRAPHY_INTRO`, `STYX_SCANOGRAPHY_GROUP`, `STYX_PRINT_LINKS_GROUP`, `STYX_SCANOGRAPHY_CAMPAIGN_GROUP`, `STYX_CATALOG_MOCKUP`, `STYX_SCANOGRAPHY_STRIP` | strips/grid/mockup | No. |
| `styx-shootings` | `section#styx-shootings` plus adjacent blocks | `styxShootingsIntro` | `styxBrandLookbookReel`, `styxLookbookMasonryGroup`, `styxGiftCertificateSlider` | `STYX_SHOOTINGS_INTRO`, `STYX_BRAND_LOOKBOOK_REEL`, `STYX_LOOKBOOK_MASONRY_GROUP`, `STYX_GIFT_CERTIFICATE_SLIDER` | slider + reels | No. |
| `styx-lookbook` | `section#styx-lookbook` plus following reel | `styxLookbookIntro` | `styxLookbook2025Reel` | `STYX_LOOKBOOK_INTRO`, `STYX_LOOKBOOK2025_REEL` | reel | No. |
| no current id — social instruction | anonymous split section | — | `styxSocialInstructionMockupDeck` + inline credits/note | `STYX_SOCIAL_INSTRUCTION_MOCKUP_DECK` | mockup deck | No. |

### Slot inventory

| Marker | Current export / renderer | Ownership note |
| --- | --- | --- |
| `STYX_INTRO` | `styxIntro` | role/period/lead EDITORIAL; logos/wrapper code-owned. |
| `STYX_BRAND_INTRO` | `styxBrandIntro` | title/paragraphs EDITORIAL. |
| `STYX_LOGO_BANNER` | `styxLogoBanner` | typed media identity + PRESENTATION. |
| `STYX_PRODUCTION_MOCKUP_DECK` | `styxProductionMockupDeck` | slide media identity PRESENTATION/ARCHITECTURE; authored captions future EDITORIAL. |
| `STYX_PRODUCTION_INTRO` | `styxProductionIntro` | title/paragraphs EDITORIAL. |
| `STYX_PRODUCTION_MEDIA_GROUP` | `styxProductionMediaGroup` | media composition PRESENTATION; captions/credits future EDITORIAL. |
| `STYX_SCANOGRAPHY_INTRO` | `styxScanographyIntro` | title/paragraphs EDITORIAL. |
| `STYX_SCANOGRAPHY_GROUP` | `styxScanographyGroup` | group presentation code-owned. |
| `STYX_PRINT_LINKS_GROUP` | `styxPrintLinksGroup` | presentation code-owned; caption data future EDITORIAL. |
| `STYX_SCANOGRAPHY_CAMPAIGN_GROUP` | `styxScanographyCampaignGroup` | presentation code-owned. |
| `STYX_CATALOG_MOCKUP` | `styxCatalogMockup` | PRESENTATION + typed media identity. |
| `STYX_SHOOTINGS_INTRO` | `styxShootingsIntro` | title/paragraphs EDITORIAL. |
| `STYX_LOOKBOOK_INTRO` | `styxLookbookIntro` | title/paragraphs EDITORIAL. |
| `STYX_BRAND_LOOKBOOK_REEL` | `styxBrandLookbookReel` | `head.credits` EDITORIAL; reel structure PRESENTATION. |
| `STYX_LOOKBOOK_MASONRY_GROUP` | `styxLookbookMasonryGroup` | masonry/columns PRESENTATION; caption data future EDITORIAL. |
| `STYX_GIFT_CERTIFICATE_SLIDER` | `styxGiftCertificateSlider` | ordinary slider; caption data future EDITORIAL, slide identity/order initially code-owned. |
| `STYX_SCANOGRAPHY_STRIP` | `styxScanographyStrip` | credits EDITORIAL; strip/reel settings PRESENTATION. |
| `STYX_LOOKBOOK2025_REEL` | lookbook reel | credits/captions EDITORIAL candidates; reel presentation code-owned. |
| `STYX_SOCIAL_INSTRUCTION_MOCKUP_DECK` | `styxSocialInstructionMockupDeck` | inline heading/note EDITORIAL; mockup deck structure PRESENTATION. |

## Sensetique

Current authored module: `src/data/content/sensetique.ts`.

### Logical section inventory

| SECTION ID / current identity | CURRENT HTML WRAPPER | INTRO EXPORT | BLOCK EXPORTS | SLOT MARKERS | SPECIAL RUNTIME | CMS MANAGED |
| --- | --- | --- | --- | --- | --- | --- |
| project intro | `article#project-sensetique` | `sensetiqueIntro` | — | `SENSETIQUE_INTRO` | project shell | No. |
| no current id — studio mockup | anonymous project section | — | `sensetiqueStudioMockupDeck` | `SENSETIQUE_STUDIO_MOCKUP_DECK` | mockup deck | No. |
| `sensetique-studio` | `section#sensetique-studio` | `sensetiqueStudioIntro` | `sensetiqueStudioJustifiedGallery`, `sensetiqueStudioInfiniteStrip` + inline equipment heading/note/PDF link | `SENSETIQUE_STUDIO_INTRO`, `SENSETIQUE_STUDIO_JUSTIFIED_GALLERY`, `SENSETIQUE_STUDIO_INFINITE_STRIP` | justified gallery + infinite reel | No. |
| `sensetique-production` | `section#sensetique-production` with nested editorial/media blocks | `sensetiqueProductionIntro` | all production/editorial exports listed below | `SENSETIQUE_PRODUCTION_INTRO` plus production markers below | mixed editorial grids, strips, reels, video, PageFlip | No. |
| no current id — community/masterclass note | trailing anonymous project section | — | inline editorial note | no typed slot | ordinary wrapper | No. |

### Slot inventory

| Marker | Current export / renderer | Ownership note |
| --- | --- | --- |
| `SENSETIQUE_INTRO` | `sensetiqueIntro` | role/period/lead EDITORIAL; logo identity code-owned. |
| `SENSETIQUE_STUDIO_MOCKUP_DECK` | `sensetiqueStudioMockupDeck` | PRESENTATION. |
| `SENSETIQUE_STUDIO_INTRO` | `sensetiqueStudioIntro` | title/paragraphs EDITORIAL. |
| `SENSETIQUE_STUDIO_JUSTIFIED_GALLERY` | `sensetiqueStudioJustifiedGallery` | row/layout composition PRESENTATION; media captions future EDITORIAL. |
| `SENSETIQUE_PRODUCTION_INTRO` | `sensetiqueProductionIntro` | title/paragraphs EDITORIAL. |
| `SENSETIQUE_BURO247_GROUP` | `sensetiqueBuro247Group` | credits/note EDITORIAL; editorial grid spans PRESENTATION. |
| `SENSETIQUE_OLOVO_BOOKLET_GROUP` | `sensetiqueOlovoBookletGroup` | credits EDITORIAL; columns/layout PRESENTATION. |
| `SENSETIQUE_TATIANA_NIKISHINA_GROUP` | `sensetiqueTatianaNikishinaEditorialGroup` | credits EDITORIAL; layout PRESENTATION. |
| `SENSETIQUE_KATYA_KNYAZEVA_GROUP` | `sensetiqueKatyaKnyazevaEditorialGroup` | credits EDITORIAL; layout PRESENTATION. |
| `SENSETIQUE_YURI_IVANOV_GROUP` | `sensetiqueYuriIvanovEditorialGroup` | credits EDITORIAL; layout PRESENTATION. |
| `SENSETIQUE_STUDIO_INFINITE_STRIP` | `sensetiqueStudioInfiniteStrip` | equipment surrounding copy EDITORIAL; strip timing/height PRESENTATION. |
| `SENSETIQUE_HARSH_LIGHT_SLIDER` | `sensetiqueHarshLightSlider` | caption data EDITORIAL; slider structure PRESENTATION. |
| `SENSETIQUE_HARSH_LIGHT_STRIP` | `sensetiqueHarshLightStrip` | credits EDITORIAL; strip presentation code-owned. |
| `SENSETIQUE_RAPUTO_EDITORIAL_STRIP` | `sensetiqueRaputoEditorialStrip` | credits EDITORIAL; strip presentation code-owned. |
| `SENSETIQUE_YOUNG_PIONEER_SEQUENCE` | `sensetiqueYoungPioneerSequence` | credits/captions EDITORIAL; sequence roles PRESENTATION/ARCHITECTURE. |
| `SENSETIQUE_KRASOTA_DRESS_VIDEO` | `sensetiqueKrasotaDressVideo` | caption/alt future EDITORIAL; video/surface behavior PRESENTATION. |
| `SENSETIQUE_KRASOTA_DRESS_STRIP` | `sensetiqueKrasotaDressStrip` | credits EDITORIAL; strip presentation code-owned. |
| `SENSETIQUE_OLOVO_BACKSTAGE_VIDEO` | `sensetiqueOlovoBackstageVideo` | caption/alt future EDITORIAL; video behavior PRESENTATION. |
| `SENSETIQUE_OLOVO_CAMPAIGN_STRIP` | `sensetiqueOlovoCampaignStrip` | credits EDITORIAL; presentation code-owned. |
| `SENSETIQUE_OLOVO_LOOKBOOK2016_REEL` | `sensetiqueOlovoLookbook2016Reel` | credits/captions EDITORIAL; reel configuration PRESENTATION. |
| `SENSETIQUE_OLOVO_LOOKBOOK2018_REEL` | `sensetiqueOlovoLookbook2018Reel` | credits/captions EDITORIAL; reel configuration PRESENTATION. |
| `SENSETIQUE_INNA_HONOUR_REEL` | `sensetiqueInnaHonourReel` | credits/captions EDITORIAL; reel configuration PRESENTATION. |
| `SENSETIQUE_OLOVO_ARCHITECTURE_STRIP` | `sensetiqueOlovoArchitectureStrip` | credits/title EDITORIAL; strip presentation code-owned. |
| `SENSETIQUE_DIGITAL_FEAR_PAGE_FLIP` | `sensetiqueDigitalFearPageFlip` | credits EDITORIAL; page order/density/PageFlip runtime PRESENTATION/ARCHITECTURE. |
| `SENSETIQUE_CHAPURIN_BENTO_GROUP` | `sensetiqueChapurinBentoGroup` | credits EDITORIAL; editorial-grid spans PRESENTATION. |
| `SENSETIQUE_YOUNG_PIONEER_STRIP` | `sensetiqueYoungPioneerStrip` | credits EDITORIAL; presentation code-owned. |
| `SENSETIQUE_DANIIL_KOROTECHENKOV_SEQUENCE` | `sensetiqueDaniilKorotechenkovSequence` | credits EDITORIAL; sequence structure PRESENTATION/ARCHITECTURE. |
| `SENSETIQUE_TATIANA_NIKISHINA_SUPPLEMENTAL_REEL` | supplemental reel | credits/captions EDITORIAL; reel presentation code-owned. |
| `SENSETIQUE_WOOD_METAL_PANIC_STRIP` | wood/metal strip | credits EDITORIAL; strip presentation code-owned. |
| `SENSETIQUE_IVAN_KRUSHINSKY_EDITORIAL_STRIP` | `sensetiqueIvanKrushinskyEditorialStrip` | credits EDITORIAL; strip presentation code-owned. |
| `SENSETIQUE_EDITORIAL_PRODUCTION_REEL` | `sensetiqueEditorialProductionReel` | credits EDITORIAL; reel presentation code-owned. |

## Shootings

The normalized authored sources are `src/content/collections/shootings.json` and one file per stable record in `src/content/shootings/`. `src/data/content/shootings-editorial.ts` validates that storage and `src/data/content/shootings.ts` remains the presentation adapter. Shootings remains a Collection domain concept rather than a Case.

### Logical section inventory

| SECTION ID / current identity | CURRENT HTML WRAPPER | INTRO EXPORT | BLOCK EXPORTS | SLOT MARKERS | SPECIAL RUNTIME | CMS MANAGED |
| --- | --- | --- | --- | --- | --- | --- |
| project intro | `article#project-shootings` | `shootingsIntro` | — | `SHOOTINGS_INTRO` | project shell | Yes — head/title, role, summary and lead only. |
| `shootings-obladaet` | `section#shootings-obladaet` plus adjacent blocks | `shootingsObladaetIntro` | collage reel, portraits group, mixed-media reel, pair group | `SHOOTINGS_OBLADAET_INTRO`, `SHOOTINGS_OBLADAET_COLLAGE_REEL`, `SHOOTINGS_OBLADAET_PORTRAITS_GROUP`, `SHOOTINGS_OBLADAET_MIXED_MEDIA_REEL`, `SHOOTINGS_OBLADAET_PAIR_GROUP` | reels/groups | Yes — record title/date/description only. |
| `shootings-evasha` | `section#shootings-evasha` plus adjacent blocks | `shootingsEvashaIntro` | banner, portrait reel, cover reel, mixed group, pair figure, portraits group | `SHOOTINGS_EVASHA_INTRO`, `SHOOTINGS_EVASHA_BANNER`, `SHOOTINGS_EVASHA_PORTRAIT_REEL`, `SHOOTINGS_EVASHA_COVER_REEL`, `SHOOTINGS_EVASHA_MIXED_GROUP`, `SHOOTINGS_EVASHA_PAIR_FIGURE`, `SHOOTINGS_EVASHA_PORTRAITS_GROUP` | reels/groups/figure | Yes — record title/date/description only. |
| `shootings-igguana` | `section#shootings-igguana` plus adjacent masonry | `shootingsIgguanaIntro` | Igguana masonry group | `SHOOTINGS_IGGUANA_INTRO`, `SHOOTINGS_IGGUANA_MASONRY_GROUP` | masonry | Yes — record title/date/description only. |
| `shootings-esmi` | `section#shootings-esmi` plus anonymous credited banner wrapper | `shootingsEsmiIntro` | `shootingsEsmiBanner` + inline credits | `SHOOTINGS_ESMI_INTRO`, `SHOOTINGS_ESMI_BANNER` | ordinary figure | Yes — record title/date/description only. |
| `shootings-hypression` | `section#shootings-hypression` plus adjacent blocks | `shootingsHypressionIntro` | banner, collage, mixed media, portraits | `SHOOTINGS_HYPRESSION_INTRO`, `SHOOTINGS_HYPRESSION_BANNER`, `SHOOTINGS_HYPRESSION_COLLAGE_GROUP`, `SHOOTINGS_HYPRESSION_MIXED_MEDIA_GROUP`, `SHOOTINGS_HYPRESSION_PORTRAITS_GROUP` | groups/figure | Yes — record title/date/description only. |
| `shootings-ofelia` | `section#shootings-ofelia` plus following strip | `shootingsOfeliaIntro` | `shootingsOfeliaStrip` | `SHOOTINGS_OFELIA_INTRO`, `SHOOTINGS_OFELIA_STRIP` | strip | Yes — record title/date/description only. |

### Slot inventory

| Marker | Current export / renderer | Ownership note |
| --- | --- | --- |
| `SHOOTINGS_INTRO` | `shootingsIntro` | text title/head, role, summary, lead are EDITORIAL. |
| `SHOOTINGS_OBLADAET_INTRO` | `shootingsObladaetIntro` | title/paragraphs EDITORIAL. |
| `SHOOTINGS_OBLADAET_PORTRAITS_GROUP` | `shootingsObladaetPortraitsGroup` | credits EDITORIAL; layout PRESENTATION. |
| `SHOOTINGS_OBLADAET_PAIR_GROUP` | `shootingsObladaetPairGroup` | credits EDITORIAL; pair/group presentation code-owned. |
| `SHOOTINGS_EVASHA_INTRO` | `shootingsEvashaIntro` | title/paragraphs EDITORIAL. |
| `SHOOTINGS_EVASHA_BANNER` | `shootingsEvashaBanner` | caption/alt future EDITORIAL; media identity code-owned. |
| `SHOOTINGS_EVASHA_MIXED_GROUP` | `shootingsEvashaMixedGroup` | media composition PRESENTATION. |
| `SHOOTINGS_EVASHA_PAIR_FIGURE` | paired figure | caption/alt EDITORIAL candidates; pair structure PRESENTATION. |
| `SHOOTINGS_EVASHA_PORTRAITS_GROUP` | `shootingsEvashaPortraitsGroup` | media composition PRESENTATION. |
| `SHOOTINGS_IGGUANA_INTRO` | `shootingsIgguanaIntro` | title/paragraphs EDITORIAL. |
| `SHOOTINGS_ESMI_INTRO` | `shootingsEsmiIntro` | title/paragraphs EDITORIAL. |
| `SHOOTINGS_ESMI_BANNER` | `shootingsEsmiBanner` | inline photographer credit + caption/alt EDITORIAL; figure presentation code-owned. |
| `SHOOTINGS_HYPRESSION_INTRO` | `shootingsHypressionIntro` | title/paragraphs EDITORIAL. |
| `SHOOTINGS_HYPRESSION_BANNER` | `shootingsHypressionBanner` | caption/alt future EDITORIAL; figure presentation code-owned. |
| `SHOOTINGS_HYPRESSION_COLLAGE_GROUP` | `shootingsHypressionCollageGroup` | composition PRESENTATION; captions future EDITORIAL. |
| `SHOOTINGS_HYPRESSION_MIXED_MEDIA_GROUP` | `shootingsHypressionMixedMediaGroup` | composition PRESENTATION. |
| `SHOOTINGS_HYPRESSION_PORTRAITS_GROUP` | `shootingsHypressionPortraitsGroup` | composition PRESENTATION. |
| `SHOOTINGS_OFELIA_INTRO` | `shootingsOfeliaIntro` | title/paragraphs EDITORIAL. |
| `SHOOTINGS_OBLADAET_COLLAGE_REEL` | `shootingsObladaetCollageReel` | credits/captions EDITORIAL; reel configuration PRESENTATION. |
| `SHOOTINGS_OBLADAET_MIXED_MEDIA_REEL` | `shootingsObladaetMixedMediaReel` | credits/captions EDITORIAL; reel configuration PRESENTATION. |
| `SHOOTINGS_EVASHA_PORTRAIT_REEL` | `shootingsEvashaPortraitReel` | captions EDITORIAL; reel configuration PRESENTATION. |
| `SHOOTINGS_EVASHA_COVER_REEL` | `shootingsEvashaCoverReel` | captions EDITORIAL; reel configuration PRESENTATION. |
| `SHOOTINGS_IGGUANA_MASONRY_GROUP` | `shootingsIgguanaMasonryGroup` | credits EDITORIAL; masonry presentation code-owned. |
| `SHOOTINGS_OFELIA_STRIP` | `shootingsOfeliaStrip` | credits EDITORIAL; strip presentation code-owned. |

## Special runtime and restricted structure

The following remain code-owned until separate component-specific contracts exist:

- **Jestei filter**: filters, genre/BPM/Camelot logic, exclude behavior, selectors and isolated UI runtime.
- Jestei theme-organism renderer.
- Before/after component structure and interaction.
- PageFlip page order, density and runtime.
- sequence `leading` / `middle` / `trailing` roles.
- mockup-deck device/layout/runtime settings.
- embedded surface-deck autoplay and active-slide behavior.
- justified-gallery row composition.
- infinite-reel duration and sizing.
- GSAP, Three.js and Canvas behavior.
- route extraction / standalone Case composition.
- `data-caption-view` and lightbox implementation mechanics.

A future CMS layer may expose validated content/visibility/caption/lightbox choices without exposing these implementation details.

## GENERATED media boundary

The following stay builder-owned and are never authored directly in Pages CMS:

- generated responsive image files;
- generated video delivery files;
- generated responsive `srcset` paths;
- responsive manifest and generated responsive catalog;
- generated video inventory;
- `dist` output.

CMS-selected source media must enter the existing typed media registry and the same responsive/video builders; it must not create a second optimization path.

## Current CMS-owned surfaces already completed

Before the Case pilot, these editorial controls already exist and should not be duplicated:

- project-card copy, visibility and scoped cover selection;
- client-logo visibility;
- primary navigation labels while href/routes remain code-owned;
- CV profile copy, skills/tool blocks, education, experience visibility and contacts;
- safe `dev -> verify -> PR -> prod` publication actions.

## Pilot recommendation

Use **Styx** for the first Stage 3 copy-storage pilot.

Reasoning:

- it contains representative project-intro copy, section intros, credits, media groups, a slider and mockup decks;
- it is materially smaller and less runtime-specialized than Jestei or Sensetique;
- it has no Jestei filter or theme-organism runtime;
- it is therefore a better test of the storage/parser/CMS boundary before visibility/media controls are added.

The Stage 3 pilot should initially migrate **copy only**: project intro editorial fields, section `title` / `paragraphs`, and structured credits/notes where the exact mapping is unambiguous. The current TypeScript presentation data remains the consumer-facing render model.

After that storage pattern is proven, Jestei becomes the richer stress test for section/block visibility, special media controls and the existing filter boundary. Sensetique follows after the generic helpers are proven; Shootings remains a separate Collection-model stage rather than being forced into the Case schema.

## Gate for Stage 3

Do not start Case schema implementation until this map and its coverage test are GREEN.

Stage 3 must preserve these invariants:

1. Default rendered HTML is unchanged by storage migration.
2. No user copy is rewritten during migration.
3. Routes, canonical state, `listed`, `indexable`, `pageType`, renderer and Vite inputs stay code-owned.
4. Presentation fields stay typed unless a dedicated tested control is introduced.
5. Media stays in the existing typed registry and existing responsive/video pipeline.
6. No browser-side CMS JSON fetch is introduced.
7. Standalone Case pages and homepage reuse the same resolved content state.
