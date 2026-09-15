# Media Desk Remote + Unified Media Graph Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a password-protected Cloudflare-hosted Media Desk that writes only to `content/text-cms` and presents one deterministic media inventory covering Gallery, project/pet/character covers, page media, direct placements and video posters.

**Architecture:** Reuse the proven Cloudflare Worker/Static Assets shape from historical PR #717, but make current Media Base safety contracts authoritative: remote writes use GitHub API against `content/text-cms`, carry expected source revision + expected branch head, validate canonical content before committing, and never write to `dev`/`prod`. Extend the current read-only inventory model with explicit usage adapters instead of adding another media database.

**Tech Stack:** Node 24, TypeScript 7, Vite 8, Cloudflare Workers/Wrangler, GitHub REST/GraphQL API, Node test runner, existing Media Catalog/MediaEntry data model, Playwright browser smoke.

**Spec:** `docs/superpowers/specs/2026-09-13-media-desk-remote-unified-design.md`

## Global Constraints

- `dev` remains working/integration and PR base.
- `prod` remains production/release/deploy only.
- `content/text-cms` remains the only remote Media Desk write target.
- No plaintext password/session/GitHub token in Git, browser storage or logs.
- Ordinary local `npm run desk` remains read-only and loopback-only.
- No remote mutation may bypass expected revision/head conflict detection.
- No second canonical media database.
- No arbitrary repository file editor.
- No Worker-side expensive video transcoding.
- Public production build must remain isolated from private Desk runtime.

---

### Task 1: Cloudflare authentication and worker-first private boundary

**Files:**
- Create: `tools/cloudflare/media-desk/auth.mjs`
- Create: `tools/cloudflare/media-desk/domain.mjs`
- Create: `tools/cloudflare/media-desk/worker.mjs`
- Create: `tools/cloudflare/media-desk/wrangler.jsonc`
- Create: `tools/media-desk/hash-password.mjs`
- Test: `test/media-desk-cloudflare-auth.test.mjs`
- Test: `test/media-desk-cloudflare-worker.test.mjs`

**Interfaces:**
- Produces `passwordMatches(password, encodedHash) -> Promise<boolean>`.
- Produces `createSessionToken(subject, secret, now?) -> Promise<string>`.
- Produces `verifySessionToken(token, subject, secret, now?) -> Promise<boolean>`.
- Produces `isAllowedMediaDeskOrigin(url) -> boolean` accepting production `https://media.looksawful.ru` and bounded local test origins only.
- Produces Worker default export `{ fetch(request, env) }` with protected Static Assets/API routing.

- [ ] **Step 1: Write failing auth tests**

```js
import assert from "node:assert/strict";
import test from "node:test";
import {
  createPasswordHash,
  createSessionToken,
  passwordMatches,
  verifySessionToken,
} from "../tools/cloudflare/media-desk/auth.mjs";

test("remote Media Desk password hashes are salted PBKDF2 values", async () => {
  const hash = await createPasswordHash("secret", new Uint8Array(16).fill(7), 210_000);
  assert.match(hash, /^pbkdf2-sha256\$210000\$[A-Za-z0-9_-]+\$[A-Za-z0-9_-]+$/);
  assert.equal(await passwordMatches("secret", hash), true);
  assert.equal(await passwordMatches("wrong", hash), false);
});

test("remote Media Desk sessions are signed, scoped and expire", async () => {
  const now = Date.UTC(2026, 8, 13, 20, 0, 0);
  const token = await createSessionToken("media.looksawful.ru", "test-session-secret-32-bytes-minimum", now);
  assert.equal(await verifySessionToken(token, "media.looksawful.ru", "test-session-secret-32-bytes-minimum", now + 1_000), true);
  assert.equal(await verifySessionToken(token, "admin.looksawful.ru", "test-session-secret-32-bytes-minimum", now + 1_000), false);
  assert.equal(await verifySessionToken(`${token}x`, "media.looksawful.ru", "test-session-secret-32-bytes-minimum", now + 1_000), false);
  assert.equal(await verifySessionToken(token, "media.looksawful.ru", "test-session-secret-32-bytes-minimum", now + 13 * 60 * 60 * 1_000), false);
});
```

- [ ] **Step 2: Run RED**

