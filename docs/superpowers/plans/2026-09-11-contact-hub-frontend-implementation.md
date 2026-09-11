# Contact Hub + Venus Frontend Implementation Plan

> **For agentic workers:** implement this plan vertically, one observable behavior seam at a time. The repository testing policy remains authoritative. The cloud runner is the normal execution environment; the owner's desktop is not required for ordinary TDD or verification.

**Goal:** Build the production frontend overlay for canonical Venus + one shared Contact Hub with prepared/local assistant answers, Yandex-backed free-form AI, and an independent direct-contact form, while leaving the existing site layout unchanged.

**Architecture:** `portfolio-pet` owns Venus rendering, animation, gesture and visibility preferences only. `contact-hub` owns the shared overlay shell, mode/visibility lifecycle, focus, responsive geometry, form state and safe UI context. Assistant routing resolves deterministic/prepared answers before any network call. Free-form AI crosses one narrow public assistant boundary. Direct-contact delivery crosses a different contact boundary. Neither backend is allowed to become a dependency of the other.

**Tech Stack:** Vite 8, strict TypeScript, vanilla DOM, Canvas2D Venus renderer, current site tokens/CSS architecture, Node 24 contract tests, Playwright affected browser tests, cloud GitHub Actions execution.

**Canonical spec:** `docs/superpowers/specs/2026-09-11-contact-hub-pet-product-contract.md`

## 0. Resolved implementation decisions

These decisions directly integrate the useful evidence from the earlier Venus/Contact Hub prototypes. There is no separate prototype implementation authority.

### Keep and productionize

- One shared Contact Hub: pet primary action -> `ai`; existing site CTA -> `form`; pet direct-contact affordance -> `form` in one action.
- Explicit AI writer handoff: `AI draft -> explicit visitor action -> form`; never automatic delivery and never silent transfer of form PII/chat history.
- AI degraded mode: prepared/local answers and direct form continue to work when Yandex generation is unavailable.
- Prepared/local route before generation. Existing prototype `cases`, `resume`, `about`, `write` canned behaviors become approved answer IDs backed by #713, not duplicated strings inside components.
- Focus lifecycle demonstrated by the prototype: intentional focus on open, Escape/close, return focus to the actual opener.
- AI request lifecycle synchronized with Venus: actual async request -> quiet thinking state + Venus thinking animation; answer -> speaking/review -> idle; error -> recoverable error. Prepared answers do **not** fake a thinking delay.
- Internal Hub scrolling and `overscroll-behavior: contain` where useful. Composer/actions remain reachable independently of underlying page scroll.
- Safe-area padding belongs to the overlay widget, never to the site's layout.
- Minimal editorial form language: site tokens, thin separators, restrained controls, no nested SaaS cards.
- Hover hint is allowed as a delayed enhancement on real hover devices and disappears during drag/open.

### Reuse from the uploaded Venus widget runtime

The uploaded Venus prototype proves a useful renderer shape:

- external `pet.json` identity + sprite version;
- external atlas/manifest mapping semantic animation states to clips;
- Canvas2D draw from one spritesheet;
- `imageSmoothingEnabled = false` for the intended pixel treatment;
- state-specific FPS/loop/next semantics;
- reduced-motion can render a stable frame instead of running the loop.

Production must **not** embed thousands of frame rectangles or temporary `row-00` semantics inside `portfolio-pet.ts`. The current prototype atlas was automatically inferred from transparency and explicitly labels its row semantics temporary. Convert that evidence into the existing generic `sprite-manifest.ts` contract and canonical Venus asset data.

### Reject and replace

Do not copy from old prototypes:

- pet-owned chat panel;
- fixed bottom-right ownership;
- `z-index: 9999` as collision strategy;
- hard-coded `430x560`, `356x420`, `580px`, `620px`, `23rem` geometry;
- `100vh` mobile sizing;
- full-screen-only mobile behavior;
- glass blur/scrim as product identity;
- green `online` dot/status pill;
- duplicated `Venus`/`Contact Hub` labels;
- black SaaS message bubbles and button styling;
- dashboard-like 2-column quick-action grids;
- `setTimeout()` fake provider responses or fake waiting delays;
- one giant enum that mixes pet, Hub, AI request and form delivery states.

