# Contact Hub Direct-Contact Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Provide a narrow public Yandex-backed direct-contact service for looksawful.ru that validates form submissions, supports private temporary attachments up to the 20 MB UX target, sends exactly one primary email plus one receipt per accepted logical submission, and remains independent from the AI assistant service.

**Architecture:** A public API Gateway routes `/api/contact/*` to a dedicated contact Cloud Function/service. Browser attachments upload directly to a private Object Storage bucket through short-lived authorization, then the send service verifies object metadata and emails a temporary signed download link through Yandex Postbox. A tiny TTL idempotency ledger stores no message body/PII and exists only to prevent duplicate deliveries across retries. This is not the private `awful-control` control plane and it has no AI/model/admin permissions.

**Tech Stack:** Yandex API Gateway, Cloud Functions (or equivalent narrow serverless runtime), Yandex Postbox, private Object Storage, TTL-capable YDB/serverless metadata store for idempotency, TypeScript/Node where provider support permits, GitHub Actions deployment only after an explicit infrastructure/release task.

**Spec:** `docs/superpowers/specs/2026-09-11-contact-hub-pet-product-contract.md`

## Global Constraints

- Backend work starts only after the frontend submission/upload response schemas are stable and frontend fake adapters are GREEN.
- Public contact backend is a separate trust boundary from `awful-control` and from the public AI assistant service.
- No provider credential, bucket credential or service secret in the static frontend.
- Fixed destination: `i@lookawful.ru`.
- Fixed subject: `LOOKSAWFUL — новое сообщение`.
- Visitor email is `Reply-To`, never an unverified `From` identity.
- No persistent submission/message database.
- Idempotency metadata may persist briefly with TTL but must contain no message body, attachment bytes, name or email.
- Attachment binary never passes through the Cloud Function request body.
- No visible CAPTCHA by default; rate limit + honeypot + server validation first.
- All server behavior is developed RED -> GREEN against fake provider adapters before real-provider smoke.

---

## Proposed repository boundary

At backend implementation start, create or designate a dedicated public-service repository, recommended name `looksawful/awful-public-contact`, unless the pre-implementation architecture audit selects an existing repository with the same public trust level.

Do **not** place anonymous contact runtime inside private `awful-control` merely to reuse credentials. Shared provider helpers may be extracted later, but deployment identities and permissions remain separate.

Main portfolio repo keeps only frontend schemas/docs and endpoint configuration. Backend repo owns runtime code, IaC/deployment definitions, provider adapters and backend tests.

---

## Public API contract

### `POST /api/contact/attachment-upload`

Request:

```ts
interface AttachmentUploadRequest {
  submissionId: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
}
```

Response on authorization:

```ts
interface AttachmentUploadAuthorization {
  kind: "authorized";
  objectKey: string;
  uploadUrl: string;
  expiresAt: string;
}
```

The endpoint validates declared MIME/size before issuing a short-lived upload URL. The later send endpoint performs a server-side HEAD/metadata verification before delivery; client-declared size/type is never trusted as final truth.

### `POST /api/contact/send`

Request:

```ts
interface ContactSendRequest {
  submissionId: string;
  name: string;
  email: string;
  message: string;
  attachment?: { objectKey: string };
  context: {
    currentPath: string;
    language: "ru" | "en";
    entryPoint: "pet" | "pet-direct" | "site-contact" | "collapsed-launcher";
    activeMode: "form";
  };
  honeypot?: string;
}
```

Responses:

```ts
type ContactSendResponse =
  | { kind: "accepted"; submissionId: string }
  | { kind: "invalid"; fieldErrors: Record<string, string> }
  | { kind: "rate_limited" }
  | { kind: "unavailable" };
```

No response contains provider internals or sensitive debug detail.

---

### Task 1: Backend domain schema and validation

**Requirements:** F-003..010, A-001..004, SEC-002..005

