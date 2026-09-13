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
