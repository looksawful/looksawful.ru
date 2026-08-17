# Инструкция coding-agent

Интегрируй содержимое этого архива в:

`looksawful/looksawful.ru`
branch: `prod`

Не redesign и не рефактори сайт вокруг пакета.

Сначала прочитай:

1. `README.md`
2. `INTEGRATION.md`
3. `BEHAVIOR-SPEC.md`
4. `ARCHITECTURE.md`
5. `manifest.json`
6. `baseline.json`

Затем изучи текущие production contracts:

- `index.html`
- `src/main.js`
- `src/components/cv-accordion/**`
- `src/components/animated-canvas-gallery/**`
- `src/components/media-marquee/**`
- `src/components/browser-promo/**`
- `src/content/accordion-presentation.css`
- `src/styles/tokens.css`
- `src/styles/patterns.css`

После этого выполни:

```powershell
node .\tools\apply-moves-awful-patch.mjs --repo="<repo>" --check
```

Если guard проходит, примени пакет.

Не переноси standalone JS/CSS из `prototype/` в production. Prototype является только visual source of truth.

Production source находится в `repo/` и `fragments/`.

Не менять:

- accordion runtime;
- scroll math;
- generic Canvas runtime;
- generic marquee runtime;
- global tokens;
- global font;
- project order;
- IDs соседних scenes;
- другие проекты.

Не добавлять дополнительные observers/timers.

В финальной production-реализации допустимы только уже находящиеся в пакете project-specific механизмы:

- один scoped ResizeObserver на browser screen для fixed mobile Canvas scale;
- один 5-second timeout для automatic tab switching;
- event listeners lightbox.

Не добавляй второй способ решать те же задачи.

После установки запусти:

```powershell
npm test
npm run build
git diff --stat
git diff
```

Проверь браузером desktop и mobile по `VERIFICATION.md`.

Если baseline не совпадает, не обходи guard и не применяй файлы вручную поверх неизвестного состояния. Сначала сопоставь изменения текущего `prod` с package manifest.

## Дополнительные запреты для финальной версии

Не добавлять:
- Moves-specific `visibilitychange`;
- `IntersectionObserver` для tab autoplay;
- второй hover transform commercial video;
- tap-toggle общей подписи;
- дополнительный mobile caption state.

Использовать:
- `accordionRuntime.subscribeScene()` для tab autoplay;
- существующий site media hover;
- настоящий `<a>` для `www.jesteipool.ru`;
- click/tap `media-lightbox` для video.
