# Private Lab

Status: OAUTH SECURITY CANDIDATE / non-production internal tooling foundation.

Private Lab is a read-only internal tooling surface. It is not a CMS branch, not a source of truth, not a deployment authority and not a shortcut around Media/Content Desk write policy.

## Build

```bash
npx vite build --config vite.lab.config.ts
```

The Lab is built into `dist-lab/` independently from the public production Vite build. It carries exact build provenance through `LAB_BUILD_BRANCH`, `LAB_BUILD_COMMIT` and `LAB_BUILD_TIME`.

Local Lab serving/preview defaults to `127.0.0.1`.

## Storybook inventory

The Lab Storybook is a read-only projection of production architecture. It does not own a parallel component tree, authored copy, media fixtures, DOM contract or CSS implementation.

Current inventory classes:

- **Templates**: compact section-owner fixtures rendered through `src/site/renderers/entity/section.ts`.
- **Compositions**: compact canonical entity articles rendered through `src/site/renderers/entity/entity-shell.ts`.
- **Pages**: representative standalone Case, Collection and Project archetypes selected from `src/site/pages/manifest.ts`.

Fixture data comes from `src/content/pages/index.ts` and the existing typed production PageContent registry. Page shell presentation comes from `src/site/pages/entity-presentation.ts`. Every entity fixture carries route-discovery evidence (`path`, `listed`, `indexable`) from the canonical manifest and exposes desktop, tablet and mobile inspection canvases.

The Storybook therefore follows production changes instead of preserving Storybook-only copies that can drift from the public site.

## Access boundary

The repository-owned authentication candidate uses application-level GitHub OAuth for the private Admin/Lab surface. It does not use a parallel Basic Auth/password mechanism.

Runtime bindings required by the candidate:

```text
ADMIN_GITHUB_CLIENT_ID
ADMIN_GITHUB_CLIENT_SECRET
ADMIN_SESSION_SECRET
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

This slice expands the existing isolated Lab with a production-derived Storybook inventory while preserving the authentication and read-only boundaries. It does not make Lab a CMS, a route owner or a second source of production markup.

## Verification

`.github/workflows/private-lab-verify.yml` checks:

- typecheck;
- the Lab shell contract;
- the permanent GitHub OAuth security contract;
- isolated Lab build;
- noindex artifact;
- absence of a Lab entry from the public production artifact.

The focused Storybook architecture contract is `test/lab-storybook-architecture.test.mjs`. It verifies that inventory ownership remains connected to the production page manifest, PageContent registry, section renderer and entity-shell renderer rather than copied Storybook markup.

A green repository build proves the repository-owned OAuth/Lab contract only. It must not be used to claim that Cloudflare runtime secrets, the production OAuth app/callback, the custom domain or remote Admin deployment are operational.
