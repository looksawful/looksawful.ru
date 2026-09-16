# Contact Hub + Awful Pet Product Contract

Status: **CANONICAL PRE-IMPLEMENTATION CONTRACT**

Date: 2026-09-11

Owners: #746 (shared Contact Hub + direct form), #709 (AI pet/assistant), #715 (writer/handoff), #170 (analytics/privacy)

This document supersedes prototype-specific assumptions from Contact Hub prototypes v1-v7 and the temporary visual shell in PR #724 whenever they conflict with the requirements below. PR #724 remains useful architecture evidence for typed states, feature flags, local intent routing, character context, sprite manifest/runtime and approved knowledge boundaries. Its floating panel CSS, action grid and placeholder character rendering are not design authority.

## 1. Product definition

Contact Hub is one independent overlay widget with two modes:

- `ai`: portfolio assistant, opened by the Awful pet;
- `form`: direct message to Ivan, opened by the existing site contact CTA or a one-action direct-contact affordance on the pet.

The modes share one visual shell and lifecycle but keep data and backend contracts independent. The form is never gated by AI. The AI never silently receives form data. Chat history is never silently attached to delivered mail.

The default portfolio pet is **Awful**. Awful Cases characters are not valid substitutes for the default portfolio pet.

## 2. Non-negotiable boundaries

1. Root site remains the existing Vite + TypeScript/vanilla application on GitHub Pages.
2. Pet and Contact Hub are overlay widgets. They do not participate in the document layout and do not change the geometry of existing site content.
3. Existing authored site copy is not rewritten as part of structural/runtime implementation.
4. The existing large `Связаться со мной` CTA is preserved.
5. The intentional destination address is `i@lookawful.ru`. Never normalize the domain spelling.
6. Frontend implementation precedes backend implementation. Frontend tests use deterministic fake boundaries where network behavior must be exercised.
7. Production code is written only after a focused RED test exists for the behavior being implemented.
8. Tests assert user-visible or system-boundary outcomes, not CSS class names, internal function call counts or incidental DOM structure.
9. New tests follow `docs/testing-policy.md`; they do not enter `test:fast` automatically.
10. AI transport and direct-contact delivery are separate public backend namespaces and separate failure domains.

## 3. Canonical interaction model

### Entry points

- Site CTA -> Contact Hub opens directly in `form`.
- Pet primary action -> Contact Hub opens directly in `ai`.
- Pet direct-contact affordance -> Contact Hub opens directly in `form` in one user action.
- Collapsed mobile launcher -> restores the last Hub mode/state in one action.
- Mailto fallback remains available even when the widget/backend fails.

### Shared state model

The product-level states are observable states, not implementation class names:

- widget: `hidden`, `pet`, `hub-open`, `hub-collapsed`;
- pet: `idle`, `hover/focus`, `dragging`, `invite`, `opening`, `thinking`, `speaking/review`, `success`, `error`;
- hub mode: `ai`, `form`;
- AI request: `idle`, `thinking`, `answer`, `error`;
- form: `editing`, `validating`, `sending`, `success`, `error`.

A production state model may use different internal names, but every observable transition below must hold.

## 4. Product contracts

### P — global product behavior

- **P-001** Direct contact is always available even when AI is disabled, unavailable, rate-limited or broken.
- **P-002** AI is an enhancement, never a required step before direct contact.
- **P-003** Pet and site CTA open the same Contact Hub instance, not independent modal systems.
- **P-004** Switching `ai` <-> `form` keeps the Hub open.
- **P-005** Form draft survives mode switching and normal Hub close/reopen in the same tab.
- **P-006** AI conversation survives mode switching and mobile collapse/restore for the active session.
- **P-007** Form values are never silently inserted into AI context.
- **P-008** AI history is never silently inserted into email delivery.
- **P-009** AI -> form draft handoff requires an explicit visitor action and remains editable before submit.
- **P-010** The widget remains usable without analytics consent.
- **P-011** Feature-off mode leaves the existing site and direct mailto contact usable.
- **P-012** No product state can remove every path to `i@lookawful.ru`.

### W — widget isolation and geometry

