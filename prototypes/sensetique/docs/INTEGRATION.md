# Integration

1. Обновить только Sensetique `article.cv-item` содержимым `src/sensetique-section.html`.
2. Подключить `src/sensetique-section.css` после production styles компонентов. Файл не содержит reset, `:root`, нового шрифта или palette.
3. Добавить `page-flip@2.0.7`.
4. В существующем scene/page lifecycle вызвать:

```js
import { initSensetiqueSection } from "./sensetique-section.mjs";
const sensetique = initSensetiqueSection(document.querySelector(".cv-item--sensetique"));
```

После фактического открытия accordion можно вызвать `sensetique.refresh()`. При unmount/HMR — `sensetique.destroy()`.

## Site-owned
Не переносить из reference standalone runtime для accordion, theme, image fallback, `.reel[data-auto-reel]`, `device-mockup`, animated canvas. Production data-contracts оставлены в HTML.

Crossfade диспатчит `sensetique:slidechange`; `event.detail.activeSlide` содержит активный slide. Если existing canvas runtime требует refresh, использовать его текущий публичный hook на это событие — не MutationObserver.

Не задавать локально accordion colors/font и не создавать второй lifecycle.
