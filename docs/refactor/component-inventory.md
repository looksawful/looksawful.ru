# looksawful remaining refactor — component inventory and baseline

generated: 2026-07-02T10:09:04.640Z

## git baseline

| item | value |
| --- | --- |
| branch | fix/mobile-polish-round2 |
| head | d0773e74 refactor final audit and scoped guards |
| status | M package.json<br>?? scripts/audit-refactor-step1-inventory.mjs<br>?? scripts/refactor-inventory.mjs |

## package scripts

| script | command |
| --- | --- |
| audit:refactor | node scripts/audit-refactor-step1-inventory.mjs |
| audit:refactor:final | node scripts/audit-refactor-final.mjs |
| build | npm run build:asset-gallery && vite build |
| build:asset-gallery | node scripts/build-asset-gallery.mjs |
| check:portfolio | node scripts/portfolio-regression-check.mjs |
| compress-media | node scripts/compress-media.js |
| compress-media:dry | node scripts/compress-media.js --dry-run |
| compress-media:force | node scripts/compress-media.js --force |
| dev | vite |
| inventory:refactor | node scripts/refactor-inventory.mjs |
| preview | vite preview |

## source counts

| item | value |
| --- | --- |
| all source files with archive/lab | 314 |
| active source files without _local/to-implement/src/_lab | 120 |
| active js/mjs/ts | 61 |
| active css | 36 |
| active html | 9 |
| active md | 11 |
| index.html bytes | 344492 |
| playlist-filter-embed.js bytes | 200041 |
| playlist-filter-embed.css bytes | 61613 |

## runtime map

| file | status | lines |
| --- | --- | --- |
| src/runtime/dom.js | present | 66 |
| src/runtime/init-runtime.js | present | 14 |
| src/runtime/mount-engine.js | present | 85 |
| src/runtime/mounts.js | present | 103 |
| src/runtime/schedule.js | missing | 0 |
| src/runtime/visibility.js | missing | 0 |

## mount registry signals

| item | value |
| --- | --- |
| main imports initRuntime | true |
| mounts has MOUNTS | true |
| mount refs in mounts.js | 15 |
| components/index.js remains bridge | true |
| visual registry bytes | 1107 |

## component modules

| file | lines | bytes |
| --- | --- | --- |
| src/components/artifact-fullscreen.js | 99 | 3834 |
| src/components/awfulface/awfulface.js | 249 | 5832 |
| src/components/filter-fullscreen.js | 63 | 1725 |
| src/components/fit-showcase-headings.js | 72 | 2307 |
| src/components/heading-animations.js | 193 | 4534 |
| src/components/hero-title/hero-title.js | 152 | 4013 |
| src/components/index.js | 173 | 4820 |
| src/components/letter-motion.js | 167 | 7489 |
| src/components/lightbox.js | 347 | 10405 |
| src/components/proximity-components.js | 409 | 10625 |
| src/components/proximity-core.js | 218 | 4528 |
| src/components/showcase-inline-video/showcase-inline-video.js | 68 | 1689 |
| src/components/showcase-signatures.js | 53 | 1629 |
| src/components/showcase-task-previews/jestei-logo-three.js | 223 | 6285 |
| src/components/showcase-task-previews/logo-inspector-3d.js | 893 | 22771 |
| src/components/showcase-video-controls.js | 120 | 4477 |
| src/components/showcase-visuals/observer.js | 38 | 821 |
| src/components/showcase-visuals/showcase-visual-registry.js | 23 | 1107 |
| src/components/showcase-visuals/showcase-visuals.js | 268 | 6646 |
| src/components/site-header/site-header.js | 732 | 17662 |

## visual/dom/canvas modules

