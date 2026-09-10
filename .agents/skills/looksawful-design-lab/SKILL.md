---
name: looksawful-design-lab
description: Use when prototyping or reviewing visual, layout, motion, interaction or component changes for looksawful.ru before they are promoted to dev.
---

# Looksawful design lab

Use the persistent `lab` branch as the disposable visual workspace. It is intentionally separate from `dev` and `prod`.

## Entry points

- remote workbench: `https://lab.looksawful.ru/lab/` when the custom domain is active;
- stable fallback: `https://lab.looksawful-ru-preview.pages.dev/lab/`;
- local workbench: `npm run lab`;
- long-lived review PR: `lab -> dev`, draft PR #707.

The workbench renders the real pages from the same Lab deployment inside a viewport harness. It supports route switching, canonical desktop/tablet/mobile sizes, arbitrary dimensions, debug grid, element outlines and a same-origin DOM inspector.

## Hard boundaries

- Never deploy Lab experiments to `prod`.
- Never turn the long-lived Lab PR into an automatic merge path.
- Never merge PR #707 wholesale as a release.
- Do not enable production analytics in Lab builds.
- Do not make Lab routes indexable or add them to sitemap/discovery.
- Do not weaken Cloudflare `noindex` verification.
- Do not copy Lab-only shell/workflow/bootstrap files into `dev` unless the user explicitly decides to productize the Lab itself.

Lab-only infrastructure currently includes:

- `lab/index.html`
- `src/lab/**`
- `tools/lab/**`
- `.github/workflows/lab-preview.yml`
- `docs/LAB.md`
- `.agents/skills/looksawful-design-lab/**`
- `test/lab-workspace-contract.test.mjs`
- the Lab-only Vite input and `npm run lab` script

## Prototype flow

1. Make sure the work is happening on `lab` or on a short-lived branch intended to land in `lab`, not on `prod`.
2. Read the relevant repository-local frontend/CSS/motion skills before editing production components.
3. Keep each promotable experiment in focused commits. Avoid mixing unrelated visual experiments in one commit.
4. Push to `lab` and use the persistent workbench to inspect the actual Cloudflare build.
5. Review desktop `1440x1000`, tablet `834x1112`, mobile `390x844`, plus any task-specific breakpoint.
6. Use inspect/outline/grid only as diagnostic overlays; never change product markup merely to satisfy the Lab UI.
7. Treat the immutable Cloudflare deployment URL as evidence for the exact commit and the stable Lab alias as the latest workspace.
8. Keep rejected experiments in Lab or revert them there. Production history does not need to contain abandoned design attempts.

## Promotion to dev

Promotion is deliberate and narrow:

1. Start from current `dev`.
2. Create a clean feature branch from `dev`.
3. Port or cherry-pick only the approved product/component commits from Lab.
4. Exclude Lab-only infrastructure listed above.
5. Run the normal repository verification required for the changed area.
6. Open a normal PR to `dev` and let the existing PR preview prove the exact candidate.
7. Reach `prod` only through the existing release path from `dev`.

If a Lab commit mixes infrastructure and product code, do not cherry-pick it wholesale. Reapply the approved product diff onto a clean branch from `dev`.

## Keeping Lab current

Periodically merge or otherwise bring current `dev` forward into `lab`. Prefer a normal merge so active experiments remain visible. Do not force-reset `lab` while another agent or person is using it.

When syncing, resolve conflicts in favor of current `dev` architecture while preserving the Lab-only entry point, workflow and workbench.

## Cloudflare contract

`Lab Preview` deploys the exact `lab` commit to the isolated Pages project `looksawful-ru-preview` with `--branch=lab`. This produces:

- an immutable deployment URL for a specific build;
- stable branch alias `lab.looksawful-ru-preview.pages.dev`;
- optional custom domain `lab.looksawful.ru`, configured as a proxied CNAME to the branch alias.

The workflow verifies the exact Lab identity, the `/lab/` entry point and `X-Robots-Tag: noindex`. Custom-domain bootstrap is idempotent and must never mutate the production domain.
