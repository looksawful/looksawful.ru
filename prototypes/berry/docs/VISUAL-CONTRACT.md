# Визуальный и поведенческий контракт

Этот документ описывает только текущий утверждённый прототип.

## Общая структура

Berry — обычная `.cv-item` существующего accordion.

Внутри:
- intro;
- 2 видимые media sections;
- 14 видимых media;
- hidden content отсутствует.

## Intro

Остаются текущие:
- Berry Agency;
- СММ;
- 2020;
- описание агентства;
- primary copy.

Заголовок и обычное описание используют глобальную CV typography.

Primary copy использует текущий approved крупный scale Berry.

## Первая группа

Текст:

`Посты и сторис для социальных сетей агентства.`

4 phone mockup.

### Desktop
- 4 колонки;
- без горизонтального scroll;
- box-shadow телефона не клипуется.

### Mobile
- существующий `.reel`;
- ручной horizontal scroll;
- scroll snap;
- scrollbar скрыт;
- autoplay отсутствует;
- swipe не открывает caption;
- короткий tap по phone image открывает caption;
- повторный tap закрывает;
- tap по другой media переключает открытую caption;
- scrollport имеет технический внутренний clearance под тень, но внешний vertical rhythm компенсирован.

## Вторая группа

Текст:

`Модельные тесты и съёмки для агентства.`

10 media:
`12, 13, 14, 15, 16, 17, 18, 20, 21, 22`

### Desktop
- 5 колонок × 2 ряда;
- заполнение сверху вниз.

### Mobile
- 2 колонки.

Все boxes — 3:4.

## Caption

Markup caption остаётся стандартным для сайта.

### Desktop
- hidden по умолчанию;
- hover/focus показывает overlay.

### Touch / pen
- hidden по умолчанию;
- короткий tap переключает `data-caption-open`;
- swipe не переключает состояние.

### Внешний вид
- overlay снизу;
- `--item-text`;
- gradient от `--item-body-bg`;
- 1px bleed убирает щель по нижнему краю;
- global caption typography не переписывается;
- global photo zoom для Berry отключён.

## Разделители

- 1px;
- `color-mix(in srgb, var(--item-text), transparent 78%)`;
- не добавляют отдельную высоту.

## Theme / font

Berry не определяет:
- `--item-bg`;
- `--item-ink`;
- `--font-primary`;
- `@font-face`.

Следовательно цветовая тема и Rubik продолжают принадлежать сайту.
