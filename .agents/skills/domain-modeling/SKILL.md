---
name: domain-modeling
description: Use when project terminology, domain boundaries, canonical names, CONTEXT.md, or a durable architecture decision needs to be clarified.
---

# Domain modeling

Use `CONTEXT.md` as a glossary, not a spec or implementation notebook.

## Rules

- Read the current glossary before introducing a new domain term.
- When two words describe the same project concept, choose one canonical term and record confusing alternatives under `_Avoid_` only when the distinction matters.
- Keep definitions to one or two sentences and free of implementation detail.
- Cross-check claimed domain relationships against the current typed domain/catalog code and canonical architecture docs.
- Do not add generic programming vocabulary to the glossary.

## ADRs

Create or propose an ADR only when all are true:
1. the decision is meaningfully hard to reverse;
2. future readers would otherwise wonder why the choice exists;
3. real alternatives were considered and the trade-off matters.

ADRs record the decision and reason, not a transcript. Easy-to-reverse implementation details do not need ADR sediment.

When an existing canonical architecture document already owns the decision, update that source instead of creating a competing ADR/glossary rule.
