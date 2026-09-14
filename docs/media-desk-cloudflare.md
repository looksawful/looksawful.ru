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

Pull requests build the isolated UI and run Wrangler dry-run only. Real Worker deployment is eligible only when the workflow ref is exactly `refs/heads/dev`, for either a trusted `push` or a manual `workflow_dispatch`. The deploy job checks out the exact `github.sha`; a manual run from a feature branch or tag cannot publish the production Worker.

The Worker-side GitHub adapter independently fixes its target to `content/text-cms`, validates repository paths before network access, checks the expected branch head, creates one Git commit, rechecks the head, and updates the branch with non-force fast-forward semantics.

## Authenticated preview delivery

The private Desk does not package the public portfolio media library into the Worker bundle. After a valid Media Desk session is established, `GET`/`HEAD` requests under `/media/**` and `/pets/**` are proxied to the fixed public origin `https://looksawful.ru`.

The proxy forwards only preview-relevant request headers (`Accept`, `Range`, `If-None-Match`, `If-Modified-Since`). Media Desk cookies and authorization state are never forwarded to the public site. Range responses are preserved so video previews can seek normally. Proxy responses are still wrapped with the private Desk `no-store` / `noindex` headers.

All other Desk JavaScript, CSS and HTML continue to come from the Cloudflare Static Assets binding.

## Remote API contract

Authenticated read endpoints:

- `GET /api/status` -> fixed authoring branch plus current `content/text-cms` head;
- `GET /api/media/revision?target=project-cover|pet-cover` -> revision for one fixed cover-authoring source;
- `GET /api/media/revision?assetId=cms-<uuid>&surface=catalog|source` -> revision for one server-resolved CMS asset surface. Raw repository paths are rejected.
Mutation endpoints are same-origin `POST` requests:

- `/api/media/upload` creates one canonical binary plus one CMS upload record in one authoring commit;
- `/api/media/replace` is destructive-authoring only for CMS-owned PNG/JPEG/GIF/WebP images. The Worker resolves the canonical source from the `cms-<uuid>` record, verifies same-format MIME + magic bytes, derives dimensions from the replacement bytes, and commits binary + technical catalog metadata atomically;
- `/api/media/delete` is destructive-authoring only for CMS-owned assets. The Worker resolves file/catalog paths itself and recomputes blocking usages from the exact expected authoring commit before deletion;
- `/api/media/assign` supports typed project-cover and pet-cover targets. Character-cover remains fail-closed until a canonical character owner source exists.

New remote uploads require the captured branch head but no fictitious source revision. Replace and delete accept only canonical CMS asset identity plus the relevant source revision; repository paths and client-supplied usage arrays are not authority. Assignment requires its fixed-source revision plus the captured branch head. A stale source or branch fails with `409`; the browser keeps its captured state and requires an explicit refresh instead of silently retrying.

Registered/code-owned media remains visible and assignable but is read-only for remote replace/delete. Video, AVIF and SVG replacement also fails closed remotely; those replacements stay on the local/Git workflow until a server-side validator exists.

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

The deploy verification also checks the generated page-usage and static-usage snapshots for exact freshness. These snapshots let delete dependency checks use the same expected Git commit for page media, direct/video-poster placements and code-owned pet-cover bases.

No account secret, custom-domain activation or real authoring mutation is required for PR dry-run verification.
