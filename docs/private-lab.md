# Private Lab

Status: OAUTH SECURITY CANDIDATE / non-production internal tooling foundation.

Private Lab is a read-only internal tooling surface. It is not a CMS branch, not a source of truth, not a deployment authority and not a shortcut around Media/Content Desk write policy.

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
