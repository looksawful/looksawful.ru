---
name: looksawful-design-audit
description: "Use when auditing or planning changes to UX flows, interaction models, information hierarchy, responsive behavior, accessibility, visual hierarchy, or cross-page design consistency in looksawful.ru before implementation."
---

# Looksawful Design Audit

Audit before redesign. Preserve the site's existing design language unless the task explicitly asks to change it.

## Workflow

1. Define the user task and the exact flow or surface being reviewed.
2. Inventory entry points, states, actions, transitions, failure/empty/loading states, keyboard behavior, mobile behavior, and exit/recovery paths.
3. Trace each visible symptom to its owning layer: authored content, data/model, renderer/component, CSS/layout, runtime state, animation, media, or route/navigation.
4. Separate UX/product findings from implementation findings. Do not prescribe CSS patches for a state/data problem.
5. Rank findings by user impact, frequency, reach, accessibility risk, regression risk, and ownership ambiguity.
6. Before implementation, define acceptance criteria and the cheapest verification boundary for each change.

## Visual rules

- Reuse current tokens, type, spacing, component semantics, density, media behavior and motion vocabulary where they are valid.
- Do not introduce generic AI decoration, arbitrary gradients, excessive cards, new radius systems, or fashionable effects as a substitute for hierarchy.
- Fix parent layout and ownership before adding local compensation patches.
- Preserve responsive intent; test narrow, medium and wide layouts where the surface exists.
- Motion must preserve reduced-motion behavior, lifecycle cleanup and input responsiveness.

## Flow rules

- One user intent should have one obvious action owner.
- Preserve state and user position on recoverable failures.
- Make loading, empty, error, disabled and success states explicit when the flow can reach them.
- Navigation/reachability/indexability are separate concerns.
- Accessibility findings must identify the actual barrier: semantics, focus order, keyboard reachability, contrast, motion, target size, labeling or reading order.

## Evidence

Prefer browser/rendered evidence for user-visible defects. Source inspection is sufficient for ownership and architecture findings when the behavior follows directly from code. Do not create screenshots or design captures unless the current task explicitly authorizes them.

## Refactor gate

Do not begin a broad redesign until the current flow map, state model, protected visual contracts, known compensating CSS patches and regression tests are recorded.