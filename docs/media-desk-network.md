# Media Desk network deployment

## Goal

Expose the existing Media/Content Desk at `https://media.looksawful.ru/tools/media-desk/` without changing its local write model.

The Desk remains a private development tool backed by a writable checkout of this repository. It is not added to the public production site or sitemap.

## Architecture

`browser -> Cloudflare Tunnel -> 127.0.0.1:4174 -> authenticated Vite Media Desk -> writable git checkout`

Recommended host: a small persistent Yandex Cloud Compute VM. Do not use an ephemeral/serverless container for this mode because Media Desk intentionally writes repository JSON files through the local filesystem.

The network runner binds to loopback by default and disables Vite HMR. The authentication middleware is registered before Vite's own middleware and protects the complete dev server, including `/src` and other Vite routes.

## Authentication

Network mode requires:

- `MEDIA_DESK_USERNAME`
- `MEDIA_DESK_PASSWORD_HASH`
- `MEDIA_DESK_SESSION_SECRET`
- `MEDIA_DESK_PUBLIC_ORIGIN=https://media.looksawful.ru`

Generate the password hash interactively:

```bash
npm run desk:password-hash
```

The password itself is never stored in the repository. The helper emits a salted `scrypt` hash. Store that hash only in `/etc/looksawful/media-desk.env` on the host.

Generate a session secret on the host, for example:

```bash
openssl rand -base64 48
```

Session cookies are `HttpOnly`, `SameSite=Strict`, `Secure`, host-only cookies. Sessions expire after 12 hours. Login attempts are rate-limited in-process.

## Host setup

Use a persistent VM and a dedicated Unix user named `looksawful`.

Expected checkout:

```text
/srv/looksawful.ru
```

Install Node 24, npm, git and the repository's media dependencies. Clone the `dev` branch into `/srv/looksawful.ru`, then run:

```bash
npm ci
npm run media:ensure
```

Copy the environment template:

```bash
sudo install -d -m 750 /etc/looksawful
sudo cp tools/deploy/media-desk/media-desk.env.example /etc/looksawful/media-desk.env
sudo chmod 600 /etc/looksawful/media-desk.env
```

Fill the real username, scrypt hash, session secret and public origin in that file.

Install the service:

```bash
sudo cp tools/deploy/media-desk/looksawful-media-desk.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now looksawful-media-desk
sudo systemctl status looksawful-media-desk
```

The service must listen only on `127.0.0.1:4174` unless a separate firewall/reverse-proxy design explicitly requires otherwise.

## Cloudflare Tunnel

Create one named Cloudflare Tunnel for Media Desk and route `media.looksawful.ru` to `http://127.0.0.1:4174`.

A configuration template is provided at:

```text
tools/deploy/media-desk/cloudflared-config.example.yml
```

Do not expose port `4174` publicly in the Yandex Cloud security group. The only intended path is the local Cloudflare Tunnel process.

Cloudflare Access may be added as an additional perimeter layer. If enabled, restrict it to the owning Cloudflare account/member or another explicit identity policy. The built-in Media Desk username/password gate should still remain enabled unless the deployment deliberately replaces it with an equivalent identity boundary.

## Start manually

For diagnostics on the host:

```bash
npm run desk:network
```

It starts Media Desk with write mode enabled, authentication enabled, HMR disabled and loopback binding on port `4174`.

## Persistence and git

Media Desk keeps its current behavior: edits are written to the checkout under `/srv/looksawful.ru`. They are not automatically committed or pushed by the authentication layer.

Before updating the VM checkout, inspect and commit/push Desk edits or otherwise reconcile the working tree. Do not run destructive reset/clean commands against a checkout containing uncommitted Desk changes.

A later automation layer can add reviewed commit/push or pull-request creation, but that is intentionally separate from network exposure and authentication.

## Security invariants

- no plaintext password in Git, service files or frontend code;
- no public bind for Vite;
- no HMR WebSocket in authenticated network mode;
- all unauthenticated HTTP routes are intercepted before Vite;
- authentication responses are `no-store` and `noindex`;
- login and logout reject cross-origin browser requests;
- the public site build remains unchanged;
- local `npm run desk` behavior remains unchanged.
