# Homepage typography normalization

## Scope

Normalize typography only on the published homepage in `index.html` and its visible showcase sections. Do not change copy, markup, media, canvas behavior, section order, card geometry, or page-specific typography on `/resume/`, `/gallery/`, and pet-project pages.

## Goal

Create one predictable hierarchy for paragraphs and headings across the visible Jestei Pool, Styx, pet-project, and resume preview sections. Remove accidental size drift caused by overlapping global, component, section, and publication-mode overrides.

## Typographic hierarchy

### Body copy

Use one body scale for ordinary paragraphs, list items, and descriptive copy:

- desktop: `clamp(1rem, 0.34vw + 0.94rem, 1.14rem)`;
- mobile: `clamp(1rem, 4vw, 1.12rem)`;
- line-height: `1.48` on mobile and `1.5` to `1.55` on larger screens;
- maximum measure: existing `--text-measure` / section-local text width contracts.

Lead paragraphs may remain one level larger only where the markup explicitly identifies them as lead text.

### Content headings

Use one scale for card titles and subsection headings:

- desktop: `clamp(1.45rem, 2vw + 1rem, 2.6rem)`;
- mobile: `clamp(1.45rem, 7vw, 2.45rem)`;
- line-height: approximately `0.98` to `1.05`.

### Section headings

Use one restrained scale for ordinary homepage section headings:

- desktop: `clamp(2rem, 4.1vw, 4rem)`;
- mobile: `clamp(1.8rem, 9vw, 2.75rem)`;
- line-height: `0.94` desktop and `0.98` mobile;
- maximum measure: `16ch`, except where an existing section intentionally requires a narrower measure.

### Exceptions

Keep separate scales for:

- homepage hero;
- project cover titles;
- large numerical metrics inside the Jestei results bento;
- deliberately oversized art-direction statements;
- small metadata, captions, chips, controls, and technical labels.

These exceptions must remain section-local and must not redefine general paragraph or heading rules.

## Italic and accent behavior

Italic is a visual accent, not a separate typographic level.

- The main and accent parts of a heading share the same `font-size`, `line-height`, weight, and wrapping context.
- Existing gray accent color is preserved.
- Italic remains only where the section already explicitly defines it, such as the Jestei logo heading.
- Do not automatically italicize all gray heading fragments.
- Do not reduce the size of italic text relative to the main heading.

## Implementation approach

Add one final homepage-only normalization layer loaded after section styles and before or inside the final publication-mode layer. The layer must:

1. target only `main[data-showcase]` and visible homepage typography roles;
2. use the existing global tokens instead of introducing unrelated scales;
3. normalize ordinary paragraphs, section headings, and content headings;
4. preserve section-local exceptions through explicit, narrow selectors;
5. avoid editing text or HTML structure;
6. avoid broad `!important` usage;
7. remove or neutralize only conflicting publication-mode typography overrides that duplicate the new system.

Do not refactor the large shared `showcase-layout.css` file in this task. The normalization layer should be isolated so parallel work on Jestei, Styx, and canvas sections remains safe.

## Verification

Check the homepage at widths:

- 1440;
- 1280;
- 1024;
- 768;
- 430;
- 390;
- 360;
- 320 CSS pixels.

At each width verify:

- ordinary paragraphs have the same computed size across Jestei and Styx sections;
- equivalent section headings have the same computed size;
- subsection and card titles follow one level below section headings;
- italic accent fragments remain the same size as the rest of their heading;
- hero, covers, metrics, captions, and controls retain their intended hierarchy;
- no heading clips, collides, or gains forced unwanted wrapping;
- no section geometry, media, canvas, or interaction behavior changes;
- no visible text changes.
