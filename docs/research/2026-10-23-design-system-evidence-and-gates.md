# looksawful.ru — исследование дизайн-системы: источники истины и следующие контрольные точки

Дата: 2026-10-23  
Метод: первичные источники репозитория (ветка `dev`) + официальные спецификации.  
Статус: исследование / решение о внедрении не принято.  
Ограничения: без изменений production CSS/TS, Jestei Pool filter, GitHub Issues и Asana.

## Исследовательский вопрос

Что в существующей дизайн-системе looksawful.ru подтверждено кодом и контрактами, а что действительно нужно завершить для надёжного DESIGN.md, Storybook и будущего Figma UI Kit, не создавая вторую систему?

## Краткое заключение

Система существует, её не следует переписывать. Повторяющиеся основы уже нормализованы, но управляемость зависит от трёх ворот: (1) текущего инвентаря и версий кода, (2) реального взаимодействия и доступности, (3) точной привязки Figma-компонентов к производственным владельцам. Документацию следует извлекать из production, а не делать самостоятельным источником новых размеров и цветов.

## Подтверждено текущими файлами

| Подсистема | Авторитетный источник | Проверенное состояние |
| --- | --- | --- |
| Глобальные токены | [`src/styles/tokens.css`](https://github.com/looksawful/looksawful.ru/blob/dev/src/styles/tokens.css) | Inter Variable и моноширинный fallback, веса 300–900, fluid `--fs-200`…`--fs-900`, `--fs-supporting`, `--size-100`…`--size-800`, отступы, радиусы, ширины, motion-speed, shadows, z-layers |
| Семантический цвет | [`src/styles/colors.css`](https://github.com/looksawful/looksawful.ru/blob/dev/src/styles/colors.css) | Активны neutral surface/foreground, blue accent и производные `--clr-*`; архив альтернативных `[data-theme]` заблокирован CSS-комментарием |
| Каскад и базовые правила | [`src/styles/index.css`](https://github.com/looksawful/looksawful.ru/blob/dev/src/styles/index.css), [`src/styles/base.css`](https://github.com/looksawful/looksawful.ru/blob/dev/src/styles/base.css) | CSS layers, глобальная читаемость, `:focus-visible`, правила выбора и типографика |
| Композиции | [`src/styles/patterns.css`](https://github.com/looksawful/looksawful.ru/blob/dev/src/styles/patterns.css) | Wrapper, Cluster, Stack, Grid, Auto-grid, Split, Reel, Text-pair; конфигурация локальными custom properties |
| Primitives | [`src/styles/primitives.css`](https://github.com/looksawful/looksawful.ru/blob/dev/src/styles/primitives.css) | Есть `.action-control` и `.sequence-counter`; полного канонического Button API в этом файле нет |
| Компонентные владельцы | [`src/templates/`](https://github.com/looksawful/looksawful.ru/tree/dev/src/templates), [`src/components/`](https://github.com/looksawful/looksawful.ru/tree/dev/src/components), [`src/site/`](https://github.com/looksawful/looksawful.ru/tree/dev/src/site) | Отдельные render/runtime/layout контракты; не все source-модули являются независимыми визуальными компонентами |
| LAB/Storybook | [`tools/lab/build-storybook.mjs`](https://github.com/looksawful/looksawful.ru/blob/dev/tools/lab/build-storybook.mjs) | Storybook 10.6.0, html-vite, docs, a11y и axe; инструменты устанавливаются через `npm install --no-save` перед сборкой |
| Автоинвентарь | [`tools/lab/design-system-inventory.mjs`](https://github.com/looksawful/looksawful.ru/blob/dev/tools/lab/design-system-inventory.mjs) | `schemaVersion: 3`; source groups включают `src/site/**`; распознаёт `.stories.mjs`, declared-source evidence, story policies, state/route evidence |
| Capture | [`tools/design-capture/cli.mjs`](https://github.com/looksawful/looksawful.ru/blob/dev/tools/design-capture/cli.mjs) | Есть ручной, SHA-привязанный захват страниц и компонентов с manifest; нет необходимости внедрять альтернативный скриншотный pipeline |
| Контракты UI Kit | [`2026-09-04-ui-kit-token-component-traceability.md`](https://github.com/looksawful/looksawful.ru/blob/dev/docs/superpowers/specs/2026-09-04-ui-kit-token-component-traceability.md) | Классификация Global Foundation / Semantic Alias / Pattern Configuration / Component Local / Specialized Local / Implementation Only; правила доказательств для будущего Figma UI Kit |

Корневые `DESIGN.md` и `PRODUCT.md` на проверенной ветке `dev` не найдены. Это пробел в переносимой документации, но не отсутствие внутренней системы.

## Не использовать устаревшую статистику Storybook

Исторический [`docs/storybook/ui-inventory-audit.md`](https://github.com/looksawful/looksawful.ru/blob/dev/docs/storybook/ui-inventory-audit.md) сам помечен как snapshot старой ветки. В нём отмечалось отсутствие `src/site/**` в знаменателе и отсутствие `.stories.mjs`. В текущем скрипте `SOURCE_GROUPS` уже включает навигацию, renderers, shell, pages; `STORY_SUFFIXES` включает `.stories.mjs`. Следовательно, нельзя автоматически повторять прежние подсчёты покрытия и старые диагнозы.

Однако наличие более корректного алгоритма не доказывает высокий процент покрытия. На текущем `dev` нужно выполнить `npm run lab:inventory` и записать точное `coverageSummary` вместе с SHA и структурными ошибками. Этот research-проход не запускал локальный build/inventory, поэтому **числа покрытия не утверждаются**.

Данные исторического [#976](https://github.com/looksawful/looksawful.ru/issues/976) (96 sources, 79 missing) относятся к определённой интеграционной ветке и не являются измерением сегодняшнего `dev`.

## Переносимость токенов: DTCG и DESIGN.md

Официальный Design Tokens Format Module 2025.10 задаёт типизированный JSON, `$value`, `$type`, aliases и группы. При этом значение `dimension` — числовое `value` с единицей `px` или `rem`; оно не выражает произвольную CSS-функцию `clamp()` или `cqi` как нативную величину.

Основной источник: https://www.w3.org/community/reports/design-tokens/CG-FINAL-format-20251028/#dimension ; общий стандарт https://www.designtokens.org/TR/2025.10/format/ . Это **финальный отчёт Community Group, а не стандарт W3C Recommendation**.

Для looksawful это означает:

- CSS `clamp()`, `vw`, `cqi`, `color-mix()` и контейнерные правила остаются первичным runtime-контрактом;
- при обмене с Figma или DTCG не заменять их одним произвольно выбранным пиксельным значением;
- разъяснять составные/fuid токены семантически и при необходимости экспортировать вычисленные значения для документированных контрольных viewport/container размеров;
- статические значения (шрифт, вес, отдельные радиусы, прямые цвета) могут экспортироваться в структурированные токены без потери смысла;
- не создавать ручной двусторонней синхронизации CSS↔JSON без проверенного инструмента и тестов паритета.

Спецификация Google Labs DESIGN.md (`https://github.com/google-labs-code/design.md/blob/main/docs/spec.md`) допускает опциональный YAML frontmatter и markdown-описание visual world. Для этого проекта рационален **генерируемый описательный слой**: нормативные значения из production CSS, привязки к файлам/SHA, пометки «specialized» и «not active». Если используется machine-readable frontmatter, его синхронность с CSS должна проверяться автоматически. Не переименовывать существующие токены ради чужого формата.

## В чём реальный незакрытый долг

### 1. Компонентные действия и состояния

[`2026-09-30-ui-surface-inventory.md`](https://github.com/looksawful/looksawful.ru/blob/dev/docs/research/2026-09-30-ui-surface-inventory.md) фиксирует расхождение между размерами интерактивных controls и визуальной грамматикой focus/active/disabled. При этом текущий `primitives.css` по-прежнему узок. Решение не в универсальном Button для всех кейсов, а в общем semantic/interaction контракте для действительно переиспользуемых controls. База уже описана в issues [#1106](https://github.com/looksawful/looksawful.ru/issues/1106), [#1112](https://github.com/looksawful/looksawful.ru/issues/1112), [#1113](https://github.com/looksawful/looksawful.ru/issues/1113)–[#1118](https://github.com/looksawful/looksawful.ru/issues/1118).

Не делать «Button» из навигационных ссылок, «Chip» из неинтерактивной подписи, «Pill» из любой скруглённой формы. Формальные понятия определены в существующем инвентаре.

### 2. Семантическая типографика уже частично согласована

[`2026-10-03-interface-typography-1262-evidence.md`](https://github.com/looksawful/looksawful.ru/blob/dev/docs/research/2026-10-03-interface-typography-1262-evidence.md) описывает `--fs-supporting`, роль подписей и решение не нормализовать hero/editorial. Не возвращать старые Rubik-era соглашения. Не объявлять проблему отсутствующего `--fs-100` новой без перепроверки: документ фиксирует owner-approved исправление badge через `--fs-200` (#1274).

### 3. Accessibility проходит через production, а не только Storybook

История [#1275](https://github.com/looksawful/looksawful.ru/issues/1275), [#1276](https://github.com/looksawful/looksawful.ru/issues/1276), [#1277](https://github.com/looksawful/looksawful.ru/issues/1277) охватывает реальные проблемы с hero ARIA, focusable infinite-reel clones и контрастом повторяющихся media indices. Проверять исправления через реальные страницы и keyboard/runtime states, затем отражать результат в story/contract. Это не повод заменять компонентную систему.

Внешнее основание: W3C WCAG 2.2 Target Size (Minimum) https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum (24×24 CSS px с перечисленными исключениями). Storybook accessibility addon https://storybook.js.org/docs/writing-tests/accessibility-testing — лишь первая линия QA, не полное подтверждение соответствия.

**Жёсткое ограничение:** пользователь запретил правки Jestei Pool track filter. Этот исследовательский документ не предлагает изменений его runtime, структуры или визуала. Общие ошибки в других reusable owners рассматриваются отдельно.

### 4. Storybook: адекватное покрытие важнее процента

Есть актуальная [`state-and-visibility-model.md`](https://github.com/looksawful/looksawful.ru/blob/dev/docs/storybook/state-and-visibility-model.md). Метаданные `parameters.looksawful` фиксируют canonical source owners, production states, pointer/motion/responsive conditions и явные исключения. Это согласуется с официальными возможностями Storybook parameters: https://storybook.js.org/docs/writing-stories/parameters .

Рекомендация: строить coverage по критическим компонентам и состояниям (navigation, lightbox, media, hero, captions, contact, mobile overlays), не создавать stories для каждого служебного TS-модуля и не считать experimental stories production-доказательством.

Storybook рекомендует Vitest и a11y addon, но existing LAB уже подключает a11y; новая зависимость или migration не оправданы без обнаруженного пробела в текущих тестах: https://storybook.js.org/docs/writing-tests/accessibility-testing .

### 5. Figma: доказательства до публикации

Существующий traceability contract требует конкретный source SHA, CSS owner, variant/state, responsive input conditions и соответствующий screenshot для каждой публикационной единицы. Это правильные ворота, а не избыточная бюрократия: только так исключается расхождение между production и красивой, но неверной библиотекой.

Figma Variables поддерживают коллекции/режимы, но заводить будущие или закомментированные themes как работающие переменные нельзя: https://developers.figma.com/docs/plugins/working-with-variables/ .

Figma Code Connect сопоставляет настоящие code components с Figma-компонентами и имеет плановые/seat ограничения; это опциональный последующий шаг, а не предпосылка базовой дизайн-системы: https://developers.figma.com/docs/code-connect/ .

## Рекомендуемые контрольные точки (без запуска внедрения)

| Очерёдность | Действие | Доказательство завершения |
| --- | --- | --- |
| 1 | Запустить current `lab:inventory` на фиксированном SHA `dev` и свести исторические заметки с v3 | Машинный `coverageSummary`, `structuralIssues`, SHA, классификация реальных missing owners |
| 2 | Обновить визуальные доказательства из существующего `npm run design:capture` | Manifest + desktop/mobile/keyboard/motion/case contexts и точные версии |
| 3 | Закрыть существующие подтверждённые a11y дефекты через #1275–1277 | Production browser/axe + keyboard + related stories; Jestei filter не трогать |
| 4 | Сверить Button/focus/compact action/state contracts по #1112–1118 | Одна semantics/interaction vocabulary, явные specialized exceptions, без искусственных abstractions |
| 5 | Подготовить переносимый `DESIGN.md` как производный справочник | Provenance для tokens, нейтральная palette, fluid formulas, component owners; проверка на дрейф с CSS |
| 6 | Решать вопрос Figma UI Kit только после выполнения gate документа 2026-09-04 | Screenshot evidence, variants, owner mapping и публикационная классификация |

## Метод и ограничения

- Изучены тексты файлов в GitHub `dev`, исторические исследовательские документы и официальные материалы DTCG/W3C, Storybook, Google Labs DESIGN.md и Figma.
- Не выполнялись `npm run lab:inventory`, `design:capture`, Storybook build, скринридер-тесты или Figma-публикация. Поэтому не утверждаются ни текущий процент Storybook coverage, ни готовность Figma UI Kit.
- Не проводилась прямая инспекция Notion canonical pages: их список взят из repository contract, а не из подтверждённого текущего содержимого Notion.
- Репозиторий не меняется, кроме этого исследовательского Markdown в отдельной `research/*` ветке; в `dev`, Issues, производственные файлы и Asana записей нет.
