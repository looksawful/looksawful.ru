# Domain docs

This repository uses a single-context domain-doc layout.

## Canonical locations

- `/CONTEXT.md` is the canonical project glossary. Read it when a task uses project-specific domain language or when naming/identity boundaries matter.
- `/docs/adr/` is the canonical location for durable architecture decision records. Read only ADRs relevant to the subsystem being changed.
- There is no `CONTEXT-MAP.md` because this repository is not configured as a multi-context monorepo.

## Consumer rules

- Executable code, schemas, tests, workflows, and repository policy outrank prose when they disagree.
- Use `CONTEXT.md` for stable vocabulary, not task plans, implementation checklists, or temporary branch state.
- Use an ADR for a durable architectural decision whose rationale and consequences need to survive the current issue or PR. Do not create an ADR merely to narrate a small code change.
- If a domain document is stale relative to current repository/runtime evidence, reconcile the document explicitly rather than silently following stale text.
- GitHub Issues remain the source for executable repository work; broader roadmap and long-lived planning context may remain in Notion as described in `docs/agents/issue-tracker.md`.
