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

## Shared layout patterns

- `prose` owns vertical rhythm between direct typographic children. Keep its current `1.5em` default unless a deliberate local art-direction override is required.
- `stack` owns uniform vertical rhythm between containers/components; do not substitute it for prose merely because both stack vertically.
- `cluster` owns peer inline groups; `split` owns container composition; `editorial-grid` owns authored editorial tracks.
- Multi-paragraph section intros must render as exactly two layout roles when a title exists: the title and one `.section-copy__text.prose` wrapper containing all paragraphs. Never allow each paragraph to become a direct Grid/Flex layout item.
- Layout width and readable text measure are separate concerns. A layout primitive may size the track; readable measure belongs inside that track.

## Quality

Use `looksawful-web-quality` for performance/a11y/SEO work and `optimize-web-animations` for CPU/GPU/jank/leak work. Follow `docs/testing-policy.md` for verification tier selection.
