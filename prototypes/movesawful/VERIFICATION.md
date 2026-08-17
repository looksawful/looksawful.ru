# Verification

## Package tests

Из распакованного архива:

```powershell
node --test .\test\moves-awful-patch.test.mjs
```

## Repository tests

После применения:

```powershell
npm test
npm run build
```

## Diff audit

```powershell
git diff --stat
git diff
```

Разрешённая production surface:

- `index.html`
- `src/main.js`
- `src/components/moves-awful/moves-awful.js`
- `src/components/moves-awful/moves-awful.css`
- `src/components/media-lightbox/media-lightbox.js`
- `src/components/media-lightbox/media-lightbox.css`
- `src/content/animated-canvas-gallery-sources.js`

Других путей быть не должно.

## Desktop browser

Проверить:

- Moves находится на прежнем месте accordion.
- Accordion до/после Moves работает как раньше.
- Mockup занимает ширину accordion content.
- Canvas не имеет hover.
- Все 6 tabs переключают правильный Canvas.
- Tabs сами переключаются раз в 5 секунд.
- Ручное переключение сбрасывает countdown.
- Marquee идёт со скоростью 34.
- Hover не останавливает marquee.
- Desktop fade-mask присутствует.
- Над marquee одна подпись с `www.jesteipool.ru`.
- Отдельных подписей 01–03 нет.
- Каждое видео открывает lightbox.
- Lightbox закрывается background / × / Escape.
- После закрытия focus возвращается.
- Нет console errors.

## Mobile browser

Проверить примерно на 360–430px:

- нет horizontal overflow страницы;
- mockup целиком находится внутри accordion content;
- browser chrome не обрезается;
- Canvas area не обрезается;
- mobile Canvas сохраняет desktop composition и только масштабируется;
- overlay title масштабируется вместе со сценой;
- tabs остаются одной строкой;
- tabs можно горизонтально свайпать;
- нет fade-mask на tabs;
- mobile marquee без боковых fade-mask;
- video surface можно тапнуть;
- lightbox помещает video в viewport;
- close button имеет нормальный touch target.

## Lifecycle

Несколько раз:

1. открыть Moves;
2. переключить tabs;
3. открыть/закрыть lightbox;
4. закрыть accordion;
5. снова открыть Moves.

Не должно появляться:

- duplicate tabs;
- duplicate lightboxes;
- ускорение auto-switch;
- два timers;
- duplicate listeners;
- console errors.

## Reduced motion

Не добавлять Moves-specific reduced-motion policy поверх глобальной.

Canvas и marquee должны продолжать подчиняться существующим site/runtime contracts.

## Installer safety

Installer должен:

- отклонить baseline mismatch до записи;
- не перезаписывать неожиданно существующий `media-lightbox`;
- заменять только Moves article в `index.html`;
- патчить только lifecycle lines в `src/main.js`;
- откатывать уже записанные файлы при write failure.

## Hover / touch final checks

Desktop:
- commercial video получает один site hover, без двойного scale;
- link подписи имеет hover/focus;
- click video открывает lightbox.

Mobile/touch:
- нет hover-only блокирующего состояния;
- подпись видна без tap;
- tap `www.jesteipool.ru` открывает ссылку;
- tap video открывает lightbox.

Accordion:
- закрыть Moves и подождать >5 секунд: tabs не должны переключаться в фоне;
- снова открыть Moves: autoplay снова работает;
- в Moves production source нет собственного `visibilitychange` listener.
