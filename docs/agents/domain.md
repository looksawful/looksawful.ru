# Domain docs

This repository uses a **single-context** domain layout.

## Sources of truth

- `CONTEXT.md` at the repository root is the canonical glossary for project-specific domain language.
- `docs/adr/` is the location for durable architecture decision records when a decision is hard to reverse or materially changes system boundaries.
- Executable code, tests, workflows, schemas, and generated-output rules remain stronger evidence for current runtime behavior than prose documentation.

## Consumer rules

Before changing domain language, architecture, or behavior whose meaning depends on project terminology:

1. Read the relevant entries in `CONTEXT.md`.
2. Read applicable ADRs under `docs/adr/` if present.
3. Prefer existing domain terms over inventing synonyms.
4. If implementation reality and documentation disagree, verify the implementation first, then reconcile stale docs explicitly.
5. Record a new ADR only for a durable decision, not routine implementation detail.

## Layout

This is not a monorepo and does not use `CONTEXT-MAP.md` or per-package context files. Keep shared terminology in the root `CONTEXT.md`.
