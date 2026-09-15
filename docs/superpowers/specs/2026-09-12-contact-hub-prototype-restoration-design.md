# Contact Hub prototype restoration design

Date: 2026-09-12
Status: approved direction, implementation pending
Target: PR #788 / `contact-hub-frontend-current`

## Source of truth

The visual and interaction reference is the approved `contact-hub-awful-minimal-v7.html` prototype from the ChatGPT Library. The current Contact Hub product contract and state/domain modules remain the architectural source of truth. Prototype code is reference material only and must not reintroduce obsolete ownership or routing.

## Restore from v7

- One shared Contact Hub shell for AI and Form.
- Header mode actions: `AI` and `написать`, plus close action.
- Awful opens the Hub in AI mode; the existing site contact CTA opens it in Form mode.
- AI view uses the prototype's plain message stream, inline text actions, and bottom composer.
- Form view uses editorial rows for `имя`, `email`, `сообщение`, plus `+ файл`, `отправить`, and the existing mail fallback.
- Visual direction stays site-like: Inter, thin borders, light elevation, restrained radius, text actions, no status dot/name, bubbles, pills, glass, or nested card UI.
- Desktop remains a compact fixed shell adjacent to Awful; mobile remains a bottom sheet using dynamic viewport units.

## AI → Form handoff

The prototype did not define transfer semantics, so the current canonical domain contract fills that gap without changing the prototype's visual language.

- Switching between `AI` and `написать` never copies data by itself.
- A transfer occurs only from an explicit action associated with a selected/generated AI draft.
- Only the selected draft text may cross into Form. Chat history and AI context do not.
- Existing `name` and `email` values are preserved.
- Empty Form message: insert the selected draft and switch to Form.
- Non-empty Form message: require an explicit append/replace/cancel decision before mutation.
- Handoff never submits the form.
- The existing `applyExplicitAiDraftHandoff()` domain function remains the only merge/replace authority.

## State ownership

`ContactHubState` continues to own shell visibility, mode, entry point, and AI availability only. Form field values remain form-owned. AI transcript/composer state remains AI-owned. Handoff is an explicit boundary operation, not shared mutable state.

## Implementation boundary

Production changes should be limited to the Contact Hub UI/controller, its styles, and focused UI/E2E contracts. Existing author website copy and site geometry outside the overlay must not be rewritten or restructured.

The production assistant stays fail-closed for unapproved knowledge. This restoration must not change provider routing, approval policy, Yandex integration, analytics goals, backend deployment, or release/merge gates.

## Test contract

RED tests must be added before production UI code. They must prove:

1. Site CTA opens the shared shell in Form mode and Awful opens it in AI mode.
2. Mode switching alone does not copy AI text into Form.
3. Explicit handoff inserts selected AI draft into an empty message while preserving name/email.
4. Existing message requires an explicit decision; append and replace work; cancel leaves the draft untouched.
5. Handoff never submits and never transfers transcript/history.
6. Existing Escape/focus restoration, viewport containment, no-horizontal-overflow, persistence, prepared-answer, service/client, and typecheck contracts remain green.

## Non-goals

- Rebuilding the entire AI assistant in this slice.
- Enabling production generative answers before knowledge approval.
- Recreating obsolete prototype routing or app-like panel chrome.
- Changing the site's authored text.
