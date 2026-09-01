# Tooling pipeline

## Local development

Use Node 24 and `npm ci`. `npm run dev` uses `media:ensure → vite`.
The existing ensure/sync architecture is unchanged. Unchanged local media does not
invoke Sharp or ffmpeg. Missing/stale derivatives fall back to real sync.
`npm run build` remains production-like: ensure → typecheck → Vite → site postbuild.
Postbuild applies CMS CV content, builds the sitemap and checks metadata/local links.

## Quick verification

`npm test` / `npm run test:fast` runs ordinary recursive Node tests (including nested
CSS contracts), without physical derivative checks or media-tool fixtures.
`npm run verify` runs ensure, typecheck, fast tests, media/data contracts, build:site and compact smoke.
`test:core` retains the original recursive `node --test` plus data integrity;
it includes all media fixtures and requires prepared derivatives.
`test:unit`, `test:ci`, `test:cv` expose focused groups. Lists belong to
`tools/ci/run-tests.mjs`, not deployment YAML.

## Media workflow

`media:sync` is the correctness path: catalog sync, video builder, responsive
builder, local-state write. It validates/builds real media; no placeholders.
`test:media` runs sync and `test:media:checks`; the latter runs media tests
and data integrity without repeating sync.

CI caches derivative **binaries only**, with the existing catalog-aware v4 key.
Tracked manifests, inventory, generated TypeScript and catalog records are never
restored from cache. All verification runs check the catalog and tracked diffs.

CI calls deterministic sync and media fixtures if any of these is true:

- Media inputs changed, dependencies changed, or diff scope is unknown/full manual.
- No exact derivative cache key hit.
- Cached binaries do not satisfy tracked metadata (missing files/byte-size drift).

Even an exact hit is checked by `tools/ci/media-scope.mjs`, using the existing
media-state validator. Fast tests and physical-media contracts also remain
mandatory. Thus cache presence is not correctness proof. For ordinary content/CV
changes complete data integrity (IDs, references, real source formats/dimensions,
manifest files) also runs in `test:media:contract`, after derivatives are available.
It does not invoke ffmpeg or regenerate media. For ordinary content/CV
changes with valid cached derivatives, neither ffmpeg installation nor sync/media
fixtures run. Build/local-link checks still reject missing referenced assets.
On this validated unchanged-input path, catalog `--check --check-stored` checks
registered technical fields, upload source presence/size/type/dimensions and the
import index without ffprobe. It is read-only and cannot write metadata. Any media
change or unusable cache instead installs tooling first and runs the original
full catalog probe/check and deterministic sync; `media:sync` never uses this mode.

### CMS metadata mutation

**Verify workflows do not modify their branch.** Stale tracked metadata fails
verification; it is never silently committed.

