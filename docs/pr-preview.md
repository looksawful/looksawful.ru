# Pull request browser previews

## Purpose

Every internal pull request targeting `dev` or `prod` can be built from its exact head SHA and published as an isolated **private** Cloudflare Pages preview before merge.

The preview project is `looksawful-ru-preview`. Production `looksawful.ru` is outside this system and must never be modified by the preview workflow.

The same workflow supports a manual exact-SHA mode for release candidates.

## Privacy contract

All Cloudflare Pages preview deployments are protected by Cloudflare Access before a new preview may be uploaded.

Human access uses the Cloudflare Access login configured for the account. CI uses a dedicated Access Service Token stored only in GitHub Actions secrets:

- `CF_ACCESS_CLIENT_ID`
- `CF_ACCESS_CLIENT_SECRET`

The workflow is fail-closed:

1. it requires both service-token secrets;
2. it probes the already protected `lab.looksawful-ru-preview.pages.dev` boundary anonymously;
3. anonymous access must receive an Access challenge or denial;
4. the same target must be readable with the service token;
5. only then may Wrangler publish a new `pr-<number>` deployment;
6. every newly published immutable URL is checked again for anonymous denial and authenticated exact-SHA access.

A public `200` response from a preview URL is a deployment failure, not a warning.

## Runtime contract

Workflow: `.github/workflows/pr-preview.yml`

For each eligible pull request or manually selected repository SHA the workflow:

1. Resolves the exact candidate SHA, preview number, and a trusted QA ref. For pull requests the QA ref is the base SHA, never the candidate head.
2. Uses Node 24 and `npm ci` in the candidate build job.
3. Restores or regenerates the canonical generated-media cache.
4. Runs typecheck, Fast CI and the private-preview Access contract.
5. Builds with `npm run build:site` without production analytics variables.
6. Stamps `dist/preview-version.txt` with the exact target SHA and preview number.
7. Prepares Cloudflare-compatible media without deleting repository sources.
8. Keeps tracked files above the Cloudflare Pages per-file limit in Git and exposes them through exact-SHA redirects. Only the temporary copy inside `dist` is removed.
9. Re-encodes only oversized generated browser-delivery video into a preview-only surrogate.
10. Must never make an unknown file disappear. Unsupported oversized files fail closed.
11. Enforces Pages file-count and per-file limits.
12. Requires the existing protected `looksawful-ru-preview` project. The workflow no longer creates a fresh unprotected project automatically.
13. Verifies the shared Access boundary before deployment.
14. Deploys only to `pr-<number>` and receives immutable and branch-alias URLs.
15. Verifies anonymous denial, service-token access, exact SHA/PR identity and `X-Robots-Tag: noindex` on the immutable deployment.
16. Verifies oversized-media routes while forwarding Access credentials only to the preview origin. External exact-SHA media redirects never receive Access secrets.
17. Runs Playwright against the private immutable deployment from the **trusted base QA harness**, not candidate source. The browser injects Access headers only for the preview origin.
18. Waits for the protected human-friendly branch alias to converge.
19. Creates or updates one PR comment with the stable protected preview and immutable URL.

## Oversized media contract

The repository remains the source of truth for original media. Preview packaging is ephemeral and runs only against generated `dist`.

For an oversized tracked file under `public/`:

- the repository file stays unchanged;
- the original public path remains canonical;
- only the temporary copy inside `dist` is removed;
- the preview uses an exact-SHA redirect to `raw.githubusercontent.com`;
- Access Service Token headers are never forwarded to that external origin.

For an oversized generated browser-delivery video:

- source/master remains untouched;
- canonical generated-media cache is not rewritten in Git;
- a smaller H.264/AAC preview-only surrogate is created only inside the artifact;
- `preview-media-manifest.json` records the preview-only surrogate.

Any unknown oversized asset fails the workflow.

## Preview URLs

Cloudflare returns two protected URLs per deployment:

