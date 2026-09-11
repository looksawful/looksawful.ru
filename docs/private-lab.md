# Private Lab

Status: INTEGRATION CANDIDATE / non-production internal tooling.

Private Lab is a read-only network shell for internal tools and diagnostics. It is not a CMS branch, not a source of truth and not a shortcut around Media/Content Desk write policy.

## Build

```bash
npx vite build --config vite.lab.config.ts
```

The Lab is built into `dist-lab/` independently from the public production Vite build. It carries exact build provenance through `LAB_BUILD_BRANCH`, `LAB_BUILD_COMMIT` and `LAB_BUILD_TIME`.

## Access boundary

`lab/functions/_middleware.js` is fail-closed:

- if `LAB_PASSWORD` is not configured, requests return `503`;
- missing/invalid Basic credentials return `401`;
- successful responses keep `Cache-Control: private, no-store` and `X-Robots-Tag: noindex, nofollow, noarchive`;
- the Lab HTML also carries `noindex,nofollow,noarchive`.

Repository code can define this middleware contract, but actual hostname/deployment secret configuration must be verified at the deployed Cloudflare boundary before claiming the Lab is protected on the public network.

## Read-only rule

The Lab client contains no Desk mutation API calls and displays `READ ONLY`. Authentication to the Lab does not grant CMS/media write authority.

Local write authority remains:

```text
npm run desk:write
  -> local loopback only
  -> content/text-cms only
  -> revision-aware guarded writes
```

## Verification

`.github/workflows/private-lab-verify.yml` checks:

- typecheck;
- the private Lab contract test;
- isolated Lab build;
- noindex artifact;
- absence of a Lab entry from the public production artifact.

External protection is a separate deployment/account verification step and must not be inferred from a green repository build alone.