`Sync CMS media metadata` is a separate narrowly scoped operation on dev CMS media
pushes. It preserves the original allowed-path and generated-file guards, validates
real media, checks that dev has not advanced, and uses a non-force push. It then
explicitly dispatches Verify dev for the resulting head because pushes performed
with GITHUB_TOKEN do not normally trigger push workflows.
See [GitHub trigger rules](https://docs.github.com/actions/using-workflows/triggering-a-workflow).

`verify-pr.yml` keeps its optional `payload` compatibility input:
[Pages CMS action buttons always send it](https://pagescms.org/docs/configuration/actions/).
The payload cannot reduce validation scope. Content schemas, fields and CMS buttons
are unchanged.

## Affected verification

`tools/ci/change-scope.mjs` is the single change-classification source of truth.
Push workflows compare event.before to the exact checked-out event SHA, including
all commits in the push. PRs compare the base SHA with the checked-out merge SHA,
so the tested artifact includes integration. Missing diff means full correctness.
Invalid revisions fail instead of silently reducing scope.

Local committed changes: `npm run test:e2e:affected` compares origin/prod...HEAD.
Set `CI_DIFF_BASE` for another baseline. This command does not inspect unstaged
changes; use `verify` for current working-tree smoke or `verify:full` for full coverage.

| Scope | Browser selection |
| --- | --- |
| CV copy/styles/tools | smoke + CV |
| Navigation data/component/styles | smoke + navigation |
| Standalone Project content | smoke + project-pages |
| Other content | smoke + MPA |
| Scoped styles | smoke + MPA + project-pages |
| Media | smoke + original site/MPA/project-pages media audits |
| Entry, routing, shared components, global CSS, build config, dependencies, unknown | full |
| Documentation/ordinary CI configuration | smoke |

Unknown files are conservative, never untested. Registry or media input changes
always request deterministic media validation regardless of cache.

## Full verification

`npm run verify:full`: media:sync → typecheck → core → build:site → full browser.
`test:e2e:all` remains a compatibility alias of `test:e2e:full`.

| Level | Contract |
| --- | --- |
| smoke | home 390×844 / 1440×900; actual built JS/CSS requests; fatal/resource errors; navigation open/Escape; overflow; one Case/image decode/lightbox; Moves canvas; static CV with content-derived card counts |
| affected | smoke followed by focused original suites selected by classifier |
| full | smoke plus all five original suites/matrices: site, navigation, MPA, project-pages, CV; reduced motion, image decode, video metadata, canvas, lightbox touch/keyboard/focus, page flip, responsive/deep reload/history |
| production | compact smoke on sanitized CV + actual delivery-video metadata + production caption QA; no exhaustive second regression |

One browser/preview runtime is shared. Deep suites run with bounded concurrency 2;
each original suite keeps its serial viewport loop. Quick smoke finishes before
focused/deep suites start, so nested concurrency cannot exceed two contexts.
Failures drain active workers before browser cleanup. No mutable test state is
shared between contexts. Framework migration is not required.

### Readiness and animation contracts

Ignored networkidle waits were removed from site, MPA, Project and CV tests.
Initial readiness is the required DOM, fonts and rendering frames. Scroll waits
use animation frames; image/video checks explicitly decode/read metadata.
The full home motion test additionally waits for load/pageshow because the actual
global-reveal runtime deliberately initializes at that event plus one frame.
Canvas readiness observes bitmap/CSS size/error, lightbox close observes actual
dialog removal, page flip observes counter initialization/change.
Navigation already uses observable DOM state and contains no fixed sleeps.
Remaining timed waits in smoke-site cover real swipe/deck/reveal/motion settling
or time-based assertions; caption QA retains small visual-settling waits before
screenshots. They are not ignored network timeouts.

## Pull request pipeline

Checkout full history → classify complete integration diff → npm ci → typecheck →
fast tests → conditional media correctness → build → affected E2E.
Chromium and ffmpeg setup happen after cheap failures. CodeQL remains independent.
Checks run read-only; the normal PR workflow cannot commit or push.

## Dev pipeline

Same read-only stages as PR. A CV edit does not trigger exhaustive Jestei/STYX/media
viewport audits. CMS metadata synchronization is the separate mutation operation
described above, never a responsibility of Verify dev.

## Production pipeline

Only prod may build/deploy. Checkout exact event SHA → npm ci → typecheck → fast
tests → conditional media correctness → build:site → production CV sanitization →
production browser smoke/caption QA → deploy-version SHA + .nojekyll → Pages artifact.
Deploy depends on successful build. After Pages deployment, cache-busted requests
must prove the exact SHA, built index references (no raw src), nonempty JS/CSS
assets that are not HTML fallback, and sanitized CV structure. Commit status only
succeeds after build AND remote verification succeed. Existing retry schedule stays.

Do not auto-merge dev → prod. Production-only hotfixes must return via prod → dev
back-merge; no force push, reset, or rewritten history.

## Scheduled checks

Full regression runs nightly at 03:17 UTC and manually; it always runs deterministic
media validation and full browser coverage. Infrastructure changes also select full
in PR/dev. Healthcheck, dependency audit, external links, Lighthouse and CodeQL
remain independent and unchanged. No branch protection was found, so CodeQL push/PR
coverage is not reduced.

CV feature branch has unintegrated work: its workflow stays, narrowed to CV tests,
build, authored/production CV and screenshots, with the current cache contract.
Shootings integration branch is already ancestor of prod/dev. Its obsolete workflow
is removed, not the branch; ordinary shootings isolation/data tests and MPA browser
route checks remain. The historical SHA-freeze test remains opt-in for archaeology,
not a permanent freeze of current presentation.

## Troubleshooting

- Stale metadata: run `npm run media:sync`, review generated metadata, commit only
  expected source/metadata. Verification intentionally fails on drift.
- Cache missing/corrupt: CI selects deterministic sync, not a warning or placeholder.
- Missing Chromium: `npx playwright install --with-deps chromium`; if installation
  is unavailable, browser results are unverified until real Actions execution.
- Full failures: inspect the failing runtime/expectation first. Never adjust
  expectations just to turn a run green. Reduce concurrency if contention causes
  failure.
- Local ffmpeg versions may produce different byte counts. Do not publish local
  inventory changes from a tooling-only patch; authoritative CI derivatives and
  tracked metadata must agree. Prefer the same toolchain as the runner.
- CMS button input `payload` is a wire contract, not dead configuration.
- A concurrent dev push aborts CMS metadata persistence. Retry from the latest
  source; never force push.
