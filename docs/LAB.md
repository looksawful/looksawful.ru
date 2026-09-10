# Design Lab

`lab` is a persistent design-prototyping branch for `looksawful.ru`.

## Purpose

Use this branch for visual experiments, component prototypes, motion, layout and interaction work before promotion to `dev`.

The branch is intentionally separated from production. Production remains `prod`.

## Deployment model

- `lab` is kept as a long-lived draft pull request into `dev`.
- The existing PR Preview workflow builds the exact `lab` commit.
- Preview builds use `npm run build:site` and do not enable production analytics.
- Each deployment has an immutable Cloudflare Pages URL.
- The pull request also keeps a stable human-facing Cloudflare preview alias updated to the latest `lab` commit.
- Preview responses are verified as `noindex` by CI.
- The existing remote Playwright smoke runs against the published preview.

## Working rule

1. Prototype freely in `lab`.
2. Inspect the Cloudflare preview instead of production.
3. Keep unfinished experiments in `lab`.
4. Promote only approved work to `dev` through a clean feature branch / pull request or a deliberate commit transfer.
5. Never use the long-lived Lab PR as an automatic release to `dev`.
6. `prod` is reached only through the existing release path from `dev`.

## Sync rule

`lab` should periodically be brought forward from `dev` so prototypes stay compatible with current site code. Do not force-push or reset it while another agent or person is actively using the workspace.

## Intended Cloudflare address

The canonical working address is the stable preview alias posted by the Lab pull request. Immutable deployment URLs remain useful for comparing revisions and visual-regression evidence.

A custom hostname such as `lab.looksawful.ru` may later be attached to the same preview alias without changing this branch model.
