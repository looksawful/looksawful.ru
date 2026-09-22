# looksawful.ru — исследование полного текстового слоя

Дата исследования: 2026-09-22  
Production baseline: `8402fd7684df37beb0f19e572b9a7a1c33bc78af`

## Зачем этот документ

Первый редакторский раунд содержал 48 решений. Он полезен как набор уже принятых решений, но **не является полной инвентаризацией текста сайта**.

Цель этого исследования — сначала собрать реальный корпус текста, а уже потом делать второй раунд «точное до → точное после».

## Источники истины

1. Live production: https://www.looksawful.ru
2. Production page manifest: https://github.com/looksawful/looksawful.ru/blob/prod/src/site/pages/manifest.ts
3. Production source data and page composition in repo: https://github.com/looksawful/looksawful.ru/tree/prod/src
4. Отдельные public documents: https://github.com/looksawful/looksawful.ru/tree/prod/public/docs

## Масштаб, который показал live-аудит

В enabled page manifest сейчас 13 маршрутов.

| Route | Live staticText chunks |
|---|---:|
| `/` | 32 |
| `/gallery/` | 2 |
| `/work/jestei-pool/` | 125 |
| `/work/styx/` | 16 |
| `/work/sensetique/` | 20 |
| `/shootings/` | 3 |
| `/work/awful-cases/` | 14 |
| `/work/awful-studio/` | 1 |
| `/work/moves-awful/` | 13 |
| `/work/berry-social-content-2020/` | 1 |
| `/cv/` | 160 |
| `/privacy/` | 47 |
| `404` | 3 |

Итого: **437 видимых staticText-фрагментов** до учёта дополнительных accessibility labels, metadata и standalone documents.

Первый раунд на 48 пунктов поэтому покрывал лишь небольшую часть реального текстового слоя.

## Ключевой вывод

Для второго раунда нельзя продолжать от старого списка, просто дописывая ещё несколько вопросов.

Нужен новый канонический corpus:

- route;
- section;
- точная текущая строка;
- text role;
- source file;
- повтор / уникальная строка;
- уже принятое решение из round 1, если есть точное соответствие;
- proposed replacement только после привязки к exact current string.

## Где первый раунд был недостаточно точным

### 1. Expertise

Live на главной сейчас показывает **шесть** конкретных групп:

1. `Арт-дирекшн`
2. `Дизайн`
3. `UX/UI`
4. `Продюсирование и съёмки`
5. `Разработка и 3D`
6. `Внедрение ИИ`

С описаниями:

- `Определяю направление проекта, организую работу дизайнеров и отвечаю за результат.`
- `Создаю визуальные системы и дизайн для цифровых платформ и физических носителей.`
- `Исследую задачу, проектирую и развиваю интерфейс и продукт.`
- `Организую съёмочный процесс и руковожу всем циклом производства контента.`
- `Проектирую и реализую интерактивные трёхмерные решения.`
- `Встраиваю ИИ в рабочие процессы дизайнеров и использую его для производства контента, прототипирования макетов и автоматизации процессов.`

Старый questionnaire использовал синтетический агрегат примерно из 23 направлений. Это не exact current string.

Primary source candidates:
- https://github.com/looksawful/looksawful.ru/blob/prod/index.html
- https://github.com/looksawful/looksawful.ru/blob/prod/src/site/pages/homepage.ts
- https://github.com/looksawful/looksawful.ru/blob/prod/src/data/content/home-visibility.ts

### 2. Hero / accessible naming

У главной есть текст, который не появился отдельным staticText, но присутствует в accessibility tree:

- `иван крушинский`
- `артдиректор цифровых продуктов`
- combined heading: `иван крушинский артдиректор цифровых продуктов`

Также есть UI labels:

- `Открыть меню`
- `Открыть медиа`
- `Предыдущий кадр`
- `Следующий кадр`
- `Навигация по слайдам`

То есть простой сбор параграфов и заголовков тоже недостаточен.

### 3. Jestei Pool

Live route:
https://www.looksawful.ru/work/jestei-pool/

Снято **125** staticText chunks.

Кроме обычного case copy там есть большой продуктовый UI corpus:

