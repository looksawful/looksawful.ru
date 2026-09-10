---
name: looksawful-modern-css
description: Use when CSS work in looksawful.ru depends on modern platform features, intrinsic layout, container queries, cascade behavior, progressive enhancement, or browser-support tradeoffs.
---

# Looksawful modern CSS

Use this as a focused reference after `looksawful-frontend-runtime`. The repository's existing CSS ownership, DOM, selectors, tokens, breakpoints and authored copy remain authoritative.

## Defaults

- Prefer normal flow, intrinsic sizing, Flexbox/Grid, `minmax()`, `clamp()`, logical properties and component-local container queries before adding breakpoint patches.
- Use viewport media queries for page-level composition and environment capabilities, not as a device-name taxonomy.
- Prefer native CSS over JavaScript when CSS can express responsive layout or visual state cleanly.
- Treat newer CSS as progressive enhancement. Preserve a usable baseline when the actual browser floor is uncertain.
- Use semantic state already exposed by HTML/ARIA/data attributes. CSS reflects state; it does not invent accessibility state.
- Keep specificity and cascade ownership explicit. Do not introduce a new layer/token/naming architecture merely because a generic reference recommends one.

## Hard boundaries

Do not introduce Tailwind, UnoCSS, Sass/SCSS, CSS-in-JS, BEM migration, a new reset, a new token system or Animate.css without an explicit architecture/dependency decision.

## Browser support comes from the repository

The canonical browser-support contract is `docs/testing-policy.md#13-browser-support-and-verification-contract`.

Treat MDN Baseline and current browser documentation as supporting evidence, not project policy. Normal repository browser acceptance is Chromium-centered; a GREEN Chromium run does not prove Firefox or Safari/WebKit behavior.

Before adding version-sensitive CSS:

1. read the canonical contract;
2. identify whether the task requires an additional browser engine or version;
3. add the smallest fallback or focused engine evidence only when the task's support requirement needs it.

Do not add speculative compatibility scaffolding.

## Upstream reference

Adapted from the policy-first and intrinsic-layout guidance in `PyModel/css-pro-tips`, reviewed at commit `7332ca009ecc469f1bc26bd4083620b022896610`. Upstream guidance is advisory and never overrides repository-local rules.