Run: `node --test test/media-desk-cloudflare-auth.test.mjs`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `tools/cloudflare/media-desk/auth.mjs`.

- [ ] **Step 3: Implement minimal crypto helpers**

Use Web Crypto only so the module runs in Node and Workers. Encode password hashes as `pbkdf2-sha256$<iterations>$<salt-base64url>$<digest-base64url>`. Use SHA-256 PBKDF2 with 32-byte output and constant-time byte comparison. Session payload is `{ sub, exp }`, signed with HMAC-SHA256, 12-hour expiry.

- [ ] **Step 4: Run GREEN**

Run: `node --test test/media-desk-cloudflare-auth.test.mjs`

Expected: PASS.

- [ ] **Step 5: Write failing worker boundary tests**

Test these concrete behaviors against the Worker `fetch` export with a fake `env.ASSETS.fetch`:

```js
assert.equal((await worker.fetch(new Request("https://media.looksawful.ru/"), env)).status, 401);
assert.equal((await worker.fetch(new Request("https://media.looksawful.ru/login", { method: "POST", body: JSON.stringify({ password: "bad" }) }), env)).status, 401);
assert.match(authenticated.headers.get("set-cookie"), /HttpOnly/);
assert.match(authenticated.headers.get("set-cookie"), /Secure/);
assert.match(authenticated.headers.get("set-cookie"), /SameSite=Strict/);
assert.equal(privateResponse.headers.get("cache-control"), "private, no-store");
assert.match(privateResponse.headers.get("x-robots-tag"), /noindex/);
```

Also prove a cross-origin mutation request returns `403`.

- [ ] **Step 6: Run RED and implement Worker gate**

Run: `node --test test/media-desk-cloudflare-worker.test.mjs`

Expected before implementation: FAIL because the Worker route/security contract is missing.

Implementation rules:

```js
const PROD_ORIGIN = "https://media.looksawful.ru";
const SESSION_COOKIE = "__Host-media_desk_session";
```

`/login` is the only unauthenticated POST. `/logout` requires same origin. Every other path requires a valid cookie before `env.ASSETS.fetch(request)` or API routing. Production unknown origins fail closed.

- [ ] **Step 7: Re-run focused tests and commit**

Run:

```bash
node --test test/media-desk-cloudflare-auth.test.mjs test/media-desk-cloudflare-worker.test.mjs
```

Expected: PASS.

Commit message: `feat(media-desk): add private Cloudflare auth boundary`.

---

### Task 2: GitHub-backed revision-aware remote writes to content/text-cms

**Files:**
- Create: `tools/cloudflare/media-desk/github.mjs`
- Extend: `tools/cloudflare/media-desk/worker.mjs`
- Test: `test/media-desk-cloudflare-github.test.mjs`

**Interfaces:**
- `const MEDIA_DESK_AUTHORING_BRANCH = "content/text-cms"`.
- `readRepositoryFile({ token, path, fetchImpl? }) -> { text, blobSha, revision, branchHead }`.
- `commitRepositoryFiles({ token, expectedHead, files, message, fetchImpl? }) -> { commitSha, branchHead }`.
- `files` is `readonly { path: string; content: Uint8Array | string }[]` and is rejected unless every path belongs to the Media Desk content/media allowlist.

- [ ] **Step 1: Write RED tests for fixed branch and stale head**

The fake GitHub transport records requested URLs/bodies. Assert:

```js
assert.equal(MEDIA_DESK_AUTHORING_BRANCH, "content/text-cms");
assert.ok(calls.every((call) => !call.url.includes("/git/refs/heads/dev")));
assert.ok(calls.every((call) => !call.url.includes("/git/refs/heads/prod")));
await assert.rejects(
  () => commitRepositoryFiles({ token: "x", expectedHead: "old", files, fetchImpl: movedHeadFetch }),
  /stale branch head/i,
);
```

Assert `../`, `.github/`, `tools/`, `src/devtools/` mutation paths are rejected before any network write.

- [ ] **Step 2: Run RED**

Run: `node --test test/media-desk-cloudflare-github.test.mjs`

Expected: FAIL because `github.mjs` does not exist.

- [ ] **Step 3: Implement minimal GitHub adapter**

Use GitHub Git Data API for a single atomic branch commit:

