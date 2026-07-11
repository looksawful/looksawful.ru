# Jestei bento responsive layout redesign

## Scope

Refine only the `#jestei-results` bento section. Preserve the current card order, card copy, desktop four-column composition, tablet composition, mobile two-panel horizontal scrolling, animations, and the existing desktop site-width constraint.

## Goals

- All card titles must remain on one line at every supported breakpoint.
- Secondary title lines and card paragraphs must remain comfortably readable.
- Internal spacing must feel consistent without excessive empty areas.
- Cards with visual modules must reserve predictable visual space without allowing canvases or SVGs to determine uncontrolled card height.
- Each breakpoint must have its own coherent typography, spacing, and row proportions rather than relying on overlapping exceptions.
- The process-map animation must not show stray black or purple dots when paths are fully hidden.

## Breakpoints

Keep the existing four ranges:

1. Desktop: above `72rem`.
2. Tablet: `43.001rem` through `72rem`.
3. Mobile: above `25rem` through `43rem`.
4. Compact mobile: `25rem` and below.

No new breakpoint families are introduced.

## Layout model

### Desktop

Keep the current four-column grid and areas:

- row 1: steps, price, rebrand spanning two columns;
- row 2: manual spanning two columns, products, audience;
- row 3: manual spanning two columns, USA spanning two columns.

Replace generic `grid-auto-rows` growth with explicit row sizing tuned to the content and visual modules. Compact metric cards remain compact; the manual and USA cards receive larger but bounded visual rows.

### Tablet

Keep the same grid areas, but use tighter gaps and slightly taller text rows. Avoid shrinking paragraph text below comfortable reading size. Visual cards keep fixed proportional allocations between text and illustration.

### Mobile

Keep the two horizontal snap panels and current card order. Panel row heights are defined by card type rather than a shared minimum. The steps and price cards stay compact; manual, rebrand, audience, and USA receive content-aware heights with bounded visual areas.

### Compact mobile

Use a single-column text layout inside dense cards where two-column text becomes cramped. Keep titles on one line through card-specific font sizing rather than allowing wrapping. Paragraphs retain a minimum readable size.

## Typography

- Use breakpoint-level tokens for metric titles, strong titles, regular titles, subtitles, and paragraphs.
- Keep metric values visually dominant.
- Increase subtitle size relative to the current implementation.
- Keep paragraph line-height between approximately `1.3` and `1.4` depending on width.
- Apply card-specific title scaling only where required, especially the long products title.
- Use `white-space: nowrap` for titles that must never wrap and reduce font size within bounded limits rather than clipping.
- Limit paragraph measure to prevent overly long lines.

## Spacing

- Establish one content gap token per breakpoint.
- Establish one card padding token per breakpoint.
- Use smaller padding for compact metric cards and larger padding for text-heavy cards only when necessary.
- Remove duplicate padding declarations from visual-specific styles where the base card layout should own spacing.
- Keep visual modules flush to selected card edges only where this is intentional.

## Card-specific behavior

### Steps

Text occupies the top area and the canvas occupies a bounded lower visual area. The one-shot animation remains unchanged. The card must not grow after the animation completes.

### Price

Use the same compact typographic hierarchy as steps, without a visual reserve.

### Manual process card

Use a clear text block above or beside the process map depending on breakpoint. The process map receives a bounded aspect area. Stray dots are caused by zero-length masked strokes rendered with round caps, not by the explicit port or moving-dot elements alone. Fix this by using non-round reveal-mask caps and explicitly hiding a source path whenever its visible masked length is effectively zero. Preserve line drawing and erasing behavior.

### Rebrand

Balance text and passive logo inspector. The inspector must remain entirely visible and must not force excess card height.

### Products and audience

Use readable paragraph text and card-specific title sizing. The long products title must remain on one line without clipping.

### USA

Balance the text block and globe at every breakpoint. The globe remains fully visible and cannot determine unbounded card height.

## CSS ownership

- `jestei-bento.css` owns grid, shared typography, common card spacing, and breakpoint tokens.
- `jestei-steps.css` owns only the steps canvas placement and dimensions.
- `jestei-process.css` owns only the process visual placement and SVG appearance.
- `jestei-bento-visuals.css` owns only the logo inspector and globe placement.

Remove or override duplicated row, padding, and typography rules from visual-specific files so that one layer controls each concern.

## Verification

Check at representative widths around `1440`, `1280`, `1024`, `768`, `430`, `390`, `360`, and `320` CSS pixels.

For every width verify:

- no title wraps, clips, or overlaps;
- paragraphs remain readable;
- no card contains disproportionate empty space;
- no card feels cramped;
- all canvases and SVGs stay inside their cards;
- mobile horizontal snap behavior remains intact;
- steps animation runs once and holds its final state;
- process animation contains no stray dots before, during, or after path drawing.