- immutable deployment URL: exact deployment identity and CI source of truth;
- `https://pr-<number>.looksawful-ru-preview.pages.dev`: stable human review alias.

Both must require Cloudflare Access. `X-Robots-Tag: noindex` remains required as a second, independent preview safeguard.

## Trigger modes

### Automatic PR mode

`pull_request` runs for internal PRs targeting `dev` or `prod`. Fork PRs are excluded.

### Manual exact-SHA mode

`workflow_dispatch` accepts:

- `target_sha`: exact 40-character repository commit SHA;
- `preview_number`: numeric PR/release identifier.

Manual exact-SHA mode is preview evidence only. It never approves merge or production deployment.

## Required GitHub Actions secrets

Four repository Actions secrets are required:

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`
- `CF_ACCESS_CLIENT_ID`
- `CF_ACCESS_CLIENT_SECRET`

`CLOUDFLARE_API_TOKEN` is the infrastructure token. It should be narrowly scoped to the account/project and must not be a Global API Key.

The `CF_ACCESS_*` pair belongs to the dedicated `looksawful-preview-ci` Cloudflare Access Service Token. It authenticates CI to private preview URLs and is not a human password.

GitHub deliberately does not expose existing secret values back to repository automation, so creation of these secret values is an account-owner action.

## Security boundaries

- The workflow uses `pull_request`, never `pull_request_target`.
- Fork PRs do not receive Cloudflare credentials.
- Candidate source executes only in the build job, which has no Cloudflare/API/Access secrets.
- The deploy job receives Cloudflare infrastructure and Access credentials but does not checkout or execute candidate source.
- Remote browser QA receives only the Access Service Token and checks out the trusted PR base SHA, never the candidate SHA.
- Browser routing adds the Access Service Token only to the private preview origin.
- External media redirects do not receive Access credentials.
- No production analytics variables are injected into preview builds.
- No production domain is attached to `looksawful-ru-preview`.
- Preview deployment always uses `--branch=pr-<number>`, never `--branch=prod`.
- Production remains owned by `.github/workflows/pages.yml` and `prod`.

## Activation prerequisites

Before this workflow is enabled on `dev`:

1. Cloudflare Zero Trust must be initialized.
2. The Pages project `looksawful-ru-preview` must have its preview Access policy enabled.
3. The dedicated CI service token must be allowed by the preview Access application.
4. All four GitHub Actions secrets must exist.
5. Anonymous access to a Lab/preview Pages URL must be denied.
6. Service-token access must succeed.

The workflow intentionally refuses to publish while any of these conditions is missing.

## Manual review gate

A green preview means the exact target SHA was built, published privately, anonymously blocked, service-authenticated, identity-checked, media-checked, and browser-smoked. It does not replace visual review.

Before merge, sign into the protected preview and inspect the affected layouts, typography, media, motion, touch/hover behavior, WebGL content, sliders, galleries, lightboxes and project-specific interactions.

Production release policy is explicit: **no merge/deployment to `prod` until the exact candidate preview has been manually approved.**

## Failure interpretation

- Missing Access service credential: create `looksawful-preview-ci` and add both `CF_ACCESS_*` GitHub secrets.
- Anonymous preview returns `200`: Cloudflare Access is not protecting previews; do not deploy another preview.
- Service authentication fails: repair the Service Auth policy/token before publishing.
- Cloudflare project missing: create/configure the protected preview project first; the workflow will not create a public replacement.
- Unsupported oversized asset: add an explicit safe preview strategy instead of deleting the source.
- Preview-media route failure: exact-SHA redirect or preview-only surrogate is not reachable.
- Immutable preview identity mismatch: invalidate the deployment.
- Stable branch alias lag: immutable protected deployment remains the source of truth.
- Missing `X-Robots-Tag: noindex`: treat preview publication as failed.
- Remote Playwright failure: the private preview is not review-green.
