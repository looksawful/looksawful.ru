# Mockup review surfaces — 2026-09-28

## Scope

This note separates three frequently-confused surfaces:

1. **AWFUL 3D Mockups** — site presentation of interactive device models.
2. **AWFUL STUDIO device acceptance** — current production/closeout evidence for iPhone/iPad/MacBook.
3. **AWFUL Mockups** — PSD/JPEG mockup library.

## 1. AWFUL 3D Mockups — site presentation

Canonical route:
- https://looksawful.ru/work/awful-3d-mockups/

Current site project state:
- project id: `project:awful-3d-mockups`
- state: live, unlisted/noindex
- interactive models:
  - iPhone 17 v30
  - iPad Pro 11 M5 v6
  - iPad Pro 13 M5 v6
  - MacBook Pro 14 M5 v1

Static contact sheets used by the site:
- `/media/projects/awful-3d-mockups/iphone-17-contact.jpg`
- `/media/projects/awful-3d-mockups/ipad-pro-11-contact.jpg`
- `/media/projects/awful-3d-mockups/ipad-pro-13-contact.jpg`
- `/media/projects/awful-3d-mockups/macbook-pro-14-contact.jpg`

Important: this page is the current site/presentation surface, not the authority for latest closeout acceptance.

## 2. AWFUL STUDIO — current 3D acceptance

Execution SoT:
- Asana project: **AWFUL STUDIO — 3D Production & Debug Pass**

### MacBook Pro 14 M5
Status:
- PR #121 open, mergeable, draft
- mechanical gate GREEN
- web/runtime checks GREEN
- **human visual acceptance still required**

Current human-review evidence committed in PR #121:
- `assets/device_mockups/macbook_pro_14/previews/acceptance_v1/macbook_hinge_000.png`
- `.../macbook_hinge_030.png`
- `.../macbook_hinge_060.png`
- `.../macbook_hinge_090.png`
- `.../macbook_hinge_102.png`
- `.../macbook_hinge_macro_030.png`

Review surface:
- https://github.com/looksawful/awful-studio/pull/121

### iPad Pro 11 / 13 M5
Status:
- PR #122
- code/spec/runtime/Storybook/browser gates GREEN
- both remain **LOW_DRAFT**
- **human visual acceptance still required**
- PR #122 does not commit a standalone PNG acceptance pack

Historical Storybook review route on Titan:
- `http://192.168.1.8:6016/?path=/story/review-current-candidates--i-pad-11`
- `http://192.168.1.8:6016/?path=/story/review-current-candidates--i-pad-13`

Current check on 2026-09-28: port 6016 is not serving, so these links are stale until Storybook is relaunched.

### iPhone 17
Status:
- Asana closeout task: `[CLOSEOUT] iPhone 17 3D — 2 source defects → rerun gates → publishable`
- PR #119 open
- not publishable yet
- visual gate not approved

PR #119 contains the current committed PNG evidence set:
- front
- back
- left/right
- three-quarter
- back three-quarter
- camera macro
- bottom macro
- front sensor macro
- screen-edge macro

Review surface:
- https://github.com/looksawful/awful-studio/pull/119

These images are evidence, not an approved final human-review pack.

## 3. AWFUL Mockups — PSD / JPEG library

Canonical project:
- Asana: `[P0][CLOSEOUT] AWFUL Mockups — 38 PSD: final QA → site → free release`

Current site review route:
- https://looksawful.ru/work/awful-mockups/

The site currently shows these eight JPEG mockup previews:
- `02-monitor.jpg`
- `03-phone-fashion.jpg`
- `11-square.jpg`
- `16-landscape.jpg`
- `17-dual-phone.jpg`
- `18-phone.jpg`
- `28-phone-camera.jpg`
- `39-print-case.jpg`

Additional Photoshop-structure images are not mockup previews:
- `photoshop-layers-full.png`
- `photoshop-layers-detail.jpg`

Current status:
- 38 production PSD tracked
- 34/34 screen-content replacements ready
- site has 8 selected previews
- final 38/38 visual/perspective QA is not closed
- proof↔PSD and archive/current-PSD reconciliation are not closed
- Drive `PSD` / `PREVIEWS` folders are not authoritative; cloud handoff remains incomplete

Local production source:
- `F:\\AWFUL_ASSETS\\Photoshop\\Mockups\\AWFUL-Mockups-2026-09-17`

## Human review map

Use:
- **3D site presentation:** `/work/awful-3d-mockups/`
- **MacBook current acceptance:** PR #121 PNG pack
- **iPhone current evidence:** PR #119 PNG pack
- **iPad:** not currently exposed as a live Storybook review surface; relaunch required
- **PSD/JPEG mockups:** `/work/awful-mockups/` for the eight selected JPEGs

Do not use:
- Google Drive PREVIEWS as current authority
- old Storybook 6016 links unless the server is relaunched and rechecked
- the 3D site page as proof that current closeout candidates are visually approved