### Orthogonal state ownership

```text
Pet runtime
idle | hover/focus | dragging | invite | temporarily-hidden | thinking | speaking/review | success | error

Contact Hub
closed | open | collapsed
  x
ai | form

AI request
idle | prepared | thinking | answer | error

Form delivery
editing | invalid | sending | success | error
```

These dimensions may coordinate but must remain separately owned.

## 1. Global constraints

- Do not change authored/user-facing site copy during structural/runtime work.
- Preserve `Связаться со мной` and intentional address `i@lookawful.ru`.
- Default pet is canonical Venus; Awful Cases assets are not acceptable substitutes.
- Pet and Hub are overlay-only and must not change underlying site flow/geometry.
- Form remains usable when AI is disabled, failing, rate-limited or feature-off.
- Form values never silently enter AI context; AI history never silently enters mail payload.
- No Yandex/provider secret in frontend.
- No new dependency unless a focused requirement cannot be satisfied with existing platform APIs.
- Development tests do not enter `test:fast` automatically. Final KEEP/MOVE/DELETE classification follows `docs/testing-policy.md`.
- Browser/responsive tests belong to AFFECTED/FULL unless a cheaper stable contract proves the same risk.
- Cloud verification is required for meaningful slices; local owner workstation verification is optional, not part of ordinary execution.

## 2. Public seams locked by this plan

### Contact form backend seam

Frontend contract only during this phase:

`POST /api/contact/send` and attachment authorization owned by the separate contact backend plan.

### Public AI seam

Browser calls one public service endpoint only when local routing returns `generate`:

`POST https://api.looksawful.ru/v1/portfolio-chat`

Request shape:

```ts
export interface PortfolioChatRequest {
  message: string;
  locale: "ru" | "en";
  sessionId: string;
  context: {
    currentPath: string;
    projectId?: string;
    activeTopicId?: string;
    previousIntentId?: string;
    sourceIds?: readonly string[];
  };
}
```

Response shape:

```ts
export type PortfolioChatResponse =
  | { kind: "answer"; text: string; sources: readonly string[] }
  | { kind: "no_data"; text: string; sources: readonly string[] }
  | { kind: "rate_limited" }
  | { kind: "unavailable" };
```

No generic model proxy, tools array, provider model settings, arbitrary documents, form values or attachment data are exposed through the public browser contract.

The first production AI integration is intentionally **non-streaming**: the UI already has a quiet thinking state, and returning one bounded answer gives us a much smaller failure/retry/cost surface. Streaming can be evaluated later as an independent enhancement, not smuggled into MVP because chat products traditionally enjoy multiplying protocols.

## 3. File structure

### Shared Contact Hub domain

- `src/features/contact-hub/state.ts` — mode/visibility/entry-point transitions only.
- `src/features/contact-hub/context.ts` — safe shared `ContactContext` allowlist.
- `src/features/contact-hub/form-contract.ts` — form draft types, normalization and validation.
- `src/features/contact-hub/persistence.ts` — current-tab draft persistence only.
- `src/features/contact-hub/transport.ts` — frontend contact transport interface/HTTP adapter.

### Pet/assistant domain

- Preserve/refine PR #724 `feature-flag.ts`, `intent-router.ts`, `knowledge.ts`, `sprite-manifest.ts`, `character-context.ts` only where compatible.
- `src/features/portfolio-pet/interaction.ts` — pure gesture classification and position clamp.
- `src/features/portfolio-pet/preferences.ts` — temporary hide/permanent disable persistence policy.
- `src/features/portfolio-pet/prepared-answers.ts` — approved answer registry + conservative natural-language routing.
- `src/features/portfolio-pet/assistant-transport.ts` — narrow `/v1/portfolio-chat` adapter; local/prepared paths never call it.
- Canonical Venus asset metadata lives outside the UI component and implements the generic sprite-manifest contract.

