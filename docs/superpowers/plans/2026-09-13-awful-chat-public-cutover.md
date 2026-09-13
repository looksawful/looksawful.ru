# Awful Chat Public Site Cutover Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce `looksawful.ru` to the Awful/Contact Hub presentation layer plus a thin HTTP client, switch PR preview to the private `awful-chat` staging service, then remove duplicated AI knowledge/provider/router code from the public repository.

**Architecture:** The browser sends message, locale, sessionId, and currentPath to a concrete staging/production Awful Chat endpoint. It does not build or authorize knowledge, select source IDs, run prepared-answer routing, or call Yandex directly. Existing Contact Hub UX and the separate owner visual approval gate remain unchanged.

**Tech Stack:** Vite 8, strict TypeScript, vanilla DOM, Playwright/Node E2E, Cloudflare Pages PR preview, private Awful Chat HTTPS API.

**Spec:** `looksawful/awful-chat/docs/superpowers/specs/2026-09-13-awful-chat-repository-extraction-design.md`

## Global Constraints

- Canonical name is `Awful`; `Venus` must not appear in active source, tests, workflows, or docs for this feature.
- Initial chat greeting remains exactly `Привет.` and does not introduce the assistant.
- Quick-action suggestion chips remain absent.
- Awful UI, sprites, animation runtime, drag/hide/restore, Contact Hub UI, CSS, draft handoff, and browser session persistence remain in `looksawful.ru`.
- Approved knowledge, source selection, prepared answers, Yandex prompt/provider, backend rate limiting, and server response policy move to `awful-chat`.
- Do not expose a Yandex credential in this repository or its frontend bundle.
- Do not switch preview until the private staging endpoint has passed the `awful-chat` smoke gate.
- Do not delete the old preview AI path until the new staging path passes browser integration.
- PR #788 remains draft and cannot merge or deploy Awful to production before explicit owner visual approval.

---

### Task 1: Replace the source-aware transport with the v1 thin client contract

**Files:**
- Modify: `src/features/portfolio-pet/assistant-transport.ts`
- Modify: `test/portfolio-assistant-transport-contract.test.mjs`

**Interfaces:**
- Consumes: concrete `endpoint`, `sessionId`, message, locale, and page/currentPath.
- Produces: `PortfolioAssistantTransport.reply(input)` returning `answer | no_data | rate_limited | unavailable`.

- [ ] **Step 1: Write RED request-shape tests**

The expected browser request is exactly:

```json
{
  "message": "Расскажи про Styx",
  "locale": "ru",
  "sessionId": "awful-session",
  "context": {
    "currentPath": "/work/styx/"
  }
}
```

Add assertions that the serialized request does not contain:

```text
sourceIds
profile.about
project.styx
CONTEXT
Yandex
```

Keep tests for timeout, 429, non-2xx, malformed JSON, empty answer, and safe source response parsing.

- [ ] **Step 2: Run RED**

Run:

```bash
node --test test/portfolio-assistant-transport-contract.test.mjs
```

Expected: FAIL because current transport imports knowledge and sends `sourceIds`.

- [ ] **Step 3: Replace transport types**

Use:

```ts
export interface PortfolioAssistantRequest {
  message: string;
  locale: "ru" | "en";
  context: { currentPath: string };
}

export type PortfolioAssistantTransportResult =
  | { kind: "answer"; text: string; sources: readonly string[] }
  | { kind: "no_data"; text: string; sources: readonly string[] }
  | { kind: "rate_limited" }
  | { kind: "unavailable" };

export interface PortfolioAssistantTransport {
  reply(input: PortfolioAssistantRequest): Promise<PortfolioAssistantTransportResult>;
}
```

Remove these imports/dependencies entirely:

```text
buildPortfolioPetKnowledgeCandidates
PortfolioAssistantRoute
KNOWN_SOURCE_IDS
safeRequestSourceIds
safeCurrentPath(sourceIds-aware form)
```

- [ ] **Step 4: Implement path-only request serialization**

Normalize path with the public site origin and permit only:

```text
/
/work/<single-segment-slug>/
```

Foreign absolute origins collapse to `/`.