- **W-001** Pet and Hub are fixed/overlay UI and do not change existing page flow geometry.
- **W-002** Opening, closing, dragging, collapsing, expanding, validation and success/error states do not create material layout shift in the underlying page.
- **W-003** Widget presence does not add document width or horizontal scrolling.
- **W-004** Existing navigation, project interactions, media/lightbox behavior and contact/footer remain functional while the widget is closed.
- **W-005** Underlying site geometry before and after opening the widget remains unchanged within a 1px measurement tolerance for stable reference elements.
- **W-006** Widget z-index rules are deterministic relative to site navigation and media overlays; users cannot become trapped behind two competing modal surfaces.
- **W-007** Removing/feature-disabling widget code restores the baseline site composition without compensating CSS.
- **W-008** The widget does not reserve blank space at the bottom or side of the document.
- **W-009** Resizing or rotating the viewport clamps widget geometry into the new visual viewport.
- **W-010** 200% browser zoom keeps every required control reachable.

### PET — Awful asset, size, motion and control

- **PET-001** Default character is canonical Awful.
- **PET-002** No Awful Cases asset is accepted as the default portfolio pet.
- **PET-003** Closed Awful is visually large and reads as a character, not a launcher icon.
- **PET-004** On a typical desktop viewport Awful occupies roughly 28-38% of viewport height unless a future approved visual spec narrows the range.
- **PET-005** On mobile Awful remains visually substantial in the closed state and is not reduced to a tiny FAB.
- **PET-006** Head, hair, hands, legs and footwear are not clipped by the widget viewport in normal idle/hover states.
- **PET-007** Transparent sprite background remains transparent.
- **PET-008** Idle motion loops without a visible discontinuity or baseline jump.
- **PET-009** Animation frames do not cause the character to drift across the screen.
- **PET-010** Hover/focus produces a short character reaction and returns to idle.
- **PET-011** Rare autonomous invite/special-idle actions are allowed but may not repeat aggressively.
- **PET-012** Autonomous animation does not run as an attention loop while the visitor is actively typing in Hub.
- **PET-013** `prefers-reduced-motion: reduce` disables or substantially reduces non-essential pet motion.
- **PET-014** Pet is a real accessible control with an understandable accessible name.
- **PET-015** Pet can be dragged by mouse/pointer.
- **PET-016** Pet can be dragged by touch.
- **PET-017** Drag does not simultaneously scroll/select the underlying page.
- **PET-018** A short click/tap opens the configured pet action; drag beyond threshold does not accidentally click-open Hub.
- **PET-019** After drag, enough of Awful remains inside the viewport to grab her again.
- **PET-020** Dragged position is clamped to safe viewport/safe-area bounds.
- **PET-021** Drag position survives navigation/reopen for the current session where technically safe.
- **PET-022** Invalid persisted coordinates are automatically clamped after resize/orientation change.
- **PET-023** Pet can be temporarily hidden with an explicit close control.
- **PET-024** On touch, a deliberate swipe-to-hide gesture may hide the pet; ordinary taps and scroll-adjacent movement must not.
- **PET-025** Temporary hide removes the pet from obstruction without clearing Hub/form/AI session data.
- **PET-026** Temporarily hidden pet can reappear after a non-aggressive cooldown when auto-return is enabled.
- **PET-027** Auto-return never occurs over an actively open Hub or competing modal/lightbox.
- **PET-028** User can explicitly disable future automatic pet return persistently.
- **PET-029** Persistent disable survives reload and navigation.
- **PET-030** Direct form remains reachable even when the pet is persistently disabled.
- **PET-031** Pet hover on hover-capable devices may show a short delayed hint.
- **PET-032** Hover hint disappears on pointer leave, drag start and Hub open.
- **PET-033** Hover hint is never the only way to discover direct contact.
- **PET-034** Touch-only devices do not depend on hover UI.
- **PET-035** Pet state cannot become stuck after rapid open/close/open or interrupted animation.

### H — shared Hub shell