### DOM/runtime

- `src/components/portfolio-pet.ts` — launcher/Canvas renderer, drag, hint, hide, direct-form callbacks. **No panel ownership.**
- `src/components/portfolio-pet.css` — large Venus overlay geometry using site tokens and overlay arbitration.
- `src/components/contact-hub.ts` — shared shell/focus/mode/collapse composition.
- `src/components/contact-hub.css` — desktop overlay + stable mobile sheet/collapse + safe-area/viewport rules.
- `src/components/contact-hub-form.ts` — form DOM + local validation/draft + injected contact transport.
- `src/components/contact-hub-ai.ts` — stream/composer/prepared/thinking/answer/error + injected assistant transport.
- `src/main.ts` — lazy feature composition + existing CTA interception without authored-copy edits.

### Existing pre-implementation tests

- `test/contact-hub-domain-contract.test.mjs`
- `test/portfolio-pet-interaction-contract.test.mjs`
- `test/portfolio-assistant-prepared-contract.test.mjs`
- `tools/e2e/contact-hub-acceptance-v2.mjs` — canonical broad browser acceptance; the original first draft is superseded.

## 4. Task plan

### Task 1 — Reconcile PR #724 foundation and canonical Venus assets

**Requirements:** P-003, PET-001..014, AI-001..015.

- [ ] Compare current `dev`, PR #724 and canonical contract. Preserve only feature flag, approved knowledge boundary, character resolver, generic manifest/runtime concepts and deterministic-router evidence.
- [ ] Do not import PR #724 panel/action-grid/placeholder anatomy.
- [ ] Convert uploaded Venus `pet.json` + atlas evidence into the generic production sprite-manifest representation. Preserve `id=venus`, sprite version and real spritesheet identity; do not preserve temporary row names as semantic truth.
- [ ] Renderer contract supports `idle`, `open`, `thinking`, `speaking/review`, `reaction`, and future movement clips through data rather than hard-coded component branches.
- [ ] Focused tests prove invalid manifests fail safely and missing animation state falls back predictably.
- [ ] Cloud typecheck/tests GREEN.

**Ready when:** canonical Venus can be rendered by a generic runtime without any Contact Hub panel existing.

### Task 2 — Shared Contact Hub state and safe context

**Requirements:** P-001..012, H-001..008, PRV-004..005.

Implement orthogonal Hub state:

```ts
type ContactHubMode = "ai" | "form";
type ContactHubVisibility = "closed" | "open" | "collapsed";
type ContactHubEntryPoint = "pet" | "pet-direct" | "site-contact" | "collapsed-launcher";
```

- [ ] CTA -> form, pet -> AI, pet-direct -> form, collapsed launcher -> restore.
- [ ] Mode switch never creates a second shell.
- [ ] AI availability never removes form mode.
- [ ] Safe shared context allowlists only path/language/entry/mode. AI-specific structured topic/source IDs live in AI state, not shared form context.
- [ ] Cloud domain contract GREEN for state/context slice.

**Ready when:** shell lifecycle is deterministic without DOM implementation.

### Task 3 — Form validation and current-tab draft

**Requirements:** F-001..030, PRV-001..005.

- [ ] Optional name; required normalized email; required message; 5000-char cap.
- [ ] One versioned `sessionStorage` key for text draft only.
- [ ] Close/mode switch/reload same tab preserves draft.
- [ ] Success clears draft; attachment bytes never persist.
- [ ] Cloud contract GREEN.

**Ready when:** form domain behavior exists independently from its UI and backend.

### Task 4 — Pet gesture, position and visibility preference domain

**Requirements:** PET-015..030, DR-001..007, W-009.

- [ ] Pure click-vs-drag-vs-hide classification.
- [ ] Pointer/touch drag position clamp with safe-area and minimum visible region.
- [ ] Temporary hide and persistent disable are separate states.
- [ ] Temporary hide auto-return has a non-aggressive cooldown and is suppressed while Hub/modal collisions exist.
- [ ] Invalid persisted position is clamped on resize/orientation.
- [ ] Cloud contract GREEN.

