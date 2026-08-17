# Карта файлов

## Production files

### `snippet/berry-agency-section.html`
Текущая Berry markup. Только visible content.

### `files/src/components/berry-case/berry-case.css`
Только Berry:
- group layout;
- mobile reel geometry;
- 5×2 / 2-column photo grid;
- group notes;
- divider;
- caption overlay;
- phone shadow clearance;
- local disable глобального photo zoom.

Не содержит theme/font assignment.

### `files/src/components/berry-case/berry-case.js`
Только mobile/touch caption interaction.

Event listeners:
- pointerdown;
- pointermove;
- pointerup;
- pointercancel.

Нет observer/timer/animation loop.

### `files/src/components/phone-mockup/phone-mockup.css`
CSS-only phone shell.

## Integration utilities

### `install.mjs`
Не входит в runtime сайта.

### `tools/verify-berry-integration.mjs`
Не входит в runtime сайта.

## Reference

### `reference/berry-agency-prototype.html`
Standalone визуальный эталон. Целиком в production не переносится.
