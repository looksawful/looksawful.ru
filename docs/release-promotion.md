# Release promotion: Lab → dev → prod

This runbook is the canonical agent-facing sequence for narrow product promotion after visual approval in Lab.

## 1. Start from live branch state

Read current `lab`, `dev`, and `prod` SHAs from GitHub immediately before preparing a candidate. Do not use a remembered base.

Record:

- approved Lab/product head;
- current `dev` integration head;
- current `prod` release head;
- exact approved product diff.

Lab-only review files are never promoted to `dev` or `prod` merely because they were present during visual approval.

## 2. Integrate the approved product layer into dev

Create an isolated branch/worktree from the current `dev`. Port only the approved product files and their required dependencies. Preserve unrelated current `dev` work.

Before the PR, run the cheapest sufficient local checks for the touched subsystem. The normal PR must then pass the repository exact-SHA preview and Remote Browser QA gates.

Merge to `dev` only after those configured checks are green and the candidate preview is visually accepted when the change requires visual approval.

## 3. Prepare a fresh prod backport

Create the release candidate from the **current** `prod`, never by merging all of `dev` wholesale. Compare the approved `dev` implementation with the candidate before opening a prod PR.

Run the fail-closed preflight:

```powershell
node tools/release/preflight.mjs `
  --repo . `
  --prod-base <current-prod-sha> `
  --candidate <candidate-sha> `
  --approved-base <approved-dev-base-sha> `
  --approved-head <approved-dev-head-sha>
```

The preflight rejects:

- Lab-only paths, including rename origins;
- approved product files missing from the release candidate;
- extra candidate files outside the derived approved-file allowlist;
- touched files that discard clean prod-only changes;
- overlapping changes that cannot be reconciled automatically.

An intentional extra product file can be declared with repeated `--allow <path>`. This never overrides the Lab-only path guard.

If an approved file and `prod` both changed the same lines and the release candidate was manually reconciled, declare that exact conflicting overlap path with repeated `--reconcile <path>`. The preflight accepts `--reconcile` only for paths that its three-way merge classifies as genuine overlap conflicts. A non-overlap or automatically mergeable path is rejected with `INVALID_RECONCILIATION_PATH`.

`--reconcile` is an acknowledgement of a reviewed manual conflict resolution, not a general bypass: Lab-only paths, missing approved files, extra unapproved candidate files, and clean prod-only changes remain fail-closed.

## 4. Use an explicit temp root for local release verification

If the system temp drive is constrained, do not delete arbitrary user files and do not accept ENOSPC as a product failure. Route child-process temp files to an explicit roomy location:

```powershell
node tools/release/run-verification.mjs `
  --temp-root A:\Temp\looksawful-release `
  -- npm run test:fast
```

Run additional required commands through the same wrapper when necessary, for example `npm run typecheck` or `npm run build:site`. The wrapper verifies the temp root is writable and exports `TEMP`, `TMP`, and `TMPDIR` to the child process.

## 5. Release gate

A prod PR is not ready from local checks alone. It still requires the repository's configured exact-SHA PR preview and Remote Browser QA. Immediately before merge, re-read current `prod`; if it advanced, compare drift and rebuild the candidate from or reconcile it with the fresh base without force-pushing shared history.

After merge, require the production deployment workflow to verify the published exact SHA, then probe the affected live routes independently.

## 6. Evidence and handoff

Record in the issue/PR:

- approved and release SHAs;
- preflight result;
- local verification commands and temp root when used;
- exact-SHA preview and browser-QA result;
- production deploy SHA and live verification;
- any deferred editorial or architecture follow-ups.

This tooling prevents common promotion mistakes. It does not grant permission to merge or deploy and it does not replace human visual approval where the task requires it.
