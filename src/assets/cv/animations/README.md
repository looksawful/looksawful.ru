# CV animation media

Единый корень для медиа, которые питают canvas-анимации в CV.

Как пользоваться:

- кладёшь картинки или видео в нужную папку сценария;
- Vite подхватывает все `webp`, `png`, `jpg`, `jpeg`, `avif`, `mp4` из этой папки и её подпапок;
- порядок сначала числовой по началу имени файла, потом алфавитный;
- лимита `maxItems` в анимациях больше нет: количество материалов задаётся содержимым папки.

Сценарии:

- `jestei-interface-masonry` — Jestei Pool, группа `ux/ui лид`, анимация masonry.
- `jestei-product-horizontal` — Jestei Pool, группа `продуктовый дизайн`, горизонтальная лента.
- `jestei-graphic-arc` — Jestei Pool, группа `графический дизайн`, дуга.
- `styx-graphic-diagonal` — Styx Jewels, группа `графический дизайн`, диагональная сетка.
- `lyve-graphic-carousel` — Lyve Moscow, группа `графический дизайн`, carousel.

Кодовый реестр сцен лежит в:

- `src/lab/canvas/cv-animation-assets.js`