1. `GET /repos/looksawful/looksawful.ru/git/ref/heads/content/text-cms`.
2. Require returned object SHA to equal `expectedHead`.
3. `GET /git/commits/<head>` to obtain base tree.
4. Create blobs for changed files.
5. `POST /git/trees` with `base_tree` and changed path/blob pairs.
6. `POST /git/commits` with one parent equal to `expectedHead`.
7. Immediately re-read branch ref; fail `409` semantics if it moved before update.
8. `PATCH /git/refs/heads/content/text-cms` with `force:false` equivalent fast-forward semantics.

Allow mutation roots only under existing CMS/media authority, initially:

```js
const WRITE_ROOTS = [
  "src/content/",
  "src/data/media/",
  "public/media/",
  "public/pets/",
];
```

Narrower operation-level validation still applies before calling this adapter.

- [ ] **Step 4: Run GREEN and commit**

Run:

```bash
node --test test/media-desk-cloudflare-github.test.mjs
```

Expected: PASS.

Commit message: `feat(media-desk): add GitHub authoring adapter`.

---

### Task 3: Cloudflare-specific build, static assets and trusted deploy contract

**Files:**
- Create: `tools/cloudflare/media-desk/build.mjs`
- Create: `tools/cloudflare/media-desk/vite.config.mjs`
- Create: `tools/cloudflare/media-desk/configure-secrets.ps1`
- Create: `.github/workflows/media-desk-cloudflare.yml`
- Create: `docs/media-desk-cloudflare.md`
- Modify: `package.json`
- Modify: `src/devtools/media-desk/editor-entry.ts`
- Create: `src/devtools/media-desk/auth-controls.css`
- Test: `test/media-desk-cloudflare.test.mjs`

**Interfaces:**
- `npm run media-desk:build` builds isolated output to `dist-media-desk`.
- `npm run media-desk:cf:dry-run` executes Wrangler dry-run without secrets.
- Remote UI gets build-time `VITE_CONTENT_DESK_REMOTE=1` and `VITE_CONTENT_DESK_WRITE=1`, but local server write registration remains unrelated.

- [ ] **Step 1: Write RED repository/deploy contract**

Assert package scripts and workflow contain these invariants:

```js
assert.match(packageJson.scripts["media-desk:build"], /tools\/cloudflare\/media-desk\/build\.mjs/);
assert.match(workflow, /push:\s*[\s\S]*branches:\s*\[dev\]/);
assert.doesNotMatch(workflow, /pull_request:[\s\S]*MEDIA_DESK_GITHUB_TOKEN/);
assert.match(wrangler, /media\.looksawful\.ru/);
assert.match(wrangler, /run_worker_first/);
```

Production deploy job may run only on trusted `push` to `dev` or `workflow_dispatch`. PR checks may build/dry-run only.

- [ ] **Step 2: Run RED, implement build/workflow/docs, run GREEN**

Run: `node --test test/media-desk-cloudflare.test.mjs`

Expected before implementation: FAIL on missing scripts/files.

Build with a dedicated Vite config that uses `tools/media-desk/index.html` as the entry and emits only the Desk application. The Worker Static Assets binding points at `dist-media-desk` and runs Worker first.

- [ ] **Step 3: Add remote mode UI provenance**

In `editor-entry.ts`, remote mode must show `REMOTE WRITE · content/text-cms` and expose no local filesystem branch/dirty controls. Reuse existing mode status patterns rather than duplicating the entire Desk boot sequence.

- [ ] **Step 4: Verify build isolation**

Run:

```bash
node --test test/media-desk-cloudflare.test.mjs
npm run typecheck
npm run build:site
npm run media-desk:build
npm run media-desk:cf:dry-run
```

Expected: all PASS. `build:site` must not include the private Desk as a public SitePage/input.

Commit message: `deploy(media-desk): add Cloudflare remote build`.

---

### Task 4: Extend inventory model into a typed unified usage graph

**Files:**
- Modify: `src/devtools/media-desk/inventory-model.ts`
- Create: `src/devtools/media-desk/usage-sources.ts`
- Modify: `src/devtools/media-desk/inventory-readonly.ts`
- Test: `test/media-desk-model.test.mjs`
- Test: `test/media-desk-unified-usage.test.mjs`

