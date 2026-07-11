# Styx cover responsive alignment

## Scope

Refine only the Styx cover section in `src/homepage-publication.js` and `src/styles/sections/styx-cover.css`.

Preserve the existing Styx logo, title, role labels, description, dates, element order, section behavior, and all content outside the cover. Do not add new visual entities or reuse Jestei component classes directly.

## Goal

Bring the Styx cover width, outer spacing, grid behavior, and mobile adaptation close to the current Jestei cover while preserving the Styx-specific visual character.

## Structure

Add Styx-specific classes to the existing cover elements so the section can be styled without broad attribute selectors or shared global overrides:

- cover head;
- cover grid;
- logo figure;
- content column;
- title;
- role list;
- summary;
- dates;
- skill cloud.

Do not change any text, image source, semantic element, or content order.

## Desktop layout

- Use the same outer-width model as Jestei: `min(calc(100% - var(--space-7)), var(--case-wide))` centered in the section.
- Keep the bordered white card and current Styx radius.
- Use a three-column grid: logo, content, date.
- Size the logo column responsively and keep the image contained without cropping.
- Keep the content column bounded to a readable measure.
- Keep the date aligned to the lower/right part of the grid without absolute positioning.
- Remove the bottom skill-cloud row from rendering.

## Role pills

- Keep the existing labels `дизайнер`, `продюсер`, `фотограф`.
- Present them as one non-wrapping row distributed across the content width, following the visual logic of the Jestei role pills.
- Use white backgrounds, black borders, rounded pill geometry, regular weight, and responsive type sizing.
- On narrow screens, use a three-column grid so every role remains on one line.

## Mobile layout

At `43rem` and below:

- use the same horizontal width logic as Jestei mobile: `min(calc(100% - var(--space-5)), var(--page-max))`;
- stack logo, content, summary, and date into one column;
- center the logo;
- make title, role row, summary, and date use the full available width;
- keep the description readable without changing its text;
- avoid horizontal overflow at 320 CSS pixels.

## CSS ownership

- `src/homepage-publication.js` receives class hooks only.
- `src/styles/sections/styx-cover.css` owns all Styx cover width, grid, spacing, logo, typography, role-pill, date, skill-cloud visibility, and breakpoint rules.
- Do not modify `jestei-cover.css`, shared chip styles, or shared showcase layout styles.
- Do not add `!important`.

## Verification

Check representative widths around 1440, 1280, 1024, 768, 430, 390, 360, and 320 CSS pixels.

Verify that:

- the Styx card width and side margins visually track the Jestei cover;
- the logo remains unchanged and fully visible;
- all existing copy remains byte-for-byte unchanged;
- the three role pills remain on one line;
- the black skill chips are not rendered;
- no unrelated section changes;
- no overflow, overlap, or clipping appears at supported widths.
