---
name: looksawful-typescript-strict
description: Use when looksawful.ru work changes TypeScript types, migrates JavaScript to TypeScript, fixes strict-mode errors, models runtime boundaries, or risks introducing `any`, unchecked casts, or parallel JS/TS implementations.
---

# Looksawful TypeScript strict

Use this after reading the nearest code and current `tsconfig`/package scripts. Repository behavior, DOM contracts, authored copy, tests, and existing module boundaries remain authoritative.

## Core rules

- Do not introduce explicit or implicit `any` in new or migrated code. Treat external, CMS, DOM-adjacent, JSON, storage, and third-party boundary values as `unknown` until narrowed.
- Prefer fixing the producer/consumer signature over adding `as` casts. Never use `as any`, `as unknown as`, `@ts-ignore`, or non-null assertions to silence a design problem.
- Use `@ts-expect-error` only for a deliberate, documented compiler boundary that cannot be modeled more accurately; it is not a migration shortcut.
- Let TypeScript infer local types when the inference is precise. Add explicit exported/boundary types where they clarify the contract.
- Prefer narrow discriminated unions and precise object shapes over bags of optional fields that permit impossible states.
- Use `import type` for type-only imports when consistent with the surrounding code and formatter/linter behavior.
- Treat generated files and declared third-party globals as boundaries. Model only the API surface the repository actually consumes.

## JS to TS migration

1. Find every import/reference to the source before renaming or replacing it.
2. Preserve selectors, DOM structure, content, timing, event semantics, public globals, and runtime behavior unless the task explicitly changes them.
3. Replace the production `.js` implementation with `.ts`; do not leave parallel JS and TS versions as a compatibility crutch.
4. Update import sites and any build/test references in the same slice.
5. Type DOM queries, events, lifecycle state, external globals, and data boundaries narrowly enough that strict checks prove the existing behavior.
6. Search again for stale `.js` references after the replacement.

## Debugging type failures

- Start from the first meaningful compiler error, then inspect definitions and references before editing.
- Distinguish a bad value model from a bad call-site assumption. Fix the owning contract rather than sprinkling local assertions.
- If a library type is incomplete, prefer a small local declaration/wrapper for the consumed surface over widening the application to `any`.
- Do not expand a focused type fix into framework, module-system, or architecture migration.

## Verification

Use the cheapest relevant checks in this order:

1. the repository typecheck command that covers the changed files;
2. focused unit/contract tests for the changed behavior;
3. affected browser/runtime checks only when behavior crosses a browser seam;
4. broader verification only when required by the merge/release gate.

When migrating a file, completion requires: strict typecheck GREEN, no stale production `.js` twin/reference, and relevant behavior tests GREEN.

## Upstream reference

Adapted from the type-safety and boundary-modeling guidance in `lobehub/lobehub` TypeScript skill, reviewed at commit `906b10e03029648655e0257bda4f785a9e0973f0`. LobeHub-specific React, Ant Design, database, package-layout, and import-sorting rules are intentionally excluded.
