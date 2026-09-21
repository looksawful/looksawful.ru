# Private Lab

Status: OAUTH SECURITY CANDIDATE / non-production internal tooling foundation.

Private Lab is read-only with respect to site/CMS state. The Private Review Hub may write isolated visual-review evidence to its private Supabase backend; it is not a CMS branch, not a source of truth, not a deployment authority and not a shortcut around Media/Content Desk write policy.

## Build

```bash
npx vite build --config vite.lab.config.ts
```

The Lab is built into `dist-lab/` independently from the public production Vite build. It carries exact build provenance through `LAB_BUILD_BRANCH`, `LAB_BUILD_COMMIT` and `LAB_BUILD_TIME`.

Local Lab serving/preview defaults to `127.0.0.1`.

## Access boundary

The repository-owned authentication candidate uses application-level GitHub OAuth for the private Admin/Lab surface. It does not use a parallel Basic Auth/password mechanism.

Runtime bindings required by the candidate:

```text
ADMIN_GITHUB_CLIENT_ID
ADMIN_GITHUB_CLIENT_SECRET
ADMIN_SESSION_SECRET
SUPABASE_URL             # backend-only Supabase project URL
SUPABASE_SECRET_KEY      # backend-only secret key; never browser/public source
REVIEW_EVIDENCE_BUCKET  # dedicated private Storage bucket id
```

Accepted application origins are deliberately narrow:

```text
https://admin.looksawful.ru
http://127.0.0.1:8787
```

OAuth endpoints:

```text
/auth/github
/auth/github/callback
/auth/logout
```

Security contract:

- request no broad GitHub OAuth scopes;
- reject a token response that reports inherited/non-empty scopes;
- verify the authenticated identity directly through GitHub `GET /user`;
- authorize only GitHub login `looksawful`;
- keep the GitHub access token server-side and never put it in cookies/browser storage;
- HMAC-SHA256 sign OAuth state and the application Admin session;
- production session/state cookies are `Secure`, `HttpOnly`, `SameSite=Lax` and `__Host-` scoped;
- unauthenticated GET/HEAD requests redirect to GitHub login;
- unauthenticated mutation-like requests fail `401`;
- missing/broken authentication configuration fails closed;
- protected responses retain private/no-store/noindex/frame/content-type headers;
- network authentication never grants Media Desk write authority.

Repository code alone does **not** prove that the remote Admin is deployed or protected. `ADMIN_GITHUB_CLIENT_ID`, `ADMIN_GITHUB_CLIENT_SECRET`, `ADMIN_SESSION_SECRET`, the GitHub OAuth application callback and the `admin.looksawful.ru` runtime/custom-domain configuration must exist in the actual deployment environment before remote access can be claimed operational.

## Read-only rule

The Lab client contains no Desk mutation API calls and displays `READ ONLY`.

Local write authority remains separate:

```text
npm run desk:write
  -> local loopback only
  -> content/text-cms only
  -> revision-aware guarded writes
```

Authentication does not change those write gates.

## Scope boundary

This slice provides the authentication boundary for the existing isolated Lab foundation. It does not claim to complete the broader #732 product scope for the full LIVE/HIDDEN/WIP page and organism catalog, viewport/debug tooling or Berserk visibility.

## Verification

`.github/workflows/private-lab-verify.yml` checks:

- typecheck;
- the Lab shell contract;
- the permanent GitHub OAuth security contract;
- isolated Lab build;
- noindex artifact;
- absence of a Lab entry from the public production artifact.

A green repository build proves the repository-owned OAuth/Lab contract only. It must not be used to claim that Cloudflare runtime secrets, the production OAuth app/callback, the custom domain or the full #732 Lab workspace are deployed and operational.

## Storybook design system

The canonical Storybook viewer is part of the isolated Private Lab artifact, not the public production build.

```text
npm run lab:system
  -> dist-lab/lab/system/

npm run lab:inventory
  -> dist-lab/lab/system-inventory.json
  -> dist-lab/lab/system/inventory.html
```

The Lab shell links to `/lab/system/` and `/lab/system/inventory.html`. Storybook stories use production renderers, production data and the shared `parameters.looksawful` state schema. Public assets are mounted read-only from `public/` for production-backed media fixtures.

`.github/workflows/private-lab-verify.yml` builds the isolated Lab first, then Storybook and the generated inventory into the same `dist-lab/` artifact. The workflow verifies those files while still rejecting any accidental `dist/lab/index.html` public-build entry.

## Private Review Hub

The first Review Hub slice lives at `/lab/review/` behind the existing GitHub OAuth boundary.

Private review data uses a server-only Supabase adapter: JSON control/state records live behind RLS in Postgres and image evidence lives in a private Storage bucket. The repository does not contain captured review screenshots, runtime Review manifests, private object identifiers, private review URLs or Supabase secret keys. Missing backend configuration fails closed with `503`. The control table intentionally has RLS enabled with no `anon` or `authenticated` policies; only backend service-role RPCs may mutate Review Hub state. The reproducible Postgres schema/RPC contract lives in `tools/supabase/review-hub.sql`; the private Storage bucket id, Vault values and scheduled maintenance credentials remain deployment-specific and stay outside the public repository.

The authenticated runtime exposes:

```text
GET  /lab/review/api
POST /lab/review/api
GET  /lab/review/evidence/<evidence-id>
```

`POST /lab/review/api` accepts multipart form data containing a JSON `manifest` field and one image part per evidence id. The v1 manifest binds one Case to an exact 40-character source SHA, a review depth (`quick`, `interactive` or `full`), capture time and image evidence descriptors. Storage paths are derived server-side and are never returned to the browser.

The initial Review Hub slice intentionally left approval, stale-SHA rejection, retention, affected-Case routing and viewport matrices to follow-up work.

## Visual approval and retention

Visual approval is an explicit owner-only mutation at `POST /lab/review/approval`. The request carries the exact displayed `caseId`, 40-character `sourceSha` and `reviewDepth`; the server rejects a mismatch with `409 Conflict`. Browser-facing approval and baseline responses expose approval facts only; private promotion/storage identifiers remain server-side.

Approved evidence is staged into a unique durable bundle under `review-hub/v1/baselines/`. The Case-scoped state record at `review-hub/v1/state/<case>.json` carries both the current review identity and the active baseline pointer; approval updates that record through a service-role-only Postgres RPC with an exact opaque-etag compare-and-swap, so a superseding review makes promotion fail closed instead of publishing a stale baseline. Compact approval records persist separately under `review-hub/v1/approvals/<case>/<sha>/<review-depth>/<promotion-id>.json`; the promotion id remains private and is never returned to the browser.

Temporary capture objects under `review-hub/v1/cases/` receive an application `expiresAt` exactly four days after ingestion. The Review Hub stops serving them at that deadline. The production Supabase project runs an hourly `pg_cron` → `pg_net` maintenance call whose authentication token lives only in Vault; the maintenance Edge Function deletes expired binary objects through the Storage API before removing their metadata rows. The adapter also performs the same bounded cleanup opportunistically during Review Hub requests. The cleanup RPC is hard-scoped to `review-hub/v1/cases/`, so durable `baselines/`, `approvals/` and Case state are excluded.

The repository verifies the adapter and application contracts. Deployment still must provide the backend-only Supabase URL, secret key and private bucket id; none of those values belongs in browser code or the public repository.