- **H-001** Only one Contact Hub instance exists at a time.
- **H-002** Hub is closed by default.
- **H-003** Close control closes Hub in one action.
- **H-004** Escape closes Hub on keyboard-capable layouts unless a nested control has a stronger expected Escape behavior.
- **H-005** Closing never submits or clears draft/conversation.
- **H-006** Focus returns to the actual opener after close.
- **H-007** Mode switch clearly exposes active `ai` or `form` without relying only on color.
- **H-008** Mode switch is keyboard and touch accessible.
- **H-009** Shell is visually minimal: no decorative online dot, duplicated mascot title, dashboard chrome or nested card system without a user task.
- **H-010** Shell uses the existing site typography, surface, foreground, border, radius and elevated shadow semantics.
- **H-011** AI and form are visibly two states of the same shell.
- **H-012** Background site remains visible; no heavy blur/dimming is required.
- **H-013** Rapid repeated open actions never duplicate Hub.
- **H-014** Hub remains inside visual viewport after resize and zoom.
- **H-015** Hub can internally scroll when vertical space is insufficient; required controls must not be clipped by `overflow:hidden`.

### M — mobile shell and collapse behavior

- **M-001** Mobile uses a dedicated sheet/overlay composition, not a squeezed desktop panel.
- **M-002** Open form is fully usable on 320x568 minimum functional fallback and representative 360x800, 390x844, 430x932 viewports.
- **M-003** Required controls, current field and submit remain reachable with the virtual keyboard open.
- **M-004** Sheet respects bottom and lateral safe areas.
- **M-005** Sheet is based on stable dynamic/visual viewport geometry, not brittle `100vh` assumptions.
- **M-006** Appearing/disappearing Safari/Chrome browser chrome does not make the sheet visibly shake or repeatedly restart transitions.
- **M-007** Browser toolbar changes do not permanently crop sheet top/bottom.
- **M-008** Orientation changes recalculate valid geometry once and keep controls accessible.
- **M-009** Open Hub and large Awful do not overlap form fields or required controls.
- **M-010** Mobile Hub can be collapsed without losing state.
- **M-011** Collapse animates toward a screen edge and becomes a compact launcher.
- **M-012** Collapsed launcher uses a touch-friendly hit target and minimal visual footprint.
- **M-013** One tap restores the same Hub mode and content state.
- **M-014** Collapse/restore never creates a second Hub instance.
- **M-015** Collapse/restore does not change underlying page layout.
- **M-016** Collapsed launcher is clamped into safe viewport bounds.
- **M-017** Form scroll/AI history are preserved to a reasonable position across collapse/restore.
- **M-018** Landscape mobile remains usable even with reduced vertical space.

### F — direct form UX and validation

Form v1 fields are `name`, `email`, `message`, optional attachment. `name` is optional; `email` and `message` are required. This supersedes older issue wording that marked name required.

- **F-001** Visible persistent labels exist for name, email and message.
- **F-002** No phone, Telegram, company/title, budget, deadline or mandatory inquiry category fields.
- **F-003** Name is optional.
- **F-004** Email is required.
- **F-005** Message is required.
- **F-006** Valid Unicode names and messages are accepted.
- **F-007** Leading/trailing email whitespace is safely normalized.
- **F-008** Obvious invalid email syntax is rejected before network send.
- **F-009** Empty/whitespace-only message is rejected.
- **F-010** Message maximum is 5000 characters.
- **F-011** Character counter is not persistent clutter; it appears near the configured threshold (target 80%) or limit.
- **F-012** Errors are not shown before meaningful interaction.
- **F-013** Invalid field can show a local error on blur.
- **F-014** Submit reveals all remaining validation errors.
- **F-015** Correcting a field removes its invalid state without requiring another submit.
- **F-016** Error text is programmatically associated with its field.
- **F-017** First invalid field can receive focus after failed submit.
- **F-018** Browser/mobile autofill semantics are provided for name and email.
- **F-019** Email uses an email-appropriate mobile input mode/type.
- **F-020** Message supports multiline text and preserves line breaks through delivery.
- **F-021** User-provided markup is treated as text, not executable HTML.
- **F-022** Form is visible and usable in full whenever `form` mode is open; nothing required is permanently clipped.
- **F-023** If viewport height is insufficient, form content scrolls inside the widget while close/mode access remains possible.
- **F-024** Submit is reachable on every supported viewport and with keyboard visible.
- **F-025** Close is easy to reach on every supported viewport.
- **F-026** Form draft persists in `sessionStorage` for the current tab only.
- **F-027** Closing Hub, switching mode and reloading the same tab preserve text draft.
- **F-028** Successful confirmed submit clears the text draft.
- **F-029** Attachment bytes are never persisted in sessionStorage.
- **F-030** Reload after attachment selection honestly requires re-selection of the file.

