# Branch Consolidation Design

## Goal
Reduce the repository to four permanent branches while preserving recoverability and ongoing work.

## Permanent branches
- `dev`: default working and integration branch.
- `prod`: production/release and deployment source.
- `lab`: temporary integration lane for currently active 3D/model/Storybook/viewer work.
- `content/text-cms`: temporary permanent editorial lane required by the current CMS workflow.

All other branches are temporary task branches. They must be deleted after their useful work is integrated, superseded, or archived.

## Safety constraints
- Never force-push, rebase shared history, reset hard, or overwrite `dev`/`prod`.
- Record exact branch tip SHA before deleting any remote branch.
- Do not delete the head of an open PR unless the PR is intentionally closed or retargeted first.
- Do not delete branches referenced by dirty local clones/worktrees until their uncommitted work and unique commits are preserved remotely.
- Treat model/3D/assets/device/viewer/render/gltf/glb/blender/Storybook work as active until it is intentionally consolidated into `lab`.

## Archive mechanism
When a non-active branch has unique commits but no reason to remain a branch, create an immutable archive tag pointing to its exact tip SHA, verify the tag exists remotely, then delete the branch ref. Tags preserve recoverability without keeping hundreds of branches alive.

## Consolidation lanes
- Normal engineering work: temporary branch -> `dev`.
- Active model/3D work: temporary branch -> `lab` -> `dev` when the model program is ready.
- Editorial work: temporary/editorial changes -> `content/text-cms` -> `dev` when ready.
- Releases: verified `dev` -> `prod`.

## Completion criteria
1. Exactly four permanent branches remain.
2. Every other branch is either an active temporary PR branch or has been archived/deleted.
3. No open PR loses its head ref.
4. No dirty local worktree loses recoverability.
5. Production deployment remains intact.
6. Repository docs and automation describe the same branch model.