- `Новые релизы`
- `Жанры`
- `Теги`
- `BPM`
- `Рейтинг`
- `Тип`
- `Часть ночи`
- `Сбросить`
- `Скачанное`
- `Прослушанное`
- `Продвинутый фильтр`
- `Фильтр`
- genre names;
- track types;
- time-of-night labels;
- filter values;
- `До` / `После`;
- tariff headings and captions.

Это не один текст про «фильтр». Это десятки отдельных текстовых единиц.

Primary sources:
- https://github.com/looksawful/looksawful.ru/blob/prod/src/content/pages/cases/jestei-pool.ts
- https://github.com/looksawful/looksawful.ru/blob/prod/src/data/content/jestei-pool.ts
- https://github.com/looksawful/looksawful.ru/blob/prod/src/data/content/jestei-editorial.ts
- https://github.com/looksawful/looksawful.ru/blob/prod/src/data/content/jestei-page-presentation.ts
- https://github.com/looksawful/looksawful.ru/blob/prod/src/data/content/jestei-theme-organism.ts

### 4. Sensetique

Live lead сейчас:

`Запустил и управлял московской фотостудией и продакшеном для моды и рекламы. Собирал команды, продюсировал съёмки и организовывал продакшен.`

Это уже отличается от «текущего» текста, который попал в первый questionnaire.

Следовательно, минимум часть old-current strings в round 1 была stale ещё до голосования.

Primary sources:
- https://github.com/looksawful/looksawful.ru/blob/prod/src/content/pages/cases/sensetique.ts
- https://github.com/looksawful/looksawful.ru/blob/prod/src/data/content/sensetique.ts
- https://github.com/looksawful/looksawful.ru/blob/prod/src/data/content/sensetique-editorial.ts
- https://github.com/looksawful/looksawful.ru/blob/prod/src/data/content/sensetique-page-presentation.ts

### 5. CV

Live CV содержит **160 staticText chunks**.

Это самостоятельный корпус:

- intro;
- пять self-description blocks;
- competencies;
- technologies;
- tools;
- education;
- courses;
- languages;
- experience;
- roles;
- dates;
- long Jestei description;
- Styx;
- Sensetique;
- Mad Cow;
- LI-NE;
- Progress-Tradition;
- РИА Новости;
- links.

Live intro сейчас:

`Проектирую цифровые продукты и визуальные системы, выстраиваю дизайн-процессы и руковожу командами. Сочетаю art direction, product design и hands-on работу с интерфейсами, motion, generative production и frontend.`

Это не тот current intro, который использовался в первом questionnaire.

Primary sources:
- https://github.com/looksawful/looksawful.ru/blob/prod/src/data/cv.ts
- https://github.com/looksawful/looksawful.ru/blob/prod/src/data/cv-source.ts
- https://github.com/looksawful/looksawful.ru/blob/prod/public/cv/index.html

### 6. Privacy

Route:
https://www.looksawful.ru/privacy/

Содержит **47 staticText chunks** и ни разу полноценно не проходил редактуру в round 1.

Там есть:

- privacy intro;
- Cloudflare explanation;
- Yandex Metrica explanation;
- goals list;
- consent storage explanation;
- localStorage/sessionStorage keys;
- GPC / DNT wording;
- current consent state;
- CTA labels.

Primary source:
- https://github.com/looksawful/looksawful.ru/blob/prod/public/privacy/index.html

### 7. Hidden but enabled pages

В page manifest enabled, но не listed:

- `/work/awful-cases/`
- `/work/awful-studio/`
- `/work/moves-awful/`
- `/work/berry-social-content-2020/`

Первый round их практически не покрывал.

#### Awful Cases

Live includes:

- `Awful Cases - обучающая игра`
- `ДЕМОНСТРАЦИОННЫЙ РЕЖИМ`
- `СТАРТ`
- `Игра-обучалка о том как пользоваться программой`
- `Установка`
- `Запуск`
- code snippets;
- `Параметры.`

Sources:
- https://github.com/looksawful/looksawful.ru/blob/prod/src/data/content/awful-cases.ts
- https://github.com/looksawful/looksawful.ru/blob/prod/src/data/content/awful-cases-editorial.ts

#### Moves Awful

Live includes:

- `ARC`
- `arc`
- `spiral`
- `horizontal`
- `diagonal`
- `showcase diagonal`
- `masonry`
- `Анимации лендинга`
- descriptive copy;
- link-label copy.