**Files in backend repo:**
- Create `src/contact/schema.ts`
- Create `test/contact-schema.test.ts`

**Interfaces:**

```ts
export const CONTACT_MESSAGE_MAX_LENGTH = 5000;
export const CONTACT_ATTACHMENT_MAX_BYTES = 20 * 1024 * 1024;
export const CONTACT_ALLOWED_MIME_TYPES: ReadonlySet<string>;

export function parseContactSendRequest(input: unknown): ContactSendRequest;
export function parseAttachmentUploadRequest(input: unknown): AttachmentUploadRequest;
```

- [ ] **Step 1: write failing tests for valid payload, optional name, required email/message, message cap, unknown fields/header injection and attachment declared size/type.**
- [ ] **Step 2: run focused tests and confirm RED from missing behavior.**
- [ ] **Step 3: implement strict parsers with allowlisted fields and safe normalization.**
- [ ] **Step 4: rerun to GREEN.**

**Ready when:** client validation can be bypassed without weakening server rules; arbitrary destination/header fields are impossible.

---

### Task 2: Provider-neutral delivery model

**Requirements:** S-014..015, SEC-001..003

**Files:**
- Create `src/contact/delivery.ts`
- Create `src/providers/mail.ts`
- Create `test/contact-delivery.test.ts`

**Interfaces:**

```ts
export interface MailMessage {
  from: string;
  to: readonly string[];
  replyTo?: string;
  subject: string;
  text: string;
}

export interface MailProvider {
  send(message: MailMessage): Promise<{ providerMessageId: string }>;
}

export interface ContactDeliveryService {
  deliver(input: VerifiedContactSubmission): Promise<{ primaryMessageId: string; receiptStatus: "sent" | "degraded" }>;
}
```

- [ ] **Step 1: write RED proving one verified submission builds one primary message to `i@lookawful.ru` with verified service `From` and visitor `Reply-To`.**
- [ ] **Step 2: implement provider-neutral message builders and fake provider.**
- [ ] **Step 3: write RED proving successful primary delivery triggers one receipt, while primary failure triggers no success receipt.**
- [ ] **Step 4: implement receipt sequencing. If primary succeeds but receipt fails, return accepted delivery with degraded receipt status internally; do not encourage a retry that duplicates the primary message.**
- [ ] **Step 5: verify user HTML/mail-header text is rendered as plain text and line breaks are preserved.**

**Ready when:** delivery semantics are proven without Yandex credentials.

---

### Task 3: TTL idempotency ledger

**Requirements:** S-002..015, especially S-003/S-013/S-014

**Files:**
- Create `src/contact/idempotency.ts`
- Create `src/providers/idempotency-store.ts`
- Create `test/contact-idempotency.test.ts`

**Data policy:** store only opaque/hash key, status, timestamps and safe provider result identifiers. Do not store name/email/message/filename.

**Interface:**

```ts
export interface IdempotencyStore {
  begin(key: string, ttlSeconds: number): Promise<"acquired" | "existing_pending" | "existing_accepted">;
  accept(key: string, result: { submissionId: string }): Promise<void>;
  releaseFailed(key: string): Promise<void>;
}
```

- [ ] **Step 1: write RED for two concurrent identical submission IDs producing one acquired delivery lease.**
- [ ] **Step 2: implement in-memory fake semantics.**
- [ ] **Step 3: write RED for retry after accepted result returning accepted without a second mail send.**
- [ ] **Step 4: implement orchestration around delivery service.**
- [ ] **Step 5: later implement YDB/serverless adapter with TTL and conditional acquisition; keep provider adapter tests separate.**

**Ready when:** duplicate browser activation and ambiguous network retry cannot multiply primary emails.

---

### Task 4: Private Object Storage upload authorization

**Requirements:** A-001..011, SEC-004

**Files:**
- Create `src/contact/attachments.ts`
- Create `src/providers/object-storage.ts`
- Create `test/contact-attachments.test.ts`

