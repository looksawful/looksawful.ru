# Issue tracker

The repository execution tracker is GitHub Issues for `looksawful/looksawful.ru`.

## Reading

When a branch, PR or commit references an issue number, fetch that issue before treating it as the implementation spec. Prefer the current issue body plus explicit later owner decisions over stale summaries.

If no issue exists, the current explicit user request and named canonical repository documents form the spec. Do not invent a missing issue merely to satisfy a workflow.

## Writing

Creating, editing, labeling, assigning or closing an issue is an external mutation. Do it only when the user explicitly requests that action. A code-review or architecture skill may read the tracker but does not gain permission to reorganize it.

Keep execution requirements in the issue that owns the work; avoid duplicating the same live specification across several repository documents.