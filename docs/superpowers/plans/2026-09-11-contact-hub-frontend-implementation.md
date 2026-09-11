# Contact Hub + Venus Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the production frontend overlay for canonical Venus + one shared Contact Hub with AI/prepared answers and direct form, while leaving the existing site layout unchanged and keeping backend delivery/provider calls behind narrow adapters.

**Architecture:** `portfolio-pet` owns only Venus launcher/sprite/gesture/preferences. `contact-hub` owns the shared overlay shell, mode/visibility lifecycle, form state and safe UI context. Assistant routing stays in `portfolio-pet` feature logic and resolves deterministic/prepared answers before any generative adapter. Contact delivery and AI generation are separate injected transport boundaries so frontend can be completed with deterministic fake adapters before backend work starts.

**Tech Stack:** Vite 8, TypeScript strict, vanilla DOM, CSS cascade layers/site tokens, Playwright 1.61 affected browser tests, Node 24 test runner.

**Spec:** `docs/superpowers/specs/2026-09-11-contact-hub-pet-product-contract.md`

## Global Constraints

- Do not change authored/user-facing site copy during structural/runtime work.
- Preserve `Связаться со мной` and intentional address `i@lookawful.ru`.
- Default pet is canonical Venus; Awful Cases assets are not acceptable substitutes.
- Pet and Hub are overlay-only and must not change underlying site flow/geometry.
- Form remains usable when AI is disabled/failing.
- Form values never silently enter AI context; AI history never silently enters mail payload.
- No provider secret in frontend.
- No new dependency unless a focused requirement cannot be satisfied with existing platform APIs.
- Do not add tests to `test:fast` during development; classify only at final KEEP/MOVE/DELETE gate.
- Browser/responsive tests belong to AFFECTED/FULL unless a cheaper stable contract proves the same risk.
- Production code follows strict RED -> verify RED -> GREEN -> verify GREEN -> refactor.

---

## File structure locked by this plan

### Shared Contact Hub domain

- Create `src/features/contact-hub/state.ts` — mode/visibility/entry-point state transitions only.
- Create `src/features/contact-hub/context.ts` — safe shared `ContactContext` allowlist.
- Create `src/features/contact-hub/form-contract.ts` — form draft types, normalization and validation.
- Create `src/features/contact-hub/persistence.ts` — session draft persistence only.
- Create `src/features/contact-hub/transport.ts` — frontend contact transport interface and HTTP adapter; no provider-specific secret logic.

### Pet/assistant domain

- Preserve/refine `src/features/portfolio-pet/feature-flag.ts` from PR #724.
- Preserve/refine `src/features/portfolio-pet/intent-router.ts` from PR #724.
- Preserve/refine `src/features/portfolio-pet/knowledge.ts` from PR #724.
- Preserve/refine `src/features/portfolio-pet/sprite-manifest.ts` and `character-context.ts` from PR #724.
- Create `src/features/portfolio-pet/interaction.ts` — pure gesture classification and position clamp.
- Create `src/features/portfolio-pet/preferences.ts` — temporary hide/permanent disable state and persistence policy.
- Create `src/features/portfolio-pet/prepared-answers.ts` — prepared answer registry + natural-language routing/fallback result.
- Create `src/features/portfolio-pet/assistant-transport.ts` — narrow generative HTTP interface; no local/prepared path calls it.

### DOM/runtime components

- Refactor `src/components/portfolio-pet.ts` from PR #724 into **launcher only**: Venus sprite, pointer/touch drag, hover hint, temporary hide, direct-form action callbacks. It must not own a panel.
- Replace temporary PR #724 visual CSS with `src/components/portfolio-pet.css` aligned to current site tokens.
- Create `src/components/contact-hub.ts` — shared dialog/sheet DOM and focus lifecycle; composes AI/form views.
- Create `src/components/contact-hub.css` — overlay geometry, desktop shell, mobile sheet/collapse, viewport/safe-area behavior.
- Create `src/components/contact-hub-form.ts` — direct-form DOM behavior using domain contract + injected transport.
- Create `src/components/contact-hub-ai.ts` — message stream/composer/thinking/prepared response rendering + injected generative transport.
- Modify `src/main.ts` — lazy/feature-flagged composition mount and existing CTA interception, without changing authored CTA text.

