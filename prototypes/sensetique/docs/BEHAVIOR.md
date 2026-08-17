# Behavior ownership

## Site-owned
Accordion, scene palette, font/global typography, wrapper/CV primitives, MediaItem/MediaGallery base, image fallback, reel/media-marquee, device-mockup, animated-canvas-gallery.

## Sensetique-owned
- captions: один delegated click/keydown handler, без observers;
- crossfade sliders: interval только для существующих slider components, reduced motion отключает autoplay;
- MIMI flipbook: `page-flip@2.0.7`;
- studio justified rows: единственный local `ResizeObserver`, потому что desktop row height зависит от реальной ширины раскрытого accordion container; на mobile расчёт отключён.

`initSensetiqueSection()` возвращает `refresh()` и `destroy()`. Auto-init отсутствует. MutationObserver/IntersectionObserver отсутствуют.
