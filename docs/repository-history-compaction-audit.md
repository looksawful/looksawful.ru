# Repository history compaction audit

Issue: #198

Status: GREEN — audit complete. Recommendation: **NO-GO for history rewrite now**.

Audit date: 2026-09-05.

## Executive decision

Do not rewrite the repository history now.

The repository is large enough to deserve monitoring, but the current cost does not justify a destructive migration. The large historical object database primarily penalizes full clones and the small number of workflows that intentionally request full history. Normal Fast CI, Pages deployment, production-health and quality workflows use shallow checkout (`fetch-depth: 1`).

Keep the current history intact, keep the existing upload limits, and continue using shallow clones in routine automation. Re-open destructive compaction only if one of the explicit decision triggers below is reached.

## Current measured state

GitHub repository metadata on 2026-09-05 reports repository size `2,776,636 KiB`, approximately **2.648 GiB**.

This corroborates the earlier full-history measurement recorded in #82:

- packed reachable Git history: **2.64 GiB**;
- `.git` after a full-history checkout: approximately **2.7 GiB**;
- pre-cleanup working tree: approximately **1004 MiB**.

The active-tree cleanup completed in #82 removed the legacy root `media/**` tree, approximately **174.4 MB** of current-tree payload, and established a post-cleanup active-tree baseline of approximately **830 MiB**. The GitHub repository-size figure remaining near 2.65 GiB demonstrates the expected result: deleting current-tree duplicates did not materially compact already reachable historical blobs.

These figures are not directly subtractable as a precise "historical overhead" number because Git repository size is compressed object storage while the working-tree figure is materialized file size. They are sufficient to show that history, not the current duplicate root, is now the dominant repository-storage concern.

## Dominant large-blob families

The full-history audit in #82 identified historical large blobs under retired paths including:

- `sandbox/**`;
- historical `src/assets/**`;
- historical `public/assets/**`;
- lab/staging paths;
- the removed legacy root `media/**` tree, whose objects remain reachable from older commits.

The media audit also established the large binary families that drove repository growth at the time of measurement:

- WebP: 1,436 files, approximately 394.2 MB;
- MP4: 39 files, approximately 346.3 MB;
- PNG: 76 files, approximately 145.6 MB;
- MOV: 2 files, approximately 128.5 MB;
- individual historical/current source files included approximately 92.9 MB MP4, 70.3 MB MOV, 58.2 MB MOV, and 45.8/41.1 MB MP4 objects.

The important distinction is that active delivery ownership is now clean: `public/media/**` is canonical and root `media/**` is guarded against reintroduction. The remaining size problem is historical, not an unexplained second active media tree.

## Practical cost today

### Normal CI and deployment

Routine workflows are already protected from the full-history cost:

- Fast CI: `fetch-depth: 1`;
- GitHub Pages deployment: `fetch-depth: 1`;
- production-health: `fetch-depth: 1`;
- normal quality jobs use shallow checkout for their primary source/ref paths.

Therefore the 2.65 GiB history is **not paid on every pull request or ordinary deployment**.

### Workflows that intentionally pay for history

Two repository workflows currently request `fetch-depth: 0`:

1. `CMS media` — runs on `dev` pushes that touch media/catalog paths and on manual dispatch. It uses history to classify changes and operate on media state.
2. `Publish CMS changes` — manual `workflow_dispatch` only. It checks trusted `prod`, fetches `dev`/`prod`, and validates publication topology/scope.

These are narrower operator workflows, not the permanent Fast CI path. Their full-history cost is real, but not frequent enough by itself to justify rewriting every repository SHA.

### Local development

A fresh full clone still has to obtain a repository whose compressed Git storage is approximately 2.65 GiB. Existing clones pay mostly for incremental objects after the initial clone. Developers who do not need history can use shallow/filtered clone strategies, but the canonical repository should not require special clone instructions merely to remain functional.

## Option comparison

### 1. Leave history as-is — RECOMMENDED

Benefits:
- zero migration risk;
- all existing commit SHAs, PR references, release evidence and links remain valid;
- no clone invalidation for current developers;
- no coordination freeze across active branches/PRs;
- normal CI is already shallow;
- current repository size remains below GitHub's documented 10 GB on-disk repository recommendation ceiling, although GitHub also recommends keeping repositories small and notes that large repositories make clone/fetch slower.

