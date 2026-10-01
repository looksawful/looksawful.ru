# UI surface inventory — 2026-09-30

Status: **source-complete first pass / live browser measurements pending**

Scope: public looksawful.ru UI surface on current `dev`, with production-backed Storybook/system contracts as supporting evidence. This pass inventories interactive and compact-label families before any primitive migration.

## Evidence

Primary repository owners reviewed:
- `src/site/shell/navigation.ts`
- `src/styles/site-navigation.css`
- `src/components/project-navigation.ts`
- `src/styles/project-navigation.css`
- `src/templates/project-card.ts`
- `src/styles/components.css`
- `src/templates/subproject-card.ts`
- `src/styles/subproject-cards.css`
- `src/templates/media-slider.ts`
- `src/styles/slider.css`
- `src/styles/media-deck.css`
- `src/templates/page-flip.ts`
- `src/styles/page-flip.css`
- `src/components/media-lightbox.ts`
- `src/styles/media-lightbox.css`
- `src/templates/before-after.ts`
- `src/styles/before-after.css`
- `src/components/content/code-block.ts`
- `src/styles/code-block.css`
- `src/components/contact-form-hub.ts`
- `src/styles/contact-form-hub.css`
- `src/components/site-analytics-consent.ts`
- `src/styles/site-analytics-consent.css`
- `src/components/portfolio-pet.ts`
- `src/styles/portfolio-pet.css`
- `src/components/berserk-audio-player.ts`
- `src/components/animated-canvas-gallery.js`
- `src/components/specialized/jestei-track-filter.ts`
- `docs/storybook/state-and-visibility-model.md`
- `docs/superpowers/specs/2026-09-04-ui-kit-token-component-traceability.md`

Standards baseline:
- WCAG 2.2 Target Size (Minimum): https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum
- WCAG 2.2 Focus Appearance: https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance
- WAI-ARIA APG Button: https://www.w3.org/WAI/ARIA/apg/patterns/button/
- WAI-ARIA APG Tabs: https://www.w3.org/WAI/ARIA/apg/patterns/tabs/

Live visual/runtime inspection is not yet authoritative in this pass because Opera Browser Connector was disconnected. Do not infer contrast ratios or final rendered hit-box geometry from CSS alone where runtime/container geometry can change the result.

## Inventory

