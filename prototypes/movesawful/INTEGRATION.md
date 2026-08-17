# Интеграция

## 1. Рабочая ветка

Работать только с:

`looksawful/looksawful.ru`
`prod`

Не переносить пакет в `dev` и не делать параллельную реализацию в другой ветке.

Перед изменениями:

```powershell
git status
git branch --show-current
git rev-parse HEAD
```

Рабочее дерево должно быть понятным. Пакет не должен маскировать уже существующие несвязанные изменения.

## 2. Сначала dry run

Из распакованного архива:

```powershell
node .\tools\apply-moves-awful-patch.mjs --repo="C:\path\to\looksawful.ru" --check
```

Dry run:

- проверяет `baseline.json`;
- проверяет точные git-blob SHA исходных файлов;
- проверяет существующий Moves slot;
- вычисляет будущие изменения;
- проверяет, что новые файлы `media-lightbox` ещё не существуют;
- ничего не пишет.

Baseline нельзя обходить вручную. Если `prod` изменился, нужно сначала сравнить новый `prod` с этим пакетом, а не отключать guard.

## 3. Применение

```powershell
node .\tools\apply-moves-awful-patch.mjs --repo="C:\path\to\looksawful.ru"
```

Installer делает только заявленные `manifest.json` изменения.

`index.html` не заменяется целиком. Installer находит внешний `<article>` существующего Moves Awful через `cv-trigger-09`, учитывает вложенные `<article>` и заменяет только этот article.

`src/main.js` тоже не заменяется целиком. Добавляется только lifecycle cleanup для `configureMovesAwful()`.

## 4. Почему именно так

Moves уже существует в accordion. Новая версия не создаёт новый slot.

Сохраняются:

- `cv-trigger-09`
- `cv-panel-09`
- позиция сцены
- `.cv-item`
- `.cv-item__header`
- `.cv-item__body`
- `.cv-item__content`
- `data-cv-scene`
- `data-cv-theme="moves-awful"`

Поэтому accordion не получает новый record и не меняет индексы остальных проектов.

## 5. После применения

```powershell
npm test
npm run build
```

Затем:

```powershell
git diff --stat
git diff -- index.html src/main.js src/components/moves-awful src/components/media-lightbox src/content/animated-canvas-gallery-sources.js
```

В diff не должно быть других production-путей.

## 6. Не делать

Не нужно:

- менять `cv-accordion`;
- менять `animated-canvas-gallery`;
- менять `media-marquee`;
- менять theme tokens;
- добавлять новый font import;
- переносить CSS прототипа целиком в global stylesheet;
- добавлять второй accordion lifecycle;
- добавлять отдельный scroll observer;
- добавлять MutationObserver;
- добавлять IntersectionObserver для Moves;
- диспатчить искусственный global `resize`;
- создавать второй Canvas renderer;
- копировать standalone runtime прототипа в production.

Standalone prototype нужен только как визуальная проверка.
Production использует файлы из `repo/`.

## Подключение Moves к accordion runtime

После:

```js
const accordionRuntime = cvAccordion?.runtime ?? null;
```

монтировать:

```js
destroyMovesAwful = configureMovesAwful(document, { accordionRuntime });
```

Прежний ранний вызов:

```js
configureMovesAwful(document);
```

до создания `cvAccordion` удаляется.

Это не изменяет accordion runtime: Moves только подписывается на существующий scene contract.