### Tests

- Existing pre-implementation RED: `test/contact-hub-domain-contract.test.mjs`.
- Existing pre-implementation RED: `test/portfolio-pet-interaction-contract.test.mjs`.
- Existing pre-implementation RED: `test/portfolio-assistant-prepared-contract.test.mjs`.
- Existing pre-implementation RED: `tools/e2e/contact-hub-acceptance.mjs`.
- Add focused temporary/unit/browser tests just-in-time per task. Do not pre-create implementation-shaped test archives.

---

### Task 1: Reconcile PR #724 foundation without importing its obsolete visual shell

**Requirements:** P-003, PET-001, V-010, AI-001..015

**Files:**
- Preserve/refine from PR #724: `src/features/portfolio-pet/feature-flag.ts`
- Preserve/refine from PR #724: `src/features/portfolio-pet/intent-router.ts`
- Preserve/refine from PR #724: `src/features/portfolio-pet/knowledge.ts`
- Preserve/refine from PR #724: `src/features/portfolio-pet/sprite-manifest.ts`
- Preserve/refine from PR #724: `src/features/portfolio-pet/character-context.ts`
- Do **not** adopt PR #724 `portfolio-pet__panel`, action-grid CSS or placeholder figure as product design.
- Review tests from PR #724 for KEEP/MOVE/DELETE before copying them.

**Interfaces:**
- `resolvePortfolioPetEnabled(input): boolean`
- `routePortfolioPetIntent(message, locale): local-action | free-chat`
- approved knowledge selection remains explicit and fail-closed.
- sprite manifest remains independent from Contact Hub shell.

- [ ] **Step 1: establish clean implementation branch from current `dev` and record current SHA/status.**
- [ ] **Step 2: compare current `dev` to PR #724 head and list foundation files that remain compatible with the canonical spec.**
- [ ] **Step 3: run surviving PR #724 foundation tests against the reconciled files and obtain expected RED for any contract intentionally changed by this spec.**
- [ ] **Step 4: make the minimum foundation changes required by the new ownership boundary; do not mount any panel UI yet.**
- [ ] **Step 5: run focused foundation tests + `npm run typecheck`; require GREEN.**
- [ ] **Step 6: classify copied PR #724 tests provisionally; do not add new tests to fast manifest.**

**Ready when:** foundation logic exists on current `dev` lineage, no obsolete panel UI is treated as approved, and Contact Hub ownership is still unimplemented/RED.

---

### Task 2: Shared Contact Hub state and safe context

**Requirements:** P-001..012, H-001..008, PRV-004..005

**Files:**
- Create `src/features/contact-hub/state.ts`
- Create `src/features/contact-hub/context.ts`
- Test `test/contact-hub-domain-contract.test.mjs`

**Interfaces:**

```ts
export type ContactHubMode = "ai" | "form";
export type ContactHubVisibility = "closed" | "open" | "collapsed";
export type ContactHubEntryPoint = "pet" | "pet-direct" | "site-contact" | "collapsed-launcher";

export interface ContactHubState {
  visibility: ContactHubVisibility;
  mode: ContactHubMode;
  entryPoint: ContactHubEntryPoint | null;
  aiAvailable: boolean;
}

export type ContactHubEvent =
  | { type: "OPEN"; entryPoint: ContactHubEntryPoint }
  | { type: "SET_MODE"; mode: ContactHubMode }
  | { type: "COLLAPSE" }
  | { type: "RESTORE" }
  | { type: "CLOSE" }
  | { type: "SET_AI_AVAILABLE"; available: boolean };

export function createContactHubState(input: { aiAvailable: boolean }): ContactHubState;
export function transitionContactHub(state: ContactHubState, event: ContactHubEvent): ContactHubState;

export interface ContactContext {
  currentPath: string;
  language: "ru" | "en";
  entryPoint: ContactHubEntryPoint;
  activeMode: ContactHubMode;
}

export function buildSharedContactContext(input: Record<string, unknown>): ContactContext;
```

