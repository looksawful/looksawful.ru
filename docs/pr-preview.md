# Pull request browser previews

## Purpose

Every internal pull request targeting `dev` or `prod` can be built from its exact head SHA and published as an isolated Cloudflare Pages preview before merge.

This preview path is intentionally separate from the production GitHub Pages deployment. It must never update `looksawful.ru`, merge a pull request, or deploy the `prod` branch.

## Runtime contract

Workflow: `.github/workflows/pr-preview.yml`

For each eligible pull request the workflow:

1. Checks out `github.event.pull_request.head.sha` exactly.
2. Uses Node 24 and `npm ci`.
3. Restores or regenerates the canonical generated-media cache using the same cache key family as production.
4. Runs typecheck and the Fast test suite.
5. Builds with `npm run build:site` without production analytics environment variables.
6. Stamps `dist/preview-version.txt` with the exact PR head SHA and PR number.
7. Rejects a build that exceeds Cloudflare Pages Direct Upload file-count or per-file size limits before upload.
8. Ensures the isolated Cloudflare Pages project `looksawful-ru-preview` exists. The project is created automatically on the first authenticated run if needed, with `prod` recorded as the Cloudflare Pages production branch.
9. Deploys only to the preview branch alias `pr-<number>`.
10. Fetches the published deployment over HTTPS, verifies the stamped SHA/PR identity, and requires Cloudflare's preview `X-Robots-Tag: noindex` response header.
11. Launches Playwright Chromium and runs the repository's production browser smoke against the published internet URL.
12. Creates or updates one PR comment containing the preview URL and immutable deployment URL.

## Required GitHub Actions secrets

Two repository Actions secrets are required:

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`

The Cloudflare API token should be scoped to the relevant account with `Cloudflare Pages: Edit` / `Pages Write` permission only. Do not use a Global API Key.

The workflow cannot and must not create these GitHub secrets itself. Add them in GitHub repository settings under Actions secrets. GitHub deliberately does not expose existing secret values back to workflows or repository automation.

## Security boundaries

- The workflow runs only when the pull request head repository is the same repository as the base repository. Fork pull requests do not receive Cloudflare credentials.
- The workflow uses `pull_request`, never `pull_request_target`.
- Checkout uses the exact PR head SHA with persisted Git credentials disabled.
- Cloudflare credentials exist only as GitHub Actions secrets.
- No production analytics variables are injected into preview builds.
- No custom production domain is attached to `looksawful-ru-preview`.
- The Cloudflare Pages deploy command always uses `--branch=pr-<number>`, never `--branch=prod`.
- Production remains owned by `.github/workflows/pages.yml` and the `prod` branch.

## First activation

After the two Actions secrets are present, re-run the PR Preview workflow for an open internal PR or push a new commit to that PR branch. The first authenticated run creates `looksawful-ru-preview` automatically if it does not exist, then performs the first preview deployment.

Cloudflare Pages preview deployments are public by default but receive `X-Robots-Tag: noindex`. Cloudflare Access can be added later if authenticated previews are required; doing so also requires configuring machine access for remote CI verification.

## Manual review gate

A green preview workflow means the exact PR SHA was built, published, identity-checked over the internet, and passed automated browser smoke. It does not replace human visual review.

Before merge, open the PR's preview URL on the actual target devices/browsers and inspect layout, typography, media, motion, touch/hover behavior, WebGL/Three.js content, sliders, galleries, lightboxes and project-specific interactions affected by the change.

## Failure interpretation

- Missing credential error: add the two required GitHub Actions secrets.
- Cloudflare project lookup/create error: verify Account ID and token scope.
- Asset limit error: the generated `dist` contains too many files or a file larger than the current Cloudflare Pages Direct Upload limit; do not silently omit the asset from preview.
- Preview identity mismatch: treat the deployment as invalid. Do not review or merge based on that URL.
- Missing `X-Robots-Tag: noindex`: treat preview publication as failed until indexing protection is restored.
- Remote Playwright failure: the published internet build is not considered preview-green even if local CI passed.
