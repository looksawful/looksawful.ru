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

Do not treat MDN Baseline or a generic compatibility table as the project's browser policy. Read the current repository configuration and verify version-sensitive behavior when it matters.

## Upstream reference

Adapted from the policy-first and intrinsic-layout guidance in `PyModel/css-pro-tips`, reviewed at commit `7332ca009ecc469f1bc26bd4083620b022896610`. Upstream guidance is advisory and never overrides repository-local rules.
