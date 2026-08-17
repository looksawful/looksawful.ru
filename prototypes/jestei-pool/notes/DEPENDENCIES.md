# Existing site dependencies

Пакет ожидает текущие production-компоненты и не включает их копии.

Уже существующие зависимости:

- `src/styles/patterns.css`
  - `.reel` используется для мобильной группы 04.
- `src/components/cv-accordion/*`
  - shell, scroll/click mode, accordion runtime.
- `src/content/accordion-presentation.css`
  - тема текста, размеры и обычные подписи под медиа.
- `src/content/accordion-presentation.js`
  - стандартная подготовка контента сцены.
- `src/components/media-gallery/*`
- `src/components/media-marquee/*`
- `src/components/before-after/*`
- `src/components/playlist-filter-workflow/*`
- `src/components/jestei-theme-organism/*`
- `src/components/animated-canvas-gallery/animated-canvas-gallery.css`
  - только существующие visual-классы lightbox.
- `src/motion-preference.js`

Важно: `jestei-pool-scene.js` не заменяет ни одну из этих систем.
