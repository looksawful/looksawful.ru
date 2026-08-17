# Baseline / существующие контракты

Пакет собран под:

- repo: `looksawful/looksawful.ru`
- branch: `prod`
- commit: `7caa2af97df75197a8dd91c4f38fb3c937e0473a`

Проверено в текущем prod:

## main.js

Сайт уже:
- импортирует общий `media-marquee.css`;
- монтирует `createMediaMarquees({ root: document, motion })`;
- использует единый motion preference;
- монтирует accordion централизованно;
- имеет общий `media-slider`, но он сейчас принудительно static.

S&S не добавляется в mount/unmount.

## accordion-presentation

Существующий presentation layer:
- задаёт `--item-body-bg`;
- задаёт `--item-text`;
- задаёт общие caption typography roles;
- подготавливает обычные media surfaces;
- не содержит общего tap-toggle captions.

Поэтому S&S использует CSS focus pattern, а не новый JS handler.

## tokens.css

Уже существуют:
- `--font-primary: "Rubik Variable", ...`;
- `--cv-ss-background`;
- `--cv-ss-foreground`.

S&S только ссылается на эти tokens.

## media-marquee

Существующий marquee:
- сам клонирует source group;
- сам измеряет дистанцию;
- уже имеет собственный ResizeObserver;
- уже учитывает motion preference.

S&S не меняет его реализацию и не создаёт второй observer.