**Interfaces:**

Extend the model with:

```ts
export type MediaDeskUsageKind =
  | "gallery"
  | "project-cover"
  | "pet-cover"
  | "character-cover"
  | "page-media"
  | "video-poster"
  | "direct-placement";

export interface MediaDeskUnifiedUsage {
  readonly kind: MediaDeskUsageKind;
  readonly ownerId: string;
  readonly sourcePath: string;
  readonly fieldPath?: string;
  readonly route?: string;
  readonly blockingDelete: boolean;
}
```

`MediaDeskInventoryRecord` gains `usages: readonly MediaDeskUnifiedUsage[]`. Existing aggregate `usage.direct/poster/total/entryIds/projectIds` remains for compatibility and is derived from the same inputs.

`usage-sources.ts` exports pure adapters:

```ts
export function galleryUsages(items: readonly MediaCatalogItem[]): readonly MediaDeskUsageBinding[];
export function mediaEntryUsages(entries: readonly MediaDeskUsageRecordLike[]): readonly MediaDeskUsageBinding[];
export function projectCoverUsages(cards: readonly ProjectCardPresentation[], catalog: readonly MediaCatalogItem[]): readonly MediaDeskUsageBinding[];
export function petCoverUsages(cards: readonly SubprojectCardData[], entries: readonly MediaEntry[]): readonly MediaDeskUsageBinding[];
```

- [ ] **Step 1: Write RED tests for Gallery/direct/poster/project/pet cover**

Use a tiny fixture catalog and assert one asset can accumulate multiple usage kinds. Project cover path lookup resolves `/media/projects/index/jestei-pool-cover.webp` to the canonical asset with matching `asset.src`. Pet cover lookup resolves `coverEntryId -> MediaEntry.assetId`.

Example assertion:

```js
assert.deepEqual(
  record.usages.map(({ kind }) => kind).sort(),
  ["gallery", "pet-cover", "video-poster"].sort(),
);
assert.equal(record.diagnostics.includes("orphan"), false);
```

- [ ] **Step 2: Run RED**

Run: `node --test test/media-desk-unified-usage.test.mjs`

Expected: FAIL because `usage-sources.ts` and `record.usages` do not exist.

- [ ] **Step 3: Implement adapters and inventory integration**

Rules:

- `showInCatalog=true` adds `gallery` usage with `blockingDelete=true`.
- direct MediaEntry adds `direct-placement`.
- poster relationship adds `video-poster`.
- project cover matches canonical asset by normalized `asset.src`; unmatched cover produces a graph-level missing-reference diagnostic surfaced by the adapter test rather than silently inventing an asset.
- pet cover resolves from `coverEntryId` through MediaEntry to its asset ID.
- usage ordering is deterministic: `gallery`, `project-cover`, `pet-cover`, `character-cover`, `page-media`, `video-poster`, `direct-placement`, then owner ID.
- `orphan` means zero unified usages, not merely zero MediaEntry direct/poster uses.

- [ ] **Step 4: Render usage provenance**

Inventory details show kind + owner ID + route/source path. Search text includes these fields.

- [ ] **Step 5: Run GREEN and regression tests**

Run:

```bash
node --test test/media-desk-model.test.mjs test/media-desk-unified-usage.test.mjs
npm run typecheck
```

Expected: PASS.

Commit message: `feat(media-desk): derive unified media usages`.

---

### Task 5: Standalone pet/character page media index and canonical cover assignment boundary

**Files:**
- Create: `tools/media-desk/index-page-media.mjs`
- Create: `src/data/media/page-usage.generated.json`
- Create: `src/devtools/media-desk/page-usage.ts`
- Extend: `src/devtools/media-desk/usage-sources.ts`
- Test: `test/media-desk-page-usage.test.mjs`
- Test: `test/media-desk-cover-assignment.test.mjs`

**Interfaces:**
- Build tool emits deterministic records `{ assetId, ownerId, route, sourcePath }` only for references that resolve to a canonical catalog asset.
- `pageMediaUsages(records) -> MediaDeskUsageBinding[]` produces `page-media` or `character-cover` usages.
- Assignment contract is operation-level, not a free-form path editor:

```ts
interface MediaDeskAssignmentTarget {
  kind: "project-cover" | "pet-cover" | "character-cover" | "video-poster";
  ownerId: string;
}
```

