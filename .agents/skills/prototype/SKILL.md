---
name: prototype
description: Use for an explicitly throwaway prototype that answers one UI, interaction, state-model or behavior question before production implementation.
---

# Prototype

A prototype answers one question. It is not production code with lower standards.

## Choose the question

- UI/layout question: create 2–4 structurally different variants, not color tweaks.
- Interaction/state question: expose the important state and let the user drive representative scenarios.

## Rules

- Keep it trivial to run and clearly marked as prototype/throwaway.
- Prefer embedding a UI prototype in the real surrounding page/state rather than designing in an empty vacuum.
- Do not mutate production data or CMS state from a visual prototype.
- Do not add permanent tests, generic abstractions, persistence or error-handling frameworks to prototype code.
- Keep authored project copy unchanged unless the prototype is explicitly about copy.
- A prototype does not override `AGENTS.md`, security, privacy, Git or branch rules.

## Finish

Record the decision the prototype resolved. Re-implement the chosen solution under normal production constraints; do not simply promote throwaway code. Remove prototype-only routes/switchers from the integration branch when they have served their purpose.