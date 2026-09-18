# Branch Consolidation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce looksawful.ru to four permanent branches (`dev`, `prod`, `lab`, `content/text-cms`) while preserving recoverability and all active work.

**Architecture:** Branch names are ephemeral coordination refs, not archives. Completed or superseded unique tips are preserved by immutable archive tags before branch deletion; active work is routed into one of the four permanent lanes. `prod` remains deployment-only and is not rewritten.

**Tech Stack:** Git, GitHub CLI/API, GitHub Actions, repository release tooling.

**Spec:** `docs/superpowers/specs/2026-09-17-branch-consolidation-design.md`

## Global Constraints
- Never force-push, rebase shared history, reset hard, or rewrite `dev`/`prod`.
- Protect active model/3D/assets/device/viewer/render/gltf/glb/blender/Storybook work until consolidated into `lab`.
- Never delete an open PR head or a branch referenced by dirty local work before preservation.
- Record exact remote SHA before every branch deletion and verify any archive tag remotely first.
- Refresh remote state immediately before each mutation batch.

---

### Task 1: Establish clean isolated audit workspace
**Files:** none.
- [ ] Record current `dev`, `prod`, `lab`, and `content/text-cms` SHAs.
- [ ] Verify canonical clone status and create/reuse an isolated cleanup worktree from current `dev`.
- [ ] Run the repository fast baseline verification and record result.

### Task 2: Build authoritative branch inventory
**Files:** Create/update cleanup evidence outside production source or in issue #1009.
- [ ] Fetch all remote branch refs and all open PR head/base refs.
- [ ] Enumerate local clones/worktrees and dirty states.
- [ ] Classify every branch as permanent, active PR, protected model lane, dirty-local dependency, merged/superseded, or review.
- [ ] Verify classification count equals current remote branch count.

### Task 3: Archive and delete inactive non-PR branches
**Files:** Git refs only.
- [ ] For each inactive unique branch, create `archive/branches/2026-09-17/<encoded-name>` tag at its exact SHA.
- [ ] Push archive tags and verify them remotely.
- [ ] Delete only corresponding remote branch refs.
- [ ] Refresh and verify canonical branches, open PR heads, and protected model branches remain.

### Task 4: Collapse active model branches into `lab`
**Files:** only files intentionally selected from active model branches.
- [ ] Inventory current model/3D/Storybook/viewer branches and their PR/worktree ownership.
- [ ] Identify the newest compatible product changes and overlaps.
- [ ] Integrate approved compatible slices into `lab` without force/rebase or unrelated changes.
- [ ] Verify model catalog/Storybook/viewer checks on exact resulting SHA.
- [ ] Archive/delete model task branches only after their useful work is represented in `lab` and no active worker depends on them.

### Task 5: Collapse normal engineering branches into `dev`
**Files:** only files intentionally selected from surviving engineering branches.
- [ ] Group open/still-useful branches by supersession chain and affected paths.
- [ ] Close or archive superseded PRs only after confirming useful diffs are represented elsewhere.
- [ ] Integrate useful independent slices into `dev` through the existing review/check path.
- [ ] Delete task branches after integration or archival.

### Task 6: Preserve editorial and production lanes
**Files:** workflow/docs only if evidence shows drift.
- [ ] Keep `content/text-cms` until the CMS publication workflow is deliberately migrated.
- [ ] Keep `prod` as deployment source and verify production health still expects its SHA.
- [ ] Do not merge wholesale `dev` into `prod`; use the repository release preflight for approved releases.

### Task 7: Enforce branch hygiene
**Files:** repository settings/workflows/docs as needed.
- [ ] Enable automatic deletion of merged PR head branches if repository settings permit.
- [ ] Update branch documentation so only the four permanent branches are named as persistent.
- [ ] Verify no workflow relies on arbitrary historical task branch names.

### Task 8: Final verification
**Files:** none.
- [ ] Recount remote branches and separate permanent from active temporary branches.
- [ ] Verify all open PR head refs exist.
- [ ] Verify dirty local work is still recoverable.
- [ ] Verify archive tags resolve to every deleted unique SHA.
- [ ] Verify `dev`, `prod`, `lab`, and `content/text-cms` exact SHAs and production deployment contract.
- [ ] Update cleanup issue #1009 with final evidence and remaining temporary branches.