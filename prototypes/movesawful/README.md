# Moves Awful — финальный пакет интеграции

Цель: встроить текущий прототип Moves Awful в `looksawful/looksawful.ru`, ветка `prod`, не меняя глобальную архитектуру сайта.

Visual source of truth:

`prototype/moves_awful_production_refactor_prototype.html`

Пакет собран под текущий `prod` baseline:

`7caa2af97df75197a8dd91c4f38fb3c937e0473a`

Перед упаковкой повторно проверены blob SHA текущих `prod`-файлов. Они совпадают с `baseline.json`.

## Что пакет меняет

Патчит только:

- `index.html` — заменяет существующий Moves Awful article `cv-trigger-09 / cv-panel-09` на том же месте.
- `src/main.js` — сохраняет cleanup, который возвращает `configureMovesAwful()`, и вызывает его при `unmount()`.

Заменяет только:

- `src/components/moves-awful/moves-awful.js`
- `src/components/moves-awful/moves-awful.css`
- `src/content/animated-canvas-gallery-sources.js`

Добавляет только:

- `src/components/media-lightbox/media-lightbox.js`
- `src/components/media-lightbox/media-lightbox.css`

Полный список зафиксирован в `manifest.json`.

## Что пакет НЕ меняет

Он не меняет:

- `src/components/cv-accordion/**`
- `src/components/animated-canvas-gallery/**`
- `src/components/media-marquee/**`
- `src/components/browser-promo/**`
- `src/styles/tokens.css`
- `src/styles/patterns.css`
- `src/content/accordion-presentation.css`
- глобальную тему accordion
- Rubik / глобальную типографику
- порядок accordion
- IDs других сцен
- scroll runtime accordion
- generic Canvas renderer
- generic marquee runtime

## Как использовать

Сначала:

```powershell
node .\tools\apply-moves-awful-patch.mjs --repo="C:\path\to\looksawful.ru" --check
```

Если проверка проходит:

```powershell
node .\tools\apply-moves-awful-patch.mjs --repo="C:\path\to\looksawful.ru"
```

После установки в репозитории:

```powershell
npm test
npm run build
git diff --stat
git diff
```

Installer проверяет baseline до записи файлов. Новые файлы `media-lightbox` не должны уже существовать. При ошибке во время записи уже записанные файлы откатываются.

Подробности:

- `INTEGRATION.md` — точная процедура интеграции.
- `BEHAVIOR-SPEC.md` — что должно быть видно и как всё должно работать.
- `ARCHITECTURE.md` — ownership компонентов и почему глобальная логика не меняется.
- `AGENT-INSTRUCTIONS.md` — готовая инструкция для coding-agent.
- `VERIFICATION.md` — обязательные проверки перед merge/deploy.

## Runtime и hover — финальная версия

Canvas tab autoplay не создаёт собственного `visibilitychange` listener. `configureMovesAwful()` получает уже существующий `accordionRuntime` и использует `subscribeScene()`.

Timer запускается только когда Moves является активной accordion scene и `documentVisible` по состоянию этого runtime.

Commercial media hover в production не дублируется. Его уже задаёт `src/content/accordion-presentation.css` для `[data-media-marquee-surface]` на fine-pointer устройствах.

Общая подпись над marquee остаётся всегда видимой. `www.jesteipool.ru` — настоящий `<a>`:
- desktop: hover / focus-visible;
- touch: обычный tap/click.

Video:
- desktop: существующий site hover + click lightbox;
- mobile/touch: tap lightbox.