| file | lines | bytes |
| --- | --- | --- |
| src/components/showcase-visuals/observer.js | 38 | 821 |
| src/components/showcase-visuals/showcase-visual-registry.js | 23 | 1107 |
| src/components/showcase-visuals/showcase-visuals.js | 268 | 6646 |
| src/visuals/canvas/before-after/index.js | 330 | 8763 |
| src/visuals/canvas/landing-motion/arc/index.js | 640 | 16442 |
| src/visuals/canvas/landing-motion/masonry/index.js | 1038 | 29617 |
| src/visuals/canvas/showcase-animation-assets.js | 113 | 3983 |
| src/visuals/canvas/showcase-diagonal/index.js | 677 | 17893 |
| src/visuals/canvas/showcase-horizontal/index.js | 638 | 17294 |
| src/visuals/dom/artifact-reader.js | 100 | 2293 |
| src/visuals/dom/asset-gallery.js | 483 | 15341 |
| src/visuals/dom/case-chapters.js | 22 | 776 |
| src/visuals/dom/list-scroll.js | 122 | 2879 |
| src/visuals/dom/media-marquee.js | 176 | 3693 |
| src/visuals/dom/media-slider.js | 607 | 15289 |
| src/visuals/dom/pet-previews.js | 84 | 2804 |
| src/visuals/dom/playlist-filter-embed.js | 2512 | 200041 |
| src/visuals/dom/policy-book.js | 158 | 4337 |
| src/visuals/dom/portfolio-gallery.js | 92 | 2847 |
| src/visuals/dom/random-gallery.js | 301 | 7966 |
| src/visuals/dom/showcase-toc.js | 311 | 8890 |

## css modules imported by index.css

| import |
| --- |
| ./modules/core.css |
| ./modules/layout.css |
| ./modules/typography.css |
| ./modules/canvas.css |
| ./modules/proximity.css |
| ./modules/awfulface.css |
| ./modules/hero-skill-marquee.css |
| ./modules/site-header.css |
| ./modules/hero.css |
| ./modules/resume.css |
| ./modules/footer.css |
| ./modules/policy-book.css |
| ./modules/artifact-reader.css |
| ./modules/jestei-policy-marquee.css |
| ./modules/jestei-token-colors.css |
| ./modules/portfolio-foundation.css |
| ./modules/portfolio-system.css |
| ./modules/portfolio-gallery.css |
| ./modules/portfolio-structure.css |
| ./modules/portfolio-reading.css |
| ./modules/portfolio-lists.css |
| ./modules/pets/pet-cards.css |
| ./modules/pets/pet-full-page-slides.css |
| ./modules/portfolio-signatures.css |
| ./modules/portfolio-fullscreen.css |
| ./modules/case-hero-lead.css |
| ./modules/refactor-round1.css |
| ./modules/pet-preview-round2.css |
| ./modules/refactor-round3-typography.css |
| ./modules/refactor-round4-media.css |
| ./modules/refactor-round5-final.css |

## css module files

| file | lines | bytes |
| --- | --- | --- |
| src/styles/modules/artifact-reader.css | 179 | 3351 |
| src/styles/modules/asset-gallery.css | 909 | 22142 |
| src/styles/modules/awfulface.css | 91 | 2297 |
| src/styles/modules/canvas.css | 61 | 1317 |
| src/styles/modules/case-hero-lead.css | 49 | 920 |
| src/styles/modules/core.css | 202 | 4517 |
| src/styles/modules/footer.css | 62 | 1176 |
| src/styles/modules/hero-skill-marquee.css | 71 | 1324 |
| src/styles/modules/hero.css | 245 | 4429 |
| src/styles/modules/jestei-policy-marquee.css | 65 | 1271 |
| src/styles/modules/jestei-token-colors.css | 310 | 8515 |
| src/styles/modules/layout.css | 76 | 1174 |
| src/styles/modules/pet-preview-round2.css | 363 | 7815 |
| src/styles/modules/pets/pet-cards.css | 178 | 3875 |
| src/styles/modules/pets/pet-full-page-slides.css | 209 | 4087 |
| src/styles/modules/policy-book.css | 458 | 8129 |
| src/styles/modules/portfolio-foundation.css | 43 | 1253 |
| src/styles/modules/portfolio-fullscreen.css | 102 | 2309 |
| src/styles/modules/portfolio-gallery.css | 793 | 23377 |
| src/styles/modules/portfolio-interface-sections.css | 78 | 2362 |
| src/styles/modules/portfolio-lists.css | 227 | 5101 |
| src/styles/modules/portfolio-media-system.css | 1 | 91 |
| src/styles/modules/portfolio-reading.css | 590 | 19205 |
| src/styles/modules/portfolio-signatures.css | 132 | 3211 |
| src/styles/modules/portfolio-structure.css | 522 | 13889 |
| src/styles/modules/portfolio-system.css | 767 | 18416 |
| src/styles/modules/proximity.css | 257 | 5554 |
| src/styles/modules/refactor-round1.css | 142 | 4126 |
| src/styles/modules/refactor-round3-typography.css | 153 | 4524 |
| src/styles/modules/refactor-round4-media.css | 145 | 3794 |
| src/styles/modules/refactor-round5-final.css | 61 | 1746 |
| src/styles/modules/resume.css | 56 | 834 |
| src/styles/modules/site-header.css | 350 | 8530 |
| src/styles/modules/typography.css | 270 | 4717 |

