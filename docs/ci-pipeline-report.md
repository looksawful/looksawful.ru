# CI pipeline audit — 2026-09-01

Snapshot before implementation. No source/application edits.

```text
On branch perf/ci-pipeline-recovery
Your branch is up to date with 'origin/prod'.

nothing to commit, working tree clean
  feat/cms-media-catalog
* perf/ci-pipeline-recovery
  remotes/origin/HEAD -> origin/feat/cms-media-catalog
  remotes/origin/acceptance/media-catalog-upload-20260831
  remotes/origin/agent-ping-trigger
  remotes/origin/agent-runner-pong
  remotes/origin/backup/dev-pre-mpa-20260829
  remotes/origin/chore/free-site-infrastructure
  remotes/origin/content-edit-2026-08-25
  remotes/origin/debug/harsh-light-geometry
  remotes/origin/dependabot/github_actions/actions/checkout-7
  remotes/origin/dependabot/github_actions/actions/deploy-pages-5
  remotes/origin/dependabot/github_actions/actions/setup-node-7
  remotes/origin/dependabot/github_actions/actions/upload-artifact-7
  remotes/origin/dependabot/npm_and_yarn/sharp-0.35.3
  remotes/origin/dependabot/npm_and_yarn/three-0.185.1
  remotes/origin/dependabot/npm_and_yarn/vite-8.2.2
  remotes/origin/design/media-groups-layout-pass
  remotes/origin/dev
  remotes/origin/docs/cms-content-map
  remotes/origin/feat/blog-v1-design-red
  remotes/origin/feat/blog-v1-editorial
  remotes/origin/feat/blog-v1-editorial-ci
  remotes/origin/feat/blog-v1-editorial-red
  remotes/origin/feat/blog-v1-hardening-red
  remotes/origin/feat/blog-v1-smoke-red
  remotes/origin/feat/caption-intrinsic-height
  remotes/origin/feat/caption-intrinsic-height-ready
  remotes/origin/feat/caption-lower-third
  remotes/origin/feat/caption-lower-third-test
  remotes/origin/feat/cms-awful-cases-editorial
  remotes/origin/feat/cms-berry-editorial-copy
  remotes/origin/feat/cms-cv-contacts
  remotes/origin/feat/cms-cv-experience-copy
  remotes/origin/feat/cms-editorial-control
  remotes/origin/feat/cms-jestei-editorial-copy
  remotes/origin/feat/cms-media-catalog
  remotes/origin/feat/cms-moves-awful-editorial
  remotes/origin/feat/cms-navigation-labels
  remotes/origin/feat/cms-project-cover-metadata
  remotes/origin/feat/cms-sensetique-editorial-copy
  remotes/origin/feat/cms-shootings-records
  remotes/origin/feat/cms-styx-editorial-copy
  remotes/origin/feat/cv-page
  remotes/origin/feat/experience-workplaces-refine
  remotes/origin/feat/media-engines
  remotes/origin/feat/pages-cms-editor
  remotes/origin/feat/project-nav-back-to-top
  remotes/origin/feat/project-nav-back-to-top-rebased
  remotes/origin/feat/project-nav-back-to-top-temp
  remotes/origin/feat/shootings-page
  remotes/origin/feat/site-mpa-architecture
  remotes/origin/finalize-typography-dev
  remotes/origin/finish-numbering
  remotes/origin/finish-typography
  remotes/origin/finish-typography-final
  remotes/origin/finish-typography-red
  remotes/origin/finish-typography-test
  remotes/origin/finish-typography-work
  remotes/origin/fix/cms-cv-four-projects
  remotes/origin/fix/cms-jestei-review-guards
  remotes/origin/fix/cms-main-cases-editability
  remotes/origin/fix/cms-project-cover-registry
  remotes/origin/fix/harsh-light-intrinsic-sizing
  remotes/origin/fix/lighthouse-chromium-sandbox
  remotes/origin/fix/mobile-dense-captions-20260829
  remotes/origin/fix/pages-cms-yaml-scalars
  remotes/origin/fix/project-nav-fallback
  remotes/origin/fix/sensetique-harsh-light-slider-width
  remotes/origin/hotfix/analytics-loopback
  remotes/origin/hotfix/production-asset-loading
  remotes/origin/infra/post-seo-foundation
  remotes/origin/infra/post-seo-foundation-v2
  remotes/origin/integration/shootings-data-prod
  remotes/origin/lab/jestei-theme-organism-prod-base
  remotes/origin/lab/motion-system-refactor
  remotes/origin/noop
  remotes/origin/perf/lighthouse-media-cache
  remotes/origin/perf/tooling-pipeline-production
  remotes/origin/prod
  remotes/origin/release/free-site-infrastructure
  remotes/origin/release/media-catalog-prod-20260831
  remotes/origin/release/media-catalog-prod-20260831-final
  remotes/origin/release/media-catalog-prod-20260831-v2
  remotes/origin/release/media-catalog-prod-20260831-v3
  remotes/origin/rollback/mobile-dense-captions-pre-20260829
  remotes/origin/typography-dev-run
  remotes/origin/typography-media-numbering
  remotes/origin/verify/free-site-infrastructure-release
  remotes/origin/verify/prod-smoke-baseline
df1ddce (HEAD -> perf/ci-pipeline-recovery, origin/prod) fix(cms): allow empty editorial copy
fd5d44f CV: refine technology labels and tools
bab5e1e CI: skip full browser suite for CV copy-only deploys
d5b4ba5 CV: hide soft skills and update RIA copy
6aa300d CV: update profile, skills, education and experience copy
14e6a99 CV: hide Kursovoy, case lists and portfolio links
bd8929b cv: hide case lists and portfolio links
b4753ad cv: hide Kursovoy experience
74e28fc CV: update profile summary copy
a9f6358 cv: update profile summary copy
10b92fd Publish reusable Media Catalog
46167bf (origin/release/media-catalog-prod-20260831-v2, origin/release/media-catalog-prod-20260831) Merge pull request #56 from looksawful/feat/cms-media-catalog
d0faacf (origin/feat/cms-media-catalog, origin/HEAD) docs(cms): add media catalog handoff
e3c1fc8 feat(cms): add reusable media catalog
7f97159 Merge pull request #54 from looksawful/dev
d8804a8 Merge pull request #53 from looksawful/fix/cms-cv-four-projects
7649856 (origin/fix/cms-cv-four-projects) fix(cms): complete CV and main project editors
e880bec Merge pull request #50 from looksawful/feat/cms-awful-cases-editorial
27e9ed8 (origin/feat/cms-awful-cases-editorial) Merge dev into feat/cms-awful-cases-editorial
57779c2 Merge pull request #47 from looksawful/feat/cms-berry-editorial-copy
df1ddce8302d20ffc9e39a3246114115a2594f73
10	1
871c7a2 cv: replace about section copy
df1ddce fix(cms): allow empty editorial copy
fd5d44f CV: refine technology labels and tools
bab5e1e CI: skip full browser suite for CV copy-only deploys
d5b4ba5 CV: hide soft skills and update RIA copy
6aa300d CV: update profile, skills, education and experience copy
14e6a99 CV: hide Kursovoy, case lists and portfolio links
74e28fc CV: update profile summary copy
10b92fd Publish reusable Media Catalog
7f97159 Merge pull request #54 from looksawful/dev
5633013 Merge pull request #42 from looksawful/dev
676a958 test: cover data-driven homepage experience visibility
f2b3dff feat: guard hidden homepage experience in CSS
95905e6 feat: hide homepage experience via data attribute

```

