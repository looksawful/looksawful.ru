# Unified UI primitives design

## Goal

Create one production-backed visual contract for buttons, icon controls, chips, badges and panels in looksawful.ru without replacing the current design system, importing a UI framework, or creating a second token architecture.

## Constraints

- Existing CSS tokens, theme variables, cascade layers and component ownership remain authoritative.
- No Tailwind, Material Web, CSS-in-JS, Sass, new reset or React runtime is added to the production site.
- No authored copy changes are part of this work.
- No monkey patching, selector aliases that hide ownership, or hardcoded brand colors in shared primitives.
- The first production slice must be reversible, incremental and usable by both `button` and `a` elements.
- Storybook/LAB documents the production contract; it does not own duplicate token values.
- Mobile-first intrinsic sizing, logical properties and focus-visible behavior are required.

## Evidence from existing code

### Current looksawful.ru

The site already has a strong foundation: `tokens.css`, `colors.css`, cascade layers, surface aliases, Storybook metadata and CSS ownership tests. The gap is above tokens: controls are currently styled independently in slider, media deck, lightbox, analytics consent, audio/game UI and specialized Jestei UI.

### SEA

SEA already proved a useful semantic vocabulary: primary/secondary/ghost/danger/tonal/quiet controls, sm/md/lg sizing, shared button/link classes, status badges, tag chips and surface levels. We reuse the vocabulary, not its Tailwind implementation.

### Awful Describer

Describer proved that a compact panel language works well: page/panel/tertiary/elevated surfaces, border/default/hover/active colors, consistent panel headers, toggles and icon controls. We reuse its hierarchy, not its application-specific dark palette.

### Sophisticate

Sophisticate reinforces the same small set of primitives: panel, strong panel, control base, primary/ghost/danger button, chip and active chip. It is evidence that the abstraction is shared across our own projects rather than invented for this task.

### Legacy React portfolio

The old React site had a deliberately tiny API: one Button that renders button/link/anchor plus Chip and Tag. Its implementation is too shallow to copy, but it supports keeping the new public surface small.

## External reference principles

Material is used only for semantic separation: buttons initiate actions; chips represent compact dynamic actions/selections/filters; passive metadata remains a badge rather than an interactive chip. Tailwind is used as a lesson in constrained composable primitives, not as a dependency. Backdraft reinforces code and tokens as the source of truth rather than a parallel design artifact.

## Architecture

### 1. Shared stylesheet

Create `src/styles/primitives.css` in the existing `components` cascade layer. It owns only shared visual primitives and their states.

Public classes:

- `.control`
- `.chip`
- `.badge`
- `.panel`

Variants are attributes instead of class explosions:

- `data-variant="primary|secondary|quiet|danger"`
- `data-size="sm|md|lg"`
- `data-shape="default|round"` where needed
- `data-level="plain|raised|elevated"` for panels

Interactive state uses native semantics first:

- `:hover` only behind hover-capable media conditions
- `:focus-visible`
- `:active`
- `:disabled` / `[aria-disabled="true"]`
- `[aria-pressed="true"]` for selectable controls/chips

No JavaScript state vocabulary is invented for styling when native HTML/ARIA already expresses it.

### 2. Semantic tokens

Keep global additions small. Add only long-lived semantic dimensions and motion aliases to `tokens.css` when an existing scale cannot express the contract cleanly. Color variants derive from `--clr-bg`, `--clr-text`, `--clr-text-muted`, `--clr-border`, `--clr-border-strong`, `--clr-accent` and `--clr-on-accent`.

Component-specific derived colors live as local custom properties inside `primitives.css`, preventing global token inflation.

### 3. Control behavior

`.control` works on `button` and `a` without element-specific layout rules. The minimum target size stays touch-safe. Icon-only controls use the same primitive plus `data-shape="round"` and an accessible label supplied by markup.

Primary is reserved for the dominant action. Secondary is bordered/neutral. Quiet is low-emphasis and transparent. Danger uses semantic destructive styling derived from the theme rather than a hardcoded red brand token unless the site later introduces a canonical feedback palette.

### 4. Chip and badge behavior

`.chip` is interactive or selectable and therefore appears on button/link semantics. Selection is expressed with `aria-pressed`.

`.badge` is passive metadata/status. It has no hover/press treatment and should normally render as span-like content.

This prevents the existing ambiguity where chip, tag and badge names describe shape rather than behavior.

### 5. Panels

`.panel` standardizes border, radius, surface and padding. Levels reuse current site surface semantics rather than Describer/Sophisticate colors.

Panels do not own internal typography or layout; organisms continue to own those concerns.

### 6. Storybook

Add canonical atom stories for Controls, Chips and Badges, and Panels. Stories use the real production stylesheet graph and declare source paths in `parameters.looksawful.sources`.

State coverage must include default, hover-capable documentation, focus-visible, active/pressed, selected and disabled where applicable, plus desktop/tablet/mobile review metadata.

### 7. Production adoption

Adopt primitives in narrow representative owners first:

1. analytics consent actions,
2. slider/media-deck/lightbox controls,
3. resource/action links where semantics match,
4. Jestei shared chip shapes only where doing so preserves its authored theme behavior.

Specialized organisms keep their names and behavior. The shared class is added to markup instead of replacing owner classes wholesale, allowing local geometry to remain component-owned.

## Non-goals

- No full site visual redesign.
- No wholesale migration of every historical selector in one pass.
- No deletion of specialized component CSS merely because a primitive exists.
- No framework migration.
- No new icon library.
- No copy changes.
- No new parallel token namespace.

## Verification seam

The public seam is the CSS class + attribute/ARIA contract and the canonical Storybook stories.

A focused contract test verifies:

- the shared stylesheet is imported once in the expected cascade layer,
- the four primitives exist,
- variants/states are expressed through the agreed attributes/native states,
- shared primitives consume canonical CSS variables rather than literal brand colors,
- canonical atom stories declare the production source.

Browser/layout proof remains an affected/manual check, not a new always-on CI burden.

## Acceptance criteria

- One shared production stylesheet defines control, chip, badge and panel primitives.
- Storybook exposes canonical production-backed atom stories for the system.
- At least three existing production owners adopt the shared primitives without losing their specialized geometry or behavior.
- Existing design-system inventory, focused tests, typecheck/build and LAB build pass.
- No Tailwind/Material dependency is added.
- No authored copy changes.
- Work lives on one feature branch based on fresh `dev`, outside C:, with commits pushed to GitHub.