## html section/article map

| tag | id |
| --- | --- |
| section | hero |
| section | showcase |
| section | jestei-frame-провели-ребрендинг |
| section | jestei-frame-добавили-цвет |
| section | jestei-frame-подобрали-слова |
| section | page-1 |
| section | page-2 |
| section | page-3 |
| section | page-4 |
| section | page-5 |
| section | page-6 |
| section | page-7 |
| section | page-8 |
| section | page-9 |
| section | page-10 |
| section | page-11 |
| section | page-12 |
| section | page-13 |
| section | page-14 |
| section | page-15 |
| section | page-16 |
| section | page-17 |
| section | page-18 |
| section | page-19 |
| section | page-20 |
| section | page-21 |
| section | page-22 |
| section | page-23 |
| section | page-24 |
| section | jestei-frame-улучшили-интерфейс |
| section | jestei-frame-обновили-графику |
| section | styx-frame-graphic-design |
| section | styx-frame-print-design |
| section | styx-frame-photo-production |
| section | styx-frame-scanography |
| section | pets |
| section | shootings-frame-photo-production |
| section | resume |
| article | project-jesteipool |
| article | project-styx |
| article | project-shootings |
| article | resume-jesteipool |
| article | resume-styx |
| article | resume-lyve-moscow |
| article | resume-sensetique |
| article | resume-madcow |
| article | resume-line |
| article | resume-progress |
| article | resume-ria |

## top data attributes

| data attribute | count |
| --- | --- |
| data-media-item | 71 |
| data-lightbox-item | 70 |
| data-policy-page | 24 |
| data-policy-title | 24 |
| data-media-layout | 16 |
| data-media-ratio | 16 |
| data-media-count | 15 |
| data-media-group | 15 |
| data-media-mobile | 8 |
| data-media-size | 8 |
| data-mobile-layout | 7 |
| data-nav-chip | 5 |
| data-nav-state | 5 |
| data-nav-menu-link | 5 |
| data-jestei-chapter-title | 5 |
| data-case-chapter-title | 5 |
| data-animation | 4 |
| data-animation-scene | 4 |
| data-portfolio-toc-link | 3 |
| data-content-section | 3 |
| data-media-gallery | 3 |
| data-pet-preview | 3 |
| data-berserk-slide | 3 |
| data-visual-demo | 2 |
| data-policy-current | 2 |
| data-policy-total | 2 |
| data-component | 1 |
| data-site-header | 1 |
| data-nav-island | 1 |
| data-nav-chips | 1 |
| data-nav-trigger | 1 |
| data-nav-menu | 1 |
| data-portfolio-toc | 1 |
| data-portfolio-toc-panel | 1 |
| data-three-poster | 1 |
| data-three-scene | 1 |
| data-cv-min-height | 1 |
| data-color-headline | 1 |
| data-artifact-source | 1 |
| data-policy-book | 1 |
| data-policy-page-title | 1 |
| data-policy-viewport | 1 |
| data-policy-track | 1 |
| data-policy-prev | 1 |
| data-policy-next | 1 |
| data-interface-signature | 1 |
| data-chapter-signature | 1 |
| data-filter-fullscreen | 1 |
| data-playlist-filter-embed | 1 |
| data-animation-stage | 1 |
| data-animation-scale | 1 |
| data-playlist-filter-app | 1 |
| data-animation-black | 1 |
| data-animation-tip | 1 |
| data-hover-tooltip-layer | 1 |
| data-after-label | 1 |
| data-before-label | 1 |
| data-center-label | 1 |
| data-lightbox-video | 1 |
| data-pets-preview-list | 1 |
| data-berserk-widget | 1 |
| data-berserk-play | 1 |
| data-berserk-intensity | 1 |
| data-berserk-slider | 1 |

