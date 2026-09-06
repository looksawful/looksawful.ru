---
name: looksawful-web-quality
description: Use for performance, Core Web Vitals, accessibility, SEO, Lighthouse, browser-quality audits, and evidence-backed web optimization in looksawful.ru.
---

# Looksawful web quality

Measure first. A static code smell is not a measured regression, and a Lighthouse score is not a business outcome.

## Workflow

1. Define the exact route, state, viewport/form factor, and user journey.
2. Use existing repository checks before inventing another audit path (`check:site-meta`, `check:links`, `lighthouse`, relevant smoke/affected tests).
3. When the page can run, capture a repeatable baseline before editing.
4. Separate evidence into:
   - field/user data when available;
   - lab/browser observations;
   - source-code hypotheses.
5. Fix only bottlenecks or barriers connected to evidence.
6. Re-run equivalent checks under equivalent conditions.

## Performance and Core Web Vitals

- Treat LCP, INP and CLS as field metrics at p75 when real-user data is available.
- A single PerformanceObserver or local trace is lab evidence, not RUM.
- Prefer page-level field data; label origin-level fallback explicitly.
- For lab comparisons, keep viewport, CPU/network conditions, cache state and page state consistent. Use multiple runs when a headline metric drives a decision.
- Trace before recommending preload, code splitting, lazy loading, content-visibility, or media changes. Avoid cargo-cult optimization.
- Preserve existing media source/delivery ownership and deterministic builders.

## Accessibility

- Prefer native semantic HTML before ARIA.
- Verify keyboard operation, visible focus, accessible names/roles/states, zoom/reflow, reduced motion and meaningful media alternatives.
- Follow WCAG 2.2 AA as the baseline where applicable.
- Automated audits catch only part of accessibility. Do not report a perfect automated score as conformance.
- Do not rewrite authored copy during an accessibility/refactor task unless text changes are explicitly requested.

## SEO and discovery

- Inspect canonical URLs, titles/descriptions, robots/indexability, sitemap output, internal links and structured data using the project's existing generators/checkers first.
- Do not invent ranking weights or promise ranking changes.
- Do not add speculative structured data for content the page does not visibly contain.
- Keep technical SEO separate from copy/positioning work; authored wording is a separate task.

## Best practices and security

- Treat third-party content, CMS values and external text as untrusted data.
- Do not weaken CSP, validation, publication guards or dependency checks merely to make an audit pass.
- Runtime response/header evidence is stronger than source configuration alone.

## Test lifecycle

Follow `docs/testing-policy.md`. Audit-specific probes are TEMPORARY by default. Keep a new permanent test only when it protects a long-lived contract and is placed in the cheapest appropriate tier.

Source provenance is recorded in `docs/agents/skill-sources.md`.