## GitHub

## Local evidence

Fresh recovery environment, Node 24.19.0:

| Command | Result | Wall time |
| --- | --- | ---: |
| Baseline npm ci | pass | 16.176s |
| Baseline typecheck | pass | 0.803s |
| Baseline core/build:site (cold checkout) | fail: missing generated derivatives; existing always-sync CI assertion also fails | not comparable to warm run |
| Baseline test:e2e:all | blocked: Playwright Chromium absent | 1.875s to failure |
| Real cold media:sync | pass; 495 sources / 1138 derivatives / 24 videos | 190.057s |
| Updated typecheck | pass | 0.729s |
| Updated test:fast | 309 passed | 4.296s |
| Updated test:core | 325 passed plus data integrity | 7.921s |
| Updated build | pass, 13 HTML pages/local links | 5.150s |

Playwright Chromium v1234 download exhausted five CDN timeouts. Browser results
must come from actual Actions execution before merge; no local browser success is
claimed. Local ffmpeg produced a different byte count for the existing Sensetique
MP4 (26558336 vs authoritative tracked 26373477). This generated metadata change
is excluded from the tooling patch; source and production metadata stay unchanged.

Classifier scenarios pass: CV → smoke/CV and no media; media → real media path;
entry/global CSS → full; docs → smoke. With actual generated binaries, media-scope
reports sync=false for unchanged inputs/exact cache and sync=true for changed
inputs even with an exact cache hit. Existing media fixtures run in core and prove
real builders handle source changes. Browser validation remains pending Actions.

