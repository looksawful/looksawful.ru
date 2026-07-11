# Jestei interface bento redesign

## Scope

Refine only the `#jestei-interface-bento` section and its four existing cards: `#jestei-filter`, `#jestei-event-nav`, `#jestei-promo`, and `#jestei-landings`.

Preserve all existing copy, card order, IDs, aria attributes, media assets, canvases, fullscreen behavior, and current interactive behavior. Do not modify the first Jestei results bento or unrelated sections.

## Goal

Make the interface bento follow the visual logic of the first Jestei bento more closely: stronger hierarchy, asymmetric card proportions, tighter internal rhythm, better media scale, clearer title levels, and fewer accidental empty areas.

## Desktop layout

Keep the current 12-column grid and use an asymmetric 7/5 split:

- row 1: `filter` spans 7 columns, `event` spans 5 columns;
- row 2: `promo` spans 7 columns, `landings` spans 5 columns.

The upper row is slightly taller than the lower row. The cards must not feel like four equal boxes.

Card roles:

- `filter` is the primary card and receives the strongest title and largest interface visual;
- `event` is a taller, more vertical card with a compact text block and a curated three-screen composition;
- `promo` is a wide lower card where the diagonal canvas is the dominant visual;
- `landings` is the most compact card and presents the two landing screens as one coordinated pair.

## Internal card structure

Keep the existing semantic order:

1. heading;
2. main paragraph;
3. media or interactive module;
4. caption.

Use shared spacing tokens for title-to-copy, copy-to-media, and media-to-caption gaps. Captions remain visually quieter than main paragraphs.

### Filter

- Use the largest card title in this section.
- Limit paragraph measure so the copy does not become a wide text band.
- Give the embedded filter the largest media allocation.
- Preserve the fullscreen control and current filter interaction.
- Keep the media inset from the card edges rather than visually glued to the border.

### Event navigation

- Keep heading and paragraph compact at the top.
- Present the three screens as a deliberate showcase rather than three identical loose columns.
- Let the central screen dominate slightly while side screens remain subordinate.
- Keep all three images fully visible with `object-fit: contain`.
- Keep the caption at the bottom without excessive separation from the screens.

### Promo

- Use a strong but secondary title level.
- Let the diagonal canvas occupy most of the card width and visual height.
- Use a controlled aspect ratio so the canvas does not create an excessively tall card.
- Preserve all current canvas runtime behavior.

### Landings

- Keep the text block compact.
- Present both landing screens as one pair with consistent dimensions and bottom alignment.
- Avoid oversized empty space beneath the media.
- Stack the pair vertically only when the available width is no longer readable.

## Responsive behavior

### Above 72rem

Use the asymmetric 7/5 two-row layout. Tune each card independently rather than assigning one universal media height.

### 48rem through 72rem

Keep a two-column layout with the same card order. Titles, padding, and media sizes reduce proportionally. Cards may have different intrinsic heights; do not force equal-height content modules when that creates empty space.

### Below 48rem

Use one column in this order:

1. filter;
2. event;
3. promo;
4. landings.

Do not add a section-level horizontal slider.

Within `event`, keep three screens in one row while readable; on narrow widths allow a contained horizontal media rail or another bounded layout that does not overflow the card.

Within `landings`, keep the pair side by side while readable, then stack vertically on compact widths.

Keep the promo canvas on a controlled responsive aspect ratio.

## CSS ownership

Primary implementation file:

- `src/styles/sections/jestei-landings.css`

The existing markup already exposes separate `head`, `copy`, `media`, and `caption` areas. Do not edit `src/homepage-publication.js` or page markup unless CSS alone cannot preserve the required media behavior.

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
- headings do not collide, clip, or produce awkward orphaned lines;
- media remains fully contained;
- fullscreen filter behavior still works;
- canvases still initialize and resize correctly;
- event screens remain readable;
- landing screens behave as a coordinated pair;
- captions remain distinct from main copy;
- there is no disproportionate empty space;
- no unrelated section changes visually or functionally.