POST body:

```ts
body: JSON.stringify({
  message: input.message,
  locale: input.locale,
  sessionId,
  context: { currentPath: safeCurrentPath(input.context.currentPath) },
})
```

- [ ] **Step 5: Run test and typecheck**

Run:

```bash
node --test test/portfolio-assistant-transport-contract.test.mjs
npm run typecheck
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/features/portfolio-pet/assistant-transport.ts test/portfolio-assistant-transport-contract.test.mjs
git commit -m "refactor: make Awful transport a thin HTTP client"
```

---

### Task 2: Simplify the assistant client and Contact Hub result mapping

**Files:**
- Modify: `src/features/portfolio-pet/assistant-client.ts`
- Modify: `src/components/contact-hub.ts`
- Modify: `test/portfolio-assistant-client-contract.test.mjs`
- Modify: `test/contact-hub-prototype-ui-contract.test.mjs`

**Interfaces:**
- Consumes: `PortfolioAssistantTransport.reply()` from Task 1.
- Produces: Contact Hub rendering of `answer | no_data | rate_limited | unavailable` without a frontend router.

- [ ] **Step 1: Write RED client test**

Expected implementation contract:

```ts
export function createPortfolioAssistantClient(options: PortfolioAssistantTransportOptions) {
  return createPortfolioAssistantTransport(options);
}
```

No router dependency parameter exists.

- [ ] **Step 2: Run RED**

Run:

```bash
node --test test/portfolio-assistant-client-contract.test.mjs
```

Expected: FAIL because current client imports `portfolio-chat-service.ts` and `prepared-answers.ts`.

- [ ] **Step 3: Simplify `assistant-client.ts`**

Remove imports of:

```text
createPortfolioChatService
PortfolioAssistantRouter
prepared-answers.ts
portfolio-chat-service.ts
```

Return the transport directly.

- [ ] **Step 4: Update Contact Hub construction**

Remove:

```ts
import { createPreviewPortfolioAssistantRouter } from "../features/portfolio-pet/prepared-answers.ts";
```

Replace preview-router construction with one client:

```ts
const assistantClient = createPortfolioAssistantClient({
  sessionId: resolveAssistantSessionId(root),
  endpoint: resolveAwfulChatEndpoint(root),
});
```

Define endpoint resolution so a build-time non-secret value wins:

```ts
function resolveAwfulChatEndpoint(documentRef: Document): string {
  const configured = String(import.meta.env.VITE_AWFUL_CHAT_ENDPOINT ?? "").trim();
  if (configured) return configured;
  return "https://api.looksawful.ru/v1/portfolio-chat";
}
```

- [ ] **Step 5: Update message submission**

Call:

```ts
const result = await assistantClient.reply({
  message,
  locale: root.documentElement.lang.toLowerCase().startsWith("en") ? "en" : "ru",
  context: { currentPath: root.defaultView?.location.pathname ?? "/" },
});
```

Replace:

```ts
if (result.kind === "prepared" || result.kind === "generated")
```

with:

```ts
if (result.kind === "answer")
```

Keep exact UI fallback strings:

```text
no_data: Про это у меня нет точной информации. Лучше написать мне напрямую.
rate_limited: Слишком много запросов. Попробуй ещё раз через минуту.
unavailable: Чат сейчас недоступен. Лучше написать мне напрямую через форму.
```

Keep the initial log message exactly `Привет.`.

- [ ] **Step 6: Run focused contracts and typecheck**

Run:

```bash
node --test test/portfolio-assistant-client-contract.test.mjs test/contact-hub-prototype-ui-contract.test.mjs
npm run typecheck
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/features/portfolio-pet/assistant-client.ts src/components/contact-hub.ts test/portfolio-assistant-client-contract.test.mjs test/contact-hub-prototype-ui-contract.test.mjs
git commit -m "refactor: route Contact Hub through private Awful Chat API"
```

---

### Task 3: Switch PR preview to the proven private staging endpoint

**Files:**
- Modify: `.github/workflows/pr-preview.yml`
- Modify: `test/pr-preview-workflow.test.mjs`
- Retain temporarily: `tools/build-preview-assistant-worker.mjs`
- Retain temporarily: `test/preview-assistant-worker-contract.test.mjs`

