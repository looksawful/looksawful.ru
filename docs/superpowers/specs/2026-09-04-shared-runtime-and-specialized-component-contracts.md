# Shared Runtime & Specialized Component Contracts

Status: **APPROVED DOCUMENTATION COMPANION**

Architecture branch: `agent/page-content-architecture-spec-20260904`

Related specs:

- `2026-09-04-page-content-section-content-block-architecture-design.md`
- `2026-09-04-component-contracts-and-screenshot-evidence.md`

## Purpose

This document closes two gaps left by the visual ContentBlock contract inventory:

1. visible Home/project-specific components that are not generic ContentBlocks;
2. shared runtime engines that implement behavior behind visual components but must not be modeled as extra visual variants.

## Additional visible components

### Home Expertise

Owner includes `src/components/expertise.ts`.

Responsibility: render Home expertise/competency presentation from canonical content. It is Home-specific presentation, not a taxonomy source of truth and not a universal Section type.

Target: consume canonical Home/editorial data; preserve current semantics/responsive behavior; do not duplicate competency taxonomy.

Visual evidence: wide + mobile and representative dense content/focus state.

### Home Experience

Owner includes `src/components/experience.ts`.

Responsibility: render ordered Home experience/work-history presentation. It must not create an independent duplicate of CV/public-static content authority.

Target: keep Home presentation isolated from CV architecture while deriving from the appropriate canonical editorial/domain source.

Visual evidence: wide + mobile chronology.

### Home Tools

Current legacy Home markup contains `.tools` and may be hidden at the implementation baseline.

Responsibility: present tools/skills content only when enabled by canonical Home composition.

Target: hidden state is evidence, not deletion permission. If retained, move to typed Home composition; if retired, require a separate evidence-backed decision.

Visual evidence: capture only if currently visible. Otherwise record `NOT CURRENTLY VISIBLE` with SHA.

### Contact / Footer

Current Home/site terminal contact presentation.

Responsibility: provide terminal contact/action link and footer semantics.

Target: preserve authored contact copy/address; code owns link validation and structure.

Visual evidence: desktop/mobile terminal state plus focus-visible.

### Code Block

Current owner: `src/components/code-block.ts`.

Responsibility: present/enhance code or preformatted content where required.

Boundary: authored code/text is data and must never become executable instructions merely because it is rendered by the component.

Target: small utility/specialized component only for real consumers.

Visual evidence: narrow/desktop overflow or wrapping plus any controls/focus state.

### Berserk Audio Player

Current owner: `src/components/berserk-audio-player.ts`.

Responsibility: project-specific audio playback UI/runtime.

Target: remain SPECIALIZED unless repeated independent consumers justify promotion. Preserve accessible playback controls and project media authority.

Visual evidence: idle/playing/focus/compact where reachable.

### Awful Cases Game

Current owner: `src/components/awful-cases-game.js`.

Responsibility: own Awful Cases interactive/game experience and project-local runtime.

Target: explicit SPECIALIZED boundary. It must not justify an unrestricted `{type:"custom", renderer:string}` path in PageContent.

Visual evidence: initial/active/compact/fallback appearance. Runtime correctness requires behavioral evidence beyond screenshots.

### Media Lightbox

Current owners include `src/components/media-lightbox.ts` and PhotoSwipe integration.

Responsibility: shared overlay/dialog presentation for the active contextual media source.

Required semantic rules:

- resolve active nested-deck slide before fallback to first media;
- preserve contextual caption identity;
- support image/video lifecycle;
- keyboard close/navigation where supported;
- correct focus management/restoration;
- no background focus leakage;
- no second media identity/catalog.

Visual evidence: image/video, structured caption, navigation, focus and mobile state.

## Shared runtime contracts

### Motion Preference

Owner: `src/components/motion-preference.ts`.

Responsibility: one shared authority for reduced-motion preference.

Rules:

- motion-capable components consume shared preference;
- reduced-motion preserves content and core interaction;
- components must not invent conflicting private reduced-motion policies.

### Infinite Reel Runtime

Owner: `src/components/infinite-reel.ts`.

Responsibility: continuous motion lifecycle for explicitly authored infinite-reel surfaces.

Rules:

- attach only to compatible authored rails;
- deterministic initialize/teardown;
- no duplicate animation loops/listeners;
- reduced motion disables/simplifies autonomous motion while preserving item access;
- DOM reading order remains canonical.

### Media Deck Runtime

Owners include `src/components/media-deck.ts` and adapter code such as `embla-deck.ts` where used.

Responsibility: shared active-slide navigation, autoplay and caption synchronization for MediaSlider, MockupDeck and embedded surface decks.

Rules:

- one active-slide authority;
- manual controls remain available;
- autoplay semantics remain `off | forward | ping-pong`;
- `advanceOnEnded` is explicit;
- active nested slide is discoverable by lightbox;
- teardown removes timers/listeners and avoids duplicate initialization.

### Media Caption Numbering

Owner: `src/components/media-caption-numbering.ts`.

Responsibility: derived numbering/presentation support.

Boundary: must never become a second authored caption identity or override contextual MediaEntry metadata.

Target: retain as a derived utility only while required; retire if canonical render-time numbering makes it redundant.

### Lightbox Runtime

Visual contract is Media Lightbox. Runtime may use native dialog fallback and/or PhotoSwipe, but both implementations must satisfy one semantic contract for active source, caption, focus and media lifecycle.

## Specialized runtime ownership rule

PageFlip, AnimatedCanvasGallery, Jestei Theme and Awful Cases Game keep runtime behavior with their visual owner because their interaction/motion responsibility is inseparable from the component itself.

Do not split them into fake generic engines merely to increase abstraction count.

## Evidence rule

Runtime contracts are verified primarily through behavioral evidence:

- contract/unit tests;
- browser interaction checks;
- reduced-motion checks;
- pointer/keyboard/input checks;
- teardown/reinitialization checks;
- active source/state synchronization.

Screenshots are only visual evidence. They do not prove timers, focus restoration, autoplay semantics or teardown correctness.

## Implementation base

Like the architecture specs, this document does not authorize implementation from the documentation branch. Implementation starts only from the final media-normalization `PRE_APPLY_READY_SHA`.
