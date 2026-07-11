# Jestei interface bento redesign

## Scope

Refine only the `#jestei-interface-bento` section and its four existing cards: `#jestei-filter`, `#jestei-event-nav`, `#jestei-promo`, and `#jestei-landings`.

Preserve all existing copy, card order, IDs, aria attributes, media assets, canvases, fullscreen behavior, and current interactive behavior. Do not modify the first Jestei results bento or unrelated sections.

## Goal

Make the interface bento substantially more compact, precise, and compositionally controlled. Follow the logic of the first Jestei bento: asymmetric card roles, limited card heights, bounded media areas, tighter typography, and no oversized empty zones inside cards.

The section must contain visible breathing room, but no card may use large blank areas merely to match a neighboring card.

## Desktop layout

Keep the 12-column grid but replace the current two equal rows with a three-track asymmetric composition:

- row 1: `filter` spans 7 columns; `event` spans 5 columns;
- row 2: `promo` spans 7 columns; `event` continues across the right side;
- row 3: `promo` continues across the left side; `landings` spans 5 columns.

Grid areas:

```css
grid-template-areas:
  "filter filter filter filter filter filter filter event event event event event"
  "promo promo promo promo promo promo promo event event event event event"
  "promo promo promo promo promo promo promo landings landings landings landings landings";
```

This creates four distinct roles without forcing equal card heights:

- `filter` is the leading compact card;
- `event` is the tall right card;
- `promo` is the large lower-left media card;
- `landings` is the compact lower-right card.

Do not assign one universal `min-height` to all cards. Grid tracks must be content-controlled and media modules must have explicit maximum heights.

## Horizontal fields and section width

The interface bento must use exactly the same horizontal field contract already used by the first Jestei bento. Do not invent a separate desktop width system for this section.

Desktop contract:

```css
.jestei-interface-bento {
  --jestei-interface-bento-page-x: clamp(0.5rem, 2.2cqi, 2rem);
}

main[data-showcase] .jestei-interface-bento [data-section-screen] {
  grid-template-columns: minmax(0, 1fr);
  inline-size: 100%;
  max-inline-size: none;
  padding-inline: var(--jestei-interface-bento-page-x);
}

.jestei-interface-bento__grid {
  inline-size: 100%;
  min-inline-size: 0;
  margin-inline: 0;
}
```

These values and rules mirror the existing first Jestei bento contract. The left and right edges of both bento grids must align exactly at the same desktop viewport width.

Do not add:

- a second centered wrapper;
- `max-inline-size: var(--page-max)` on the inner bento grid;
- `inline-size: var(--page)` or `var(--case-wide)` for this grid;
- extra inline margins around the grid;
- additional card-grid padding inside the section-screen padding.

Responsive field values must follow the first Jestei bento values:

- desktop above `72rem`: `clamp(0.5rem, 2.2cqi, 2rem)`;
- tablet through `72rem`: `clamp(0.7rem, 2cqi, 1.4rem)`;
- mobile: `clamp(0.45rem, 2.4cqi, 0.85rem)`;
- below `25rem`: `0.4rem`.

The layout breakpoint may differ where required by the four-card composition, but horizontal fields must not drift from the first Jestei bento.

## Compactness rules

Use section-local tokens under `.jestei-interface-bento`:

- grid gap: approximately `0.45rem` to `1rem` depending on viewport;
- card padding: approximately `0.75rem` to `1.3rem`;
- title-to-copy gap: approximately `0.35rem` to `0.65rem`;
- copy-to-media gap: approximately `0.55rem` to `0.9rem`;
- media-to-caption gap: approximately `0.4rem` to `0.7rem`.

Remove inherited or local minimum heights that make cards taller than their content. Avoid `align-content: stretch` where it distributes unused vertical space. Internal card layout should use `align-content: start` and bounded media dimensions.

Card borders, corner radii, and spacing must stay visually consistent with the first Jestei bento.

## Typography

- `filter` receives the largest title, but it must stay compact and avoid dominating the whole row;
- `event` and `promo` use a strong secondary title level;
- `landings` uses the smallest title level in the section;
- main paragraphs remain readable but do not exceed a controlled line measure;
- captions remain visibly quieter and closer to their media;
- no title, paragraph, or caption receives extra vertical margins outside the section spacing system.