**Ready when:** pointer listeners can later consume pure decisions rather than owning product logic.

### Task 5 — Prepared answer registry and routing

**Requirements:** AI-001..015, PERF-004/PERF-008, #713.

Response order is fixed:

```text
known UI action
-> prepared intent
-> small approved structured/template answer
-> generative fallback
```

- [ ] Convert prototype `about`, `cases`, `resume`, `write` from inline canned strings into stable prepared answer IDs backed by canonical approved sources.
- [ ] Add RU/EN aliases and conservative natural-language matching.
- [ ] Common answers and quick actions make zero network/model calls.
- [ ] Ambiguous input returns a `generate` route with only bounded message + approved source/topic/page IDs.
- [ ] No entire CV/site/chat dump is constructed on the frontend.
- [ ] Cloud prepared-answer tests GREEN.

**Ready when:** the assistant is already useful with the provider entirely absent.

### Task 6 — Large canonical Venus launcher runtime

**Requirements:** PET-001..035, DR-001..007, V-009, PERF-001..007.

- [ ] Canvas renderer loads external image/manifest once and draws frames with bottom-anchor stability.
- [ ] Use real canonical Venus and make her visually large according to product contract; the uploaded prototype's 148x196 canvas is renderer evidence, **not** production display size.
- [ ] Idle loops; hover/focus reaction; actual request thinking; answer speaking/review; success/error states.
- [ ] Prepared/local answer may trigger a brief response/review state but no fake thinking delay.
- [ ] Reduced motion draws stable representative frames and suppresses autonomous movement.
- [ ] Pointer capture implements mouse/touch drag without activation or page scroll/select.
- [ ] Delayed hover hint only on hover-capable devices.
- [ ] Temporary close/swipe hide + persistent disable.
- [ ] No panel/chat markup in the pet component.
- [ ] Browser slice proves large Venus, bounds, drag and underlying-page geometry.

**Ready when:** Venus is a complete independent overlay control.

### Task 7 — Shared desktop Hub and focus lifecycle

**Requirements:** H-001..015, W-001..010, V-001..010, AX-001..012.

- [ ] One semantic shared overlay surface with minimal mode controls and close. Do not lock `role=tab` unless final accessibility design actually chooses tabs.
- [ ] Reuse site typography/surface/border/radius/shadow semantics; no old glass card, status dot, duplicated mascot title or action dashboard.
- [ ] Existing site CTA opens form mode while preserving its authored text and mailto fallback behavior when widget is unavailable.
- [ ] Pet callbacks open the same controller.
- [ ] Open focuses the active mode intentionally; close/Escape returns focus to actual opener.
- [ ] Hub body owns internal overflow and may use `overscroll-behavior: contain`; underlying page geometry stays unchanged.
- [ ] Overlay arbitration prevents collision with analytics consent/navigation/lightbox without absurd global z-index escalation.
- [ ] Desktop acceptance slices GREEN.

**Ready when:** shell composition is stable before feature-rich mode contents are added.

### Task 8 — Mobile stable sheet, collapse and dynamic viewport

**Requirements:** M-001..018, MV-001..011, F-022..025.

- [ ] Dedicated mobile sheet/overlay, not squeezed desktop panel and not old fullscreen-only prototype behavior.
- [ ] Use `dvh`/safe-area baseline and internal overflow; never brittle `100vh` sizing.
- [ ] Form close/current field/submit remain reachable on 320x568 fallback and representative phone viewports.
- [ ] Collapse -> compact edge launcher; one tap restores same mode/draft/conversation.
- [ ] Large Venus, collapsed launcher and open Hub obey collision arbitration.
- [ ] Add `visualViewport` normalization only if CSS baseline cannot satisfy observed browser behavior; avoid resize thrash.
- [ ] Chromium geometry GREEN; real Mobile Safari/Android chrome remains focused release evidence.