### A — attachment UX

- **A-001** Accepted formats are PDF and images defined by an explicit MIME allowlist.
- **A-002** Unsupported type is rejected before submit with a clear message.
- **A-003** Target maximum attachment size per submission is 20 MB.
- **A-004** Oversize attachment is rejected without clearing text fields.
- **A-005** Selected filename is visible to the visitor.
- **A-006** Selected attachment can be removed before submit.
- **A-007** Replacing attachment works without resetting text fields.
- **A-008** Upload failure preserves form text and allows retry/reselection.
- **A-009** Attachment is never published as an unauthenticated public object.
- **A-010** Direct email delivery uses a temporary signed/private download link rather than trying to exceed Postbox attachment limits.
- **A-011** Temporary object expires and is lifecycle-deleted according to backend policy.

### S — form send, success, failure and fallback

- **S-001** Invalid form causes no send request.
- **S-002** Valid form creates one logical submission.
- **S-003** Double click/tap cannot create duplicate logical submissions.
- **S-004** Pending state is visible and is not mistaken for success.
- **S-005** Success state appears only after confirmed backend acceptance.
- **S-006** Network/server failure never displays success.
- **S-007** Server failure preserves name/email/message.
- **S-008** Failure provides retry.
- **S-009** Failure provides mailto fallback to `i@lookawful.ru`.
- **S-010** Mailto fallback uses the fixed contact subject and may prefill message body safely.
- **S-011** Success contains a way to start another message and close Hub.
- **S-012** Success copy makes no response-time SLA promise.
- **S-013** Timeout/ambiguous network result is handled with idempotency-safe retry semantics.
- **S-014** One accepted submission results in exactly one primary delivery action.
- **S-015** One accepted submission results in one visitor receipt; failed submission produces no success receipt.

### AI — assistant and prepared-answer economy

Response priority is normative:

`known UI action -> prepared intent -> small approved structured context/template -> Yandex generation`.

- **AI-001** No model request occurs merely because the pet/Hub was opened.
- **AI-002** Common quick actions resolve locally when their answer is deterministic.
- **AI-003** Most common portfolio questions have approved prepared answers.
- **AI-004** Prepared answers are stored in a canonical content/domain layer, not duplicated across UI components.
- **AI-005** Natural-language variants can resolve to the same prepared intent as the equivalent quick action.
- **AI-006** RU and EN intent variants are supported where the site exposes those languages.
- **AI-007** Moderate typo tolerance may still resolve a known intent, but ambiguous/low-confidence input falls through instead of guessing.
- **AI-008** A prepared intent produces zero generative-model requests.
- **AI-009** Prepared answer remains usable when Yandex AI is down.
- **AI-010** Complex/free-form query may fall through to Yandex generation.
- **AI-011** Generation receives only minimum relevant approved context, not the entire knowledge base by default.
- **AI-012** Unknown owner facts are not invented.
- **AI-013** Form name/email/message/attachment are never automatic model context.
- **AI-014** Existing chat history is bounded/selected; irrelevant history does not grow prompt without limit.
- **AI-015** Input/output token budgets are bounded server-side.
- **AI-016** While a generated answer is pending, UI displays a simple muted `thinking` state.
- **AI-017** Thinking animation is calm, continuous and does not claim fake progress.
- **AI-018** Thinking reserves stable answer space enough to avoid a large layout jump on completion.
- **AI-019** Thinking clears on success, error and timeout.
- **AI-020** Reduced motion has a static/minimal thinking representation.
- **AI-021** Awful may enter a waiting/thinking state, but pet animation and UI loader do not compete for attention.
- **AI-022** User can always switch to direct form while AI is thinking or failing.
- **AI-023** AI timeout/error preserves conversation and exposes recoverable state.
- **AI-024** Free-form output is rendered safely as content, not executable arbitrary HTML.
- **AI-025** Screen readers receive complete meaningful response updates, not noisy per-character announcements.

