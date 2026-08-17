# Berserk Timer — готовая секция CV-аккордеона Looksawful.ru

Пакет предназначен для `looksawful/looksawful.ru`, рабочая ветка `prod`.

Задача пакета — вынести Berserk Timer из старого вложенного preview внутри `Awful Tools` в самостоятельную сцену штатного CV-аккордеона, сохранив макет, адаптивность и интерактивность прототипа и не создавая параллельную архитектуру.

## Главное правило интеграции

Berserk Timer подключается **как обычная CV-сцена сайта**.

Пакет не должен менять:

- глобальную механику `cv-accordion`;
- `cv-accordion-runtime`;
- цветовую палитру и `nth-child`-цикл аккордеона;
- Rubik и глобальную типографику сайта;
- `.wrapper`, `.stack`, `.cluster`, `.equal-columns`;
- общий `.btn`;
- общий `repository-link`;
- общий контракт `data-media-captioned` / `data-media-caption-surface` / `data-media-caption`;
- логику остальных проектов в `Awful Tools`.

Никаких CSS-правил для `.cv-item`, `body`, `html`, глобальных media captions или глобальных кнопок в компоненте нет.

## Что находится в архиве

```text
looksawful-berserk-timer-section/
├─ README-INTEGRATION.md
├─ INTEGRATION-CHECKLIST.md
├─ MANIFEST.json
├─ integration/
│  ├─ 01-index-html.md
│  ├─ 02-main-js.md
│  ├─ 03-accordion-content.md
│  ├─ 04-awful-tools-preview.md
│  └─ 05-runtime-and-responsive-contract.md
├─ prototype/
│  └─ berserk-timer-section.html
├─ snippets/
│  ├─ berserk-timer-accordion-item.html
│  └─ berserk-timer-case.html
├─ src/components/berserk-timer-case/
│  ├─ berserk-timer-case.css
│  └─ berserk-timer-case.js
└─ test/
   └─ berserk-timer-case-source.test.js
```

В архиве **нет собственного patch/install-скрипта**. Интеграция состоит из двух новых production-файлов, одного source-test и четырёх небольших точечных изменений существующих файлов. Это намеренно: текущую архитектуру сайта проще и безопаснее проверить обычным Git diff, чем прятать изменения за отдельным patch-runtime.

## Какие файлы добавить в сайт

Скопировать без изменений:

```text
src/components/berserk-timer-case/berserk-timer-case.css
src/components/berserk-timer-case/berserk-timer-case.js
test/berserk-timer-case-source.test.js
```

`prototype/` и `snippets/` — документация/эталон разметки; они не должны попадать в production bundle.

## Какие существующие файлы точечно изменить

Только:

```text
index.html
src/main.js
src/content/accordion-content.js
src/components/awful-tools-preview/awful-tools-preview.js
```

Подробные изменения лежат в `integration/01…04`.

## Как Berserk Timer должен выглядеть внутри сайта

Внешняя секция остаётся обычным `.cv-item`. У Berserk Timer нет собственной темы и нет `data-cv-theme`.

Секция добавляется **в конец текущего `[data-cv-accordion-list]`**. Это важно: существующие проекты не меняют индекс, а значит их текущие цвета остаются теми же. На проверенном `prod` Berserk становится 16-й сценой и получает существующий восьмой цветовой шаг автоматически через текущую циклическую систему аккордеона.

Внутри открытой сцены:

1. Сайт задаёт фон, foreground и Rubik как обычно.
2. Контент кейса ограничивается штатным `.wrapper` и использует `.stack`.
3. Терминальные мокапы сохраняют собственный тёмный UI и моноширинный шрифт **только внутри самих мокапов**. Это часть изображения продукта, а не новая типографика сайта.
4. Управляющие кнопки используют существующий `.btn` и только локальные custom properties компонента.
5. Финальная ссылка на GitHub использует существующий `.repository-link`.
6. Подписи используют существующие классы `.media-caption__index`, `.media-caption__title`, `.media-caption__meta` и глобальную типографику captions.

## Подписи: desktop hover, mobile click без дополнительного JS

Для раскрытия длинной части подписи используется нативный HTML `details/summary` внутри `figcaption`.

Всегда видны:

- номер;
- короткий заголовок.

Desktop с `(hover: hover) and (pointer: fine)`:

- metadata раскрывается при наведении на подпись;
- metadata раскрывается при keyboard focus;
- нативный click по `summary` также остаётся рабочим.

Touch/mobile:

- пользователь нажимает на короткую подпись;
- нативный `details` получает/снимает `open`;
- metadata открывается/закрывается без JS.

Поэтому для captions не существует listener, observer, отдельной state-machine или animation runtime.

## Lifecycle и observers

Production-компонент получает активность только через существующий:

```js
accordionRuntime.subscribeScene(root, callback)
```

Когда runtime передан, компонент не читает `aria-expanded` и не создаёт `MutationObserver` или `IntersectionObserver`.

В standalone-прототипе, где CV runtime отсутствует, используется только `document.visibilitychange`, чтобы остановить активные части при скрытой вкладке.

В компоненте остаётся **один `ResizeObserver`**, привязанный к viewport галереи. Его единственная задача — пересчитать масштаб терминальных `<pre>`, когда реальная ширина контейнера меняется. Это требуется не только при `window.resize`: ширина контейнера может измениться из-за режима аккордеона/лейаута. При отсутствии `ResizeObserver` используется обычный `window.resize` fallback.

Других observers нет.

## Галерея

Галерея использует локальные `data-berserk-*` контракты, а не presentation-классы.

Поведение:

- prev / next;
- drag/pointer scrolling;
- dots;
- grid toggle;
- autoplay раз в 10 секунд только когда текущая CV-сцена активна;
- autoplay выключается в grid mode;
- autoplay выключается при `prefers-reduced-motion: reduce`;
- при деактивации сцены interval очищается.

Перемещение слайдов выполняется нативным `scrollTo({ behavior: "smooth" })`; собственного animation loop нет.

## Аудиоплеер

Аудио:

- `preload="none"`;
- файл загружается только при попытке воспроизведения;
- выбранный звук и volume работают локально внутри компонента;
- playback останавливается при деактивации сцены;
- URL источника не зашит в JS — base/fallback передаются через root markup;
- текущий markup указывает на существующий release `v0.2.1-beta`.

## Copy

Copy-кнопки связываются с кодом через локальные пары:

```text
data-berserk-copy-target="install"
data-berserk-copy-source="install"
```

Глобальные `id` не нужны. При отсутствии Clipboard API текст выделяется обычным Range как fallback.

## Что специально не добавлено

- новый custom element;
- Shadow DOM;
- новый accordion controller;
- новый theme controller;
- `MutationObserver`;
- `IntersectionObserver`;
- caption JavaScript;
- собственный шрифт для страницы;
- глобальные CSS overrides;
- hardcoded accordion color;
- отдельный install/patch runtime;
- новые фото/ассеты, которых нет в текущих источниках Berserk Timer.

## Проверка перед интеграцией

Работать с чистой `prod` веткой и сначала сравнить текущие файлы с инструкциями в `integration/`.

После ручной интеграции:

```powershell
npm test
npm run build
```

Затем пройти `INTEGRATION-CHECKLIST.md` в desktop и mobile viewport.

## Откат

Если изменения ещё не закоммичены:

```powershell
git restore index.html src/main.js src/content/accordion-content.js src/components/awful-tools-preview/awful-tools-preview.js
Remove-Item -Recurse src/components/berserk-timer-case
Remove-Item test/berserk-timer-case-source.test.js
```

Никакие другие файлы сайта пакет менять не требует.