- [ ] **Step 1: run `node --test test/contact-hub-domain-contract.test.mjs`; verify RED is the missing state/context contract, not syntax/tooling.**
- [ ] **Step 2: implement only entry-point/mode/visibility transitions and safe context allowlisting.**
- [ ] **Step 3: rerun focused test; require relevant state/context cases GREEN while form cases may remain RED until Task 3.**
- [ ] **Step 4: add one focused temporary test only if a reducer edge case cannot be expressed in the main contract; watch it RED before code.**
- [ ] **Step 5: typecheck.**

**Ready when:** CTA -> form, pet -> AI, pet-direct -> form and collapse/restore transitions are deterministic; AI availability never removes form mode; shared context strips PII.

---

### Task 3: Form validation and session draft contract

**Requirements:** F-001..030, PRV-001..005

**Files:**
- Create `src/features/contact-hub/form-contract.ts`
- Create `src/features/contact-hub/persistence.ts`
- Test `test/contact-hub-domain-contract.test.mjs`
- Add focused TEMPORARY test if persistence edge cases need it.

**Interfaces:**

```ts
export const CONTACT_MESSAGE_MAX_LENGTH = 5000;

export interface ContactFormDraft {
  name: string;
  email: string;
  message: string;
}

export type ContactFormErrors = Partial<Record<keyof ContactFormDraft, string>>;

export function normalizeContactFormDraft(draft: ContactFormDraft): ContactFormDraft;
export function validateContactFormDraft(draft: ContactFormDraft): ContactFormErrors;

export interface ContactDraftStore {
  read(): ContactFormDraft | null;
  write(draft: ContactFormDraft): void;
  clear(): void;
}

export function createSessionContactDraftStore(storage: Storage): ContactDraftStore;
```

- [ ] **Step 1: run focused domain test and verify form section RED.**
- [ ] **Step 2: implement optional name, required/normalized email, required message, 5000-char cap.**
- [ ] **Step 3: rerun focused test to GREEN.**
- [ ] **Step 4: write smallest failing persistence test proving close/reload-in-same-tab semantics and attachment exclusion.**
- [ ] **Step 5: implement sessionStorage draft store with one versioned key and no attachment bytes.**
- [ ] **Step 6: rerun focused persistence test and typecheck.**

**Ready when:** pure form contract is stable before any DOM form exists.

---

### Task 4: Pet pointer/touch gesture, clamp and visibility preferences

**Requirements:** PET-015..030, DR-001..007, W-009

**Files:**
- Create `src/features/portfolio-pet/interaction.ts`
- Create `src/features/portfolio-pet/preferences.ts`
- Test `test/portfolio-pet-interaction-contract.test.mjs`

**Interfaces:**

```ts
export type PetGestureResult = "activate" | "drag" | "hide";

export function classifyPetGesture(input: {
  dx: number;
  dy: number;
  durationMs: number;
  velocityX?: number;
  viewportEdgeDistance?: number;
}): PetGestureResult;

export function clampPetPosition(input: {
  position: { x: number; y: number };
  widgetSize: { width: number; height: number };
  viewport: { width: number; height: number };
  safeArea: { top: number; right: number; bottom: number; left: number };
  minimumVisible: { width: number; height: number };
}): { x: number; y: number };

export interface PetPreferenceState {
  permanentlyDisabled: boolean;
  temporaryHiddenUntil: number | null;
}

export function reducePetPreference(state: PetPreferenceState, event: PetPreferenceEvent): PetPreferenceState;
```

