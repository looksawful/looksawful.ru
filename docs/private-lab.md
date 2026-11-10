# Private Lab

Status: OAUTH SECURITY CANDIDATE / non-production internal tooling foundation.

Private Lab is read-only with respect to site/CMS state. The Private Review Hub may write isolated visual-review authority state to Cloudflare D1 and private binary evidence to Cloudinary; it is not a CMS branch, not a deployment authority and not a shortcut around Media/Content Desk write policy.

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
REVIEW_DB                # Cloudflare D1 binding; Review authority/control plane
CLOUDINARY_CLOUD_NAME    # backend-only Cloudinary product environment
CLOUDINARY_API_KEY       # backend-only Cloudinary API key
CLOUDINARY_API_SECRET    # backend-only Cloudinary API secret; never browser/public source
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

Trusted deployment credentials must never be exposed to feature/candidate build steps. Unreviewed branch code, package scripts, media tooling and Lab builds run without Cloudflare/OAuth/session/Cloudinary production secrets; privileged deployment is a separate trusted step or workflow operating on already-validated output.

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

The Review Hub thin slice lives at `/lab/review/` behind the existing GitHub OAuth boundary.

Review authority/control data is server-side in Cloudflare D1. Binary image evidence is stored as Cloudinary `authenticated` assets under the dedicated `looksawful/review-hub` namespace. Cloudinary is not authoritative for Review state. The browser never receives raw Cloudinary delivery URLs or asset identifiers; authenticated Worker endpoints proxy evidence after Private Lab authorization.

The reproducible D1 schema lives in `tools/cloudflare/review-hub.sql`. Deployment-specific D1 database identity and Cloudinary credentials stay outside the public repository. Missing D1 or Cloudinary backend configuration fails closed with `503`.

The authenticated runtime exposes:

```text
GET  /lab/review/api
POST /lab/review/api
GET  /lab/review/evidence/<evidence-id>
```

`POST /lab/review/api` accepts multipart form data containing a JSON `manifest` field and one image part per evidence id. The v1 manifest binds one Review Target to an exact 40-character source SHA, a review depth (`quick`, `interactive` or `full`), capture time and image evidence descriptors. A Review Target is anchored to canonical `SitePage.id`; it is not a synonym for the domain entity Case.

Each capture receives a fresh immutable Review ID, including recaptures of the same Review Target + SHA + depth. Server-side object keys are derived from the Review Target and Review ID. The Review Hub returns only the authenticated application evidence route, never Cloudinary storage identity. Image evidence above 10 MB fails closed.

The existing approval/lifecycle code in draft PR #1122 is implementation evidence for the follow-up **Exact Review approval, lifecycle and Baseline** work package. Its old baseline-copy/retention assumptions are not the final authority model and must be reconciled there before merge.

The repository verifies the D1/Cloudinary adapter and application contracts. Deployment still must provide the `REVIEW_DB` binding plus backend-only Cloudinary credentials; none of those values belongs in browser code or public GitHub output.
