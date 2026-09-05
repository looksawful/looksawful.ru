# Repository structure

This document describes the intentional source boundaries of `looksawful.ru`. It is a map of the current repository, not a target architecture wishlist.

## Root

```text
/
├─ .agents/        repository-local agent guidance
├─ .github/        GitHub Actions and repository automation
├─ docs/           engineering and operating documentation
├─ public/         files copied or published as static assets/pages
├─ shootings/      Vite MPA entry stub for /shootings/
├─ src/            application source, authored content and runtime code
├─ test/           Node contract/unit/integration tests
├─ tools/          repository/build/CMS/media/CI tooling
├─ work/           Vite MPA entry stubs for /work/* routes
├─ index.html      Vite entry for /
└─ 404.html        Vite entry for /404.html
```

The root-level HTML files under `work/`, `shootings/`, `/index.html`, and `/404.html` are intentional Vite MPA inputs. They are not independent content sources. Route authority lives in `src/site/pages/manifest.ts`, and generated/rendered page content lives behind the site renderers.

## `src/`

```text
src/
├─ components/     browser-side interactive/runtime components
├─ content/        CMS-authored/editorial sources and content registries
├─ data/           typed domain projections, contracts and adapters
├─ devtools/       application-adjacent development UI/runtime tooling
├─ site/           page manifest, build integration, renderers and shell
├─ styles/         site CSS, tokens and component styles
├─ templates/      rendering templates still used by current composition
├─ types/          shared TypeScript declarations
└─ utils/          general source utilities
```

### Content versus data

`src/content/**` is the authored/CMS-facing source boundary where the CMS model explicitly exposes fields. `src/data/**` owns typed domain identity, relations, adapters and code-owned presentation semantics. Do not merge these directories merely because both contain structured information.

### Application devtools versus repository tools

`src/devtools/**` is allowed to participate in the Vite development application. Media/Content Desk lives at `src/devtools/media-desk/**`; this is its only application source boundary.

`tools/**` is repository tooling executed by Node, CI or local commands. Production/runtime source must not start depending on arbitrary repository scripts.

The former duplicate `src/tools/media-desk/**` compatibility tree was retired after all external consumers moved to `src/devtools/media-desk/**` and the remaining #400 catalog-view delta was ported to the canonical copy. New code must not recreate the old boundary.

## `src/site/`

`src/site/pages/manifest.ts` is the canonical page/route registry.

- `build.kind === "vite"` resolves to a physical MPA entry through `src/site/build/inputs.ts`.
- `build.kind === "public-static"` resolves to its declared source under `public/`.
- Page renderers own generated page output. Root entry stubs do not become a second authored content source.

`src/site/renderers/**` contains page renderers. The remaining `src/site/rendering/html.ts` helper directory is known naming debt; it is intentionally left in place while active Homepage/site-composition work owns its consumers.

## `public/`

`public/**` is deployable static material. It contains both static assets and deliberately static pages such as CV/privacy sources where declared by the page manifest.

`public/docs/**` is public website material. It is different from root `docs/**`, which is repository documentation. Renaming public paths can change URLs and is therefore not a cosmetic cleanup.

Generated media paths remain governed by the media build policy and must not be edited by hand.

## `tools/`

Repository tooling is being normalized incrementally. Existing subject directories such as `ci/`, `e2e/`, `media/`, and `quality/` are preferred over adding more unrelated scripts directly at `tools/` root.

Moves must update every `package.json`, workflow, test and source reference atomically. CI/test-manifest files are shared policy surfaces and must not be reorganized while another active PR owns the same contract.

## `test/`

Tests may be physically reorganized only when their execution tier remains unchanged. Recursive discovery alone is not enough: explicit fast/CI allowlists and affected-routing contracts must continue to point to the correct paths.

Test lifecycle follows `docs/testing-policy.md`. Migration-only RED/GREEN checks are temporary unless they protect a durable contract. `test/repository-structure.test.mjs` is a permanent cheap CONTRACT because it protects long-lived repository boundaries rather than one historical migration step.

## Authored JavaScript

New browser/runtime source under `src/` should be TypeScript. The structural contract currently allowlists only explicitly tracked legacy JavaScript plus the still-consumed main compatibility entry. Each legacy migration is performed independently under behavior-preserving TDD; files are not renamed merely to manipulate GitHub Languages statistics.

## Structural guard

`test/repository-structure.test.mjs` currently protects these invariants:

- only intentional source directories exist at repository root;
- every enabled page has a valid Vite or public-static build source;
- retired JS compatibility shims do not return;
- authored JS remains restricted to an explicit migration allowlist;
- application development tooling has a canonical `src/devtools` boundary;
- the retired `src/tools/media-desk` duplicate cannot return;
- external Media Desk consumers cannot regress to `src/tools/media-desk`;
- literal path-specific `.gitattributes` rules cannot silently point at deleted files.

This guard is intentionally cheap. Do not turn it into filesystem lint for every naming preference.

## Change rule

A structural cleanup must preserve authored copy, public URLs, CMS publication scope, media identity, stable DOM/runtime hooks, build inputs and current behavior unless a separate explicitly approved project changes one of those contracts.

For refactors, use the narrowest RED → GREEN proof that demonstrates the boundary being changed, run affected neighboring contracts, then run the appropriate integration gate before the package is considered complete.
