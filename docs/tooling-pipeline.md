# Tooling pipeline

This document describes the normal development and verification commands for `looksawful.ru`.

## Local workflow

### Start development

```bash
npm run dev
```

`dev` runs `media:ensure` before Vite. The ensure path is intentionally cheap: it checks local media state, source file stats, registry/config signatures, generated manifests/inventory and expected derivative files. If everything is current, it starts Vite without running Sharp or ffmpeg.

On a fresh worktree, after a media source change, or when a generated derivative is missing, `media:ensure` automatically falls back to a real `media:sync` before Vite starts.

### Explicit media rebuild/validation

```bash
npm run media:sync
```

`media:sync` runs the existing deterministic video and responsive builders, then writes the local `.cache/media/dev-state.json` only after both builders succeed.

Use `media:sync` when you explicitly want a complete media validation. It remains the media stage used by full verification and CI.

### Production-like local build

```bash
npm run build
```

A normal local build uses `media:ensure`, one TypeScript check and one Vite/postbuild pass.

### Full validation

```bash
npm run verify
```

`verify` is the deterministic completion gate. It performs:

```text
media:sync
→ typecheck
→ node tests + data integrity
→ Vite build + postbuild
→ one shared Vite preview
→ one shared Chromium
→ all browser smoke suites sequentially
```

Run it before claiming a production change complete.

## `media:ensure` vs `media:sync`

`media:ensure` is a local acceleration layer. Its fast fingerprint uses file metadata and small configuration/registry signatures so CSS/TypeScript-only work does not re-hash or re-probe the full media corpus.

`media:sync` is the correctness layer. The existing builders remain the source of truth: they validate source/config hashes and generated outputs and rebuild stale or missing derivatives.

GitHub Actions cache is only a performance hint. CI restores reusable responsive/video derivative directories and still runs `media:sync` on every correctness pipeline. Tracked manifests, inventories and generated TypeScript catalogs remain repository-owned and are not restored from Actions cache.

## Browser verification

Individual debugging commands remain available:

```bash
npm run test:e2e
npm run test:e2e:navigation
npm run test:e2e:mpa
npm run test:e2e:projects
npm run test:e2e:cv
```

The normal combined command is:

```bash
npm run test:e2e:all
```

It starts one strict-port Vite preview and one Chromium process, then runs the existing suites sequentially with separate browser contexts where required.

Production additionally uses:

```bash
npm run test:e2e:production
```

This expects an already sanitized production CV, requires zero hidden CV experience cards, runs all browser suites against that exact `dist`, and captures caption QA using the same browser runtime.

## CI workflow

### Pull requests to `dev` / `prod`

`Verify changes` runs cheap failures before expensive setup:

```text
install
→ typecheck
→ restore derivative cache
→ ensure ffmpeg/ffprobe
→ media:sync
→ core tests
→ build
→ install Chromium
→ shared browser smoke
```

CodeQL remains an independent security check.

### Push to `dev`

`Verify dev` runs the same correctness pipeline. Caption QA and full `dist` artifact uploads are not produced on every integration push; those belong to final production or explicit visual QA.

### Production

The GitHub Pages build validates the exact artifact that will be uploaded:

```text
install/typecheck
→ media cache + media:sync
→ core tests
→ build
→ production CV sanitation
→ Chromium
→ production E2E + caption QA
→ deployment stamp + .nojekyll
→ Pages artifact
→ deploy
→ bounded remote SHA/assets/CV verification
```

The custom `github-pages/production` commit status remains the deployment gate/reporting surface.

### Scheduled checks

- Lighthouse: scheduled/manual, with real generated media.
- External links: scheduled/manual, lightweight HTML + CV content build only; no media transcoding or browser setup.
- Production healthcheck: unchanged and independent from deployment verification.
- Dependency audit: unchanged scheduled/manual workflow.
- CodeQL: unchanged security coverage.

## Troubleshooting

If `media:ensure` reports stale state unexpectedly, run:

```bash
npm run media:sync
```

If a generated output listed in the responsive manifest or video inventory is missing, do not create a placeholder. Run the deterministic builders through `media:sync` and investigate any failure.

If combined browser smoke fails, run the named individual E2E command for the failing suite. Individual commands still create and clean up their own shared runtime.
