# Sensetique — integration package

Пакет переносит утверждённую сцену Sensetique в существующий looksawful.ru без второй архитектуры аккордеона.

## Состав
- `src/sensetique-section.html` — один `article.cv-item--sensetique`.
- `src/sensetique-section.css` — scoped стили сцены.
- `src/sensetique-section.mjs` — только локальное поведение.
- `src/media-map.json` — текущие media id, номера, группы и подписи.
- `src/package.partial.json` — `page-flip@2.0.7`.
- `docs/*` — интеграция, визуальный контракт, ownership, QA.
- `reference/source-prototype-v32.html` — исходник только для сравнения; не импортировать в production.

Пакет не реализует заново accordion, темы, шрифт, wrapper/MediaItem/MediaGallery, image fallback, site media-marquee, device-mockup и animated-canvas-gallery.

Подписи: desktop — hover/focus overlay; touch/mobile — tap; под кадром остаются номер и только уникальный статический фрагмент.
