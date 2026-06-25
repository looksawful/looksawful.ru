# inactive visuals lab

This folder keeps inactive visual modules that are not imported by the production runtime.

Rules:
- Do not import anything from this folder in `src/main.js` or production visual registries.
- Rework these modules later in a separate branch.
- When a module is ready, move it back from `_lab` into the active `src` tree and wire it through the registry deliberately.

Moved groups:
- old photo-loop
- old showcase carousel
- old diagonal-loop
- old masonry
- old showcase media scenes / scroll rows
- old newsletter canvas
- retired runtime helpers