**Interface:**

```ts
export interface ObjectStorageProvider {
  createUploadAuthorization(input: {
    objectKey: string;
    mimeType: string;
    expiresInSeconds: number;
  }): Promise<{ uploadUrl: string; expiresAt: string }>;
  head(objectKey: string): Promise<{ sizeBytes: number; mimeType: string } | null>;
  createDownloadUrl(objectKey: string, expiresInSeconds: number): Promise<string>;
}
```

- [ ] **Step 1: RED: invalid MIME/declared oversize gets no upload authorization.**
- [ ] **Step 2: implement authorization policy and random scoped object key.**
- [ ] **Step 3: RED: send with attachment must HEAD-check actual object size/type and reject missing/oversize/mismatched object.**
- [ ] **Step 4: implement verification before mail construction.**
- [ ] **Step 5: RED: verified object yields a temporary download URL in primary mail text, not a public URL or binary attachment.**
- [ ] **Step 6: implement signed download link generation.**

**Ready when:** 20 MB UX target is compatible with function/request limits because binary goes browser -> private bucket directly.

---

### Task 5: Contact request orchestration

**Requirements:** S-001..015, A-008..011, SEC-001..009

**Files:**
- Create `src/contact/service.ts`
- Create `test/contact-service.test.ts`

**Flow:** validate -> abuse/rate policy -> acquire idempotency -> verify attachment if any -> primary delivery -> receipt -> mark accepted -> normalized response.

- [ ] **Step 1: RED for valid no-attachment acceptance.**
- [ ] **Step 2: implement minimal orchestrator against fakes.**
- [ ] **Step 3: RED for invalid payload, rate limit, provider failure, attachment failure and duplicate accepted submission.**
- [ ] **Step 4: implement only normalized response mapping.**
- [ ] **Step 5: verify no failure response leaks provider errors/secrets.**

**Ready when:** full business behavior is GREEN with all provider adapters fake.

---

### Task 6: Abuse controls and CORS

**Requirements:** SEC-005..009

**Files:**
- Create `src/http/policy.ts`
- Create `test/http-policy.test.ts`

- [ ] **Step 1: RED for wrong origin/content-type/body size and populated honeypot.**
- [ ] **Step 2: implement strict origin/content-type/body cap policy.**
- [ ] **Step 3: RED for normal retry staying below rate limit and abusive burst being rejected.**
- [ ] **Step 4: implement API Gateway/native rate limit configuration or smallest server-side complement.**
- [ ] **Step 5: verify CAPTCHA is not required for the normal path.**

**Ready when:** endpoint is not an open relay and normal humans can retry without a visual CAPTCHA.

---

### Task 7: Yandex Postbox adapter

**Requirements:** backend provider implementation for S-014..015

**Files:**
- Create `src/providers/yandex-postbox.ts`
- Create adapter contract test with HTTP/provider calls mocked at network boundary.

- [ ] **Step 1: RED against adapter contract for From/To/Reply-To/subject/plain-text payload mapping.**
- [ ] **Step 2: implement Postbox adapter using service-side credentials only.**
- [ ] **Step 3: RED for provider timeout/malformed response mapping to service unavailable without secret leakage.**
- [ ] **Step 4: implement timeout/error normalization.**

**Ready when:** provider-specific code is small and cannot alter domain destination/validation rules.

---

### Task 8: Yandex Object Storage adapter and lifecycle

**Requirements:** A-009..011

**Files:**
- Create `src/providers/yandex-object-storage.ts`
- Add IaC/config for private bucket and lifecycle policy.
- Create focused provider/config contract tests.

- [ ] **Step 1: RED for private bucket expectation and signed URL expiration bounds.**
- [ ] **Step 2: implement SigV4-compatible upload/download authorization.**
- [ ] **Step 3: configure lifecycle deletion target around 7 days unless privacy review selects another explicit period.**
- [ ] **Step 4: verify unauthenticated public object URL does not succeed in staging.**

