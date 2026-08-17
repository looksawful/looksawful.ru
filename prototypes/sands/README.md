# S&S — cleaned integration package

Репозиторий: `looksawful/looksawful.ru`  
Рабочая ветка: `prod`  
База, против которой пакет проверен: `7caa2af97df75197a8dd91c4f38fb3c937e0473a`

Это финальный пакет S&S для существующего CV accordion.

Он переносит утверждённый макет и поведение прототипа, но не вводит отдельную архитектуру проекта.

## Внутри

- `preview/sands-showcase-prototype.html` — standalone-превью для визуальной сверки.
- `site-patch/tools/sands-showcase/sands-article.html` — финальная S&S-сцена.
- `site-patch/src/components/sands-showcase/sands-showcase.css` — только локальная композиция и presentation S&S.
- `site-patch/src/components/mobile-mockup/mobile-mockup.css` — утверждённый собственный phone mockup.
- `site-patch/tools/apply-sands-showcase.mjs` — структурная замена только S&S article и добавление двух CSS-import.
- `site-patch/test/sands-showcase-contract.test.js` — интеграционные контракты.
- `INTEGRATION.md` — порядок подключения.
- `EXPECTED-BEHAVIOR.md` — точное ожидаемое поведение.
- `BASELINE.md` — какие существующие site contracts использует S&S.

## Что пакет принципиально НЕ меняет

- Rubik / `--font-primary`;
- глобальные accordion color tokens;
- `--cv-ss-background` и `--cv-ss-foreground`;
- `createCvAccordion`;
- `applyAccordionPresentation`;
- `createMediaMarquees`;
- `createMediaSliders`;
- `motion-preference`;
- mount/unmount sequence в `main.js`;
- глобальный `media-marquee.css/js`;
- глобальный `media-slider.css/js`.

## Никакого нового JS runtime

S&S не имеет собственного JS-файла.

Нет:
- `MutationObserver`;
- `ResizeObserver`;
- `IntersectionObserver`;
- delegated click handler;
- таймеров для captions;
- отдельного mount/unmount;
- DOM cloning.

Единственный marquee автоматически подхватывается уже существующим `createMediaMarquees()` по стандартному `[data-media-marquee]`.

## Подписи desktop / mobile

Используется тот же принцип, который уже применён в предоставленном Sensetique-прототипе: focusable media surface + CSS `:hover/:focus/:focus-within`.

Desktop:
- подпись появляется на hover;
- marquee продолжает движение.

Touch/mobile:
- тап по фотографии переводит surface в focus;
- подпись появляется;
- тап по другому кадру открывает его подпись;
- тап вне focusable кадра снимает focus и закрывает подпись.

Для этого не нужен JS-state.

## Почему одинаковая высота marquee не требует изменения общего компонента

Каждый S&S frame уже знает свои настоящие `width` и `height`.

В разметке один раз вычислено локальное отношение сторон:
`--sands-marquee-ratio`.

S&S CSS задаёт:
- общую высоту кадра;
- ширину `height × ratio`.

После этого существующий `media-marquee` измеряет уже готовую геометрию обычным способом. Его код не меняется.

## Phone swipe

Общий `media-slider` в проверенном `prod` сейчас принудительно static, поэтому S&S не включает его специальным исключением.

Два утверждённых кадра phone mockup сменяются локальной CSS keyframe-анимацией. Это нужно только для воспроизведения уже утверждённого поведения прототипа.

При `prefers-reduced-motion: reduce` animation отключается и остаётся первый кадр.
