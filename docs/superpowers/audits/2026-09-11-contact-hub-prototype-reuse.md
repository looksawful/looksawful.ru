# Contact Hub prototype reuse audit

Date: 2026-09-11
Status: normative implementation guidance, subordinate to the canonical product contract.

Reviewed artifacts:
- `contact-hub-pet-prototypes-v2.html`
- `contact-hub-pet-integrated-v3.html`
- `contact-hub-venus-minimal-v7.html`
- AI Portfolio Pet UI Showcase reference

## Important finding

The old HTML prototypes do **not** contain a real Yandex/model transport. Their AI interaction is simulated by local view changes and timers. Therefore no provider/network implementation is reused from them. Reuse is limited to user-visible interaction contracts, state ideas and selected layout techniques.

## Reuse: KEEP / ADAPT

### 1. Shared entry routing

Keep the behavior already demonstrated in v2/v3:
- pet primary entry -> shared Contact Hub in `ai` mode;
- site CTA -> the same Hub in `form` mode;
- mode switching does not create a second shell.

This maps directly to the canonical `ContactHubState` domain.

### 2. One-action direct contact from AI/pet path

Keep the explicit `написать напрямую` affordance shown inside the AI surface. The production version must additionally expose direct Form access from the visible pet itself in one action.

### 3. Draft-first AI writer handoff

Keep the demonstrated flow:
`AI writer -> draft preview -> explicit user action -> Form`.

Do not transfer chat history, name or email automatically. If a Form draft already exists, never overwrite it silently.

### 4. Degraded AI state

Keep the v2 behavior concept:
- AI may be unavailable;
- prepared/local portfolio actions may remain available;
- direct Form remains available and independent.

This is a core fault-isolation contract.

### 5. Prepared/local actions before generation

Keep the prototype's explicit distinction between local actions and `free chat`.
Production deepens this into:
`prepared intent -> approved local answer -> narrow structured context -> generative fallback`.

The old labels such as `local / 0 tokens` are prototype diagnostics, not required production copy.

### 6. Focus lifecycle

Keep the demonstrated mechanics:
- explicit close control;
- Escape closes Hub on keyboard-capable layouts;
- focus returns to the opener when Hub closes;
- opening moves focus into the active mode intentionally.

Implementation must generalize opener return for both pet and site CTA, rather than always returning to the pet.

### 7. AI waiting / character synchronization

Keep the idea that assistant request lifecycle and pet animation lifecycle are coordinated:
- request pending -> quiet `thinking/waiting` UI state + Venus thinking/waiting state;
- response complete -> speaking/review/idle transition;
- failure -> recoverable error state.

Do not use fake progress percentages or perpetual `typing` when the model is actually computing.

### 8. Internal scroll containment

Keep selected layout techniques demonstrated by v3:
- Hub body owns its internal overflow;
- `overscroll-behavior: contain` for conversation/form surfaces where useful;
- composer/form actions remain reachable independently from underlying page scroll;
- safe-area padding is applied to the widget, not to the site layout.

### 9. Minimal visual language from v7

Keep as visual guidance, not exact CSS:
- site token reuse;
- thin separators instead of nested field cards;
- minimal text mode controls;
- chat can distinguish user/assistant without heavy bubbles;
- form can use editorial rows rather than SaaS inputs.

Exact v7 dimensions/viewport rules are not reusable because subsequent review found desktop/mobile geometry defects.

## Reuse: REJECT / SUPERSEDED

Do not carry forward:
- Awful Cases pet asset from v3;
- tiny CSS placeholder pet from v2;
- pet-owned independent panel;
- heavy scrim over the site;
- full-screen-only mobile Hub from v2/v3;
- fixed left/right shell geometry from the prototypes;
- hard-coded `580px`, `620px`, `23rem` style decisions as contracts;
- dashboard-like quick-action grids;
- status labels such as `online` when they do not affect user decisions;
- duplicated `Contact Hub`, `Venus`, context/source/debug labels in production UI;
- black SaaS-style bubbles/buttons merely because they appeared in the prototype;
- `setTimeout()` as fake model transport;
- prototype view state as a substitute for the production domain state modules;
- direct mutation of Form fields during AI handoff without an explicit merge/replace policy.

## Useful production state map extracted from prototypes

The old prototypes imply a good user-result state composition, but production should split ownership:

```text
Pet runtime
idle | hover/focus | dragging | temporarily-hidden | thinking | success | error

Contact Hub
closed | open | collapsed
  x
ai | form

AI request
idle | prepared-answer | waiting | response | error

Form delivery
editing | invalid | sending | success | error
```

These state dimensions are orthogonal. Avoid one giant enum containing every cross-product combination.

## Implementation consequence

The current frontend plan remains valid. This audit strengthens Tasks 6-11 with proven prototype behavior, but does not justify copying prototype markup/CSS wholesale. In particular:
- Task 6 may reuse hover-hint and pet-state coordination concepts;
- Task 7 should reuse focus/open/close results, not prototype shell geometry;
- Task 8 should reuse internal form-flow and failure-preserves-input behavior;
- Task 9 should reuse prepared/local vs generative distinction and quiet waiting state;
- Task 10 should implement the newer collapsible mobile-sheet contract instead of old fullscreen behavior;
- Task 11 should reuse explicit draft handoff semantics.
