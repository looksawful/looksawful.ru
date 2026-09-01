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

## Изменённые файлы и назначение

Application, CSS, пользовательский контент, CMS schema и tracked media metadata
сохранены без изменений относительно исходного production SHA df1ddce.

| Path | Изменение и причина |
| --- | --- |
| package.json | Понятные fast/core/media/smoke/affected/full/production команды; старый all остаётся alias full. |
| .github/workflows/verify-dev.yml | Read-only verify, дешёвые проверки первыми, conditional media и affected browser. |
| .github/workflows/verify-pr.yml | Полный PR diff, общий classifier, ранний typecheck/fast, conditional media и affected. |
| .github/workflows/pages.yml | Exact artifact, отдельный production smoke, сохранены CV sanitation/stamp/Pages/status; проверяются реальные опубликованные JS/CSS. |
| .github/workflows/verify-full.yml | Новый nightly/manual deterministic media + core + exhaustive browser. |
| .github/workflows/sync-cms-media-metadata.yml | Узкая отдельная mutation operation с проверкой гонки и явным Verify dev после bot push. |
| .github/workflows/verify-cv-branch.yml | Только CV contracts, build, authored/production CV и visual QA; общий cache contract. |
| .github/workflows/verify-shootings-data-integration.yml | Удалён obsolete workflow интегрированной ветки; тесты и сама ветка сохранены. |
| tools/ci/change-scope.mjs | Единый conservative classifier и GitHub outputs. |
| tools/ci/media-scope.mjs | Проверка exact cache и файлов относительно tracked metadata; fallback к реальному sync. |
| tools/ci/run-tests.mjs | Рекурсивные группы тестов вне YAML; nested CSS tests не потеряны. |
| tools/e2e/concurrency.mjs | Bounded concurrency 2 с завершением активных работников при ошибке. |
| tools/e2e/readiness.mjs | Общие DOM/fonts/frame/lightbox observable signals. |
| tools/e2e/run-smoke.mjs | Короткий репрезентативный browser smoke и production delivery-video sanity. |
| tools/e2e/run-affected.mjs | Smoke и выбранные оригинальные focused suites. |
| tools/e2e/run-all.mjs | Все оригинальные suites сохранены, ограниченный параллелизм. |
| tools/e2e/run-production.mjs | Compact production smoke/video/caption QA вместо повторного exhaustive suite. |
| tools/smoke-site.mjs | Убраны игнорируемые networkidle; сохранены motion/swipe/deck time contracts; pageshow readiness для reveal. |
| tools/smoke-mpa.mjs | DOM/frame/lightbox/page-flip signals вместо произвольных задержек. |
| tools/smoke-project-pages.mjs | Canvas bitmap/CSS/error readiness вместо sleep. |
| tools/smoke-cv.mjs | DOM/fonts/frame readiness; authored/production contracts сохранены. |
| tools/sync-media-catalog.mjs | Read-only stored consistency check только для доказанно неизменившихся inputs; полноценный ffprobe/sync по умолчанию не изменён. |
| test/change-scope.test.mjs | CV/nav/projects/media/global/unknown scenarios. |
| test/ci-pipeline.test.mjs | Read-only/security/media/deploy contracts и исполняемый тест CMS output. |
| test/e2e-concurrency.test.mjs | Лимит, порядок результатов и обработка ошибок workers. |
| test/e2e-production-pipeline.test.mjs | Production runner проверяет специализированный smoke и caption QA. |
| test/media-ci-cache.test.mjs | Cache хранит только binaries; version-independent invariant и genuine correctness path. |
| test/media-catalog-sync.test.mjs | Pure catalog/index/stored-source consistency без ffprobe. |
| test/media-tools/catalog-probe.test.mjs | Перенесён существующий настоящий ffprobe image fixture в media group, не удалён и не замокан. |
| test/cms-runtime-editability.test.mjs | CMS mutation contract перенесён на отдельный workflow. |
| test/project-cards-cms.test.mjs | CMS project-cover metadata сохраняет отдельную mutation operation. |
| test/shootings-isolation-mode.test.mjs | Сохранены isolation/freeze fixtures без зависимости от obsolete workflow. |
| test/test-groups.test.mjs | Fast сохраняет nested tests и исключает только physical/media-tool group. |
| test/tooling-pipeline.test.mjs | Контракты публичных команд и общего browser runtime. |
| docs/tooling-pipeline.md | Документация реальной архитектуры и troubleshooting. |
| docs/ci-pipeline-report.md | Исходный аудит, измерения и итоговые доказательства. |

## Удалённый workflow

`verify-shootings-data-integration.yml`: integration/shootings-data-prod уже
является предком обеих основных веток. Ordinary shootings isolation/data contracts
и MPA browser route coverage остаются в core/full/affected. Ветка не удалена.
`feat/cv-page` содержит неинтегрированную работу, поэтому её workflow сохранён
и сужен. Healthcheck, dependency audit, external links, Lighthouse и CodeQL не удалены.

