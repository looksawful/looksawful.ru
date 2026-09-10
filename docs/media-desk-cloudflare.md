# Media Desk on Cloudflare

## Purpose

`Media Desk` is a private administrative tool for the `looksawful.ru` media catalog and editable content. The network version runs entirely on Cloudflare and does not require a VM, a local computer, a public Vite dev server or Cloudflare Tunnel.

Canonical URL:

```text
https://media.looksawful.ru/tools/media-desk/
```

The public portfolio remains on its existing release path. Media Desk is a separate Worker and is never added to public navigation, sitemap or indexing.

## Architecture

```text
browser
  -> media.looksawful.ru
  -> Cloudflare Worker auth
  -> Worker Static Assets (Media Desk UI)
  -> Worker API
       -> GitHub GraphQL
       -> looksawful/looksawful.ru:dev
```

Media previews use `https://www.looksawful.ru/media/...` first. If an asset is not yet present on production, the Worker falls back to the corresponding `dev/public/media/...` object on GitHub.

## Why this replaced the VM/Tunnel design

The local Media Desk writes files through Node's filesystem, which is useful for local development but is a poor network deployment boundary. The Cloudflare version replaces filesystem writes with GitHub API commits.

The result has no always-on host to patch, reboot or pay for. Cloudflare serves the static UI and runs the API only when a request arrives.

## Writes

Media metadata and Content Desk text remain Git-owned.

For each write the Worker:

1. reads the current target file(s) and exact `dev` HEAD from GitHub;
2. validates the requested fields against the Media/Content Desk editing boundary;
3. prepares complete UTF-8 JSON files;
4. creates one commit with GitHub GraphQL `createCommitOnBranch`;
5. supplies `expectedHeadOid`, so concurrent branch movement fails instead of silently overwriting another change.

Bulk media editing is committed atomically as one commit rather than one commit per asset.

The Worker does not receive Actions, administration, Issues or repository-settings permission. The recommended GitHub credential is a fine-grained token restricted to `looksawful/looksawful.ru` with repository `Contents: Read and write` only.

## Authentication

The Worker has its own username/password login page.

Non-secret username/configuration lives in `tools/cloudflare/media-desk/wrangler.jsonc`.

Secrets:

```text
MEDIA_DESK_PASSWORD_SHA256
MEDIA_DESK_SESSION_SECRET
MEDIA_DESK_GITHUB_TOKEN
```

They are Cloudflare Worker secrets and must never be committed.

The browser receives a signed 12-hour host-only session cookie with:

```text
HttpOnly; Secure; SameSite=Strict
```

All static assets run through the Worker first, so authentication protects HTML, JavaScript, CSS, source maps/API routes and media proxy requests rather than only the save endpoints.

Cloudflare Access can still be added as a second perimeter layer if desired. It is not required for the built-in account/password gate.

## First deployment from Windows

Prerequisites:

- Node 24 / npm;
- Cloudflare Wrangler authentication (`npx wrangler login`) or a suitable `CLOUDFLARE_API_TOKEN` in the environment;
- a GitHub fine-grained personal access token restricted to this repository with `Contents: Read and write`.

Run from the repository root:

```powershell
pwsh -File .\tools\cloudflare\media-desk\configure-secrets.ps1
```

The script:

- verifies Wrangler authentication;
- asks for the Media Desk password without echoing it;
- asks for the GitHub token without echoing it;
- computes the stored SHA-256 password digest;
- creates a random session-signing secret;
- writes the three deployment values to a temporary user-only file;
- builds the isolated Media Desk bundle;
- deploys Worker + secrets with Wrangler;
- removes the temporary secrets file in `finally` even when deployment fails.

The configured Worker Custom Domain is `media.looksawful.ru`. Cloudflare creates the DNS record and certificate when the API credential has the required Worker/zone permissions.

## Local Cloudflare runtime

Build the standalone Desk:

```powershell
npm run desk:cloudflare:build
```

After Cloudflare secrets exist, run the Worker runtime locally/remotely with:

```powershell
npm run desk:cloudflare:dev
```

The ordinary filesystem-backed local Desk remains available and unchanged:

```powershell
npm run desk
```

## Continuous deployment

`.github/workflows/media-desk-cloudflare.yml` verifies the Worker on PRs and deploys the Cloudflare version after relevant changes reach `dev`.

The workflow reuses:

```text
CLOUDFLARE_ACCOUNT_ID
CLOUDFLARE_API_TOKEN
```

If the existing Cloudflare token is intentionally kept Pages-only, create a separate GitHub Actions secret:

```text
CLOUDFLARE_MEDIA_DESK_API_TOKEN
```

The workflow prefers that dedicated token and falls back to `CLOUDFLARE_API_TOKEN`.

Runtime Media Desk secrets live in Cloudflare, not GitHub Actions. Normal Worker deployments preserve them.

## Cloudflare boundaries

`tools/cloudflare/media-desk/vite.config.mjs` builds only the Media Desk application. It sets `publicDir: false`, so the enormous portfolio media tree is not copied into the Worker Static Assets bundle.

`/media/*` is served through the authenticated Worker proxy instead. This keeps the Worker deployment small and avoids duplicating the portfolio's media storage.

The Cloudflare static-assets configuration uses `run_worker_first: true`. Do not remove it. Without that setting Cloudflare can serve a matching static asset before the authentication code runs.

## Security invariants

- no plaintext password or GitHub write token in Git;
- no browser-visible GitHub token;
- no VM, SSH endpoint, public dev port or Tunnel dependency;
- auth executes before static asset serving;
- write requests are same-origin only;
- session cookies are `HttpOnly`, `Secure` and `SameSite=Strict`;
- all Desk responses are `noindex`;
- protected media fields cannot be changed by the write API;
- registered catalog assets cannot acquire project membership through Media Desk;
- Content Desk writes stay inside its explicit JSON source boundary;
- GitHub writes use exact-head optimistic concurrency;
- bulk media edits become one atomic GitHub commit;
- production site build and local `npm run desk` stay independent from Cloudflare deployment.
