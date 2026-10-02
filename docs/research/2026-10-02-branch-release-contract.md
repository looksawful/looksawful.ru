# looksawful.ru branch and release contract — 2026-10-02

Status: CURRENT RESEARCH  
Purpose: correct the operational model used by UI/design work.  
Baseline: live GitHub repository state read on 2026-10-02.

## Canonical model

The project has three different concerns that must not be collapsed:

1. **Observe the current public product**
   - Use the deployed production site and current `prod` source to understand what users see now.

2. **Develop and integrate changes**
   - `dev` is the repository default branch and the normal integration branch.
   - Feature/work branches are based on the current `dev` unless a narrow production backport/release task explicitly requires another base.
   - Approved product work lands in `dev` first.

3. **Release and deploy**
   - `prod` is protected and is production/release/deploy only.
   - Normal product work must not edit `prod` directly.
   - After a change is approved in `dev`, the canonical release runbook creates a fresh release candidate from the current `prod` and ports only the approved `dev` product diff.
   - The release candidate goes through a PR into `prod`.
   - Once `prod` advances, GitHub Pages deployment starts automatically from that exact `prod` SHA.
   - The deployment workflow verifies the exact published SHA and live routes/assets.

## Current repository evidence

### Default/integration branch

GitHub repository metadata currently reports:

- default branch: `dev`;
- `dev` current head at research time: `a9170b6d3fd5e6095e71f39f9184793aaf772de3`;
- `prod` current head at research time: `3e6f60c1d2890ea72c39c61b7790da0415030fa0`.

Repository-local Git operations guidance says:

> `dev` is the integration branch and `prod` is the production/deploy source.

Source:
- `.agents/skills/looksawful-git-operations/SKILL.md`

### Protection

GitHub currently reports both `dev` and `prod` as protected.

Active ruleset `Protect prod`:
- targets `refs/heads/prod`;
- deletion blocked;
- non-fast-forward/history rewrite blocked;
- PR required;
- required status check: `verify`;
- no bypass actor for the current user.

Active ruleset `Protect dev`:
- targets `refs/heads/dev`;
- deletion blocked;
- non-fast-forward/history rewrite blocked;
- direct fast-forward integration remains possible.

Sources:
- GitHub repository ruleset 22326923 (`Protect prod`)
- GitHub repository ruleset 22329778 (`Protect dev`)
- `tools/github/configure-repo-guardrails.ps1`

### Canonical release sequence

`docs/release-promotion.md` is explicit:

`Lab → dev → prod`

For approved product work:

1. Read current Lab/dev/prod SHAs.
2. If a visual human gate is needed, approve the product layer in the review surface.
3. Create an isolated branch/worktree from current `dev`.
4. Port only approved product files and required dependencies.
5. Verify and merge into `dev`.
6. Create a fresh release candidate from current `prod`.
7. Port/reconcile only the approved `dev` diff.
8. Run release preflight.
9. Open the prod PR and pass configured exact-SHA/browser gates.
10. Merge to `prod`.
11. Automatic production deployment verifies the exact published SHA.
12. Probe affected live routes.

Important: the release runbook explicitly says **never merge all of `dev` wholesale into `prod`**.

Source:
- `docs/release-promotion.md`

### Automatic deploy

`.github/workflows/pages.yml` currently triggers on:

```yaml
on:
  push:
    branches: [prod]
  workflow_dispatch:
```

The deployment job:
- checks out the exact production SHA;
- runs typecheck;
- runs Fast tests;
- builds the site;
- runs compact production browser sanity;
- deploys the exact Pages artifact;
- fetches `https://www.looksawful.ru/deploy-version.txt`;
- verifies that the live site exposes `commit=<GITHUB_SHA>`;
- probes root, CV, discovery files and built assets.

Therefore:

**`dev` does not itself deploy the public GitHub Pages site.**  
`dev` is the integration source for approved product changes.  
The controlled `dev → prod` release promotion advances `prod`, and the resulting `prod` push automatically deploys production.

Source:
- `.github/workflows/pages.yml`

## Consequence for the current UI audit

The correct UI workflow is:

```text
LIVE PROD / prod
    ↓ observe current behavior and visual inconsistency

current dev
    ↓ normal feature branch / implementation

browser or Storybook human gate when useful
    ↓ approval

merge approved work → dev
    ↓

fresh narrow release candidate from current prod
    ↓ ports only approved dev product diff

PR → prod
    ↓

automatic GitHub Pages deploy
    ↓

exact-SHA live verification
```

So two statements are simultaneously true:

- **Audit observation starts from production**, because production is what users currently see.
- **Implementation does not happen on production**, because normal work lands in `dev` and reaches protected `prod` only through the release path.

This distinction supersedes any earlier wording that suggested either:
- using `prod` as the normal development base, or
- treating `dev` itself as the public deployment branch.

## Storybook / human gate

Storybook/Lab is not the branch/source of truth for the public product.

Its current role in this UI work is a review surface:
- isolate a component/pattern when live/local page context is inconvenient;
- compare candidate variants;
- obtain human approval when needed.

After approval, the production implementation belongs in the normal `dev` integration flow.

The canonical release document's use of `Lab → dev → prod` describes a possible visual-approval path; it does not make Lab or Storybook the public product source.

## Operational rule for future work

For ordinary UI/design-system work:

1. inspect current production;
2. read current `dev` before writing;
3. branch from current `dev`;
4. implement and verify there;
5. use Storybook only when it helps the human gate;
6. merge accepted work to `dev`;
7. release through a fresh current-`prod` candidate containing only the approved `dev` diff;
8. let the `prod` Pages workflow deploy automatically;
9. verify the live exact SHA.

Do not write directly to protected `prod` as a normal implementation shortcut.