Prod and dev diverged (10 prod-only, 1 dev-only). Prod copy and CMS fixes are authoritative. PR #64 dev → prod contains superseded About copy; do not merge it to production. Draft blog PR #25 remains independent. Dependabot #2–8 remain independent.

Branch rulesets: none; prod/dev unprotected. CodeQL triggers will remain unchanged. CV branch has three unintegrated commits, so retain its focused verification. Shootings integration is ancestor of prod/dev; retain branch, retire its task-specific workflow only after checking ordinary coverage.

## Baseline Actions job/step timings (seconds)

### Run [33404401206](https://github.com/looksawful/looksawful.ru/actions/runs/33404401206)

verify: success, 619s

| Step | Result | Seconds |
| --- | --- | ---: |
| Set up job | success | 1 |
| Checkout | success | 12 |
| Setup Node | success | 2 |
| Install | success | 6 |
| Ensure media tooling | success | 21 |
| Sync CMS media catalog | success | 0 |
| Typecheck | success | 1 |
| Restore generated media | success | 3 |
| Sync generated media | success | 5 |
| Persist synchronized CMS media metadata | success | 0 |
| Check tracked media metadata | success | 0 |
| Core tests | success | 13 |
| Build site | success | 6 |
| Install browser for smoke tests | success | 18 |
| Browser smoke | success | 526 |
| Post Restore generated media | success | 3 |
| Post Setup Node | success | 0 |
| Post Checkout | success | 0 |
| Complete job | success | 0 |
### Run [33429925039](https://github.com/looksawful/looksawful.ru/actions/runs/33429925039)

verify: success, 633s

| Step | Result | Seconds |
| --- | --- | ---: |
| Set up job | success | 1 |
| Checkout | success | 46 |
| Setup Node | success | 3 |
| Diff check | success | 0 |
| Install | success | 7 |
| Typecheck | success | 1 |
| Restore generated media | success | 3 |
| Ensure media tooling | success | 24 |
| Check CMS media catalog | success | 1 |
| Sync generated media | success | 4 |
| Check tracked media metadata | success | 0 |
| Core tests | success | 13 |
| Build site | success | 5 |
| Install browser for smoke tests | success | 17 |
| Browser smoke | success | 504 |
| Post Restore generated media | success | 2 |
| Post Setup Node | success | 0 |
| Post Checkout | success | 0 |
| Complete job | success | 0 |


### Run [33435230226](https://github.com/looksawful/looksawful.ru/actions/runs/33435230226)

verify: failure, 96s

