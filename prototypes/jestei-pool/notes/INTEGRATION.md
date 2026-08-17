# Интеграция в текущий `prod`

Пакет рассчитан на существующую структуру `looksawful/looksawful.ru`.

## 1. Не заменять внешний accordion shell

Оставить существующие:

- `<article class="cv-item" ...>`
- `data-cv-theme`
- `.cv-item__header`
- `aria-controls`
- id trigger/panel
- `.cv-item__body`

Из `jestei-pool-content.fragment.html` нужен именно узел:

```html
<div class="cv-item__content wrapper" data-jestei-case>
  ...
</div>
```

Им нужно заменить текущий `.cv-item__content` Jestei Pool. Внешний shell сцены не трогать.

Так сохраняются существующие темы, scroll/click/reduced-motion режимы и жизненный цикл аккордеона.

## 2. Положить CSS

Файл:

```text
src/content/jestei-pool-scene.css
```

Подключить после текущего:

```js
import "./content/accordion-presentation.css";
```

то есть рядом:

```js
import "./content/accordion-presentation.css";
import "./content/jestei-pool-scene.css";
```

Не переносить правила из этого файла в `patterns.css` и не менять глобальные переменные.

## 3. Положить JS

Файл:

```text
src/content/jestei-pool-scene.js
```

В `src/main.js` добавить:

```js
import { createJesteiPoolScene } from "./content/jestei-pool-scene.js";
```

Рядом с остальными destroy-переменными:

```js
let destroyJesteiPoolScene = null;
```

В `unmount()` ДО `cvAccordion?.destroy?.()`:

```js
destroyJesteiPoolScene?.();
destroyJesteiPoolScene = null;
```

После создания `accordionRuntime`:

```js
const accordionRuntime = cvAccordion?.runtime ?? null;
```

и после стандартных scene-компонентов создать локальный runtime:

```js
destroyJesteiPoolScene = createJesteiPoolScene({
  root: document,
  motion: motionPreference,
  accordionRuntime,
});
```

Это не создаёт второй lifecycle канала: Jestei runtime подписывается на уже существующий `accordionRuntime` и `motionPreference`.

## 4. Ничего дополнительно не монтировать

НЕ создавать новые:

- `MutationObserver`
- `ResizeObserver`
- `IntersectionObserver`
- собственный accordion observer
- собственный marquee timer
- собственный before/after runtime
- собственный playlist-filter runtime
- собственный Jestei Theme Organism runtime

Эти механизмы уже принадлежат сайту.

## 5. Почему локальный JS всё-таки нужен

### Moves Awful

Это не обычный `media-slider`: согласованная механика — каждый ролик проигрывается один раз, событие `ended` включает следующий, третий возвращает первый.

Локальный код использует только `ended`, существующий accordion runtime и motion preference.

### Lightbox группы 02

Статические бренд-артефакты открываются по клику/Enter/Space. Визуально используется уже существующий site-контракт `.animated-canvas-gallery-lightbox*`.

Нового CSS lightbox в Jestei-файле нет.

## 6. Пути медиа

В fragment все asset URL переведены с `raw.githubusercontent.com` на site-relative `/media/...`.

Никакого запроса медиа с live-сайта или GitHub Raw при production-рендере не требуется.

## 7. Подписи

Не добавлять CSS, который делает:

- `figcaption` absolute;
- caption opacity 0;
- caption показ только на hover;
- `+ / −` раскрытие подписи на мобильном.

Полный текст подписи всегда находится под соответствующим медиа.

## 8. Порядок проверки

Сначала проверить desktop без изменения глобальных CSS. Затем 390–430 px, 768 px и desktop. Если глобальный компонент ведёт себя иначе, исправлять локальный Jestei selector, а не добавлять новый runtime.
