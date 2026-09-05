# Testing and verification pipeline

Этот документ описывает фактическое распределение проверок. Нормативные правила жизненного цикла находятся в [`docs/testing-policy.md`](./testing-policy.md). Если документы расходятся, `testing-policy.md` имеет приоритет.

## Основной операторский интерфейс

Для обычной работы с репозиторием есть четыре основные человеческие точки входа. Остальные `test:*`, `verify:*`, media и E2E scripts остаются доступными как специализированные building blocks для CI и узких инженерных задач, но оператору не нужно выбирать между ними при каждом изменении.

- `npm test` — дешёвая повседневная проверка. Сейчас это стабильный alias на `test:fast`; подходит для частого локального запуска.
- `npm run verify` — основной pre-PR / integration checkpoint: media ensure, typecheck, Fast contracts, media contract, production build и компактный browser smoke.
- `npm run verify:full` — дорогой широкий прогон для manual/nightly и существенных инфраструктурных изменений: полный media sync, полный Node-контур, build и full E2E через `verify:core`.
- `npm run test:ui:responsive` — отдельный необязательный responsive UI audit. Он не является частью обычного `npm test` и запускается при изменениях адаптивности/интерфейса или для периодической проверки.

Новые публичные `test:*` / `verify:*` aliases не добавляются только ради удобного нового имени, если поведение можно включить в одну из существующих точек входа или оставить специализированным внутренним script. Это ограничение относится к поверхности команд, а не является поводом удалять полезные permanent checks.

## Результат аудита 2026-09-02

До изменения селектора в `test/` находилось 102 Node test-файла.

Старый `test:fast` выбирал 94 файла автоматически: практически любой новый `*.test.mjs` становился частью Fast CI. Среди них находились migration, component, media и browser-specific проверки, которые не оправдывали стоимость каждого обычного push.

Nightly Quality при этом уже выполняет `test:core`, а `test:core` запускает полный `node --test` после подготовки media. Поэтому широкий Node-набор не исчезает: он просто не дублируется на каждом обычном push.

## Текущие уровни

### `npm run test:fast`

Обычный push/PR/production safety tier.

Fast является opt-in allowlist в `tools/ci/run-tests.mjs`. Новый тест не попадает сюда автоматически.

Текущий Fast содержит 20 дешёвых долгоживущих contracts:

- `test/awful-cases-cms-editorial.test.mjs`
- `test/ci-fast-concurrency.test.mjs`
- `test/code-block-contract.test.mjs`
- `test/cms-publication-scope.test.mjs`
- `test/cms-publication-topology.test.mjs`
- `test/cms-publication-workflow.test.mjs`
- `test/domain-catalog-identity.test.mjs`
- `test/domain-taxonomy-references.test.mjs`
- `test/editorial-content-boundary.test.mjs`
- `test/editorial-copy-optional.test.mjs`
- `test/lighthouse-ci-config.test.mjs`
- `test/media-tools/media-cache-fingerprint-scope.test.mjs`
- `test/pages-cms-yaml-syntax.test.mjs`
- `test/repository-growth-policy.test.mjs`
- `test/search-presentation.test.mjs`
- `test/security-tooling.test.mjs`
- `test/site-analytics.test.mjs`
- `test/site-composition.test.mjs`
- `test/site-pages.test.mjs`
- `test/static-site-analytics.test.mjs`

### `npm run test:unit`

Широкий дешёвый Node-набор для локальной/manual проверки. Он включает обычные `*.test.mjs`, но не physical media-tool fixtures и не derivative contracts.

### `npm run test:ci`

Фокусированный набор контрактов CI/CMS publication/cache/E2E tooling. Используется при работе над pipeline, а не как обязательный шаг любой UI-задачи.

### `npm run test:cv`

Фокусированный CV-набор. Не нужен для несвязанных с CV изменений.

### `npm run test:media:contract` / `npm run test:media:checks`

Media-specific integrity. Запускается media workflow или специальной media-проверкой; ordinary unrelated push не должен повторять физические media checks.

### `npm run test:core`

Широкий полный Node-контур плюс data integrity. Используется в тяжёлом/full verification. Nightly Quality выполняет его после deterministic media preparation.

### E2E

- `test:e2e:affected` — специализированные browser suites по реально затронутой области;
- `test:e2e:production` — компактный production smoke;
- `test:e2e:full` — полный browser regression для nightly/manual/широких архитектурных изменений.

## Fast CI

`.github/workflows/ci-fast.yml` выполняет exact shallow checkout, dependency install, canonical media cache verification/recovery, typecheck, `test:fast` и `build:site`.

Push в `dev` не запускает Fast CI для заведомо non-runtime путей, включая docs/archive/agent metadata, разрешённые copy-only CMS JSON и пути, принадлежащие отдельному media workflow. PR по-прежнему получает Fast CI как integration gate.

## Production Health

`.github/workflows/production-health.yml` является единственным владельцем частой проверки опубликованного сайта.

Он запускается каждые 6 часов и вручную, использует `prod` как ожидаемый source SHA и проверяет production contract, `/cv/`, репрезентативный project route, главную и опубликованные CSS/JS assets. Это намеренно маленький smoke с лимитом 5 минут.

`Quality` не дублирует этот schedule.

## Quality

`.github/workflows/quality.yml` остаётся местом для широких и тяжёлых проверок:

- nightly `37 1 * * *`: dependency audit, external links, deterministic media preparation, full Node + full E2E и Lighthouse;
- weekly `53 2 * * 0`: физический поиск дубликатов media через `media:dedupe:physical`;
- manual: любой из этих quality suites на `dev` или `prod`;
- PR-only contract: двухминутная статическая проверка расписаний и ownership при изменении Quality/Production Health CI-контрактов; тяжёлые jobs на PR не запускаются.

Physical media duplicate scan специально вынесен из nightly: это самая дорогая дисковая проверка, а её риск не меняется настолько быстро, чтобы платить за неё каждую ночь. Lightweight `media:dedupe:check` при этом остаётся внутри nightly full E2E.

Heavy manual/scheduled Quality runs сериализуются между собой. PR contract имеет отдельную PR-scoped concurrency group и отменяется при superseded commit, поэтому короткая проверка workflow не ждёт окончания ночного прогона.

## Responsive UI

`.github/workflows/ui-responsive.yml` остаётся manual-only слоем. Он не запускается на обычные PR/push и используется для responsive/navigation/layout изменений. Расширенная cross-browser диагностика создаётся временно для конкретной задачи и удаляется после доказательства результата, если не появляется отдельный долгоживущий риск.

## Правило для будущей работы

Не добавлять файл в Fast только потому, что он существует или когда-то поймал баг.

Для нового теста сначала решить его lifecycle согласно `docs/testing-policy.md`:

`TEMPORARY → DELETE`

или

`CONTRACT → explicit Fast allowlist`

или

`AFFECTED/FULL → специализированный/manual/scheduled контур`.
