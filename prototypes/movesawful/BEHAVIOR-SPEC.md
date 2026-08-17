# Visual & behavior contract

Этот файл описывает только то, что уже реализовано в финальном прототипе.

## Accordion

Moves Awful остаётся обычной сценой существующего accordion.

Заголовок:

- Moves Awful
- Разработчик
- 2025

Внутри открытой секции:

- заголовок `Moves Awful`;
- текст `Библиотека анимированных галерей для лендингов.`;
- строка `Разработчик`;
- browser mockup с Canvas;
- блок коммерческих видео.

Цвет сцены берётся из существующих site tokens:

- `--cv-moves-awful-background`
- `--cv-moves-awful-foreground`

Новых глобальных цветов для accordion пакет не создаёт.

Шрифт — существующий `--font-primary`. Новый font-face/import не создаётся.

## Browser mockup

Mockup занимает допустимую ширину контента внутри accordion.

Он не:

- вылезает за `.cv-item__content`;
- растягивается на viewport;
- создаёт отрицательные margins;
- меняет глобальную wrapper-систему.

Внутри:

- тёмная browser chrome;
- три traffic-light точки;
- Canvas area;
- tabs под Canvas.

## Canvas

Варианты:

1. Arc
2. Spiral
3. Horizontal
4. Diagonal
5. Showcase
6. Masonry

Production использует существующий generic `animated-canvas-gallery`.

Для каждого варианта:

- `data-gallery-preset="project-wide"`
- hover отключён;
- Canvas lightbox отключён;
- autoplay Canvas остаётся;
- generic renderer не изменяется.

Tabs переключаются автоматически раз в 5 секунд.

Ручной click/keyboard переключает вариант сразу и перезапускает 5-секундный отсчёт.

При `document.hidden` timer не переключает tabs.

## Mobile Canvas

До `50rem` композиция Canvas не перестраивается как новая мобильная композиция.

Логическая сцена остаётся:

`1280 × 720`

Весь слой масштабируется целиком внутрь mockup.

Именно поэтому на мобильном сохраняются:

- расположение элементов;
- относительный размер карточек;
- плотность;
- геометрия выбранного варианта;
- overlay title.

Для вычисления scale используется один scoped `ResizeObserver` на `.browser-mockup__screen`.

Это единственный новый project-specific observer в Moves. Он нужен только потому, что generic Canvas renderer вычисляет layout от `clientWidth/clientHeight`, а требование прототипа — не пересобирать mobile-композицию, а уменьшать одну фиксированную сцену.

Observer:

- не следит за scroll;
- не следит за DOM mutations;
- не создаёт animation loop;
- не меняет generic Canvas runtime;
- отключается в `destroy()`.

На desktop выше `50rem` фиксированный mobile scale выключается, и существующий responsive Canvas runtime работает штатно.

## Canvas tabs

На мобильном:

- одна строка;
- horizontal touch scroll;
- scrollbar скрыт;
- без fade-mask;
- touch target не меньше 44px;
- активный tab подчёркнут.

На desktop сохраняются крупные tabs прототипа.

## Коммерческий блок

Над marquee находится одна подпись:

`использование библиотеки в лендинге www.jesteipool.ru`

`www.jesteipool.ru` — ссылка на:

`https://www.jesteipool.ru/`

У отдельных video нет видимых `01 / 02 / 03` подписей.

Marquee:

- использует существующий `data-media-marquee`;
- скорость `34 px/s`;
- не останавливается от hover;
- на mobile не имеет боковых fade-mask;
- на desktop fade-mask возвращается;
- generic `media-marquee.js` не изменяется.

## Video lightbox

Клик по любому видимому видео marquee открывает video lightbox.

Lightbox:

- fixed fullscreen overlay;
- фон `rgb(0 0 0 / 82%)`;
- video вписывается в viewport;
- native video controls;
- закрытие по крестику;
- закрытие по фону;
- закрытие по Escape;
- focus возвращается;
- marquee временно ставится на pause, пока lightbox открыт.

Lightbox оформлен отдельным generic-компонентом:

`src/components/media-lightbox/`

Он не встроен внутрь generic marquee или generic Canvas runtime.

Marquee clones остаются `inert`. Pointer click по видимому clone определяется делегированно внутри lightbox-компонента, поэтому существующий accessibility-contract marquee не ослабляется.

## Hover / touch — точный контракт

Production Moves не задаёт собственный transform-hover для commercial video.

Существующий `accordion-presentation.css` сайта уже применяет media hover к `[data-media-marquee-surface]` только при `(hover: hover) and (pointer: fine)`. Moves сохраняет этот contract без второго transform.

Общая подпись `использование библиотеки в лендинге www.jesteipool.ru` всегда видима.

Ссылка:
- fine pointer: hover/focus меняет underline state;
- touch: tap активирует ссылку напрямую;
- отдельного JS-toggle подписи нет, потому что скрытого дополнительного текста в макете нет.

Commercial video:
- fine pointer: site hover;
- click/tap: открывает video lightbox.
