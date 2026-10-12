# Research: Private Review Hub #1089 frontier

Date: 2026-09-23  
Repository: `looksawful/looksawful.ru`  
PR: #1122  
Ticket: #1089

## Scope

Determine the real continuation point for the Private Review Hub after the approved ToTickets rewrite: what is already proven, whether the D1 + Cloudinary boundary matches first-party APIs, what remains unproven, and what belongs to #1090 instead of being pulled back into #1089.

## Primary sources

- #1089: https://github.com/looksawful/looksawful.ru/issues/1089
- #1090: https://github.com/looksawful/looksawful.ru/issues/1090
- PR #1122: https://github.com/looksawful/looksawful.ru/pull/1122
- Current PR HEAD: https://github.com/looksawful/looksawful.ru/commit/7ec1076ec1255155cb66cc77e634aa8c7f9888ea
- Canonical SitePage manifest: https://github.com/looksawful/looksawful.ru/blob/dev/src/site/pages/manifest.ts
- Cloudinary Upload API: https://cloudinary.com/documentation/image_upload_api_reference
- Cloudinary upload guidance: https://cloudinary.com/documentation/upload_images
- Cloudinary folder modes: https://cloudinary.com/documentation/folder_modes
- Cloudinary authenticated media: https://cloudinary.com/documentation/control_access_to_media
- Cloudflare D1 Worker Binding API: https://developers.cloudflare.com/d1/worker-api/
- Cloudflare D1 prepared statements: https://developers.cloudflare.com/d1/worker-api/prepared-statements/
- Cloudflare D1 return objects: https://developers.cloudflare.com/d1/worker-api/return-object/

## Findings

### 1. The canonical storage decision is already reflected in code

The current #1089 ticket requires D1 authority/control state plus Cloudinary `authenticated` binary evidence. PR #1122 contains a later architecture comment explicitly superseding the old Supabase implementation with this D1 + Cloudinary boundary.

Current PR HEAD is `7ec1076ec1255155cb66cc77e634aa8c7f9888ea` (`fix: store Review evidence in Cloudinary asset folder`).

The branch now contains:

- `lab/functions/review-storage-cloudflare.js`
- `tools/cloudflare/review-hub.sql`
- `test/private-review-cloudflare-storage.test.mjs`
- `test/private-review-hub.test.mjs`

Supabase is no longer part of the active Review storage/control implementation in the changed surface.

### 2. Current repository verification is green

At exact HEAD `7ec1076...`, the pull-request runs are green:

- Private Lab Verify
- Fast CI
- CodeQL
- Dependency Review

This proves the current repository contract and mocks, not the remote deployment boundary.

### 3. The Cloudinary REST assumptions are valid against current first-party docs

Cloudinary's Upload API currently supports backend HTTP Basic Authentication with API key + secret, so the adapter's Authorization approach is valid.

The API supports:

- `type=authenticated` for protected media;
- immutable `asset_id` returned from upload;
- download by `asset_id`;
- destroy by `asset_id`.

The latest HEAD change from `folder` to `asset_folder` matches Cloudinary's current guidance for dynamic-folder product environments. Cloudinary documents `folder` as a legacy/fixed-folder-oriented parameter and recommends `asset_folder` for dynamic folders.

Deployment caveat: if the actual product environment is legacy fixed-folder mode, `asset_folder` support must be verified against that environment before calling the remote boundary proven.

### 4. The D1 Worker API assumptions are valid

Cloudflare documents the exact Worker pattern used by the adapter:

`env.DB.prepare(...).bind(...).run()`

The returned `D1Result.meta.changes` is a documented field, so using it to detect compare-and-swap UPDATE success is supported.

### 5. `project:awful-mockups` is a real canonical SitePage id

The repository's canonical page manifest already contains:

`id: "project:awful-mockups"`

The page-content and site-page tests also use that same id.

However, the current Review API validates `reviewTargetId` only syntactically with a regular expression. It does not prove at runtime that an arbitrary accepted id is present in the canonical `SitePage.id` set.

Therefore #1089 has canonical-id evidence for the intended thin-slice target, but the "anchored to SitePage.id" acceptance criterion is not fully fail-closed for arbitrary input.

### 6. The remote Worker/auth/D1 boundary is not proven

`docs/private-lab.md` already states that repository code alone does not prove the remote Admin deployment/auth boundary.

Current authenticated Cloudflare dashboard inspection on 2026-09-23 showed no Workers & Pages projects available in the inspected account, so there is presently no observed deployment target on which to prove:

- the `REVIEW_DB` D1 binding;
- backend-only Cloudinary credentials;
- authenticated POST/GET Review flow;
- Worker-proxied evidence delivery.

No private Cloudflare account identifiers are recorded in this note.

### 7. PR #1122 metadata is stale and materially misleading

The PR title/body still describe the old Case/Supabase architecture, including Supabase Postgres/Storage and old approval/lifecycle claims.

A PR comment records the newer D1 + Cloudinary architecture, and the code has already migrated, but the main PR description has not caught up.

This is a handoff risk because a fresh agent reading only the PR body can resume work against an obsolete architecture.

### 8. #1090 behavior should stay out of #1089

Current #1089 code uses one global `review-hub/v1/current.json` pointer and temporary four-day evidence expiry.

The canonical #1090 contract requires the next layer:

- one Current Review per Review Target;
- Superseded/Stale/Expired lifecycle;
- exact Review-ID approval;
- idempotent approval;
- append-only Approval history;
- Baseline pointer semantics;
- retention that preserves active Baseline evidence.

Those are not reasons to expand #1089 further. They belong to #1090 exactly as ticketed.

## Verdict

#1089 is repository-side near-complete, but not fully proven end to end.

Remaining evidence gaps before calling #1089 complete:

1. prove or tighten the canonical `SitePage.id` anchoring boundary;
2. identify/provision the trusted Cloudflare deployment surface;
3. bind D1 and apply the checked-in schema;
4. configure backend-only Cloudinary credentials;
5. run a real authenticated create/read/evidence smoke through the Worker;
6. prove unauthenticated evidence access fails closed;
7. update stale PR metadata after the architecture is actually proven.

No merge or production publication is implied by this research.

## Minimal next execution slice

1. Add one focused RED contract for canonical Review Target anchoring if #1089 is intended to reject unknown SitePage ids.
2. Implement only the smallest membership seam needed for that test.
3. Establish the trusted Worker/Pages + D1 deployment boundary without exposing secrets to candidate branch builds.
4. Apply `tools/cloudflare/review-hub.sql`.
5. Run one disposable authenticated Review through POST -> GET -> evidence proxy and verify no Cloudinary identity leaks to the browser.
6. Re-run PR checks.
7. Reconcile PR #1122 title/body with the D1 + Cloudinary architecture.
8. Close #1089 only after this evidence exists, then move to #1090.

