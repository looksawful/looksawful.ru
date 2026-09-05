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

Старый `test:fast` выбирал 94 файла автоматически: практически любой новый `*.test.mjs` становился частью Fast CI. Среди них находились:

- 10 файлов с `migration` в имени;
- компонентные CV/CMS тесты, несмотря на отдельный `test:cv`;
- navigation, motion, lightbox, page-flip и другие специализированные component checks;
- media/CI checks, часть которых уже имеет отдельные media/quality контуры;
- временный mobile VisualViewport RED → GREEN regression test.

Nightly Quality при этом уже выполняет `test:core`, а `test:core` запускает полный `node --test` после подготовки media. Поэтому широкий Node-набор не исчезает: он просто перестаёт дублироваться на каждом обычном push.

## Текущие уровни

### `npm run test:fast`

Обычный push/PR/production safety tier.

Fast является opt-in allowlist в `tools/ci/run-tests.mjs`. Новый тест не попадает сюда автоматически.

Текущий Fast содержит только дешёвые долгоживущие contracts:

- `test/change-scope.test.mjs`
- `test/ci-minimal-pipeline.test.mjs`
- `test/cms-publication-scope.test.mjs`
- `test/cms-publication-topology.test.mjs`
- `test/cms-publication-workflow.test.mjs`
- `test/cms-runtime-editability.test.mjs`
- `test/domain-catalog-identity.test.mjs`
- `test/domain-taxonomy-references.test.mjs`
- `test/editorial-content-boundary.test.mjs`
- `test/editorial-copy-optional.test.mjs`
- `test/media-ci-cache.test.mjs`
- `test/media-routing.test.mjs`
- `test/pages-cms-yaml-syntax.test.mjs`
- `test/production-media-cache.test.mjs`
- `test/shared-validation-primitives.test.mjs`
- `test/site-build-inputs.test.mjs`
- `test/site-pages.test.mjs`
- `test/test-groups.test.mjs`

Итого: 18 test-файлов вместо прежних 94.

### `npm run test:unit`

Широкий дешёвый Node-набор для локальной/manual проверки. Он включает обычные `*.test.mjs`, но не physical media-tool fixtures и не derivative contracts.

Это место для полезных component/runtime tests, которые не оправдывают стоимость каждого push.

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

`.github/workflows/ci-fast.yml` выполняет:

1. exact shallow checkout;
2. `npm ci`;
3. canonical media fingerprint и exact cache verification/recovery при реальном miss;
4. typecheck;
5. `test:fast`;
6. `build:site`.

Push в `dev` не запускает Fast CI для заведомо non-runtime путей:

- `docs/**`;
- `AGENTS.md`;
- `.agents/**`;
- `archive/**`;
- разрешённых copy-only CMS JSON;
- путей, принадлежащих отдельному media workflow.

PR по-прежнему получает Fast CI как integration gate независимо от того, что отдельный text-only push мог быть тихим.

## Quality

`.github/workflows/quality.yml` остаётся местом для широких и тяжёлых проверок:

- production health — каждые 6 часов;
- full Node + full E2E — nightly;
- dependency audit — по расписанию/manual;
- Lighthouse — по расписанию/manual;
- external links — по расписанию/manual.

Именно здесь допустима цена полного regression набора.

## Что было изменено при введении политики

- Fast изменён с auto-discovery на explicit allowlist.
- `unit` сохранён широким, чтобы полезные component tests не были потеряны.
- Temporary mobile VisualViewport regression test удалён после подтверждённого production hotfix.
- Очевидные migration tests исключены из Fast автоматически, но не удалены без разбора: часть из них всё ещё защищает runtime/typed composition contracts и остаётся в broad/full tier.
- В нескольких historical component tests удалены literal assertions на пользовательский copy.
- Из remaining-media migration test удалён чисто исторический check на уже завершённый temporary bridge.
- Documentation/archive/agent-skill pushes исключены из Fast CI.

## Правило для будущей работы

Не добавлять файл в Fast только потому, что он существует или когда-то поймал баг.

Для нового теста сначала решить его lifecycle согласно `docs/testing-policy.md`:

`TEMPORARY → DELETE`

или

`CONTRACT → explicit Fast allowlist`

или

`AFFECTED/FULL → специализированный/manual/scheduled контур`.
