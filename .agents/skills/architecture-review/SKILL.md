---
name: architecture-review
description: Use for deliberate architecture audits/refactors where the goal is to reduce shallow modules, improve locality, clarify seams, or simplify a repeatedly changing subsystem.
---

# Architecture review

Use this only for explicit architecture work, not as permission to refactor nearby code during a feature/fix.

## Scope

1. Read `AGENTS.md`, `CONTEXT.md` if present, and canonical docs for the subsystem.
2. Inspect recent history or the user-named hotspot to identify code that actually changes repeatedly.
3. Use the existing `codebase-design` skill for vocabulary and design principles.
4. Preserve ADR/canonical decisions unless current friction is strong enough to justify explicitly reopening them.

## Candidate quality

Prefer candidates where:
- understanding one concept requires bouncing across many shallow modules;
- an interface is almost as complex as its implementation;
- responsibilities leak across seams;
- one logical change causes shotgun edits;
- tests need intimate knowledge of implementation because the public seam is weak.

Apply the deletion test: if removing an abstraction only moves its complexity elsewhere, it is probably not earning its existence.

## Before implementation

For each candidate state:
- current files/owners;
- the concrete friction;
- proposed deeper module/seam;
- what becomes internal;
- what test surface survives;
- migration risk and recommendation strength.

Do not implement until the selected architecture is explicit. Architecture work follows the same branch/test/policy constraints as any other engineering task.