# Issue tracker

The project uses two planning layers:

- Notion is the planning map and long-lived project/decision context.
- GitHub Issues are executable implementation packets when work is ready to be performed in the repository.

## Reading

When a branch, PR or commit references an issue number, fetch that issue before treating it as the implementation spec. Prefer the current issue body plus explicit later owner decisions over stale summaries.

If no issue exists, the current explicit user request and named canonical repository documents form the implementation spec. Do not invent a missing issue merely to satisfy a workflow.

## Writing

Creating, editing, labeling, assigning, closing, moving or mirroring tasks between Notion and GitHub is an external mutation. Do it only when the user explicitly requests that action. A code-review or architecture skill may read planning context but does not gain permission to reorganize either system.

Keep executable engineering requirements in the GitHub issue that owns the work; keep broader roadmap/decision context in Notion rather than duplicating a second live specification in repository docs.