### DR — drag, hide and gesture discrimination

- **DR-001** A configurable movement threshold distinguishes click/tap from drag.
- **DR-002** Pointer drag and touch drag share the same product result.
- **DR-003** Drag end cannot strand the pet outside the usable visual viewport.
- **DR-004** Drag start suppresses hover hint.
- **DR-005** Touch drag on pet prevents page scroll only while the gesture is owned by the pet; normal page scroll elsewhere remains intact.
- **DR-006** Swipe-to-hide uses direction/distance/velocity thresholds that do not collide with ordinary drag repositioning.
- **DR-007** Temporary hide and persistent disable are distinct user intents and distinct persistence outcomes.

### V — visual/system consistency

- **V-001** Widget uses Inter Variable via existing site font system.
- **V-002** Widget inherits current site surface/foreground semantics.
- **V-003** Borders use existing semantic border contrast.
- **V-004** Shell radius is consistent with the existing shell token unless a later approved design spec explicitly changes the token itself.
- **V-005** Elevated shadow is no heavier than the existing site elevated shadow contract.
- **V-006** Form is primarily structured by typography, spacing and thin rules rather than nested filled controls.
- **V-007** User/AI messages are distinguishable without requiring heavy chat bubbles.
- **V-008** Submit has more emphasis than attachment/fallback without introducing an unrelated SaaS button language.
- **V-009** Awful remains the expressive visual element; shell motion stays restrained.
- **V-010** No decorative online dot/status chrome exists unless it communicates a real service state the visitor can act on.

### AX — accessibility and input

- **AX-001** WCAG 2.2 AA is the target contract.
- **AX-002** All required actions work with keyboard only.
- **AX-003** Focus order is logical.
- **AX-004** Opening Hub puts focus in a sensible mode-specific target.
- **AX-005** Closing returns focus to opener.
- **AX-006** Hidden/inactive views are not focusable.
- **AX-007** Visible focus indicator follows existing site focus semantics.
- **AX-008** Close, submit, AI send, launcher and mode controls expose understandable accessible names.
- **AX-009** Touch-important controls have an effective target around 44x44 CSS px where a physical button target is required.
- **AX-010** UI does not depend on hover.
- **AX-011** Error, pending and success states are announced appropriately without repetitive noise.
- **AX-012** Decorative sprite frames are hidden from screen readers while the pet control itself remains named.

### MV — mobile visual viewport stability

- **MV-001** Mobile sheet is fully contained by the current visual viewport.
- **MV-002** Dynamic browser chrome does not permanently crop or materially shake the sheet.
- **MV-003** Safe-area insets are respected.
- **MV-004** Virtual keyboard does not make the focused field or submit unreachable.
- **MV-005** Browser chrome/keyboard resize does not repeatedly restart collapse/open animation.
- **MV-006** Automated Chromium emulation is not represented as proof of real iOS Safari browser-chrome behavior; real-device/manual evidence is required before release for that risk.

### PRV — privacy

- **PRV-001** Form works with analytics denied.
- **PRV-002** Name, email, message, filename and attachment content are never analytics goal parameters.
- **PRV-003** IP/fingerprint/Webvisor/session identifiers are not copied into delivered mail.
- **PRV-004** Shared `ContactContext` contains only safe UI context such as page, language, entry point and mode.
- **PRV-005** AI and form maintain separate private data boundaries.
- **PRV-006** Privacy page is updated before production release to describe form processing, Yandex services and temporary attachment retention.

### AN — analytics

- **AN-001** Existing `contact_email` remains the mailto goal.
- **AN-002** `contact_form_open` fires only for meaningful form opening according to the final analytics adapter contract.
- **AN-003** `contact_form_submit` fires only after confirmed backend success.
- **AN-004** Validation error, failed request and AI-only usage never produce `contact_form_submit`.
- **AN-005** Duplicate UI submits cannot generate duplicate conversion events for one logical submission.
- **AN-006** Production analytics suppression in localhost/preview remains consistent with repository policy.