- [ ] **Step 1: Write RED page index tests**

Fixture HTML/JS containing `/pets/awful-cases/assets/ground.png` and a catalog fixture mapping that path to an asset must produce exactly one canonical usage. An unregistered path is reported separately and must not generate a fake asset ID.

- [ ] **Step 2: Implement deterministic indexer**

The indexer scans repository-owned standalone pet/character sources under `public/pets/**` for absolute site media references, normalizes paths, and joins to the canonical catalog by `asset.src`. Output is sorted by `assetId`, `ownerId`, `sourcePath`. Generated file carries no free-form copy and is checked for deterministic regeneration.

- [ ] **Step 3: Write RED assignment tests**

Project cover assignment must update only the `cover.src/width/height` object for the selected known project card. Pet cover assignment must update only the selected card's `coverEntryId` to an existing MediaEntry ID. Character assignment uses the same typed adapter once a canonical character source is present; until then the adapter must reject an unknown character owner instead of writing a guessed file.

- [ ] **Step 4: Implement assignment serializers**

Keep serializers pure. They return complete candidate source values plus source path/field ownership metadata; the remote GitHub adapter performs the commit only after canonical parser validation.

- [ ] **Step 5: Run GREEN**

Run:

```bash
node --test test/media-desk-page-usage.test.mjs test/media-desk-cover-assignment.test.mjs
npm run typecheck
```

Expected: PASS.

Commit message: `feat(media-desk): index page media and cover targets`.

---

### Task 6: Upload, replace and dependency-safe delete service

**Files:**
- Create: `tools/cloudflare/media-desk/media-mutations.mjs`
- Extend: `tools/cloudflare/media-desk/worker.mjs`
- Test: `test/media-desk-cloudflare-mutations.test.mjs`

**Interfaces:**

```js
validateUploadTarget({ path, mediaType, byteLength })
planReplace({ asset, nextBytes, expectedRevision, expectedHead })
planDelete({ record, expectedRevision, expectedHead })
```

- [ ] **Step 1: Write RED tests**

Assert:

- traversal (`../`) is rejected;
- unsupported extensions are rejected;
- existing repository upload policy limits are enforced;
- replace preserves asset ID;
- delete of a record containing any `blockingDelete` usage returns a conflict containing those usages;
- unreferenced delete returns an explicit file/catalog mutation plan;
- every mutation requires both expected source revision and expected branch head.

- [ ] **Step 2: Run RED**

Run: `node --test test/media-desk-cloudflare-mutations.test.mjs`

Expected: FAIL for missing service.

- [ ] **Step 3: Implement minimal service and Worker endpoints**

Endpoints:

```text
POST /api/media/upload
POST /api/media/replace
POST /api/media/delete
POST /api/media/assign
```

All require auth + same-origin + expected head/revision where applicable. Multipart/binary parsing is bounded by repository policy and Cloudflare runtime limits. The Worker never shells out to ffmpeg/sharp.

- [ ] **Step 4: Run GREEN and adapter tests**

Run:

```bash
node --test test/media-desk-cloudflare-mutations.test.mjs test/media-desk-cloudflare-github.test.mjs test/media-desk-cloudflare-worker.test.mjs
```

Expected: PASS.

Commit message: `feat(media-desk): add safe remote media mutations`.

---

### Task 7: Remote Media Desk controls and conflict UX

**Files:**
- Modify: `src/devtools/media-desk/editor.ts`
- Modify: `src/devtools/media-desk/bulk-editor.ts`
- Modify: `src/devtools/media-desk/revision-client.ts`
- Modify: `src/devtools/media-desk/inventory-readonly.ts`
- Modify: `src/devtools/media-desk/desk.css`
- Test: `test/media-desk-editor-ux.test.mjs`
- Test: `test/media-desk-revision-session.test.mjs`
- Extend: `tools/e2e/run-media-desk-browser-qa.mjs`

**Interfaces:**
- Remote client reads `/api/status` for branch/head/mode.
- Remote mutations include `expectedHead` plus existing source revision.
- `409` preserves unsaved editor state and visibly reports stale branch/source rather than auto-refreshing the revision and retrying.

- [ ] **Step 1: Write RED UX contracts**