- [ ] **Step 1: run `node --test test/portfolio-pet-interaction-contract.test.mjs`; verify RED is missing interaction/preference behavior.**
- [ ] **Step 2: implement click-vs-drag threshold and viewport clamp only.**
- [ ] **Step 3: rerun corresponding cases to GREEN.**
- [ ] **Step 4: add RED for swipe-hide discrimination and permanent opt-out if main test does not yet cover a discovered edge case.**
- [ ] **Step 5: implement temporary hide/auto-return/permanent disable state; persistence adapter remains separate from reducer.**
- [ ] **Step 6: focused GREEN + typecheck.**

**Ready when:** gesture decisions are pure/testable before pointer listeners are wired.

---

### Task 5: Prepared answers and generative fallback routing

**Requirements:** AI-001..015, PERF-004, PERF-008

**Files:**
- Create `src/features/portfolio-pet/prepared-answers.ts`
- Reuse/refine `intent-router.ts`, `knowledge.ts`, approved source IDs from PR #724/#713.
- Test `test/portfolio-assistant-prepared-contract.test.mjs`

**Interfaces:**

```ts
export type AssistantRoute =
  | { kind: "prepared"; answerId: string; text: string; sourceIds: readonly string[] }
  | { kind: "generate"; message: string; context: { sourceIds: readonly string[]; page: string; locale: "ru" | "en" } };

export function routePortfolioAssistantRequest(input: {
  message: string;
  locale: "ru" | "en";
  context: Record<string, unknown>;
}): AssistantRoute;
```

- [ ] **Step 1: run prepared-answer contract and verify expected RED.**
- [ ] **Step 2: implement the smallest approved prepared registry for existing top-level intents (`about`, `cases`, `resume`) using canonical approved sources, not duplicated biography strings.**
- [ ] **Step 3: implement natural-language aliases and conservative confidence/fallback behavior.**
- [ ] **Step 4: verify known intents are `prepared`, ambiguous input is `generate`, and generate context contains only approved IDs/safe fields.**
- [ ] **Step 5: typecheck.**

**Ready when:** prepared intents are deterministic and a free-form fallback object exists without making a network call.

---

### Task 6: Canonical Venus launcher runtime, drag and hide

**Requirements:** PET-001..035, DR-001..007, V-009, PERF-001..007

**Files:**
- Refactor/create `src/components/portfolio-pet.ts`
- Replace/refine `src/components/portfolio-pet.css`
- Consume canonical Venus sprite manifest/assets.
- Add focused browser TEMPORARY tests as needed; main proof stays `tools/e2e/contact-hub-acceptance.mjs`.

**Component interface:**

```ts
export interface PortfolioPetController {
  readonly element: HTMLElement;
  destroy(): void;
  show(): void;
  hideTemporarily(): void;
  setAnimation(state: "idle" | "hover" | "invite" | "thinking" | "success" | "error"): void;
}

export function mountPortfolioPet(options: {
  root?: HTMLElement;
  onOpenAi: () => void;
  onOpenForm: () => void;
  onPermanentlyDisabled?: () => void;
}): PortfolioPetController;
```

- [ ] **Step 1: write/run focused browser RED proving canonical pet control exists, is large, fully visible and overlay-only.**
- [ ] **Step 2: implement Venus launcher only; no panel/chat markup.**
- [ ] **Step 3: verify size/bounds and underlying geometry GREEN.**
- [ ] **Step 4: write/run RED for pointer drag and touch-pointer drag not triggering activation.**
- [ ] **Step 5: wire pointer capture to pure gesture/clamp contract; GREEN.**
- [ ] **Step 6: write/run RED for temporary close/swipe hide and permanent opt-out persistence.**
- [ ] **Step 7: implement hide/auto-return/persistent disable with no layout effect; GREEN.**
- [ ] **Step 8: write/run RED for hover hint and reduced-motion behavior; implement minimum UI; GREEN.**

**Ready when:** large Venus behaves independently of Hub, can open AI/direct form callbacks, drag/hide works, and no obsolete PR #724 panel remains.

---

### Task 7: Shared Contact Hub desktop shell and focus lifecycle

**Requirements:** H-001..015, W-001..010, V-001..010, AX-001..012

