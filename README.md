# looksawful stage 14 — final regression repair

Fixes the current final-audit state without relying on the earlier wrong audit.

Scope:
- move `#pets` out of Jestei header and place it after `#project-styx` and before `#project-shootings`
- restore accent styling for chapter title accent words
- restore gradient fill for the color chapter header
- restore token cards styling for the color section
- repair legacy/media gallery layout so images do not become huge vertical stacks

Protected:
- hero
- resume
- site-header/menu/proximity
- mailto and the typo comment
- playlist filter
- policy-book / redpolicy
- artifact-reader
- canvas / gsap globals
- texts and asset paths

Run from project root:

```powershell
node .\tools\portfolio-final-regression-repair.mjs
npm run build
```