### SEC — security and abuse boundaries

- **SEC-001** No Yandex/Postbox/provider secret ships in frontend bundle.
- **SEC-002** Visitor cannot choose arbitrary delivery destination.
- **SEC-003** User text cannot inject mail headers.
- **SEC-004** Server validates required fields, caps and attachment MIME/size independently of client validation.
- **SEC-005** Contact endpoint cannot function as an open mail relay.
- **SEC-006** Public endpoints use CORS allowlist, payload caps, timeout and rate limits.
- **SEC-007** Human path does not require visible CAPTCHA by default.
- **SEC-008** Honeypot/rate-limit protection does not break accessibility or ordinary retry.
- **SEC-009** Error responses do not disclose provider secrets/config internals.
- **SEC-010** Untrusted AI input/retrieval content cannot escalate tools or permissions.

### PERF — performance and loading

- **PERF-001** Closed pet/Hub causes no material CLS.
- **PERF-002** Closed widget does not change the page LCP element by design.
- **PERF-003** Heavy AI/game assets are not required for first render.
- **PERF-004** No AI request occurs before explicit visitor action.
- **PERF-005** No Object Storage request occurs before an attachment flow needs it.
- **PERF-006** Closed Hub does not run continuous expensive work.
- **PERF-007** Background tab does not keep high-frequency cosmetic animation/network loops active.
- **PERF-008** Prepared answers avoid unnecessary model/token cost.

## 5. Direct-contact backend target contract

Backend implementation is a later phase. Target architecture to validate:

- `/api/contact/send` — submission orchestration;
- `/api/contact/attachment-upload` — authorizes temporary private upload;
- Yandex API Gateway / Cloud Function;
- Yandex Postbox for transactional delivery;
- private Yandex Object Storage for temporary attachment objects;
- lifecycle deletion, target retention around 7 days unless legal/privacy review changes it;
- no persistent submissions database;
- no admin inbox UI;
- fixed destination `i@lookawful.ru`;
- verified service sender, target `forms@lookawful.ru` or another verified service identity;
- visitor email only in `Reply-To` and auto-receipt target;
- subject `LOOKSAWFUL — новое сообщение`;
- idempotency protection around delivery.

The 20 MB UX target requires direct browser -> private Object Storage upload with a temporary signed download link in email; Cloud Function request body and Postbox attachment size are not the transport for the binary.

## 6. AI backend target contract

AI backend remains independent:

- `/api/assistant/chat` or equivalent narrow public assistant endpoint;
- prepared/deterministic answers resolve before generative boundary;
- approved knowledge only;
- bounded context/token budgets;
- no provider secret in client;
- no form PII automatically added to prompts;
- no dependency on private `awful-control` control plane for visitor runtime.

## 7. Browser/viewport acceptance matrix

Automated affected Chromium evidence:

- 1440x900 desktop;
- 1280x800 desktop;
- 1024x768 compact desktop/tablet landscape;
- 768x1024 tablet portrait;
- 430x932 large phone;
- 390x844 common phone;
- 360x800 narrow phone;
- 320x568 minimum functional fallback.

Compatibility target: Firefox desktop, WebKit/Safari, Mobile Safari and Android Chrome. Per repository policy, Chromium automation does not prove Safari/WebKit compatibility. Mobile browser chrome/safe-area behavior requires focused real-browser/manual evidence before release.

## 8. Test philosophy and classification

### Main executable RED tests created before implementation

Main tests are broad acceptance/contract proofs. They are not `test:fast` by default.

1. `tools/e2e/contact-hub-acceptance.mjs` — AFFECTED browser acceptance for entry, isolation, geometry, mobile collapse, drag, keyboard and form/AI shell behavior.
2. `test/contact-hub-domain-contract.test.mjs` — candidate CONTRACT for stable domain decisions: entry modes, form validation, prepared-answer routing and privacy-safe shared context. It remains outside `test:fast` until GREEN and KEEP review.