Assert remote write mode renders:

```text
REMOTE WRITE
content/text-cms
```

and referenced records render dependency text. Delete button is disabled/absent for blocking usages. Conflict response must not overwrite the cached expected revision/head.

- [ ] **Step 2: Run RED and implement UI**

Run: `node --test test/media-desk-editor-ux.test.mjs test/media-desk-revision-session.test.mjs`

Expected: focused failures for missing remote status/head/dependency behavior.

- [ ] **Step 3: Add browser QA**

Browser QA verifies:

- unauthenticated root is rejected/login-gated;
- authenticated root renders Desk cards;
- usage provenance is visible;
- no horizontal overflow at desktop/mobile Desk breakpoints;
- no public-site mutation route is introduced.

- [ ] **Step 4: Run GREEN**

Run:

```bash
node --test test/media-desk-editor-ux.test.mjs test/media-desk-revision-session.test.mjs
npm run typecheck
npm run test:e2e:media-desk
```

Expected: PASS.

Commit message: `feat(media-desk): expose remote media controls`.

---

### Task 8: CI registration, documentation, exact-head verification and deployment handoff

**Files:**
- Modify: `tools/ci/run-tests.mjs`
- Extend: `.github/workflows/media-desk-cloudflare.yml`
- Update: `docs/content-media-desk-api.md`
- Update: `docs/media-desk-cloudflare.md`
- Update: issue #808 / draft PR status

**Interfaces:**
- Permanent cheap security/model tests run in Fast CI.
- Cloudflare build/dry-run runs on relevant PRs.
- Real production deployment occurs only from trusted `dev` after merge and only with repository/account secrets present.

- [ ] **Step 1: Register focused permanent tests**

Fast tier includes auth, fixed branch/write policy, unified usage and delete safety contracts. Browser/Cloudflare deployment verification remains affected/PR-specific rather than bloating every push.

- [ ] **Step 2: Run full local/repository verification**

Run:

```bash
npm run typecheck
npm run test:fast
npm run test:media:contract
npm run build:site
npm run media-desk:build
npm run media-desk:cf:dry-run
npm run test:e2e:media-desk
```

Expected: all PASS with no secret values required for dry-run.

- [ ] **Step 3: Verify branch diff scope**

Compare `feature/media-desk-remote-unified` to the current `dev`. Confirm there are no authored portfolio copy rewrites and no `prod` changes.

- [ ] **Step 4: Open/update draft PR**

PR title: `media: ship remote unified Media Desk`.

Body must link #808, state the exact head, enumerate security/branch invariants, and explicitly distinguish repository implementation from account-side Cloudflare secret/domain activation.

- [ ] **Step 5: Require exact-head gates before ready-for-review**

Required evidence:

- Fast CI PASS;
- CodeQL PASS;
- Dependency Review PASS;
- production build PASS;
- Cloudflare build/dry-run PASS;
- PR Preview/private Media Desk browser QA PASS.

Do not merge automatically.

- [ ] **Step 6: Account-side activation after trusted merge**

Using `tools/cloudflare/media-desk/configure-secrets.ps1` or equivalent Cloudflare API/dashboard action, provision:

- `MEDIA_DESK_PASSWORD_HASH`;
- `MEDIA_DESK_SESSION_SECRET`;
- `MEDIA_DESK_GITHUB_TOKEN`;
- deployment API token/account ID if not already present.

Then deploy from trusted `dev`, attach/verify `media.looksawful.ru`, verify unauthenticated denial and authenticated read before performing the first real `content/text-cms` mutation.

Commit message: `test(media-desk): verify remote unified workflow`.

## Self-review

- Spec coverage: remote auth, fixed authoring branch, stale-write protection, unified usage, Gallery/project/pet/character/page/poster coverage, upload/replace/delete, UI, CI and deployment are each mapped to tasks.
- Placeholder scan: no `TBD`/`TODO`/"implement later" steps are used.
- Type consistency: `MediaDeskUsageKind`, `MediaDeskUnifiedUsage`, `MediaDeskAssignmentTarget`, `expectedRevision` and `expectedHead` names are consistent across tasks.
- Scope boundary: character assignment intentionally fails closed until a canonical character owner source exists; the package supports the usage kind without inventing a character database.