**Ready when:** mobile no longer has the clipping/jitter class of failures seen in earlier prototypes.

### Task 9 — Direct form DOM and editorial visual system

**Requirements:** F-001..030, A-001..008, V-006..008, AX-008..011.

- [ ] Name/email/message persistent labels, optional file action, no extra qualification fields.
- [ ] Editorial rows/thin separators/site spacing; no generic SaaS card-inside-card styling.
- [ ] Validation timing: no eager errors; blur local error; submit all errors; focus first invalid; clear on fix.
- [ ] Same-tab draft behavior wired.
- [ ] PDF/image selection UI, 20 MB client rejection, filename/remove/replace; backend upload deferred.
- [ ] Full form remains reachable through internal scroll rather than being clipped.

**Ready when:** form is fully usable without real delivery.

### Task 10 — Frontend contact transport and delivery UI states

**Requirements:** S-001..015, A-008..011 frontend behavior.

- [ ] Injected transport boundary, fake-friendly.
- [ ] Valid submit -> one logical in-flight request; rapid duplicate activation -> one request.
- [ ] Pending, accepted, invalid, rate-limited, unavailable states.
- [ ] Failure preserves draft + retry + mailto fallback.
- [ ] Only confirmed acceptance clears draft and shows success.

**Ready when:** full form lifecycle is GREEN against fake responses.

### Task 11 — AI view, real async lifecycle and Yandex-facing adapter

**Requirements:** AI-001..025, PERF-004/PERF-008, AX-011..012, #712/#714.

- [ ] Minimal message stream/composer inside the shared shell. User/assistant distinction does not require heavy bubbles.
- [ ] Prepared quick action renders locally and produces zero `api.looksawful.ru` requests.
- [ ] Free-form route calls injected `AssistantTransport` at `/v1/portfolio-chat`.
- [ ] Actual pending network request shows one restrained matte/thinking animation and Venus thinking state.
- [ ] No `setTimeout()` fake delay in production. Thinking exists exactly while asynchronous work is unresolved.
- [ ] Full response replaces thinking without layout jump and moves Venus through speaking/review -> idle.
- [ ] `no_data`, `rate_limited`, timeout and `unavailable` are recoverable and keep prepared answers + direct form available.
- [ ] AI state is retained across mode switch/collapse for the active browser session.
- [ ] Reduced motion uses a static/minimal pending indicator.

**Ready when:** frontend AI works completely against a fake public assistant endpoint and can later switch to Yandex without UI/domain changes.

### Task 12 — Explicit writer -> form handoff

**Requirements:** P-007..009, AI-013, #715.

- [ ] Switching to form alone never copies AI text.
- [ ] Explicit direct-contact handoff may transfer only the selected draft text.
- [ ] Existing form name/email are preserved.
- [ ] Existing non-empty message cannot be silently overwritten; use an explicit safe merge/replace decision.
- [ ] Form never submits automatically after handoff.

**Ready when:** writer and delivery remain separate capabilities.

### Task 13 — Analytics/privacy frontend boundary

**Requirements:** AN-001..006, PRV-001..006, #170.

- [ ] `contact_form_open` only from real form opening if retained in final analytics design.
- [ ] `contact_form_submit` only after confirmed accepted backend response.
- [ ] Name/email/message/filename/validation text are structurally impossible in goal params.
- [ ] Existing `contact_email` remains unchanged.
- [ ] Analytics denied/GPC/DNT does not disable form or AI prepared behavior.

**Ready when:** conversion measurement is useful without turning correspondence into telemetry.

### Task 14 — Affected browser/accessibility/performance verification

- [ ] Run `tools/e2e/contact-hub-acceptance-v2.mjs` against the cloud-built site.
- [ ] Run focused Node contracts, typecheck, CSS checks/style lint and site build.
- [ ] Run existing responsive suite to detect unrelated navigation/layout regressions.
- [ ] Keyboard/focus/reduced-motion pass.
- [ ] Deterministic visual capture uses a stable Venus frame/state; never compare random animation frames.
- [ ] Real Mobile Safari/Android browser-chrome checks before public release.
- [ ] Verify widget adds no meaningful CLS and closed idle does not create unreasonable background CPU work.

