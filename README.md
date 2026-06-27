# stage 08 — heading animation scope fix

Точечно ограничивает GSAP/letter idle animation.

Меняется только:

- `src/components/heading-animations.js`
- `src/components/hero-title/hero-title.js`
- `src/components/index.js`

Логика:

- hero animation действует только на `.hero__title-name`
- showcase heading animation действует только на заголовки глав `.jestei-chapter-hero__title`
- brand titles, project headers, subtitles, section headers, card headers, text sections не анимируются