| Family | Current surfaces | Semantics | Cross-device behavior | Review |
| --- | --- | --- | --- | --- |
| Site navigation toggle | Awfulface menu button | native button, disclosure | 3.5rem fine pointer; 4rem coarse pointer; safe-area aware | Strong. Clear native semantics and coarse-pointer sizing. |
| Site navigation links | menu links, breadcrumbs | anchors | mobile menu recenters/full-width; hover preview only on fine pointer | Strong semantics. Visual link grammar intentionally differs from inline content links. |
| Project navigator | project anchors + “Наверх” | anchors + `aria-current` | horizontal reel/fixed bottom on narrow; left rail on very wide; 2.75rem top target on narrow | Behavior is thoughtful. Project-link hit area needs browser measurement against 24px minimum. |
| Primary CTA link | “Подробнее о проекте” | anchor styled as action | full-width narrow, fit-content >50rem | Strong primary action grammar. Keep separate from buttons semantically. |
| Project cards | full-card project anchors | anchors | full surface target; responsive caption grid; fine-pointer hover only | Strong. Large target and clear structural affordance. |
| Subproject / pet cards | full-card anchors | anchors | container-responsive; hover/focus media treatment; reduced-motion override | Strong, but focus visual treatment should not rely mainly on media zoom. |
| Inline editorial links | project intro, content links | anchors | normal text flow | Good default because base links retain underline. |
| Resource actions | `.resource-row__action` | anchor | compact low-emphasis row action | Weak affordance/target risk: tiny text and no dedicated state/size contract. |
| Slider controls | prev / count / next | native buttons + live count | 1.75rem controls | Semantics good; 28px target clears WCAG 2.5.8 minimum. Style is another independent control grammar. |
| Media deck controls | toolbar buttons + dots | buttons | buttons 2rem high; dots 1.5rem square; track/grab + grid variants | Dots are exactly 24px minimum. Focus treatment is thin and should share a canonical focus token. |
| Page Flip controls | prev / count / next | native buttons | 2.125rem circular controls; disabled state; responsive book | Good semantics and size. Focus outline is thinner than global convention. |
| Media lightbox triggers | media surfaces promoted to `role=button` | custom button semantics with tabindex + Enter/Space + dialog intent | full media surface target; PhotoSwipe controls adapt portrait/landscape/coarse pointer | Good custom-role implementation. Keep keyboard contract protected; prefer no extra nested interactive ambiguity. |
| Media lightbox controls | prev / next / close | buttons | 2.5rem circular controls; safe-area aware; coarse portrait/landscape layouts | Strong. One of the better-defined control families. |
| Code copy | “Copy” | native button | tiny text-only target | **Defect candidate:** visual target is substantially smaller than canonical controls and likely under 24px without a spacing exception. |
| Before/After | full overlay range, visible handle, “before/after” labels | native range; labels noninteractive | full-surface pointer target; keyboard focus outlines viewport | Strong semantics. The rounded labels are labels, not chips. |
| Moves tabs | horizontal tablist + tab buttons | ARIA tabs | horizontal reel on narrow; selected underline; Left/Right keyboard implemented | Good specialized tabs. Verify full APG Home/End/manual-vs-auto behavior before canonical Tabs extraction. |
| Contact hub launcher/panel | launcher, close, collapse, submit, fields | native buttons/form controls | desktop floating panel; <=42.5rem bottom sheet; safe areas; short-height/reduced-motion/forced-colors handling | Strongest coherent control subsystem. Good candidate to inform shared control tokens, not to be blindly copied. |
| Analytics consent panel | privacy link + grant/deny buttons | link + native buttons | fixed compact panel; mobile expands horizontally | Semantics good. Typography/shape/state grammar is isolated from other site controls. |
| Portfolio pet | large draggable launcher + dismiss/restore | custom pointer/keyboard surface + buttons | scaled down on mobile; hidden when contact sheet opens | Specialized interaction. Dismiss/restore sizes clear 24px; preserve as exception, not primitive baseline. |
| Berserk audio | play toggle, sound toggles, progress bar, volume range | buttons/range plus pointer-only progress div | compact monospace island | **Defect:** seek progress is pointer-only `div`; no keyboard/role/value semantics. Replace with native range or equivalent slider semantics. |
| Awful Cases controls | start/restart + mobile directional controls + focusable canvas | native buttons + specialized game controls | island-specific mobile controls | Keep specialized. Do not normalize visual style into portfolio primitives; only normalize accessibility contracts. |
| Jestei filter controls | top toggle, tag chips, key segments | buttons + custom role=button SVG segments | embedded product-demo behavior | Keep project-local visual language. Chips here prove a real interactive Chip semantic, not a portfolio-wide visual default. |
| Badge | subproject-card badge | noninteractive annotation/status | attached to card media | Real Badge candidate. Needs canonical size/type/color owner. |
| Metadata labels | project role/period, counts, before/after labels | noninteractive text | contextual | Do not rename every small text token “badge”. Preserve semantic labels/counters. |
| Chip | Jestei filter tag chips | interactive filter/selection | specialized embedded surface | Real Chip semantic exists, but current visual treatment is project-local. |
| Tag | no clear reusable public main-site primitive found in first pass | descriptive metadata candidate | — | Do not implement a Tag wrapper until a public usage proves it. |
| Pill | no distinct semantic primitive found | shape only in current evidence | — | Eliminate as semantic component name unless later evidence proves a role. Rounded shape should be a variant/token. |
| Panels / overlays | site menu, lightbox, contact hub, analytics consent | disclosure/dialog/sheet/consent panel | each has its own responsive strategy | Semantics differ enough that they should not collapse into one generic Panel API. Share surface/inset/layer/focus tokens instead. |

## System findings

1. **Action semantics are mostly correct; visual grammar is fragmented.**
   Native anchors/buttons are used in the right places for most public surfaces. The main problem is that sizes, radii, focus outlines, selected states and hover treatments are independently defined across owners.

2. **There is no canonical Button primitive yet.**
   Current control heights include approximately 1.75rem, 2rem, 2.125rem, 2.5rem, 2.75rem, 3.5rem and 4rem, plus `--control-block-size`. This is too many unrelated size contracts for one site shell.

3. **Focus-visible is inconsistent.**
   Global focus uses `--border-width-200`; site-nav/lightbox/page-flip/media-deck have local 1px-style overrides. Normalize to a shared focus-ring contract, with local color only where needed.

4. **24px target-size floor should be explicit.**
   Media-deck dots sit exactly at 1.5rem/24px; slider/page-flip/lightbox are above it. Code Copy is the clearest likely miss. Project/resource text actions need rendered measurement before a pass/fail claim.