**Interfaces:**
- Consumes: the concrete staging endpoint emitted/recorded after `awful-chat` Task 6 smoke passes.
- Produces: PR preview bundle with `VITE_AWFUL_CHAT_ENDPOINT=<proven staging URL>`.

- [ ] **Step 1: Write RED workflow tests**

Require the build step to receive only the non-secret variable:

```yaml
env:
  VITE_AWFUL_CHAT_ENDPOINT: ${{ vars.AWFUL_CHAT_STAGING_ENDPOINT }}
```

Add assertions that the preview workflow does not expose or require:

```text
YANDEX_AI_API_KEY
YANDEX_OAUTH_TOKEN
YANDEX_REFRESH_TOKEN
YANDEX_CLIENT_SECRET
```

Do not remove the old preview worker in this task yet.

- [ ] **Step 2: Run RED**

Run:

```bash
node --test test/pr-preview-workflow.test.mjs
```

Expected: FAIL until workflow uses the staging endpoint variable.

- [ ] **Step 3: Update preview build configuration**

Pass `VITE_AWFUL_CHAT_ENDPOINT` only to the Vite build step. It is an endpoint URL, not a credential.

Fail the preview job before build when the variable is empty:

```bash
test -n "$VITE_AWFUL_CHAT_ENDPOINT" || { echo "AWFUL_CHAT_STAGING_ENDPOINT is required"; exit 1; }
```

- [ ] **Step 4: Run workflow tests**

Run:

```bash
node --test test/pr-preview-workflow.test.mjs
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add .github/workflows/pr-preview.yml test/pr-preview-workflow.test.mjs
git commit -m "ci: point Awful preview at private staging service"
```

---

### Task 4: Prove the new browser-to-private-service path before deleting fallback code

**Files:**
- Modify: `tools/e2e/contact-hub-shell-contract.mjs`
- Modify: `tools/e2e/contact-hub-mobile-contract.mjs`
- Create: `tools/e2e/awful-chat-remote-contract.mjs`

**Interfaces:**
- Consumes: deployed PR preview and private staging endpoint.
- Produces: evidence that browser UI states work with the real cross-repository API.

- [ ] **Step 1: Add a gated remote E2E script**

Require:

```text
AWFUL_PREVIEW_URL
```

Open `?pet=1`, click Awful, submit:

```text
Кто ты по профессии?
```

Assert:

```text
- AI mode opens from Awful
- user message appears
- pending `думаю…` appears before completion
- final bot response is non-empty
- final response does not contain `Venus`
- final response does not match /\+7\s*999/
- composer re-enables
```

Then submit a deliberately unsupported personal question and assert the safe no-data/fallback behavior rather than invented biography.

- [ ] **Step 2: Run existing local UI E2E**

Run the existing Contact Hub shell/mobile scripts against the built site.

Expected: all current viewport and launcher contracts remain green.

- [ ] **Step 3: Run the gated remote path**

Run:

```bash
AWFUL_PREVIEW_URL="<exact published PR preview URL>" node tools/e2e/awful-chat-remote-contract.mjs
```

Expected: PASS with an actual backend `answer` and safe fallback case.

- [ ] **Step 4: Commit the remote contract**

```bash
git add tools/e2e/awful-chat-remote-contract.mjs tools/e2e/contact-hub-shell-contract.mjs tools/e2e/contact-hub-mobile-contract.mjs
git commit -m "test: verify Awful Chat cross-repository preview path"
```

---

### Task 5: Delete public AI-domain and direct-Yandex preview implementation only after Task 4 is GREEN