Source:
- https://github.com/looksawful/looksawful.ru/blob/prod/src/data/content/moves-awful.ts

#### AWFUL STUDIO / Berry

Live accessibility tree сейчас почти пустой по textual content. Это не повод считать страницы проверенными. Их source needs explicit inspection.

Sources:
- https://github.com/looksawful/looksawful.ru/blob/prod/src/data/content/awful-studio.ts
- https://github.com/looksawful/looksawful.ru/blob/prod/src/data/content/berry.ts
- https://github.com/looksawful/looksawful.ru/blob/prod/src/data/content/berry-editorial.ts

### 8. 404

Live 404 содержит:

- `404`
- `404`
- `На главную`

Это тоже часть site copy.

### 9. Gallery / Shootings

Gallery live-text сейчас минимален:

- `Иван Крушинский`
- `Галерея`

Shootings:

- `Иван Крушинский`
- `Съёмки`
- `Съёмки`

Но это media-heavy страницы. Их source copy и media captions нужно собирать из data layer, а не только из initial accessibility tree.

Primary shootings source:
- https://github.com/looksawful/looksawful.ru/blob/prod/src/data/content/shootings.ts

## Отдельные документы на домене

В `public/docs` опубликованы:

1. https://www.looksawful.ru/docs/jestei-pool-redpolitika.html
2. `jestei-editorial-guide.pdf`

Sources:
- https://github.com/looksawful/looksawful.ru/blob/prod/public/docs/jestei-pool-redpolitika.html
- https://github.com/looksawful/looksawful.ru/blob/prod/public/docs/jestei-editorial-guide.pdf

Их нужно считать отдельным long-form corpus. Если смешать редполитику построчно с UI/case copy в одном wizard, questionnaire превратится в болото на несколько сотен пунктов.

## Что сохранить из round 1

Все 48 решений уже сохранены отдельным snapshot и **не должны теряться**.

Но переносить old decision в новый corpus можно только в двух случаях:

1. old-current string точно совпадает с live/current source string;
2. old item можно однозначно привязать к source ID.

Если старое «До» было пересказом, агрегатом или stale copy, решение хранится как editorial intent, но не применяется автоматически.

## Какие old IDs точно требуют rebinding

Минимум:

- `expertise-structure`
- `expertise-dev`
- `jestei-banner-caption`
- `jestei-dev-landings`
- `jestei-event-nav`
- `jestei-tariffs`
- `jestei-dev-playlists`
- `jestei-landings`
- `sens-equipment`
- `sens-production`
- `shootings-authorship`
- `cv-intro`
- `cv-jestei-cases`
- `nav-top`

Отдельно fact checks:

- `jestei-logo`
- `sens-date`

## Правильная структура round 2

Не «ещё 20 вопросов».

Нужно четыре слоя:

### A. Editorial copy

- headings;
- leads;
- paragraphs;
- captions;
- credits;
- project cards;
- case summaries.

### B. Product / UI copy

- buttons;
- labels;
- filters;
- states;
- form values;
- before/after labels;
- navigation.

### C. System and accessibility copy

- aria labels;
- alt text;
- loading/error states;
- 404;
- consent states.

### D. Metadata and standalone docs

- page titles;
- meta descriptions;
- privacy;
- redpolitika;
- downloadable editorial guide.

## Requirement for every future questionnaire item

Только:

`точная текущая строка → точная предлагаемая строка`

Запрещённые формы «До»:

- «в нескольких соседних блоках»;
- «далее идут описания»;
- «повторяется в тексте»;
- «структура не унифицирована»;
- `…` вместо полного текста.

Если одна редакторская идея затрагивает пять строк — это пять решений или один явно обозначенный block replacement с полным exact source block.

## Следующий исследовательский шаг

Перед генерацией нового wizard нужно программно собрать canonical inventory из repo data layer, потому что live accessibility tree не отражает весь media-caption и conditional corpus.

Приоритетные source families:

- `src/data/content/*`
- `src/content/pages/*`
- `src/data/projects.ts`
- `src/data/navigation.ts`
- `src/data/media/entries/*`
- `src/data/subproject-cards.ts`
- `src/data/cv.ts`
- `public/privacy/index.html`
- `public/docs/*`

Этот research не применяет ни одной редакторской замены в production.
