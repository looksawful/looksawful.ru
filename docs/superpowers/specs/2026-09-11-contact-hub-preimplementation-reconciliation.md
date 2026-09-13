# Contact Hub + Awful Pre-implementation Reconciliation

Status: **NORMATIVE COMPANION TO THE CANONICAL PRODUCT CONTRACT**

Date: 2026-09-11

This document records requirements discovered by the five pre-implementation audit domains after `2026-09-11-contact-hub-pet-product-contract.md` was authored. Where it adds specificity, this document is normative. It does not relax any requirement in the main product contract.

## 1. Overlay arbitration contract

The existing site already has fixed/sticky surfaces. In particular, site navigation uses a high stacking layer and the analytics-consent control is fixed in the bottom-left, the same default region as Awful. A solution that merely assigns the pet an even larger `z-index` is invalid.

Add the following observable requirements:

- **OV-001** The analytics-consent control is never covered by Awful, the Contact Hub, or the collapsed launcher.
- **OV-002** When analytics consent and the closed pet would occupy the same bottom-left region, the widget runtime resolves the collision by moving/suppressing/temporarily compacting the widget, not by changing page flow.
- **OV-003** The visitor can complete analytics-consent actions without first interacting with the pet.
- **OV-004** An open Contact Hub has one deterministic priority rule relative to site navigation and media/lightbox surfaces.
- **OV-005** A competing modal/lightbox cannot leave focus trapped behind Contact Hub, and Contact Hub cannot leave focus trapped behind a competing modal.
- **OV-006** Pet autonomous return never occurs on top of an active consent control, Hub, media lightbox, or other product modal.
- **OV-007** Collapsed mobile launcher is also subject to collision arbitration and safe-area clamping.
- **OV-008** Collision resolution changes only widget geometry/visibility and leaves underlying site rectangles unchanged.
- **OV-009** Overlay arbitration is deterministic after resize/orientation change and does not oscillate between two positions.
- **OV-010** No arbitrary global `z-index: 999999` convention is accepted as proof of correct arbitration.

Implementation may use a shared overlay coordinator, explicit active-surface policy, DOM observation, state composition, or another small mechanism. Tests assert reachability and non-overlap, not the mechanism.

## 2. Browser and mobile evidence contract

- **MV-007** Playwright viewport resizing is accepted as an automated geometry regression check only.
- **MV-008** Claims about Safari address-bar collapse, keyboard/VisualViewport behavior or safe-area hardware require focused real Mobile Safari evidence before release.
- **MV-009** Android Chrome keyboard/browser-chrome behavior is a compatibility target and should receive a focused real-device check before release when available.
- **MV-010** A real-device check may be manual but must record device/browser, route, viewport/orientation, tested states and observed result.
- **MV-011** Failure to obtain real-device evidence blocks claims about those platform-specific behaviors, but does not invalidate narrower Chromium geometry evidence.

## 3. Acceptance-test selector policy

The broad browser acceptance suite must not freeze speculative UI implementation or editable copy.

- **TST-001** The broad suite must not require `role=tab` unless the approved accessibility design explicitly chooses tabs.
- **TST-002** Mode-entry tests prove user-visible mode results: direct form controls are usable after form entry; assistant composer/content is usable after AI entry.
- **TST-003** Exact authored labels are not permanent structural selectors unless copy is explicitly locked as a contract.
- **TST-004** Stable functional semantics such as `input[type=email]`, `textarea`, dialog semantics, focus ownership, status semantics, form submission and external request boundaries may be used as evidence because they describe user/browser behavior.
- **TST-005** Temporary test hooks are allowed during RED/GREEN when necessary, but must be classified DELETE or justified as a stable AFFECTED test contract before completion.
- **TST-006** Main browser acceptance remains AFFECTED/FULL and is not added to `test:fast`.
- **TST-007** Pure gesture numeric thresholds in initial RED tests are provisional; final permanent tests protect activation-vs-drag-vs-hide behavior across representative motions, not arbitrary historical pixel constants.

## 4. Privacy and analytics release gate

The public privacy page remains production-truth only during implementation. Do not preannounce undeployed processing.

Before activating the direct form publicly:

- **REL-PRV-001** `/privacy/` describes the actual direct-contact data flow and purposes.
- **REL-PRV-002** If attachments are enabled, `/privacy/` describes private temporary storage and lifecycle deletion consistent with real configuration.
- **REL-PRV-003** If AI is enabled, privacy copy distinguishes AI chat processing from direct-form processing.
- **REL-PRV-004** Metrika/Webvisor configuration is verified not to record visitor-entered form values; `Записывать все поля` must not expose the form.
- **REL-PRV-005** Contact submission works when analytics is denied and under GPC/DNT.
- **REL-AN-001** `contact_form_open` is emitted only from the actual form-opening interaction if kept in final analytics design.
- **REL-AN-002** `contact_form_submit` is emitted only after confirmed backend acceptance.
- **REL-AN-003** Analytics payload contains no name, email, message, filename, attachment contents or validation text.

## 5. PR #724 reconciliation rule

PR #724 is not merged wholesale. Reconciliation occurs file-by-file against current `dev` lineage:

Keep/refine candidates:
- feature-flag/lazy mount;
- generic sprite-manifest validation;
- knowledge approval/provenance boundary;
- contextual character resolver where still useful;
- deterministic intent-routing idea;
- lifecycle cleanup patterns.

Superseded candidates:
- pet-owned panel/dialog;
- combined pet + AI-view state reducer;
- bottom-right fixed placement;
- CSS placeholder anatomy;
- current floating-card visual system;
- exact-string-only router as complete answer routing.

Every copied test is separately classified under `docs/testing-policy.md`.

## 6. Reconciled pre-implementation gate

Frontend production implementation may start only when all are true:

1. main product contract exists;
2. this reconciliation companion exists;
3. frontend plan and backend plan exist;
4. five audit reports exist and their blocking findings are incorporated;
5. broad acceptance no longer forces speculative tab/copy decisions;
6. an isolated runnable environment has produced intended RED for the first frontend slice;
7. RED failure is due to missing required behavior, not syntax, imports, toolchain or stale branch state.

**Gate status: SATISFIED.**

Cloud evidence is GitHub Actions run `34619142083` on commit `eb16730fa0c6dd6a82271434721fe64fab26e416`. The branch-only temporary workflow proved successful checkout, Node 24 setup, `npm ci`, intended contract RED, successful `npm run build:vite`, pinned Chromium installation, and intended browser acceptance RED.

The canonical development rule for this feature is now: ordinary verification runs in an isolated cloud environment. A personal/local workstation is not required for normal RED/GREEN work. The temporary workflow must be removed before merge.

## 7. Frontend Definition of Ready after RED

Frontend implementation is ready to start.

Implementation proceeds task-by-task with one behavior seam at a time. A later task cannot be used as an excuse to make an earlier RED green through a giant cross-cutting implementation.

At each task:

`write/refine focused test -> cloud RED -> minimal implementation -> cloud GREEN -> focused review -> provisional KEEP/MOVE/DELETE classification`.

This project does not require every exploratory browser detail to be proven before code can move forward. Cheap domain/contract behavior is tested early; responsive/browser/visual checks run at the appropriate AFFECTED stage once the corresponding UI exists.

Final frontend completion additionally requires affected browser acceptance, visual review, focused real-device mobile evidence, accessibility checks and no regression to underlying site behavior.