## Новая структура CI

| Контур | Последовательность |
| --- | --- |
| dev | classify → install → typecheck/fast → conditional media → build → affected |
| PR | полный integration diff → typecheck/fast → conditional media → build → affected; CodeQL отдельно |
| prod | exact SHA → fast/correctness → build → CV sanitation → production smoke/QA → stamp/artifact/deploy → published SHA/assets/CV → status |
| nightly/manual | deterministic media → core → build → полный browser suite |

Verify не выполняет commit/push. Полный suite выбирается и для глобальных
изменений runtime/build/dependencies/unknown, но не для обычной правки CV или docs.

## Test matrix

| Уровень | Реальное покрытие |
| --- | --- |
| smoke | Home 390×844 и 1440×900, built JS/CSS, fatal/resource errors, navigation open/Escape, overflow, Case, image decode, lightbox, Moves canvas, CV. |
| affected | Smoke + оригинальные CV/navigation/project-pages/MPA/media suites по единому classifier. |
| full | Smoke + все исходные site/navigation/MPA/project-pages/CV матрицы, reduced motion, image/video, canvas, lightbox, page flip, reload/history, overflow и standalone routes. |
| production | Smoke на sanitized artifact + delivery-video metadata + caption QA; exhaustive regression не повторяется. |

## Media logic

Sync обязателен при изменённых media/dependencies, неизвестном diff, full manual,
cache miss или несоответствии физических derivatives tracked metadata.
Только неизменившиеся inputs + exact cache + проверка файлов допускают fast path.
В нём ffmpeg и повторная media regeneration не запускаются. Tracked catalog,
manifest, inventory и generated TS никогда не восстанавливаются из cache.

Stored catalog check не декодирует upload и не заменяет real validation. При
изменении source/catalog или cache miss выполняются исходный ffprobe и настоящий
deterministic sync. Stale tracked metadata всегда приводит к ошибке verification.

## Обнаруженные и исправленные проблемы при проверке

- Checkout report имел лишнюю пустую строку EOF: `git diff --check` остановил PR,
  whitespace исправлен.
- Старый catalog probe test зависел от ffprobe внутри fast group: перенесён целиком
  в media-tools, pure catalog tests остаются fast.
- Global reveal runtime инициализируется на pageshow + RAF: ожидание только DOM
  было ранним. В full home audit добавлено явное load lifecycle ожидание;
  assertion о скрытой нижней карточке не ослаблен.
- CMS mutation output имел literal backslash-n: воспроизведено failing shell test,
  исправлено, test теперь проходит. Следующий Verify dev получает true.
- Полная регрессия и production smoke считаются проверенными только по свежим
  успешным Actions runs, не по локальному наличию кода.

## Отдельные будущие задачи

- Возможная миграция на @playwright/test — необязательная отдельная работа.
- Git history/media storage/LFS cleanup — в этой задаче не выполнялись.
- Branch protection требует отдельного решения владельца; CodeQL поэтому
  не ослаблен.

## Первый успешный полный прогон после оптимизации

[Verify changes 33482852220](https://github.com/looksawful/looksawful.ru/actions/runs/33482852220), SHA `1930f04`: **success**. Весь job 284s, full browser 155s (baseline PR 633s / browser 504s). Это инфраструктурный PR с полным media/full scope, не замер обычного content commit. CodeQL того же SHA успешен.

| Step | Result | Seconds |
| --- | --- | ---: |
| Set up job | success | 1 |
| Checkout | success | 38 |
| Classify changes | success | 2 |
| Setup Node | success | 4 |
| Install | success | 8 |
| Typecheck | success | 1 |
| Fast tests | success | 10 |
| Restore generated media | success | 4 |
| Inspect cached media | success | 0 |
| Ensure media tooling | success | 21 |
| Check CMS media catalog | success | 0 |
| Check unchanged catalog structure | skipped | 0 |
| Sync generated media | success | 5 |
| Check tracked media metadata | success | 0 |
| Media contracts | success | 1 |
| Media tooling tests | success | 6 |
| Build site | success | 5 |
| Install browser for smoke tests | success | 16 |
| Affected browser verification | success | 155 |
| Post Restore generated media | success | 5 |
| Post Setup Node | success | 0 |
| Post Checkout | success | 1 |
| Complete job | success | 0 |

Финальные локальные fast: 309 passed; core: 326 passed + data integrity; typecheck/build проходят. Browser binaries локально недоступны; успешный full выше выполнен реально в GitHub Actions. Существующие warnings о повторных media resource entries и build chunk size не повышались/не понижались по severity в этой задаче.
