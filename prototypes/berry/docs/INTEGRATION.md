# Интеграция Berry Agency

## 1. Границы изменений

Installer изменяет только:

### `index.html`
Заменяется только текущий Berry article с `cv-trigger-05`.

`cv-trigger-06` / S&S используется как контроль соседней границы и не заменяется.

### `src/main.js`
Добавляется:
- 2 CSS imports;
- 1 import `createBerryCase`;
- 1 destroy handle;
- cleanup в существующий `unmount()`;
- mount сразу после `applyAccordionPresentation(document)`.

Это не новый lifecycle. Компонент подключается к уже существующему lifecycle сайта.

### Новые/обновляемые component files
- `src/components/phone-mockup/phone-mockup.css`
- `src/components/berry-case/berry-case.css`
- `src/components/berry-case/berry-case.js`

## 2. Почему Berry JS теперь нужен

Desktop caption полностью CSS-only.

На touch-устройствах одного `:focus` недостаточно для надёжного поведения и он конфликтует с горизонтальным swipe. Поэтому Berry JS делает только одно:

- на `pointerdown` запоминает touch/pen позицию;
- на `pointermove` определяет, был ли это swipe;
- на `pointerup` при перемещении не больше 10px переключает `data-caption-open`;
- `pointercancel` сбрасывает незавершённый жест.

Никаких:
- `MutationObserver`;
- `ResizeObserver`;
- `IntersectionObserver`;
- timers;
- `requestAnimationFrame`;
- autoplay;
- GSAP;
- scroll listeners.

## 3. Mobile caption contract

Короткий touch/pen tap:
- закрывает ранее открытую подпись в Berry;
- открывает подпись выбранной фотографии;
- повторный tap по той же фотографии закрывает её.

Swipe:
- если палец/pen сместился больше 10px, caption не переключается;
- поэтому горизонтальный reel `01–04` продолжает скроллиться без случайного открытия подписей.

## 4. Desktop caption contract

На `(hover: hover) and (pointer: fine)`:
- hover показывает caption;
- keyboard focus показывает caption;
- click ничего дополнительно не закрепляет.

## 5. Что остаётся глобальным

Не переопределять при интеграции:
- scene colors;
- `--item-bg`;
- `--item-ink`;
- Rubik;
- `--font-primary`;
- CV accordion mechanics;
- accordion presentation;
- media preparation;
- image skeletons;
- reduced-motion global behavior.

Berry использует `--item-text` и `--item-body-bg`, уже рассчитанные сайтом.

## 6. Проверка перед записью

```bash
node <bundle>/install.mjs --check .
```

Preflight проверяет наличие:
- Berry/S&S article boundaries;
- `.stack`, `.reel`, `.grid-flow`;
- `--item-text` и `--item-body-bg`;
- 14 media и отсутствие hidden-остатков;
- отсутствие локальных theme/font definitions;
- отсутствие observer/timer/animation-loop кода в Berry JS.

## 7. После установки

```bash
node <bundle>/tools/verify-berry-integration.mjs .
npm test
npm run build
npm run dev
```

Сравнивать результат с `reference/berry-agency-prototype.html`.
