---
name: grill-with-docs
description: Use for a bounded owner decision that needs focused questioning before Spec; pair the conversation with domain-modeling only when terminology or a durable architecture decision actually changes.
---

# Grill with docs

Use this after Research/CodebaseDesign when the route is mostly visible but one or more owner decisions still matter.

## Conversation

- Work with the human; never answer the human side of a HITL decision for them.
- Ask only decision-changing questions. Group closely related questions when the answers are simple.
- Lead with the recommended default and the material trade-off.
- Use current repository evidence and canonical domain terms; do not reopen already-settled facts for ceremony.
- If the discussion exposes broad unknown territory that cannot be resolved in one bounded session, stop and route to `wayfinder`.

## Docs

Use `domain-modeling` only when the answer:
- resolves a new canonical project term; or
- selects a durable, hard-to-reverse architecture trade-off that clears the ADR threshold.

Do not write glossary/ADR sediment for ordinary workflow choices.

## Boundary

Grill produces decisions, not production implementation. It does not grant merge, deploy, publish, branch-topology or guard-bypass authority.

## Done

Finish when the remaining route is clear enough to synthesize a Spec without silently inventing owner choices. Record durable decisions in the relevant tracker/spec context; update domain docs only when the threshold above is met.