## top classes

| class | count |
| --- | --- |
| media-item | 73 |
| title | 36 |
| chip | 29 |
| policy-page | 24 |
| policy-page__content | 24 |
| title--lg | 23 |
| policy-table | 18 |
| media-group | 16 |
| token-pill | 16 |
| token-pill__dot | 16 |
| token-pill__name | 16 |
| token-pill__value | 16 |
| block__header | 14 |
| section-head | 14 |
| policy-page__content--wide | 14 |
| block | 13 |
| chips | 11 |
| title--xl | 11 |
| policy-callout | 11 |
| meta | 10 |
| case-section-clean | 10 |
| case-chapter | 10 |
| case-chapter__body | 10 |
| stack | 9 |
| case-chapter__header | 9 |
| case-chapter-heading | 9 |
| case-chapter-heading__main | 9 |
| case-chapter-heading__accent | 9 |
| media-group--square | 9 |
| content-section__text | 8 |
| media-group--mobile-rail | 8 |
| resume-item | 8 |
| resume-item__header | 8 |
| case-note | 7 |
| no-stroke | 6 |
| policy-table--bad-good | 6 |
| site-header__chip-slot | 5 |
| site-header__chip | 5 |
| site-header__menu-link | 5 |
| visual-canvas | 5 |
| jestei-chapter-section | 5 |
| jestei-chapter-hero | 5 |
| jestei-chapter-hero__subtitle | 5 |
| media | 5 |
| media-group--grid | 5 |
| case-chapter-section | 5 |
| section | 4 |
| section__screen | 4 |
| project-chapter | 4 |
| media-group--quad | 4 |
| media-group--landscape | 4 |
| text-block | 4 |
| token-group | 4 |
| token-group__list | 4 |
| layout-inspector__badge | 4 |
| interface-section | 4 |
| interface-section__header | 4 |
| interface-section__kicker | 4 |
| interface-section__copy | 4 |
| case-chapter-section--styx | 4 |
| case-chapter-hero | 4 |
| case-chapter-hero__subtitle | 4 |
| is-active | 3 |
| portfolio-toc__link | 3 |
| portfolio-toc__link--project | 3 |
| project | 3 |
| case | 3 |
| media-group--single | 3 |
| content-section | 3 |
| content-section--text-media | 3 |
| media-gallery | 3 |
| policy-callout--danger | 3 |
| policy-callout--success | 3 |
| media-group--three | 3 |
| media-group--fit-contain | 3 |
| interface-section__media | 3 |
| media-group--interface | 3 |
| media-transparent | 3 |
| pet-preview | 3 |
| pet-preview__inner | 3 |
| pet-preview__copy | 3 |
| pet-preview__eyebrow | 3 |
| pet-preview__title | 3 |
| pet-preview__text | 3 |
| berserk-slide | 3 |
| berserk-slide__index | 3 |
| berserk-slide__title | 3 |
| berserk-slide__text | 3 |
| pet-preview__link | 3 |
| awfulface-container | 2 |
| project__header | 2 |
| case__header | 2 |
| project__head | 2 |
| project__logo | 2 |
| title--display | 2 |
| media-gallery--banner | 2 |
| policy-grid | 2 |
| policy-grid--two | 2 |
| policy-callout--warning | 2 |
| policy-book__button | 2 |
| media-group--interface-grid | 2 |
| media-group--pair | 2 |
| case-chapter-hero__media | 2 |
| case-chapter-section--photo | 2 |
| media-video | 2 |
| media-item--vertical | 2 |
| site-header | 1 |
| site-header__island | 1 |
| is-expanded | 1 |
| site-header__chips | 1 |
| site-header__trigger | 1 |
| awfulface-container--trigger | 1 |
| site-header__menu | 1 |
| hero | 1 |
| hero__screen | 1 |
| hero__screen--cover | 1 |
| hero__headline-wrap | 1 |
| awfulface-container--hero | 1 |
| hero__title | 1 |
| hero__title-name | 1 |

