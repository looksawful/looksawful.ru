# Architecture

## Ownership

### `cv-accordion`

Остаётся единственным владельцем:

- accordion state;
- scroll scene;
- active index;
- scene geometry;
- accordion lifecycle.

Пакет его не меняет.

### `moves-awful`

Владеет только Moves-specific behavior:

- tabs;
- 5-second tab autoplay;
- mobile fixed-scene scale;
- подключением Moves video lightbox;
- cleanup этих Moves-specific механизмов.

`configureMovesAwful(root)` возвращает cleanup.

`src/main.js` только сохраняет этот cleanup и вызывает его при общем `unmount()`.

### `animated-canvas-gallery`

Остаётся единственным Canvas renderer.

Moves передаёт ему обычные declarative attributes и существующие source keys.

Никакой второй Canvas engine в production не переносится.

### `media-marquee`

Остаётся единственным владельцем:

- clone groups;
- marquee distance;
- duration;
- ResizeObserver marquee;
- reduced-motion marquee behavior.

Moves не создаёт собственную копию marquee runtime.

### `media-lightbox`

Новый generic-компонент только для открытия media в modal overlay.

Он не знает об accordion layout и не знает о Canvas.

Moves монтирует один экземпляр на свою сцену и уничтожает его вместе с Moves.

## Observers

Новый Moves code не создаёт:

- MutationObserver;
- IntersectionObserver;
- scroll observer;
- global resize monkeypatch;
- отдельный requestAnimationFrame animation runtime.

Единственный новый project-specific observer:

`ResizeObserver` для mobile Canvas scale.

Он наблюдает один browser screen и существует только для требования fixed `1280×720` scene -> visual scale.

Generic Canvas и generic marquee продолжают использовать свои собственные существующие observers внутри своих компонентов.

## Timers

Один `setTimeout` используется для запрошенного automatic tab switching:

`5000ms`

Это не animation loop.

Timer:

- перезапускается после ручного выбора;
- прекращается при destroy;
- не переключает tabs при hidden document.

## CSS boundaries

`moves-awful.css` использует Moves-scoped selectors.

Он не задаёт:

- `body`;
- `html`;
- глобальный `button`;
- глобальный `canvas`;
- глобальные accordion themes.

`media-lightbox.css` scoped к `.media-lightbox`.

## Theme and typography

Moves берёт тему из существующих accordion tokens.

Moves берёт typography из существующих font variables.

Поэтому интеграция не должна менять:

- `tokens.css`;
- global Rubik setup;
- theme sequence accordion;
- соседние accordion items.

## Scene-owned autoplay

Moves получает существующий `accordionRuntime`.

`accordionRuntime.subscribeScene()` является единственным источником состояния:
- active scene;
- document visibility.

5-секундный tab timer не создаёт собственный observer или visibility channel. При закрытии Moves timer очищается; при повторной активации запускается заново.

## Hover ownership

Commercial video hover принадлежит существующему `accordion-presentation.css`.

Moves CSS не повторяет `[data-media-marquee-surface]:hover > video`.

Moves-specific CSS содержит только:
- состояние ссылки общей подписи;
- lightbox source cursor/focus/touch activation;
- собственную layout/adaptive часть Moves.