Prefer compact `clamp()` ranges instead of oversized desktop maxima. Do not change visible text.

## Internal card structure

Keep the existing semantic order:

1. heading;
2. main paragraph;
3. media or interactive module;
4. caption.

### Filter

- Keep the card compact despite its leading role.
- Use the largest title in the section with a controlled maximum size.
- Limit paragraph measure so it does not become a wide text band.
- Give the embedded filter enough width to remain useful, but cap its desktop height.
- Preserve the fullscreen control and all filter interaction.
- Remove any large blank area below or around the embedded filter.

### Event navigation

- Use the available tall card shape for the three screens rather than adding blank space.
- Keep heading and paragraph as a compact block at the top.
- Present the three screens as one deliberate composition.
- Let the central screen dominate slightly while side screens remain subordinate.
- Keep images fully visible with `object-fit: contain`.
- Keep the caption close to the screen group.

### Promo

- Use the wide lower-left area as the dominant media card.
- Keep heading and paragraph compact above the canvas.
- Let the diagonal canvas occupy the remaining useful area, but cap its height and preserve its aspect ratio.
- Remove unnecessary top and bottom margins around the canvas.
- Preserve current canvas initialization, resizing, and animation behavior.

### Landings

- Keep this card clearly smaller and denser than the other three.
- Keep heading and paragraph compact.
- Present both landing screens as one coordinated pair with consistent dimensions and bottom alignment.
- Cap image height so the card does not grow from the natural image dimensions.
- Keep the caption directly below the pair without a large empty zone.

## Responsive behavior

### Above 72rem

Use the three-track asymmetric desktop composition. Use the exact same horizontal fields as the first Jestei bento. Each card uses independent media height limits.

### 48rem through 72rem

Use a compact two-column composition:

```css
grid-template-areas:
  "filter event"
  "promo event"
  "promo landings";
```

Reduce gap, padding, title sizes, and media maxima. Preserve the tall `event`, large `promo`, and compact `filter` and `landings` roles. Keep the tablet horizontal field value synchronized with the first Jestei bento.

### Below 48rem

Use one column in this order:

1. filter;
2. event;
3. promo;
4. landings.

Do not add a section-level horizontal slider.

All mobile cards must be intrinsic-height and compact. Remove desktop minimum heights. Media receives card-specific maximum heights instead of a shared tall size.

Within `event`, keep three screens in one row while readable. On narrow widths, use a contained horizontal media rail or another bounded layout that does not overflow the card.

Within `landings`, keep the pair side by side while readable, then stack vertically only on compact widths.

Keep the promo canvas on a controlled responsive aspect ratio.

## CSS ownership

Primary implementation file:

- `src/styles/sections/jestei-landings.css`

The existing markup already exposes separate `head`, `copy`, `media`, and `caption` areas. Do not edit `src/homepage-publication.js` or page markup unless CSS alone cannot preserve required media behavior.

Do not introduce unrelated refactoring, new breakpoint families, global typography changes, or changes to shared section components.

## Parallel-work safety

Before any implementation write:

1. re-read the current `prod` version of every target file;
2. compare the latest production commit with the revision used for the edit;
3. apply only section-local selectors under `.jestei-interface-bento`;
4. avoid replacing unrelated declarations added by parallel chats;
5. commit the smallest coherent change set.

## Verification

Check at representative widths:

- 1440;
- 1280;
- 1024;
- 768;
- 430;
- 390;
- 360;
- 320 CSS pixels.

At each width verify:

- no text content changed;
- the interface bento and the first Jestei bento share identical left and right fields;
- no nested wrapper narrows the interface bento independently;
- no card is taller than required by its content and bounded media;
- no card contains a large unused blank region;
- headings do not collide, clip, or produce awkward orphaned lines;
- media remains fully contained;
- fullscreen filter behavior still works;
- canvases initialize and resize correctly;
- event screens remain readable;
- landing screens behave as one coordinated pair;
- captions remain distinct from main copy and close to their media;
- no unrelated section changes visually or functionally.