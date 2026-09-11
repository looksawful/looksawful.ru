# Design Lab

`lab` is the persistent design-prototyping branch for `looksawful.ru`.

## Purpose

Use this branch for visual experiments, component prototypes, motion, layout and interaction work before promotion to `dev`.

The branch is intentionally separated from production. Production remains `prod`.

## Working URLs

- preferred custom domain: `https://lab.looksawful.ru/lab/`;
- stable Cloudflare fallback: `https://lab.looksawful-ru-preview.pages.dev/lab/`;
- immutable deployment URLs: emitted by every successful `Lab Preview` workflow run;
- local workbench: `npm run lab`.

The custom domain is bootstrapped by `tools/lab/configure-cloudflare.mjs`. It attaches `lab.looksawful.ru` to the isolated Pages project and ensures a proxied CNAME points to `lab.looksawful-ru-preview.pages.dev`. If the current Cloudflare API token lacks zone/DNS permissions, the stable `pages.dev` branch alias remains the canonical fallback and the workflow reports the permission failure without publishing to production.

## Browser workbench

`/lab/` is a development-only browser shell around the real pages from the same deployment. It does not render fake component copies.

It provides:

- route switching for the main portfolio surfaces;
- desktop `1440x1000`, tablet `834x1112`, mobile `390x844` presets;
- arbitrary viewport width and height;
- fit-to-stage scaling;
- light, dark and checkerboard stage backgrounds;
- optional element outlines;
- optional 8px debug grid;
- same-origin element inspection with selector, dimensions and key computed styles;
- a live CSS scratchpad that injects temporary overrides into the real preview page;
- browser-local persistence for scratch CSS across reloads and route changes;
- copy/reset controls for moving an approved scratch rule into source code deliberately;
- shareable workbench state through URL query parameters;
- direct link to the current rendered page.

Scratch CSS is browser-local diagnostic state. It is never written to the repository, included in a deployment artifact as authored site CSS, or promoted automatically to `dev`.

Keyboard shortcuts: `1`, `2`, `3` select desktop/tablet/mobile, `f` selects fit mode, `r` reloads the preview, and `i` toggles element inspection.

## Deployment model

Two preview mechanisms intentionally coexist:

1. The long-lived draft PR `lab -> dev` keeps the existing repository `PR Preview` checks and remote Playwright smoke active against every Lab change.
2. `.github/workflows/lab-preview.yml` deploys every `lab` push directly to the same isolated Cloudflare Pages project using `--branch=lab`, which gives Lab its own stable branch alias.

The Lab workflow:

- checks out the exact pushed SHA;
- restores or builds canonical generated media;
- runs TypeScript checking;
- runs the fast test suite;
- runs the Lab workspace contract test;
- builds with `npm run build:site`, without production analytics;
- performs Cloudflare media packaging and asset-limit checks;
- deploys to `looksawful-ru-preview` with branch identity `lab`;
- stamps `lab-version.json` with the exact commit;
- verifies the immutable deployment;
- verifies the stable branch alias resolves to the exact commit;
- verifies `/lab/` is present;
- verifies Cloudflare `X-Robots-Tag: noindex`;
- attempts idempotent custom-domain/DNS setup;
- verifies the custom domain when setup succeeds.

## Production isolation

Lab must never become a second release path.

- Do not deploy Lab with `--branch=prod`.
- Do not point `lab.looksawful.ru` at the production Pages alias.
- Do not enable production analytics in Lab.
- Do not add `/lab/` to the public site manifest, sitemap, navigation or search discovery.
- Do not merge the long-lived Lab PR wholesale.
- Do not use Yandex Webmaster recrawl against Lab URLs. The existing Yandex control plane remains scoped to `https://www.looksawful.ru`.

The Lab HTML also carries `noindex,nofollow,noarchive`; Cloudflare preview responses are independently required to carry `X-Robots-Tag: noindex`.

## Prototype workflow

1. Make experiments in `lab`, preferably as small focused commits.
2. Push and wait for the `Lab Preview` deployment plus the existing PR Preview checks.
3. Review the actual deployed result through `/lab/` at desktop, tablet, mobile and any feature-specific dimensions.
4. Use the inspector and live CSS scratchpad for fast visual iteration before changing source code.
5. Copy only approved scratch rules into the actual component/style owner and verify them normally.
6. Use the stable Lab URL during iteration and immutable deployment URLs when comparing exact revisions.
7. Keep rejected or unfinished experiments in Lab instead of sending them through `dev`.
8. When a design is approved, create a clean feature branch from current `dev`.
9. Port or cherry-pick only the approved product/component changes. Exclude Lab-only infrastructure.
10. Open a normal PR to `dev` and use the existing PR preview as release evidence.
11. Reach `prod` only through the existing release path from `dev`.

If a prototype commit mixes Lab infrastructure and product code, do not cherry-pick it wholesale. Reapply the approved product diff to a clean branch created from `dev`.

## Lab-only infrastructure

These files belong to the persistent workspace and normally stay only on `lab`:

- `lab/index.html`;
- `src/lab/**`;
- `tools/lab/**`;
- `.github/workflows/lab-preview.yml`;
- `docs/LAB.md`;
- `.agents/skills/looksawful-design-lab/**`;
- `test/lab-workspace-contract.test.mjs`;
- the Lab-only `lab` allowance in `test/repository-structure.test.mjs`;
- the Lab-specific Vite build input;
- the `npm run lab` package script.

## Sync rule

Bring current `dev` forward into `lab` periodically so prototypes remain compatible with the current site. Prefer a normal merge. Do not force-push or hard-reset the persistent Lab branch while another person or agent is using it.

Resolve sync conflicts in favor of current `dev` architecture while preserving Lab-only infrastructure.

## Existing design capture

The repository already has a separate manual `tools/design-capture` utility for deterministic screenshots and breakpoint documentation. Keep that tool manual and local according to its safety contract. Do not wire it into the Lab deployment workflow or CI.

Use the browser Lab for interactive iteration and the manual design-capture tool only when an explicit screenshot/documentation pass is requested.