### Just-in-time TDD tests during implementation

Do not pre-create hundreds of implementation-shaped tests. For each plan task:

1. choose one unimplemented observable behavior from this spec;
2. write the smallest focused failing test;
3. run it and confirm expected RED;
4. implement minimum production behavior;
5. run focused test to GREEN;
6. refactor only while GREEN;
7. classify test KEEP/MOVE/DELETE before phase completion.

Browser-only risks stay in AFFECTED/FULL. Temporary reproduction tests are deleted. Cheap stable domain invariants may become CONTRACT.

## 9. Pre-implementation audit gate

Frontend implementation may begin only after all five audit domains have produced written findings and the owner has a reconciled plan:

1. **Architecture audit** — boundaries, state ownership, data flow, PR #724 reuse/supersession.
2. **TDD/test audit** — requirement coverage, false implementation coupling, tier classification, missing RED cases.
3. **CSS/responsive audit** — site tokens, widget isolation, mobile visual viewport, drag/collapse geometry, z-index and reduced motion.
4. **Issues/repository audit** — #709/#710/#711/#712/#714/#715/#746/#170 ownership, stale contradictions, PR #724 merge/rebase strategy.
5. **Documentation audit** — Notion Projects 114/116, repo specs/plans, privacy/analytics docs, site copy ownership and release checklist.

Each audit returns: findings, blockers, proposed changes, tests affected, and `GO / GO WITH FIXES / NO-GO`.

## 10. Frontend Definition of Ready

Frontend implementation is READY only when:

- this spec exists and is the canonical source of truth;
- frontend implementation plan maps every requirement family to tasks/tests;
- main acceptance and domain test files exist and are syntactically valid;
- expected RED state is recorded for behavior not yet implemented when runnable infrastructure is available;
- PR #724 reuse/supersession strategy is explicit;
- 5 audit work packets are complete and reconciled;
- no unresolved contradiction remains about pet identity, form required fields, mode ownership, mobile collapse, direct-form one-click path, drag/hide persistence or prepared-answer routing.

## 11. Frontend Definition of Done

Frontend phase is DONE only when:

- main acceptance contracts are GREEN with fake network boundaries;
- focused TDD tests for implemented behavior are GREEN;
- representative viewport geometry tests are GREEN;
- keyboard/focus/reduced-motion checks are GREEN;
- direct form remains usable with AI disabled/failing;
- prepared intents demonstrably produce zero generative requests;
- underlying site geometry is unchanged by widget lifecycle;
- mobile form/collapse behavior is usable and unclipped in automated viewport matrix;
- real Mobile Safari/Android browser-chrome risks receive focused manual/device evidence before production approval;
- tests are classified KEEP/MOVE/DELETE under `docs/testing-policy.md`;
- final test report states `NEW PERMANENT TESTS`, `TEMPORARY TESTS REMOVED`, `MOVED TO AFFECTED/FULL`.

## 12. Backend Definition of Ready

Backend implementation begins only after frontend contracts and request/response interfaces are stable. Required inputs:

- canonical submission schema;
- idempotency contract;
- attachment authorization schema;
- success/error response taxonomy;
- frontend fake adapter aligned to the schema;
- privacy/retention decision;
- provider credentials/verified sender prerequisites documented without publishing secrets.

## 13. Backend Definition of Done

- valid payload accepted;
- invalid payload rejected server-side;
- exactly one primary email for one logical accepted submission;
- duplicate/retry protected by idempotency;
- visitor auto-receipt only after accepted submission;
- attachment upload private, size/type bounded, signed-link delivery works, lifecycle expiry works;
- no PII in analytics;
- contact works independently of analytics and AI availability;
- rate limit/honeypot do not block normal accessibility/retry flow;
- one gated real-provider smoke confirms delivery to `i@lookawful.ru` and controlled receipt address;
- privacy page and release docs are synced before production.

## 14. Traceability rule

Every implementation task and every permanent test must cite the requirement IDs it protects. A test without a requirement ID must justify why it exists. A requirement without an implementation task/test/manual gate is a planning defect and blocks implementation readiness.
