# Jestei brand bento redesign

## Goal

Turn the existing `#jestei-logo` composition into a second Jestei bento grid placed after the first results bento, and move the existing `#jestei-type` content into that same bento without changing copy, media proportions, inspector behavior, responsive switching, or slider behavior.

## Scope

Only the Jestei logo and type sections are affected.

Do not change:

- any text, wording, spelling, or semantic labels;
- hero, cover, resume, Styx, pets, color section, or first results bento;
- logo-inspector materials, lighting, textures, geometry, animation timing, interaction, camera logic, row/grid switching, or scaling logic;
- current image aspect ratios, image order, lightbox behavior, horizontal scrolling, scroll snap, or ultrawide containment;
- existing desktop, tablet, and mobile breakpoint behavior.

## Bento structure

Create one outer composition under `#jestei-logo`, using the same spacing and radius system as the first Jestei bento.

The composition contains these top-level bento items:

1. Free text area with the existing `новый знак` title and lead. It has no card border and no radius.
2. Four independent logo-variant rows. Each row remains its own inline SVG and becomes its own rounded visual card.
3. The existing logo-inspector container as one large rounded card.
4. The three existing logo media items as rounded cards inside the existing horizontal slider / ultrawide grid behavior.
5. The existing `новый шрифт` title, paragraph, and single remaining Druk image, moved into the same composition as a lower bento group.

The original `#jestei-type` anchor must remain available for navigation, but it must no longer render as a separate vertical section after its content is moved.

## Radius system

Reuse the first Jestei bento radius values exactly:

- desktop: `clamp(0.8rem, 1.8cqi, 2rem)`;
- tablet: `clamp(0.9rem, 1.65cqi, 1.45rem)`;
- mobile: `clamp(0.75rem, 3.6cqi, 1.2rem)`.

Apply the radius only to top-level visual cards:

- logo-inspector shell;
- each of the four SVG logo rows;
- each image card in the logo slider;
- the Druk image card in the type group.

Nested `canvas`, `svg`, `img`, poster elements, and internal wrappers must use `border-radius: 0`. The top-level card clips its contents with `overflow: hidden`.

## Layout preservation

Desktop:

- Keep title/lead on the left and four SVG rows on the right.
- Keep the logo inspector below them in its current wide format.
- Keep the logo media slider below the inspector.
- Integrate the type group as the final bento row, with its current title, paragraph, and image proportions.
- On ultrawide screens, keep the existing contained three-card grid behavior.

Tablet:

- Keep the current vertical order: title, SVG rows, lead, inspector, logo media, type group.
- Keep the current inspector `2 × 2` layout and current `4 / 3` container proportion.

Mobile:

- Keep the current title, SVG rows, lead, square inspector, and horizontal media slider behavior.
- Keep the inspector `2 × 2`.
- Keep the visible next-card cue in the horizontal slider.
- Add the type group as the final bento item without introducing a second horizontal scroller.

## Implementation boundaries

Update the existing runtime reorganization module rather than hardcoding a second copy of the content in `index.html`.

Use a dedicated section stylesheet for the second bento composition. Existing logo-inspector rendering code remains untouched.

The runtime must:

- move the live `#jestei-type` content nodes into the logo bento;
- preserve all existing IDs, links, media attributes, lightbox attributes, alt text, aria labels, and data attributes;
- leave an empty anchor element or equivalent navigation target with `id="jestei-type"` at the original position;
- remain idempotent when called more than once.

## Verification

Verify at 320, 360, 390, 430, 768, 1024, 1366, 1440, 1600, and 1920 CSS pixels:

- no copy changes;
- no image or inspector proportion changes;
- no logo deformation;
- desktop inspector remains a row and mobile/tablet remain `2 × 2` according to the existing breakpoint logic;
- all top-level visual cards use the same radius as the first Jestei bento;
- nested elements have no independent radius;
- no unexpected horizontal page overflow;
- the logo media slider still scrolls on standard laptop widths;
- the media cards remain contained on ultrawide screens;
- `#jestei-type` navigation still resolves to the type content;
- lightbox and pointer interaction remain functional.
