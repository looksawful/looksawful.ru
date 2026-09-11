# Private Lab

Status: INTEGRATION CANDIDATE / non-production internal tooling foundation.

Private Lab is a read-only internal tooling surface. It is not a CMS branch, not a source of truth, not a deployment authority and not a shortcut around Media/Content Desk write policy.

## Build

```bash
npx vite build --config vite.lab.config.ts
```

The Lab is built into `dist-lab/` independently from the public production Vite build. It carries exact build provenance through `LAB_BUILD_BRANCH`, `LAB_BUILD_COMMIT` and `LAB_BUILD_TIME`.

Local Lab serving/preview defaults to `127.0.0.1`.

## Access boundary

This integration slice does **not** introduce a new network-authentication mechanism.

Current #732 contract is authoritative:

- do not invent a parallel Basic Auth/password system merely for this Lab foundation;
- remote private access should reuse the existing Admin/GitHub OAuth authentication boundary, or remain local-only until that boundary is implemented and verified;
- repository isolation/noindex is not equivalent to authentication;
- network authentication never grants Media Desk write authority.

Therefore this integration candidate should be treated as local-only until the reviewed Admin/GitHub OAuth security slice is wired to the Lab deployment.

## Read-only rule

The Lab client contains no Desk mutation API calls and displays `READ ONLY`.

Local write authority remains separate:

```text
npm run desk:write
  -> local loopback only
  -> content/text-cms only
  -> revision-aware guarded writes
```

## Scope boundary

This PR provides only a Lab foundation: isolated build, provenance, noindex and read-only shell. It does not claim to complete the broader #732 product scope for the full LIVE/HIDDEN/WIP page and organism catalog, viewport/debug tooling, Berserk visibility or GitHub OAuth/Admin integration.

## Verification

`.github/workflows/private-lab-verify.yml` checks:

- typecheck;
- the Lab foundation contract test;
- isolated Lab build;
- noindex artifact;
- absence of a Lab entry from the public production artifact.

A green repository build proves only this repository-owned foundation. It must not be used to claim that remote Lab authentication or the full #732 Lab workspace is complete.