## media and pet state

| metric | value |
| --- | --- |
| media groups | 16 |
| data-media-layout | 16 |
| data-media-ratio | 16 |
| data-media-mobile=rail | 8 |
| legacy media mobile rails | 8 |
| main page iframe refs | 0 |
| pet preview articles | 3 |

## pet source files

| file | lines | bytes |
| --- | --- | --- |
| — | — |

## heavy active files over 50kb

| file | bytes |
| --- | --- |
| pets/awful-cases/index.html | 1180904 |
| public/draco/draco_decoder.js | 719444 |
| index.html | 344492 |
| src/visuals/dom/playlist-filter-embed.js | 200041 |
| src/visuals/dom/playlist-filter.html | 196615 |
| src/styles/playlist-filter-embed.css | 61613 |
| public/draco/draco_wasm_wrapper.js | 58880 |

## js import density

| file | import refs |
| --- | --- |
| src/runtime/mounts.js | 15 |
| src/components/index.js | 13 |
| scripts/refactor-inventory.mjs | 9 |
| src/components/showcase-task-previews/jestei-logo-three.js | 6 |
| src/components/showcase-visuals/showcase-visual-registry.js | 6 |
| scripts/audit-refactor-final.mjs | 5 |
| src/components/showcase-task-previews/logo-inspector-3d.js | 4 |
| scripts/audit-refactor-round1.mjs | 3 |
| scripts/audit-refactor-round2.mjs | 3 |
| scripts/audit-refactor-round3.mjs | 3 |
| scripts/audit-refactor-round4.mjs | 3 |
| scripts/audit-refactor-step1-inventory.mjs | 3 |
| scripts/build-asset-gallery.mjs | 3 |
| scripts/portfolio-mobile-regression.mjs | 3 |
| src/components/showcase-visuals/showcase-visuals.js | 3 |
| src/vendor/gsap-globals.js | 3 |
| scripts/mobile-polish-regression.mjs | 2 |
| src/runtime/init-runtime.js | 2 |
| src/visuals/canvas/before-after/index.js | 2 |
| src/visuals/canvas/showcase-diagonal/index.js | 2 |
| src/visuals/canvas/showcase-horizontal/index.js | 2 |
| vite.config.js | 2 |
| public/draco/draco_decoder.js | 1 |
| public/draco/draco_wasm_wrapper.js | 1 |
| scripts/portfolio-editorial-regression.mjs | 1 |
| scripts/portfolio-regression-check.mjs | 1 |
| src/components/heading-animations.js | 1 |
| src/components/hero-title/hero-title.js | 1 |
| src/components/letter-motion.js | 1 |
| src/components/proximity-components.js | 1 |
| src/components/proximity-core.js | 1 |
| src/main.js | 1 |
| src/runtime/mount-engine.js | 1 |

## archive/lab/legacy folders

| path | status | source files |
| --- | --- | --- |
| _local | present | 179 |
| to-implement | present | 3 |
| src/_lab/inactive-visuals | present | 10 |
| src/_lab/retired-runtime | present | 3 |

## todo/fixme/hack markers

| file | markers |
| --- | --- |
| scripts/refactor-inventory.mjs | 9 |
| pets/awful-cases/index.html | 1 |

## deferred cleanup map

| status | task |
| --- | --- |
| done | round5 commit |
| open | runtime schedule helper |
| open | runtime visibility helper |
| open | playlist filter split |
| open | playlist filter css split |
| open | html partial build pipeline |
| open | policy book partial |
| open | pet preview partials |
| open | legacy media aliases removed |
| open | archive cleanup |

## required next batches

1. runtime completion: add schedule/visibility helpers and reduce components/index.js to bridge or registry entry.
2. canvas lifecycle: remove local pending/active/cache duplication where shared runtime can own lifecycle.
3. playlist filter source split: state/data/icons/render/interactions/css modules without visual change.
4. html partials: build-html pipeline, policy book partial, pet preview partials.
5. legacy cleanup: media aliases, typography aliases, _local/to-implement/src/_lab/archive cleanup, final browser QA.