**Files:**
- Create `src/components/contact-hub.ts`
- Create `src/components/contact-hub.css`
- Consume `src/features/contact-hub/state.ts`

**Interface:**

```ts
export interface ContactHubController {
  readonly element: HTMLElement;
  open(input: { mode: "ai" | "form"; entryPoint: ContactHubEntryPoint; opener: HTMLElement }): void;
  setMode(mode: "ai" | "form"): void;
  collapse(): void;
  restore(): void;
  close(): void;
  destroy(): void;
}
```

- [ ] **Step 1: run desktop slice of `node tools/e2e/contact-hub-acceptance.mjs`; verify RED at missing dialog.**
- [ ] **Step 2: implement one semantic dialog shell with `AI`/`Написать` tabs and close control using site tokens.**
- [ ] **Step 3: intercept existing `Связаться со мной` activation in `src/main.ts` without editing its text/href fallback and open form mode.**
- [ ] **Step 4: connect pet callbacks to same controller.**
- [ ] **Step 5: implement focus-in, Escape, close and focus-return.**
- [ ] **Step 6: verify one instance only, correct mode entry and underlying geometry stability.**
- [ ] **Step 7: typecheck + CSS check/lint relevant files.**

**Ready when:** desktop shell is structurally correct but form/AI internals may still be minimal placeholders owned by later tasks.

---

### Task 8: Mobile sheet, dynamic viewport and collapse launcher

**Requirements:** M-001..018, MV-001..006, F-022..025

**Files:**
- Modify `src/components/contact-hub.ts`
- Modify `src/components/contact-hub.css`
- Optional create `src/features/contact-hub/viewport.ts` only if stable visualViewport normalization cannot remain small inside component.

- [ ] **Step 1: run 390x844 and 320x568 acceptance slices; verify RED for clipping/collapse.**
- [ ] **Step 2: implement mobile sheet bounds with `dvh`/safe-area baseline and internal overflow; no page-flow changes.**
- [ ] **Step 3: verify all required controls remain reachable; GREEN for static mobile viewport.**
- [ ] **Step 4: write focused RED for viewport height shrink/restore without permanent crop or horizontal drift.**
- [ ] **Step 5: add minimal `visualViewport` normalization only if the CSS baseline cannot satisfy observable contract; avoid continuous layout thrash.**
- [ ] **Step 6: write/run RED for collapse -> compact launcher -> one-tap restore preserving mode.**
- [ ] **Step 7: implement collapsed state and restore; GREEN.**
- [ ] **Step 8: record manual Mobile Safari/Android chrome checks as required release evidence, not automated Chromium proof.**

**Ready when:** automated viewport matrix is unclipped and stable enough for frontend integration; real-mobile browser-chrome check remains a release/manual gate.

---

### Task 9: Direct form DOM, validation, draft and attachment selection UI

**Requirements:** F-001..030, A-001..008, V-006..008, AX-008..011

**Files:**
- Create `src/components/contact-hub-form.ts`
- Consume `form-contract.ts`, `persistence.ts`.
- Modify `contact-hub.ts` to mount form view.

- [ ] **Step 1: run form acceptance path; verify RED at missing labels/fields.**
- [ ] **Step 2: implement only name/email/message labelled controls with minimal editorial row styling and optional file control.**
- [ ] **Step 3: verify DOM/keyboard/mobile reachability GREEN before network send exists.**
- [ ] **Step 4: write/run focused RED for blur/submit validation timing and focus-first-error.**
- [ ] **Step 5: implement validation rendering from pure contract; GREEN.**
- [ ] **Step 6: write/run RED for same-tab draft close/reopen/reload and attachment non-persistence.**
- [ ] **Step 7: connect session draft store; GREEN.**
- [ ] **Step 8: write/run RED for PDF/image allowlist, 20 MB UI rejection, filename/remove/replace while preserving text.**
- [ ] **Step 9: implement selection-only attachment UX; actual upload transport is backend phase.**

**Ready when:** form is fully usable and validated locally with no backend dependency.

---