Costs:
- full clones remain large;
- the two full-history CMS workflows continue paying the history cost;
- historical binary baggage remains permanently reachable.

Decision: **keep**.

### 2. Git LFS for future files only — REJECT for current Pages delivery

Future-only LFS would not shrink the existing 2.65 GiB history. It would only change ownership for new objects.

More importantly, GitHub documentation states that **Git LFS cannot be used with GitHub Pages sites**. The current site serves media through the Pages repository/build contract, so moving public delivery assets to LFS would conflict with the current deployment model. LFS also adds separate storage/bandwidth accounting and client/tooling requirements.

Decision: **do not introduce LFS into the current Pages-backed media path**. Reconsider only together with a deliberate external/object-storage delivery migration.

### 3. Archive/new repository migration — DEFER

A new repository seeded from the current tree could remove historical baggage without rewriting the old repository in place, but it is operationally a repository migration:

- repository/clone URL strategy must be decided;
- Issues/PRs/release references and GitHub Pages source need an explicit transition plan;
- branch protection/rulesets/secrets/settings must be recreated or migrated;
- the old repository would need to remain available as an archive for historical links.

This is safer conceptually than rewriting the active repository, but far more disruption than current evidence warrants.

Decision: **defer**.

### 4. Coordinated history rewrite — NO-GO

A `git filter-repo`/equivalent migration could materially shrink `.git` by deleting large historical blobs, but it changes commit IDs across rewritten history.

Impact would include:

- force-updating protected `dev` and `prod` plus any rewritten tags;
- invalidating old commit SHAs used in issue/PR/release/deployment evidence;
- requiring every local clone to reclone or perform careful recovery;
- forcing all open feature branches/PRs to be recreated/rebased onto rewritten history;
- disrupting comparison/merge ancestry during an already active multi-branch work period;
- requiring a tested backup, migration window and rollback repository/ref set.

No ordinary cleanup PR is allowed to perform this operation.

Decision: **NO-GO now**.

## GitHub guidance relevant to the decision

Current GitHub documentation:

- recommends an on-disk repository size below 10 GB and notes that large repositories increase clone/fetch cost;
- recommends shallow clones as lower-cost Git read operations for automation;
- warns at files over 50 MiB and blocks regular Git objects over 100 MiB;
- recommends Git LFS for large binaries generally, but explicitly states Git LFS cannot be used with GitHub Pages sites.

References:
- https://docs.github.com/en/repositories/creating-and-managing-repositories/repository-limits
- https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-large-files-on-github
- https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-git-large-file-storage

## Existing controls that reduce future growth

The repository already has a documented/enforced media upload policy:

- images: warn above 20 MiB, reject above 50 MiB;
- videos: warn above 50 MiB, reject above 95 MiB.

The legacy root media tree is gone and protected by regression coverage. These controls materially reduce the chance that the history problem keeps accelerating at the previous rate.

## Decision triggers for reopening compaction

Re-open a destructive migration proposal only if at least one of these becomes true:

1. compressed repository size approaches **5 GiB** or shows sustained rapid growth despite current upload policy;
2. routine developer clone/fetch time becomes a demonstrated workflow blocker;
3. a frequently executed required CI workflow cannot be made shallow and its full-history checkout becomes a material Actions cost;
4. public media delivery moves away from GitHub Pages to object/CDN storage, making a clean repository boundary practical;
5. GitHub reports repository-health degradation or requests corrective action.

If a trigger is reached, create a **new migration issue**. That issue must contain backups, exact object-size savings, branch/tag rewrite map, open-PR freeze/rebase plan, local-clone recovery instructions, Pages rollback, and a tested rollback ref/repository before any force operation is approved.

## Acceptance result

- [x] Re-measured current repository/history cost.
- [x] Identified dominant historical large-blob families from the prior full-history audit and current repository state.
- [x] Estimated practical local-development and CI cost, including which workflows are shallow/full-history.
- [x] Compared leave-as-is, future-only Git LFS, archival/new-repository migration, and coordinated history rewrite.
- [x] Documented impact on `dev`, `prod`, open PRs, local clones, GitHub Pages, links, rollback and recovery.
- [x] Recorded a clear recommendation: **NO-GO for destructive history compaction now; leave history intact and monitor explicit triggers.**

No repository history, media, content, design, runtime, or public URL was modified by this audit.
