# QA checklist

## Global invariants

- Цвет `data-cv-theme` Jestei Pool не изменился.
- Rubik приходит из глобального `main.js`, локального font import нет.
- Accordion открывается/закрывается и работает в scroll/click/reduced mode как до интеграции.
- В console нет второго mount одного и того же компонента.

## Captions

- Все обычные подписи находятся непосредственно под медиа.
- На desktop текст подписи не исчезает до hover.
- На mobile подпись не требует tap для чтения.
- Marquee: подпись движется вместе со своим кадром и находится под ним.
- Номер и текст остаются частью одного `figcaption`.

## Groups / mobile

### 01
Один крупный блок, без горизонтального rail.

### 02
Две строки, горизонтальный touch-scroll, карточки одинаковой ширины.
Чёрные подложки у 05–09, белая у 21.
Изображения целиком (`contain`), не растянуты.
Клик/Enter/Space открывает lightbox.

### 03
Feature-блок использует доступную ширину.

### 04
Однорядный горизонтальный reel.
Следующая карточка частично читается справа.
На desktop — 2×2.

### 05
Видео сохраняет пропорции и подпись под ним.

### 06
Mockup на mobile занимает ширину контента.
На desktop ограничен примерно 46rem.
Видео идут 1 → 2 → 3 → 1 по `ended`.
При закрытой сцене и reduced motion видео не продолжают играть.

### 07
Используется существующий MediaMarquee.
Hover не ставит анимацию на паузу.
Подписи под кадрами.

### 08
Два материала остаются обычной media-gallery.

### 09
PlaylistFilterWorkflow занимает всю ширину доступного контента.

### 10
Caption-only пояснение не создаёт пустой media box.

### 11
Camelot media: full-width на mobile, компактный ~42rem на desktop, `contain`.

### 12
Before/After использует стандартный компонент сайта.
After не растягивается; изображение заполняет reveal через `cover`.

### 13
Caption-only promo explanation без пустого медиа-контейнера.

### 14
Mobile: full-width opener → 2-row horizontal square archive → full-width closer.
Desktop >=64rem: квадратная часть 3×3.
Cover-кадр 36 не показывает пустую подложку.

## Responsive widths to check

- 360 px
- 390 px
- 430 px
- 768 px
- 1024 px
- 1440 px

Горизонтальный overflow допустим только внутри специально заданных mobile rails.
