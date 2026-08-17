# 05 — runtime, responsive и interaction contract

Этот файл описывает ожидаемое поведение после интеграции. Если production ведёт себя иначе, не исправлять это глобальными overrides: сначала проверить разметку и подключение компонента.

## Accordion

- Berserk — обычная CV-сцена.
- Open/close/scroll/click/reduced mode полностью принадлежат существующему CV accordion.
- Berserk не читает `aria-expanded`.
- Scene activity приходит из `accordionRuntime.subscribeScene`.

## Layout

- Mobile-first.
- Корневой `.berserk-case` также имеет штатные `.wrapper.stack`.
- Site font наследуется; внутри CLI/terminal применяется локальный monospace.
- На узкой ширине code/pre переносится и не создаёт горизонтальный overflow страницы.
- Grid gallery на компактной ширине остаётся двухколоночной; на широком viewport становится трёхколоночной.
- Install/usage используют существующий `.equal-columns`.

## Caption

Markup:

```html
<figcaption data-media-caption>
  <details class="berserk-caption" data-berserk-caption>
    <summary class="media-caption__line berserk-caption__summary">
      <span class="media-caption__index">…</span>
      <span class="media-caption__title">…</span>
    </summary>
    <span class="media-caption__meta berserk-caption__meta">…</span>
  </details>
</figcaption>
```

- desktop fine pointer: metadata visible on caption hover/focus;
- touch: tap summary toggles native `open`;
- no JS controls captions;
- no caption animation loop.

## Gallery lifecycle

- autoplay only when scene is active;
- `prefers-reduced-motion` disables autoplay;
- grid mode disables autoplay;
- deactivation clears interval;
- drag uses Pointer Events;
- slide positioning uses native scroll.

## ResizeObserver

Единственный observer компонента смотрит только на gallery viewport и вызывает `fitScreens()` при изменении его фактической ширины. Он не следит за DOM, accordion state или scroll position.

## Audio lifecycle

- `preload=none`;
- no source until user playback;
- deactivation pauses playback;
- switching alert unloads previous source;
- base/fallback URL comes from case root markup.
