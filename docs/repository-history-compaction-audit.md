# Repository history compaction audit

Issue: #198

Status: RED — evidence collection incomplete.

## Acceptance gaps

- [ ] Re-measure current repository/history cost.
- [ ] Identify dominant historical large-blob families.
- [ ] Estimate practical local-development and CI cost.
- [ ] Compare leave-as-is, future-only Git LFS, archival/new-repository migration, and coordinated history rewrite.
- [ ] Document impact on `dev`, `prod`, open PRs, local clones, GitHub Pages, links, rollback and recovery.
- [ ] Record a clear go/no-go recommendation.

## Safety boundary

This audit must not rewrite Git history, force-push shared branches, change public media URLs, or modify content/design/runtime behavior.
