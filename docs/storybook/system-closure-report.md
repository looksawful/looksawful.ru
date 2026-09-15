# Storybook system closure report

Date: 2026-09-15
Base integration branch: `storybook/coverage-ci`
Base SHA used for closure rebase: `324289d9b86168d4d805047fb73a544ac73cbbe9`

## Scope

This closure pass keeps inventory v2 as the denominator truth and does not create a second design system. It closes cross-layer classification, page archetype coverage, route-discovery evidence, structural gaps, and build verification while leaving layer-specific runtime work in focused follow-up issues.

## Delivered

- Added canonical page stories for Home, Gallery, listed Entity, unlisted Entity, and 404.
- Page stories render through production page/entity renderers and production data; Storybook support only extracts the rendered body and removes route runtime scripts from the canvas.
- Preserved `routeDiscovery.listed/indexable` separately from visual `visibility`.
- Added explicit `no-story` classification for proven infrastructure, adapters, barrels, type-only contracts, compatibility facades, shaders/data support, and runtime helpers.
- Preserved orphan `src/templates/subproject-card.ts` as `needs-classification` instead of creating a false canonical story.
- Fixed the normal site build so only `/lab/system/` and `/lab/system/inventory.html` are deferred until the Lab artifact stage; arbitrary missing Lab links still fail.

## Inventory after closure

- 96 UI source records
- 20 Storybook story modules
- 19 `covered`
- 9 `page-only`
- 1 `composition-only`
- 45 `exempt-no-story`
- 1 `needs-classification`
- 21 `missing`
- 0 structural errors

## Verification evidence

- targeted closure/inventory/page tests: 20/20 pass
- local-link regression tests: 10/10 pass
- `npm run typecheck`: pass
- `npm run test:fast`: 207/207 pass
- `npm run media:ensure`: 481 responsive sources, 1115 generated outputs, synchronized
- `npm run build:site`: pass; 11 indexable pages validated; 17 HTML pages pass local-link validation
- Storybook 10.6 static build: pass on the closure tree
- browser smoke: 15/15 page-story × viewport scenarios pass at 1440×1000, 834×1112, and 390×844
- browser smoke assertions: HTTP 200, non-empty rendered body, no horizontal overflow, no assigned broken images, no console/page errors, no relevant failed resource requests

The smoke runner intentionally ignores cancelled media preload/video requests (`net::ERR_ABORTED`) because those are normal browser lifecycle cancellations, not failed static resources. Assigned images are still validated by `naturalWidth`.

## Remaining evidence gaps

The remaining `missing` set is intentionally report-only, not a 100% merge gate. Every remaining visual owner is either already tracked by a focused issue or listed below for handoff. Structural invalidity remains blocking.

- #889 Berserk Audio Player
- #893 Gallery controller/lightbox runtime
- #894 Animated Canvas Gallery and Moves composition
- #895 Jestei 3D theme organism
- #896 Project Navigation lifecycle
- #897 Analytics Consent UI
- #898 Jestei Track Filter
- #899 CV Experience and Expertise
- #900 remaining canonical composition templates
- #902 Awful Cases game renderer/runtime boundary
- #907 Site Navigation disclosure and shell lifecycle
- #880 Subproject Card classification decision

Non-blocking build noise is tracked separately in #908 for the Lightning CSS `:target-current` warning.