**Ready when:** attachment is private by default and automatically expires.

---

### Task 9: YDB/serverless idempotency adapter

**Requirements:** S-003/S-013/S-014

**Files:**
- Create `src/providers/yandex-idempotency.ts`
- IaC/config for TTL table containing only opaque metadata.

- [ ] **Step 1: run generic IdempotencyStore contract against local/fake adapter.**
- [ ] **Step 2: implement conditional acquire + TTL adapter.**
- [ ] **Step 3: run focused staging concurrency check: two same-key requests -> one delivery.**
- [ ] **Step 4: inspect stored row schema and verify no PII/message content fields exist.**

**Ready when:** network retries are safe without creating a submissions database.

---

### Task 10: HTTP handlers and API Gateway routing

**Requirements:** public API contract, SEC-006

**Files:**
- Create handlers for `/api/contact/attachment-upload` and `/api/contact/send`.
- Create API Gateway/IaC routing and CORS allowlist.
- Create handler integration tests with fake providers.

- [ ] **Step 1: RED for exact request/response schema and status mapping.**
- [ ] **Step 2: implement thin handlers that call policy/parser/service only.**
- [ ] **Step 3: GREEN handler tests.**
- [ ] **Step 4: deploy only to staging/preview after explicit infrastructure approval.**

**Ready when:** frontend fake adapter can be switched to staging URL without changing domain/UI code.

---

### Task 11: Analytics/logging/privacy boundary

**Requirements:** PRV-001..006, AN-003..005, SEC-009

- [ ] **Step 1: RED proving structured logs omit name/email/message/filename and raw provider bodies.**
- [ ] **Step 2: implement metadata-only logging: request outcome, latency, coarse size class, provider status identifier, no PII.**
- [ ] **Step 3: verify form works independently of client analytics consent.**
- [ ] **Step 4: update portfolio `/privacy/` and architecture docs before release, not before wording is reviewed.**

**Ready when:** operational evidence exists without turning contact messages into telemetry.

---

### Task 12: Staging integration with frontend

**Requirements:** Backend Definition of Ready/Done from spec

- [ ] **Step 1: point an approved preview/staging frontend environment at staging contact API without committing secrets.**
- [ ] **Step 2: run frontend Contact Hub acceptance against real staging send endpoint except tests that intentionally fake failures.**
- [ ] **Step 3: send one controlled message to `i@lookawful.ru`; verify exactly one primary arrival.**
- [ ] **Step 4: verify one controlled visitor receipt.**
- [ ] **Step 5: upload one allowed attachment near representative size, verify private signed link works and direct public access does not.**
- [ ] **Step 6: retry same submission ID and verify no duplicate primary email.**
- [ ] **Step 7: inspect logs/idempotency row for absence of PII/message body.**

**Ready when:** staging proves real providers without production enablement.

---

### Task 13: Production release gate

- [ ] **Step 1: run backend focused unit/contract/integration suite.**
- [ ] **Step 2: run portfolio frontend relevant verification and production-like PR Preview.**
- [ ] **Step 3: confirm provider domain/sender verification and quotas.**
- [ ] **Step 4: confirm bucket private/lifecycle policy and idempotency TTL.**
- [ ] **Step 5: confirm privacy copy and analytics goal definitions are synchronized.**
- [ ] **Step 6: enable production endpoint only through explicit release action.**
- [ ] **Step 7: execute one production smoke submission with controlled data and verify exactly one primary delivery + one receipt.**
- [ ] **Step 8: classify/delete temporary tests and report KEEP/MOVE/DELETE counts per repository policy.**

**Backend Definition of Done:** every Backend DoD item in the canonical spec has fresh evidence. A GREEN fake-provider suite alone is not evidence of real Postbox/Object Storage delivery; the gated real-provider smoke is mandatory before production completion is claimed.
