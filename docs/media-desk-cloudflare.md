# Remote Media Desk on Cloudflare

`media.looksawful.ru` is the private remote Media Desk origin. It is separate from the public site build and from the local `npm run desk` / `npm run desk:write` workflow.

## Fixed authority

- `dev` remains the working/integration branch.
- `prod` remains release/deployment authority for the public site.
- `content/text-cms` is the only remote Media Desk authoring branch.
- Remote authentication never grants direct write authority to `dev` or `prod`.

## Runtime

Cloudflare Worker runs before Static Assets. Unauthenticated browser requests receive the password screen; API-style requests receive `401`. A successful password login creates a signed `HttpOnly; Secure; SameSite=Strict` session cookie. Static files and API responses remain `private, no-store` and non-indexable.

The isolated UI is built with:

```text
npm run media-desk:build
```

It emits only the Desk bundle into `dist-media-desk`. The normal `build:site` path does not include that output.

Wrangler verification without runtime secrets:

```text
npm run media-desk:cf:dry-run
```

## Secrets

Cloudflare runtime secrets are:

- `MEDIA_DESK_PASSWORD_HASH` — salted PBKDF2-SHA256 encoding produced by `tools/media-desk/hash-password.mjs`;
- `MEDIA_DESK_SESSION_SECRET` — random signing secret;
- `MEDIA_DESK_GITHUB_TOKEN` — fine-grained token limited to `looksawful/looksawful.ru`, Contents read/write.

They are provisioned interactively with `tools/cloudflare/media-desk/configure-secrets.ps1`. Secret values are never committed to Git and are not passed to pull-request verification jobs.

## Deployment

Pull requests build the isolated UI and run Wrangler dry-run only. Real Worker deployment is eligible only on trusted `push` to `dev` or manual `workflow_dispatch`, using Cloudflare deployment credentials already stored in GitHub Actions.

The Worker-side GitHub adapter independently fixes its target to `content/text-cms`, validates repository paths before network access, checks the expected branch head, creates one Git commit, rechecks the head, and updates the branch with non-force fast-forward semantics.

## Authenticated preview delivery

The private Desk does not package the public portfolio media library into the Worker bundle. After a valid Media Desk session is established, `GET`/`HEAD` requests under `/media/**` and `/pets/**` are proxied to the fixed public origin `https://looksawful.ru`.

The proxy forwards only preview-relevant request headers (`Accept`, `Range`, `If-None-Match`, `If-Modified-Since`). Media Desk cookies and authorization state are never forwarded to the public site. Range responses are preserved so video previews can seek normally. Proxy responses are still wrapped with the private Desk `no-store` / `noindex` headers.

All other Desk JavaScript, CSS and HTML continue to come from the Cloudflare Static Assets binding.

## Remote API contract

Authenticated read endpoints:

- `GET /api/status` -> fixed authoring branch plus current `content/text-cms` head;
- `GET /api/media/revision?path=<allowed-path>` -> SHA-256 source revision plus current branch head, never source text.
Mutation endpoints are same-origin `POST` requests:

- `/api/media/upload` creates one canonical binary plus one CMS upload record in one authoring commit;
- `/api/media/replace` preserves media identity and replaces the physical source only after source-revision and branch-head checks;
- `/api/media/delete` rejects every asset with blocking unified usages and reports those dependencies;
- `/api/media/assign` supports typed project-cover and pet-cover targets. Character-cover remains fail-closed until a canonical character owner source exists.

New remote uploads require the captured branch head but no fictitious source revision. Replace, delete and assignment require both the relevant source revision and the captured branch head. A stale source or branch fails with `409`; the browser keeps its captured state and requires an explicit refresh instead of silently retrying.

The Worker transport cap for upload/replace is `16 MiB`, enforced before multipart parsing. This is intentionally lower than the repository's local media limits because Worker memory and GitHub base64 transport make larger bodies unsafe. Large media remains a local/Git-backed workflow until a separate bounded transport is designed.

## Activation checklist

Repository implementation and account activation are deliberately separate. After the PR is reviewed and merged into trusted `dev`:

1. authenticate Wrangler for the intended Cloudflare account;
2. provision `MEDIA_DESK_PASSWORD_HASH`, `MEDIA_DESK_SESSION_SECRET` and `MEDIA_DESK_GITHUB_TOKEN` with `tools/cloudflare/media-desk/configure-secrets.ps1` or equivalent secret actions;
3. deploy from trusted `dev` and verify the custom domain `media.looksawful.ru`;
4. verify unauthenticated HTML receives the login gate and unauthenticated API requests receive `401`;
5. verify authenticated Desk assets, `/media/**` and `/pets/**` previews, including a Range request;
6. verify `/api/status` reports `content/text-cms` and the current branch head;
7. perform the first real mutation only after confirming the target source revision/head and the dependency preview in the UI.

No account secret, custom-domain activation or real authoring mutation is required for PR dry-run verification.