5. **Compact labels need semantic taxonomy before styling.**
   - Badge = noninteractive status/count/annotation.
   - Chip = compact interactive selection/filter token.
   - Tag = descriptive taxonomy/metadata.
   - Pill = visual shape, unless a distinct role is proven.
   - before/after capsules = labels, not chips.
   This matches issue #1112 and avoids four rounded rectangles masquerading as four components.

6. **Specialized islands should not be visually homogenized.**
   Moves, Berserk, Awful Cases and Jestei filter are authored project demonstrations. Share accessibility, focus, target-size and state contracts; preserve their art direction.

7. **Responsive implementation is generally component-aware rather than breakpoint-global.**
   Navigation uses pointer capability and height/width conditions; contact hub becomes a bottom sheet; lightbox changes layout by pointer/orientation; project navigation uses container queries; cards use container queries. This is a strength and should remain.

8. **ARIA custom controls need strict behavioral evidence.**
   Media lightbox triggers satisfy Enter/Space. Moves tabs support Left/Right. Jestei custom key segments and any future role-based controls must continue to satisfy the keyboard behavior promised by their role.

## Priority defects / risks

### P0 — correctness/accessibility
- Berserk seek progress: pointer-only `div`; replace with native `input[type=range]` or complete ARIA slider semantics + keyboard/value exposure.
- Verify any other clickable non-native surfaces found during live browser crawl have keyboard/role/value parity.

### P1 — system consistency
- Code Copy: increase hit area to canonical compact-control minimum while retaining text-link-like appearance.
- Introduce one focus-ring contract and remove weaker local copies unless a documented exception exists.
- Define canonical compact control sizes with a hard >=24px interactive floor; prefer a larger touch size for primary mobile controls.
- Canonicalize Button/action tokens without converting anchors that navigate into buttons.
- Canonicalize Badge/Chip/Tag semantics; do not create Pill as a duplicate component by default.

### P2 — visual/UX refinement
- Strengthen Resource Action affordance and target area.
- Reconcile active/selected visual language: `aria-current`, `aria-selected`, `aria-pressed`, active audio, tab underline.
- Keep specialized project islands visually distinct but align focus/disabled/keyboard behavior.

## Device review matrix

Required browser evidence before closing the inventory:
- 1440×1000 fine pointer
- 834×1112 touch/tablet
- 390×844 coarse pointer/mobile
- short-height landscape phone
- keyboard-only path
- reduced motion
- forced colors for shared controls where supported

Measure per interactive control:
- rendered hit box;
- focus visibility;
- hover-only dependencies;
- selected/pressed/current distinction;
- overflow/clipping;
- safe-area collisions;
- text truncation/wrapping;
- horizontal-scroll usability;
- touch-action and gesture conflicts.

## Next implementation order

1. Close live-browser measurement gaps and append exact failures to this inventory.
2. Finish #1112 semantic inventory.
3. Implement #1113 Button against shared action/focus/size tokens.
4. Implement #1114 compact-label family, with Pill demoted to shape variant unless evidence changes.
5. Reconcile canonical Tabs from real Moves/Jestei behavior rather than inventing a second API.
6. Migrate only obvious duplicates; keep specialized islands explicit.
7. Verify Storybook + browser + keyboard + a11y at the canonical viewport matrix.
8. Reconcile #1118 / #861 and Asana UI molecules task.



## Methodology reinforcement — 2026-10-01

This section records the research basis for finishing the live-browser pass without changing the inventory's production-first authority model.

### Primary standards

- WCAG 2.2 Target Size (Minimum), SC 2.5.8: interactive targets should be at least 24×24 CSS px unless an explicit spacing/equivalent/inline/user-agent/essential exception applies.
  - https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum
- WCAG 2.2 Focus Visible, SC 2.4.7: keyboard-operable UI requires visible focus.
  - https://www.w3.org/WAI/WCAG22/Understanding/focus-visible
- WCAG 2.2 Focus Not Obscured (Minimum), SC 2.4.11: focused components must not be fully hidden by author-created UI.
  - https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum
- WCAG 2.2 Reflow, SC 1.4.10: content should remain usable without two-dimensional scrolling at the specified 320 CSS px equivalent, except genuinely two-dimensional content.
  - https://www.w3.org/WAI/WCAG22/Understanding/reflow.html