| Step | Result | Seconds |
| --- | --- | ---: |
| Set up job | success | 1 |
| Checkout | success | 44 |
| Setup Node | success | 3 |
| Diff check | success | 0 |
| Install | success | 5 |
| Typecheck | success | 0 |
| Restore generated media | success | 5 |
| Ensure media tooling | success | 24 |
| Check CMS media catalog | success | 0 |
| Sync generated media | success | 3 |
| Check tracked media metadata | success | 0 |
| Core tests | failure | 8 |
| Build site | skipped | 0 |
| Install browser for smoke tests | skipped | 0 |
| Browser smoke | skipped | 0 |
| Post Restore generated media | skipped | 0 |
| Post Setup Node | skipped | 0 |
| Post Checkout | success | 0 |
| Complete job | success | 0 |


### Run [33434992161](https://github.com/looksawful/looksawful.ru/actions/runs/33434992161)

build: success, 623s

| Step | Result | Seconds |
| --- | --- | ---: |
| Set up job | success | 4 |
| Mark deployment pending | success | 0 |
| Checkout | success | 19 |
| Detect deployment scope | success | 0 |
| Setup Node | success | 4 |
| Install | success | 8 |
| Typecheck | success | 0 |
| Restore generated media | success | 6 |
| Ensure media tooling | skipped | 0 |
| Check CMS media catalog | skipped | 0 |
| Sync generated media | skipped | 0 |
| Check tracked media metadata | skipped | 0 |
| Core tests without media pipeline checks | success | 7 |
| Core tests | skipped | 0 |
| Build site | success | 5 |
| Prepare production CV | success | 0 |
| Install browser for smoke tests | success | 24 |
| Final production browser verification | success | 506 |
| Upload caption QA | success | 2 |
| Stamp deployment | success | 0 |
| Add nojekyll | success | 0 |
| Upload Pages artifact | success | 31 |
| Post Restore generated media | success | 3 |
| Post Setup Node | success | 0 |
| Post Checkout | success | 0 |
| Complete job | success | 0 |

deploy: success, 30s

| Step | Result | Seconds |
| --- | --- | ---: |
| Set up job | success | 1 |
| Deploy | success | 26 |
| Verify production commit | success | 1 |
| Complete job | success | 0 |

report: success, 3s

| Step | Result | Seconds |
| --- | --- | ---: |
| Set up job | success | 1 |
| Report deployment status | success | 1 |
| Complete job | success | 0 |


### Run [33434992186](https://github.com/looksawful/looksawful.ru/actions/runs/33434992186)

JavaScript / TypeScript: success, 118s

| Step | Result | Seconds |
| --- | --- | ---: |
| Set up job | success | 1 |
| Checkout | success | 13 |
| Initialize CodeQL | success | 15 |
| Analyze | success | 87 |
| Post Analyze | success | 0 |
| Post Initialize CodeQL | success | 1 |
| Post Checkout | success | 0 |
| Complete job | success | 0 |


### Run [33302034380](https://github.com/looksawful/looksawful.ru/actions/runs/33302034380)

lighthouse: success, 235s

| Step | Result | Seconds |
| --- | --- | ---: |
| Set up job | success | 1 |
| Checkout | success | 14 |
| Setup Node | success | 4 |
| Restore generated media | success | 5 |
| Install media tooling | skipped | 0 |
| Install from lockfile | success | 9 |
| Prepare generated media | skipped | 0 |
| Install Chromium | success | 23 |
| Build | success | 5 |
| Lighthouse CI | success | 164 |
| Upload Lighthouse reports | success | 2 |
| Post Restore generated media | success | 2 |
| Post Setup Node | success | 0 |
| Post Checkout | success | 1 |
| Complete job | success | 0 |


### Run [33277204397](https://github.com/looksawful/looksawful.ru/actions/runs/33277204397)

lighthouse: failure, 390s

| Step | Result | Seconds |
| --- | --- | ---: |
| Set up job | success | 1 |
| Checkout | success | 16 |
| Setup Node | success | 3 |
| Install media tooling | success | 15 |
| Install from lockfile | success | 7 |
| Install Chromium | success | 16 |
| Build | success | 252 |
| Lighthouse CI | failure | 79 |
| Upload Lighthouse reports | success | 0 |
| Post Setup Node | skipped | 0 |
| Post Checkout | success | 0 |
| Complete job | success | 0 |
