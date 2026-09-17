# 3D Logo Source Audit

Snapshot for the 3D logo library work started on 2026-09-15.

## Automated inventory

Run:

```powershell
node tools/logo-3d/audit-logo-svg-sources.mjs > docs/3d-logo-source-audit.json
```

Current result:

- 181 SVG files audited in project logo sources plus the canonical Awfulface favicon.
- 176 contain real vector geometry.
- 5 are raster-backed SVG wrappers and must not be extruded as vector logos.

## Raster-backed wrappers

- `public/media/projects/styx/logo/source/02-styx-logo.svg`
- `public/media/projects/line/logo/source/01-line-logo.svg`
- `public/media/projects/madcow/logo/source/01-madcow-logo.svg`
- `public/media/projects/mn/logo/source/01-mn-logo.svg`
- `public/media/projects/progresstrad/logo/source/01-progresstrad-logo.svg`
## Explicitly requested families

- Jestei Pool: clean vector sources exist for symbol, wordmark and lockup.
- Awfulface: use `public/favicon.svg`; it contains the static visible face without navigation morph targets.
- Sensetique: clean vector sources exist; current catalog uses lockup `112 / r18 / c01` as the initial canonical 3D source.
- LYVÈ Moscow: clean vector source exists at `public/media/projects/lyve/logo/source/01-lyve-logo.svg`.
- Styx Jewel: current SVG is raster-backed; wordmark and monogram require source recovery or reviewed tracing.
- LI-NE Agency: current SVG is raster-backed; source recovery or reviewed tracing required.
- Progress Tradition: current SVG is raster-backed; source recovery or reviewed tracing required.
- S&S: current logo registry has a raster logo-wall asset, but no SVG source was found in the repository.
- illumihand: current logo family/rendition exists in the registry, but no SVG source was found in the repository.

## Rule

A file ending in `.svg` is not considered a vector source unless the automated audit finds actual SVG geometry. Raster wrappers are recorded as blockers and are never silently converted into geometry.