**Files:**
- Delete: `src/features/portfolio-pet/knowledge.ts`
- Delete: `src/features/portfolio-pet/prepared-answers.ts`
- Delete: `src/features/portfolio-pet/portfolio-chat-service.ts`
- Delete: `test/portfolio-assistant-prepared-contract.test.mjs`
- Delete: `test/portfolio-chat-service-contract.test.mjs`
- Delete: `test/preview-assistant-worker-contract.test.mjs`
- Delete: `tools/build-preview-assistant-worker.mjs`
- Delete or retire if now unused: `.github/workflows/portfolio-assistant-transport-tdd.yml`
- Delete or retire if now unused: `.github/workflows/portfolio-chat-service-tdd.yml`
- Delete or retire if now unused: `.github/workflows/yandex-ai-smoke-once.yml`
- Modify: `tools/ci/run-tests.mjs`
- Modify: `test/repository-structure.test.mjs`

**Interfaces:**
- Consumes: proven private staging path from Task 4.
- Produces: public repository with no approved AI knowledge, server router, Yandex provider/smoke implementation, or client-selected source IDs.

- [ ] **Step 1: Write RED repository-structure assertions**

Assert these paths do not exist:

```text
src/features/portfolio-pet/knowledge.ts
src/features/portfolio-pet/prepared-answers.ts
src/features/portfolio-pet/portfolio-chat-service.ts
tools/build-preview-assistant-worker.mjs
```

Assert active frontend source has no imports matching:

```text
knowledge.ts
prepared-answers.ts
portfolio-chat-service.ts
```

Assert active `src/` and `.github/workflows/` contain no Yandex credential identifier names.

- [ ] **Step 2: Run structure test and verify RED**

Run:

```bash
node --test test/repository-structure.test.mjs
```

Expected: FAIL because old paths still exist.

- [ ] **Step 3: Delete migrated files and update test registry**

Remove only the files listed above. Keep:

```text
assistant-client.ts
assistant-transport.ts
awful-manifest.ts
character-context.ts
feature-flag.ts
interaction.ts
preferences.ts
sprite-manifest.ts
sprite-runtime.ts
```

Update `tools/ci/run-tests.mjs` so deleted suites are no longer referenced and the thin-client contracts remain in the fast/CI groups.

- [ ] **Step 4: Run full frontend verification relevant to the PR**

Run:

```bash
npm run typecheck
npm run test:fast
npm run build:site
```

Then run Contact Hub desktop/mobile launcher/scale E2E scripts.

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor: remove migrated Awful AI domain from public site"
```

---

### Task 6: Retire the superseded public backend PR without changing production release status

**Repositories:**
- `looksawful/looksawful.ru` PR #790
- `looksawful/looksawful.ru` PR #788
- `looksawful/awful-chat`

**Interfaces:**
- Consumes: green private staging service and green PR #788 preview.
- Produces: one authoritative backend repository and an unchanged manual production gate.

- [ ] **Step 1: Record supersession in PR #790**

Add a PR comment stating:

```text
Backend implementation has moved to private repository looksawful/awful-chat under the approved repository-extraction design. This PR is superseded and must not be merged into looksawful.ru.
```

- [ ] **Step 2: Close PR #790 as superseded, not merged**

Do not merge its `server/public-assistant/**` files into `dev`.

- [ ] **Step 3: Update PR #788 description**

State that AI runtime/knowledge is now owned by `looksawful/awful-chat`; PR #788 owns only the public Awful/Contact Hub frontend and thin transport.

Retain verbatim the owner visual approval gate: green CI, backend readiness, and preview availability do not authorize production exposure.

- [ ] **Step 4: Final preview verification**

Verify exact PR preview once more after all public AI-domain files are removed.

Expected: Awful opens Contact Hub, greeting is `Привет.`, live answer succeeds via private backend, phone is never disclosed, no `Venus`, form path remains unchanged.

- [ ] **Step 5: Do not merge PR #788**

Stop at the existing manual visual approval gate.

---

## Plan self-review

- Spec coverage: thin browser contract, no source IDs, private backend staging, preserved UI, delayed deletion, no Yandex secrets, remote E2E, superseded #790 and unchanged visual gate all have explicit tasks.
- Placeholder scan: no TBD/TODO/"implement later" steps. The staging URL is an output of the preceding backend deployment and is injected through a named non-secret repository variable rather than hardcoded as an unknown placeholder.
- Type consistency: transport/client/Contact Hub all use `answer | no_data | rate_limited | unavailable`; `currentPath` is the only page context sent by the browser.
