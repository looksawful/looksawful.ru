# Frontend agent context

This is routing context, not a substitute for code or tests.

## Ownership

- CSS owns responsive layout, sizing, overflow, breakpoints and visual composition.
- `src/motion-contract.ts` defines the shared reveal attributes/kinds; `src/motion.ts` owns the current reveal runtime.
- Project gallery/lightbox/deck behavior is code-owned presentation. Read the current PhotoSwipe/Embla wrappers and `package.json` before changing APIs.
- Media presentation is separate from Media Catalog identity and generated delivery assets.

## Before changing CSS or runtime

1. Read `AGENTS.md` and `looksawful-frontend-runtime`.
2. Read current tests/contracts for the owner, especially stylesheet ownership/navigation, motion runtime/renderer, captions/lightbox and media behavior when relevant.
3. Preserve authored copy and existing DOM semantics unless explicitly requested otherwise.
4. Prefer the existing owner over a parallel implementation.

## Modern CSS direction

Use intrinsic/mobile-first layout first. Reach for container queries when a component adapts to its container; use media queries for viewport/page-level composition. Prefer CSS primitives over JS layout measurement when both can express the behavior. Do not introduce a new CSS methodology during an unrelated fix.

## Motion direction

Ordinary reveals use the existing reveal contract. GSAP is for orchestration that the existing visibility runtime cannot express cleanly. Responsive GSAP variants should prefer `gsap.matchMedia()` and deterministic lifecycle cleanup. Scroll-linked behavior should not silently replace one-shot reveal behavior.

## Quality

Use `looksawful-web-quality` for performance/a11y/SEO work and `optimize-web-animations` for CPU/GPU/jank/leak work. Follow `docs/testing-policy.md` for verification tier selection.