**Ready when:** user-visible frontend behavior is GREEN with fake network boundaries.

### Task 15 — Test lifecycle and frontend closeout

- [ ] List every created/changed test.
- [ ] KEEP only cheap long-lived domain contracts.
- [ ] MOVE responsive/browser/widget acceptance to AFFECTED/FULL.
- [ ] DELETE temporary RED/GREEN implementation scaffolding and the superseded first broad browser draft.
- [ ] Remove temporary cloud RED workflow or convert it through a separate explicit CI-policy task; it must not accidentally become permanent push infrastructure.
- [ ] Final verification after test cleanup.

Final report must include:

```text
NEW PERMANENT TESTS: N
TEMPORARY TESTS REMOVED: N
MOVED TO AFFECTED/FULL: N
```

## 5. Yandex AI integration decision for the later backend phase

We are choosing **Yandex Cloud AI Studio** as the provider layer for generative fallback. The model remains configuration, not frontend architecture.

Target topology:

```text
looksawful.ru / GitHub Pages
        |
        | free-form only
        v
https://api.looksawful.ru/v1/portfolio-chat
        |
Cloudflare DNS/TLS/security boundary (#677)
        |
Yandex API Gateway
        |
awful-public-assistant (Cloud Function first; Container only if measured need appears)
        |
        +-- body/origin/rate/session budget
        +-- reject deterministic routes
        +-- approved #713 retrieval
        +-- hard context/output budget
        +-- Yandex AI Studio adapter
        +-- normalized response + metadata-only telemetry
```

Server-side Yandex adapter target:

- AI Studio OpenAI-compatible base URL: `https://ai.api.cloud.yandex.net/v1`.
- Service account role: `ai.languageModels.user`.
- API key scope: `yc.ai.languageModels.execute`.
- API key stored server-side in Yandex Lockbox/secret binding; never GitHub Pages, JS bundle, Notion or client response.
- Model URI is configuration in `gpt://<folder_ID>/<model_ID>/latest` form. We will plug in the exact model the owner preferred in Yandex Sandbox instead of hard-coding a guessed model into product code.
- MVP uses one model call per unresolved free-form turn, synchronous/non-streaming response, bounded timeout and output.
- No provider call for prepared answers, quick actions or questions with insufficient approved evidence.
- No public generic OpenAI-compatible proxy. Anonymous users see only the narrow portfolio-chat schema.
- No privileged tools, GitHub/Notion mutation or owner control-plane access.

### Knowledge/retrieval MVP

The portfolio corpus is small. Do **not** introduce a vector database first.

1. prepared answers handle common questions;
2. structured facts/project metadata handle simple contextual composition;
3. free-form backend selects a small set of approved #713 chunks by stable tags/project/topic + lightweight lexical scoring;
4. if there is no approved evidence, return `no_data` instead of asking the model to improvise;
5. only selected evidence + current message + safe structured topic context reach the model.

Embeddings/vector search become justified only if the approved corpus grows enough that deterministic retrieval quality becomes measurably inadequate.

### Conversation context MVP

Do not persist raw public chat server-side just to simulate memory. The browser maintains conversation presentation. For generation it sends a compact structured anchor such as `projectId`, `activeTopicId`, `previousIntentId` and approved `sourceIds`, not the entire historical transcript by default. If real multi-turn quality later proves insufficient, extend this boundary deliberately with bounded short history or a privacy-reviewed session service.

## 6. Definition of Ready for frontend implementation

Frontend work may start when:

- canonical spec and this integrated plan are current;
- cloud RED evidence exists for the initial contracts;
- prototype evidence has been resolved into this plan rather than treated as a second authority;
- `contact-hub-acceptance-v2.mjs` is the broad acceptance reference;
- backend model/delivery remain behind fake adapters.

That gate is currently satisfied. Backend provider implementation still waits for stable frontend schemas.