### Task 10: Frontend contact transport boundary, pending/success/error and idempotent UI

**Requirements:** S-001..015, A-008..011 frontend-facing behavior, P-001, PRV-001

**Files:**
- Create `src/features/contact-hub/transport.ts`
- Modify `src/components/contact-hub-form.ts`

**Interface:**

```ts
export interface ContactSubmission {
  submissionId: string;
  name: string;
  email: string;
  message: string;
  attachment?: { objectKey: string };
  context: ContactContext;
}

export type ContactSendResult =
  | { kind: "accepted"; submissionId: string }
  | { kind: "invalid"; fieldErrors: Record<string, string> }
  | { kind: "rate_limited" }
  | { kind: "unavailable" };

export interface ContactTransport {
  send(submission: ContactSubmission, signal: AbortSignal): Promise<ContactSendResult>;
}
```

- [ ] **Step 1: use acceptance route interception as fake transport and verify RED for pending/failure retention/success.**
- [ ] **Step 2: implement HTTP adapter + injected fake-friendly boundary; no Yandex-specific client secret/config.**
- [ ] **Step 3: implement single-flight/idempotency-key UI behavior so rapid duplicate activation creates one logical request.**
- [ ] **Step 4: verify failure preserves draft and exposes retry + mailto fallback.**
- [ ] **Step 5: verify accepted response alone creates success state and clears draft.**
- [ ] **Step 6: verify backend absence/unavailable leaves mailto path usable.**

**Ready when:** complete frontend form lifecycle is GREEN against fake HTTP responses; no real email backend required.

---

### Task 11: AI view, prepared responses, thinking state and generative adapter

**Requirements:** AI-001..025, PERF-004, PERF-008, AX-011..012

**Files:**
- Create `src/features/portfolio-pet/assistant-transport.ts`
- Create `src/components/contact-hub-ai.ts`
- Modify `src/components/contact-hub.ts`

**Interface:**

```ts
export type AssistantTransportResult =
  | { kind: "answer"; text: string; sourceIds: readonly string[] }
  | { kind: "no_data"; text: string }
  | { kind: "rate_limited" }
  | { kind: "unavailable" };

export interface AssistantTransport {
  ask(input: {
    message: string;
    locale: "ru" | "en";
    context: { page: string; sourceIds: readonly string[] };
  }, signal: AbortSignal): Promise<AssistantTransportResult>;
}
```

- [ ] **Step 1: run prepared-answer browser acceptance; verify RED for missing AI view.**
- [ ] **Step 2: implement minimal stream/composer and prepared-answer rendering from local router.**
- [ ] **Step 3: verify prepared quick action generates zero `/api/assistant/**` requests.**
- [ ] **Step 4: write/run RED for free-form request showing stable muted thinking state before delayed fake response.**
- [ ] **Step 5: implement generative adapter and thinking/error lifecycle.**
- [ ] **Step 6: verify AI failure still allows one-action switch to form and does not lose conversation.**
- [ ] **Step 7: verify reduced-motion thinking variant and complete-response live announcement.**

**Ready when:** local-first AI experience is complete against fake generative backend and direct form remains independent.

---

### Task 12: Explicit AI writer -> form handoff

**Requirements:** P-007..009, AI-013, #715

**Files:**
- Modify `src/components/contact-hub-ai.ts`
- Modify `src/components/contact-hub-form.ts`
- Modify `src/components/contact-hub.ts`

- [ ] **Step 1: write RED proving AI draft is not inserted into form merely by switching mode.**
- [ ] **Step 2: write RED proving explicit `Написать напрямую` handoff inserts only selected draft text and preserves existing form email/name.**
- [ ] **Step 3: implement explicit handoff event with conflict-safe behavior when message field is non-empty.**
- [ ] **Step 4: verify form never sends automatically and can be freely edited after handoff.**

**Ready when:** handoff is explicit, bounded and privacy-safe.

---

### Task 13: Analytics integration without PII

**Requirements:** AN-001..006, PRV-001..006

