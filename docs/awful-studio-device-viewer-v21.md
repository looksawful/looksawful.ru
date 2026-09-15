# AWFUL STUDIO device viewer delivery

Accepted iPhone delivery: **iPhone 17 v21**.

Source repo: `looksawful/awful-studio`
Source commit: `a16e7835368f6ac406eda7131807bc31d4c82f15`
Lab repo commit: `b95621fb39624b046ad5880d062df195ae79a877`
Lab Preview run: `35033006157` / #126

## v21 repair

- retained the narrow rear camera housing from the later revisions
- restored an explicit outward camera backing rather than the recessed presentation from v20
- source validation requires camera backing protrusion >= 0.35 mm; current value is 0.42 mm
- body and camera housing use harden normals + weighted normals
- rear glass uses a flat cap for stable glTF/Three.js shading
- non-delivery rear helper geometry is hidden from export
- Apple decal stays embedded in the GLB
- no implicit geometry simplification

## Verification

- source dimensions: 71.500003 × 149.599999 × 7.95 mm
- body non-manifold edges: 0
- structural GLB contract: pass
- final triangle count: ~103,910
- external image URIs: 0
- unintended double-sided materials: 0
- Khronos validator: 0 errors / 0 warnings
- `typecheck`: pass
- `test:fast`: 285/285
- Storybook production build: pass
- browser material/orbit QA: no page errors
- exact-SHA Lab Preview: success

## Open follow-ups

- `looksawful/awful-studio#70`: reproducible source → blend → GLB pipeline and drift guard
- `looksawful/looksawful.ru#933`: viewer provenance and automated visual regression
- `looksawful/awful-studio#54`: material / texture / decal delivery rules
- `looksawful/awful-studio#53`: plugin/runtime asset delivery contract
- `looksawful/looksawful.ru#936`: custom Lab domain verification

Stable Storybook story:
`https://lab.looksawful-ru-preview.pages.dev/lab/system/?path=/story/02-molecules-model-viewer-awful-studio-devices--i-phone-17`