- WAI-ARIA APG Button/Link: action vs navigation remains a semantic boundary; prefer native button/anchor elements.
  - https://www.w3.org/WAI/ARIA/apg/patterns/button/
  - https://www.w3.org/WAI/ARIA/apg/patterns/link/
- WAI-ARIA APG Tabs: a real tablist is a single-panel-switching widget with defined keyboard focus/activation behavior; route navigation must not be renamed Tabs for visual similarity.
  - https://www.w3.org/WAI/ARIA/apg/patterns/tabs/
- WAI-ARIA APG Slider / Media Seek Slider: a seek control needs focusability, min/max/current value exposure and keyboard value changes; a pointer-only progress div is not sufficient.
  - https://www.w3.org/WAI/ARIA/apg/patterns/slider/
  - https://www.w3.org/WAI/ARIA/apg/patterns/slider/examples/slider-seek/
- WAI-ARIA APG Tooltip: tooltip content is supplemental, does not receive focus, remains associated with its trigger, and Escape dismisses it; essential content must not exist only there.
  - https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/

### Test/evidence policy

- Storybook accessibility checks are useful first-line automation but do not replace manual assessment.
  - https://storybook.js.org/docs/writing-tests/accessibility-testing
- Storybook interaction tests should exercise real production-backed states instead of static screenshots alone.
  - https://storybook.js.org/docs/9/writing-tests/interaction-testing
- Playwright + axe can scan rendered page states, but the Playwright docs explicitly recommend automated + manual accessibility assessment together.
  - https://playwright.dev/docs/accessibility-testing
- Visual baselines must be deterministic. Playwright warns that host OS/browser/settings/hardware can affect screenshot output.
  - https://playwright.dev/docs/test-snapshots
- Prefer visual/interaction tests to large DOM snapshots for UI appearance and behavior.
  - https://storybook.js.org/docs/writing-tests/snapshot-testing

### Audit matrix for each interactive surface

Record one row per real production usage, not per CSS class name:

1. route / surface / owner;
2. semantic role and native element;
3. navigation vs action vs selection vs status vs metadata;
4. actual rendered target size at required viewports;
5. default / hover / focus-visible / active / disabled / selected/current/pressed states where meaningful;
6. keyboard contract;
7. touch/coarse-pointer behavior;
8. reduced-motion behavior;
9. forced-colors/high-contrast behavior where relevant;
10. text expansion, wrapping, 200% zoom and reflow;
11. token/radius/spacing/focus owner;
12. duplicate visual grammar;
13. Storybook state coverage;
14. defect / keep-specialized / canonical-candidate / migration-candidate classification.

### External skill evaluation (omgskills catalog)

The external skills below are optional accelerators only. They do not override repository evidence, W3C, production code or current issues.

**Useful**
- `JPeetz/agent-skills:accessibility-compliance-audit` — focused WCAG 2.2 AA audit. Best used as an independent accessibility pass after the source/live inventory.
- `szilu/ux-designer-skill:ux-designer` — useful for the qualitative UX/usability pass after objective semantics and runtime measurements are recorded.
- `Ashutos1997/claude-design-auditor-skill` — broad second-opinion pass across ARIA, focus, contrast, tokens, responsive, motion, spacing and states. Use to challenge omissions, not as canonical scoring.
- `jovd83/design-fidelity-auditor` — potentially useful for token/spacing/state drift checks after canonical primitives exist.

**Low value / redundant for this repo**
- `Dragoon0x/dragoon-skills:inventory` — generic heuristic file inventory. This repository already has a source-complete hand-reviewed inventory plus `lab:inventory`; running another filename heuristic would add noise rather than authority.
- `Dragoon0x/dragoon-skills:storybook` — scaffolding-oriented and unnecessary because this repository already owns a custom production-backed Lab/Storybook system.
- PostHog visual-review triage skill — only relevant if PostHog Visual Review is actually adopted; current repo evidence uses its own review/Playwright/Storybook contracts.

### Current research conclusion

The source inventory is already sufficiently mature to move into **live rendered verification**, not another source-only taxonomy exercise.

Do not redesign primitives yet. First close the evidence gaps:
- render and measure 1440×1000, 834×1112, 390×844 and short-height landscape;
- keyboard-only walkthrough;
- reduced-motion pass;
- forced-colors/high-contrast pass where applicable;
- exact failures appended to this inventory and linked to existing #1113–#1118 or new issues only when no owner exists.

After that evidence pass, #1112 can be considered complete and the primitive implementation stream can begin.