**Files:**
- Modify `src/components/site-analytics.ts`
- Modify existing analytics test or add the smallest focused contract test.
- Do not change `/privacy/` yet unless frontend phase is immediately entering release; privacy release sync belongs to release/backend integration gate.

- [ ] **Step 1: write RED for `contact_form_open` classification and `contact_form_submit` only on confirmed accepted response.**
- [ ] **Step 2: implement minimal event calls with safe context only.**
- [ ] **Step 3: write RED that name/email/message/filename cannot appear in goal params.**
- [ ] **Step 4: implement allowlisted analytics params and verify existing `contact_email` remains unchanged.**
- [ ] **Step 5: verify analytics denied path still submits form through fake transport.**

**Ready when:** conversion semantics are correct and no PII crosses analytics boundary.

---

### Task 14: Cross-browser/responsive/performance affected verification

**Requirements:** W, PET, H, M, MV, AX, PERF families

**Files:**
- `tools/e2e/contact-hub-acceptance.mjs`
- Add only focused AFFECTED helpers if one file becomes unstable or unreadable.
- No automatic addition to ordinary push/PR CI without separate policy decision.

- [ ] **Step 1: run full Contact Hub affected Chromium acceptance matrix.**
- [ ] **Step 2: fix only observed contract failures through new focused RED -> GREEN cycles; do not weaken assertions to fit implementation.**
- [ ] **Step 3: run `npm run typecheck`, relevant Node contract tests, `npm run lint:style` for changed CSS, `npm run css:check`, `npm run build:site`.**
- [ ] **Step 4: run existing `npm run test:ui:responsive` to ensure widget changes did not regress current navigation responsive behavior.**
- [ ] **Step 5: perform focused keyboard/reduced-motion pass.**
- [ ] **Step 6: perform real Mobile Safari and Android Chrome browser-chrome/keyboard checks; record evidence separately.**
- [ ] **Step 7: inspect core Web Vitals/perf only to the extent required to prove no material widget regression; no unrelated optimization project.**

**Ready when:** frontend acceptance is GREEN against fake network boundaries and manual browser risks are recorded.

---

### Task 15: Test lifecycle classification and frontend closeout

**Requirements:** repository `docs/testing-policy.md`, spec Sections 8-11

- [ ] **Step 1: list every new/changed test.**
- [ ] **Step 2: for each test answer all five permanent-test criteria from `docs/testing-policy.md`.**
- [ ] **Step 3: mark `KEEP` only for cheap long-lived domain contracts.**
- [ ] **Step 4: mark browser/responsive/widget acceptance `MOVE` to AFFECTED/FULL unless repository policy is explicitly changed.**
- [ ] **Step 5: delete TEMPORARY implementation/reproduction tests that no longer protect a long-lived contract.**
- [ ] **Step 6: do not modify `test:fast` unless a separate explicit review approves specific KEEP tests.**
- [ ] **Step 7: rerun final relevant verification after deletions/moves.**
- [ ] **Step 8: final report must include exactly:**

```text
NEW PERMANENT TESTS: N
TEMPORARY TESTS REMOVED: N
MOVED TO AFFECTED/FULL: N
```

**Frontend Definition of Done:** every Frontend DoD item in the spec is either GREEN automated evidence or explicitly recorded focused manual evidence; backend remains fake/unavailable and no claim of real email delivery is made.

---

## Self-review / traceability

- P/H/W/V/AX contracts: Tasks 2, 7, 14.
- Form/draft/validation: Tasks 3, 9, 10.
- Pet identity/motion/drag/hide: Tasks 1, 4, 6, 14.
- Mobile/collapse/browser chrome: Tasks 8, 14.
- Prepared answers/token economy: Tasks 1, 5, 11.
- AI failure isolation: Tasks 2, 11.
- Explicit AI -> form handoff: Task 12.
- Analytics/privacy frontend: Task 13.
- Test lifecycle: Task 15.
- Backend delivery/storage/security: intentionally excluded from implementation tasks here and owned by the backend plan.
