# Agent Instructions

- When changing frontend code (`js`, `ts`, `css`, `html`) explain the intent and tradeoffs in Russian so the owner can learn from the work.
- Never edit authored/user-facing copy, captions, credits, names, labels, or project text during structural, media, CSS, or runtime refactors. Copy changes require a separate explicit task.
- Keep production edits narrow. Do not use a tooling task as permission for unrelated UI, caption, lightbox, reel, breakpoint, or content refactors.
- Media source of truth is the typed registry: `MediaAsset` → `MediaEntry` → typed content/templates. Do not reintroduce direct project-media markup into `index.html` when a registry-backed renderer exists.
- CSS owns responsive layout, sizing, overflow, breakpoints, and visual composition. TypeScript owns authored content, layout kind/options already represented by the model, and media presentation semantics.
- `data-caption-view` is the single caption contract. Do not restore `data-caption`, `data-caption-rest`, caption reveal tabindexes, or a second caption interaction layer.
- Lightbox sources are project-scoped and the lightbox must resolve the active slide of nested decks before falling back to the first media element.
- Generated media under `public/media/generated/` and `src/data/media/responsive-generated.ts` is build output. Do not hand-edit generated variants; change the source/master or builder and regenerate deterministically.
- For optimized video, `VideoMedia.src` is the browser delivery asset and optional `sourceSrc` is the retained source master for media tooling. Never destroy the master as part of optimization.
- Prefer deterministic media tooling: validate registry paths, dimensions, byte formats, generated manifests, and browser smoke checks before reporting success. Unchanged builds must not rewrite manifests or retranscode media.
- Do not create placeholder media to satisfy checks. Missing production assets must be restored from an authoritative source or reported explicitly.
- Run `npm run verify` before claiming a completed local production change when dependencies/browser tooling are available. If the environment cannot run a check, state exactly which check was not run.
- Do not use destructive git commands such as `git reset --hard`, `git clean`, forced checkout, rebase, or merge during agent work.
