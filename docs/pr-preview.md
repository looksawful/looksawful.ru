# Pull request browser previews

## Purpose

Every internal pull request targeting `dev` or `prod` can be built from its exact head SHA and published as an isolated Cloudflare Pages preview before merge.

The same workflow also supports a manual exact-SHA mode. This is used for release candidates that must be previewed before the preview workflow itself is present on the candidate's base branch.

This preview path is intentionally separate from the production GitHub Pages deployment. It must never update `looksawful.ru`, merge a pull request, or deploy the `prod` branch.

## Runtime contract

Workflow: `.github/workflows/pr-preview.yml`

For each eligible pull request or manually selected repository SHA the workflow:

1. Resolves an exact target SHA and numeric preview/PR identifier.
2. Uses Node 24 and `npm ci`.
3. Restores or regenerates the canonical generated-media cache using the same cache key family as production.
4. Runs typecheck and the Fast test suite.
5. Builds with `npm run build:site` without production analytics environment variables.
6. Stamps `dist/preview-version.txt` with the exact target SHA and preview/PR number.
7. Prepares a Cloudflare-compatible preview artifact without deleting or rewriting repository media sources.
8. Keeps tracked files larger than the Cloudflare Pages per-asset limit in Git and removes only their temporary copies from `dist`; explicit `_redirects` rules point the preview URL to the same file at the exact target SHA on `raw.githubusercontent.com`.
9. Re-encodes only oversized generated browser-delivery video into a preview-only surrogate below the Pages asset limit. The generated cache source/master and repository files remain untouched.
10. Fails closed for any other oversized untracked asset until an explicit safe preview strategy exists.
11. Enforces Cloudflare Pages file-count and per-file limits after preview packaging.
12. Ensures the isolated Cloudflare Pages project `looksawful-ru-preview` exists. The project is created automatically on the first authenticated run if needed, with `prod` recorded as the Cloudflare Pages production branch.
13. Deploys only to the preview branch alias `pr-<number>`.
14. Fetches the published deployment over HTTPS, verifies the stamped SHA/PR identity, and requires Cloudflare's preview `X-Robots-Tag: noindex` response header.
15. Verifies that every oversized-media preview route remains reachable after deployment.
16. Launches Playwright Chromium and runs the repository's production browser smoke from the checked-out target revision against the published internet URL.
17. Creates or updates one PR comment containing the preview URL and immutable deployment URL.

## Oversized media contract

Cloudflare Pages cannot store an individual static asset larger than its current per-file limit. That deployment limit is not allowed to become a deletion policy for the repository.

The repository remains the source of truth for original media. Preview packaging is ephemeral and runs only against the generated `dist` directory on the CI runner.

For an oversized file already tracked under `public/`:

- the original file stays in Git unchanged;
- the original path stays in the media/catalog architecture unchanged;
- only the temporary copy inside `dist` is removed before upload;
- the preview gets an explicit 302 redirect from the original public path to `raw.githubusercontent.com/<repository>/<exact-sha>/public/<path>`;
- therefore a changed tracked media file is still previewed from the exact candidate commit rather than silently falling back to production.

For an oversized generated browser-delivery video under `dist/media/generated/video/`:

- the repository source/master is not touched;
- the canonical generated-media cache is not rewritten in Git;
- CI creates a smaller H.264/AAC surrogate only inside the preview artifact;
- `preview-media-manifest.json` records that the deployed file is a preview-only surrogate;
- this surrogate is suitable for layout, playback, interaction and browser-regression review, but final compression/quality review must use the canonical media source/delivery artifact.

Any oversized untracked asset outside the supported generated-video path fails the workflow. The pipeline must never make an unknown file disappear merely to satisfy a hosting limit.

## Trigger modes

### Automatic PR mode

`pull_request` runs for internal PRs targeting `dev` or `prod`. Fork PRs are intentionally excluded because they must not receive Cloudflare credentials.

### Manual exact-SHA mode

`workflow_dispatch` accepts:

- `target_sha`: exact 40-character commit SHA that exists in this repository;
- `preview_number`: numeric PR/release identifier used for the `pr-<number>` alias and PR comment.

This mode exists specifically so a production candidate such as a branch created directly from current `prod` can be previewed from the workflow installed on the default development line without first modifying production.

Manual mode is preview evidence only. It never constitutes approval to merge or deploy.

## Required GitHub Actions secrets

Two repository Actions secrets are required:

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`

The Cloudflare API token should be scoped to the relevant account with `Cloudflare Pages: Edit` / `Pages Write` permission only. Do not use a Global API Key.

The workflow cannot and must not create these GitHub secrets itself. Add them in GitHub repository settings under Actions secrets. GitHub deliberately does not expose existing secret values back to workflows or repository automation.

## Security boundaries

- Automatic PR mode runs only when the pull request head repository is the same repository as the base repository. Fork pull requests do not receive Cloudflare credentials.
- Manual mode can only be invoked by a user who already has sufficient repository Actions permissions and accepts only an exact repository commit SHA plus a numeric preview identifier.
- The workflow uses `pull_request`, never `pull_request_target`.
- Checkout uses the exact resolved SHA with persisted Git credentials disabled.
- Cloudflare credentials exist only as GitHub Actions secrets.
- Candidate PR code executes in the build and remote-QA jobs without Cloudflare credentials. The deploy job receives Cloudflare credentials but does not checkout or execute candidate source code.
- No production analytics variables are injected into preview builds.
- No custom production domain is attached to `looksawful-ru-preview`.
- The Cloudflare Pages deploy command always uses `--branch=pr-<number>`, never `--branch=prod`.
- Production remains owned by `.github/workflows/pages.yml` and the `prod` branch.

## First activation

After the two Actions secrets are present, re-run the PR Preview workflow for an open internal PR or dispatch it manually for an exact candidate SHA. The first authenticated run creates `looksawful-ru-preview` automatically if it does not exist, then performs the first preview deployment.

Cloudflare Pages preview deployments are public by default but receive `X-Robots-Tag: noindex`. Cloudflare Access can be added later if authenticated previews are required; doing so also requires configuring machine access for remote CI verification.

## Manual review gate

A green preview workflow means the exact target SHA was built, published, identity-checked over the internet, oversized-media routes were verified, and the published site passed automated browser smoke. It does not replace human visual review.

Before merge, open the PR's preview URL on the actual target devices/browsers and inspect layout, typography, media, motion, touch/hover behavior, WebGL/Three.js content, sliders, galleries, lightboxes and project-specific interactions affected by the change.

Production release policy is explicit: **no merge/deployment to `prod` until the exact candidate preview has been manually approved.**

## Failure interpretation

- Missing credential error: add the two required GitHub Actions secrets.
- Cloudflare project lookup/create error: verify Account ID and token scope.
- Unsupported oversized asset: the repository source remains untouched; add an explicit preview delivery strategy instead of deleting the source.
- Preview-media route failure: an exact-SHA redirect or preview-only surrogate is not reachable; do not approve that preview.
- File-count/per-file limit error after packaging: the prepared artifact still violates Cloudflare Pages limits and must not be uploaded.
- Preview identity mismatch: treat the deployment as invalid. Do not review or merge based on that URL.
- Missing `X-Robots-Tag: noindex`: treat preview publication as failed until indexing protection is restored.
- Remote Playwright failure: the published internet build is not considered preview-green even if local CI passed.
