# Domain docs

Layout: **single-context**.

## Canonical locations

- Root `CONTEXT.md` is the project glossary and ubiquitous language.
- `docs/adr/` is the location for durable architecture decision records **when such ADRs actually exist**.
- If a future `CONTEXT-MAP.md` exists, revisit this file before assuming the repository is still single-context.

## Consumer rules

- Read `CONTEXT.md` before changing terminology, domain identity or relationships.
- Read only ADRs relevant to the subsystem being changed.
- If `docs/adr/` or another domain document does not exist, proceed silently. Do not flag its absence and do not create empty scaffolding.
- `domain-modeling` creates or extends domain files lazily, only when a term is resolved or a durable decision genuinely needs recording.
- `CONTEXT.md` is a glossary, not a task plan, implementation spec, status ledger or architecture notebook.
- Prefer existing canonical project terms over synonyms. When current code/evidence contradicts prose, verify the implementation and reconcile stale docs explicitly.
- Executable code, schemas, tests, workflows and repository policy remain stronger evidence for current behavior than descriptive prose.
- A new ADR is appropriate only when the choice is meaningfully hard to reverse, surprising without context, and the result of a real trade-off.
- GitHub Issues own executable repository work; broader roadmap and long-lived planning context may remain in Notion as described in `docs/agents/issue-tracker.md`.
