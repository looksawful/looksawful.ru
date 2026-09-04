# UI Kit / Token / Component Traceability

Status: **DOCUMENTATION BASELINE COMPLETE / POST-REFACTOR RECONCILIATION REQUIRED BEFORE FIGMA PUBLICATION**

Notion canonical pages:
- `01 — Foundations & Tokens`
- `04 — Content Blocks`
- `05A — Shared Composition Components`
- `05B — Shared Runtime Contracts`
- `06 — Component Registry`
- `07 — Component Contracts`
- `08 — Responsive & Interaction Contracts`
- `09 — Screens / Screenshot Evidence Registry`
- `11 — UI Kit Specification`
- `11A — Component → CSS → Token → UI Kit Traceability`
- `11B — UI Kit Readiness & Publication Matrix`
- `12 — Figma Design System Build Contract`

## Purpose

This spec makes the future UI Kit derivable from executable production contracts rather than reconstructed from screenshots or aesthetic guesses.

Required traceability:

```text
Production CSS / TS / runtime
  -> Notion component contract
    -> CSS owner + selector family
      -> global tokens + component-local values + specialized values
        -> responsive / input / motion contract
          -> screenshot evidence
            -> publication classification
              -> Figma UI Kit
```

## Evidence baseline

The initial direct selector/token audit is version-bound to:

`3140c01f001385e2a3e445a5622c08a5c63b1d79`

Audited CSS sources include:

- `src/styles/tokens.css`
- `src/styles/colors.css`
- `src/styles/base.css`
- `src/styles/patterns.css`
- `src/styles/components.css`
- `src/styles/captions.css`
- `src/styles/motion.css`

This SHA is a documentation evidence baseline only. It is **not** the implementation base for the approved PageContent refactor. Implementation still starts from final `PRE_APPLY_READY_SHA`.

Before Figma publication, repeat selector/token reconciliation against the final post-refactor candidate SHA.

## Styling value classes

Every styling value belongs to exactly one conceptual class:

1. **Global Foundation**
   - reusable site-wide design decision;
   - eligible for global Figma Variables/Styles.

2. **Semantic Alias**
   - reusable meaning layered on a global value, such as caption/media/section spacing or semantic color roles;
   - eligible for named Figma Variables when the meaning remains stable across consumers.

3. **Pattern Configuration**
   - local custom properties configuring shared mechanics such as Wrapper, Cluster, Grid, Editorial Grid, Pile, Reel;
   - maps to Auto Layout/layout configuration as needed;
   - is not automatically a public token.

4. **Component Local**
   - geometry or visual configuration owned by one component family, such as media ratio/fit, mockup shell internals, card geometry, group columns, Before/After split/handle values;
   - may map to Figma component properties/local variables;
   - must not pollute the global Variables collection.

5. **Specialized Local**
   - project/art-direction-specific values for Jestei, Moves, Awful Cases, specialized canvas/game/browser surfaces, etc.;
   - remains in a specialized namespace.

6. **Implementation Only / Legacy Escape Hatch**
   - raw class hooks, unrestricted strings, JS lifecycle values, utilities and historical hacks;
   - never becomes canonical UI Kit API without explicit normalization.

## Global foundation vocabulary

Current global foundations include:

- font families `--ff-primary`, `--ff-mono`;
- weights `--fw-300...900`;
- fluid font sizes `--fs-200...900`;
- line heights `--lh-*`;
- letter spacing `--ls-*`;
- fluid size scale `--size-100...800`;
- semantic spacing aliases `--space-caption`, `--space-media`, `--space-group`, `--space-section`, `--space-chapter`;
- content widths and page padding;
- semantic color roles from `colors.css`;
- radii, border widths, elevated-surface shadow;
- motion speed primitives/aliases currently proven in production.

Fluid CSS formulas remain canonical. Values sampled at Figma frame widths are examples, not replacement fixed tokens.

## CSS ownership

- `tokens.css`: global primitive/semantic reusable values.
- `colors.css`: semantic palette roles/themes.
- `base.css`: global element defaults, focus and selection foundations.
- `patterns.css`: reusable layout mechanics, not automatic UI components.
- `components.css`: component visual ownership and local presentation APIs.
- `captions.css`: Media Caption state/layout ownership.
- `motion.css`: shared motion/reduced-motion policy.
- `utilities.css`: implementation helpers only.

## Publication classes

Every documented visual/runtime entity must be classified as one of:

- `GENERIC READY`
- `SPECIALIZED`
- `FOUNDATION / PRIMITIVE`
- `RUNTIME ONLY`
- `POST-REFACTOR VERIFY`

`GENERIC READY` means the design-system definition is complete enough for future Figma construction after final implementation-SHA reconciliation. It does not mean a Figma component has already been published.

`POST-REFACTOR VERIFY` means the remaining gate is exact ownership/version reconciliation, not missing architecture.

## Generic families

Current generic-ready or target-generic families include:

- Hero (home-only organism)
- Site Navigation
- Project Navigator
- Entity Intro
- Portfolio Entity Card
- Project Teaser (after Subproject migration)
- Section Intro / Section Copy
- Media Caption
- Credits
- Group Note (pending semantic-kind confirmation)
- Media Surface
- Resource Links
- Home Expertise / Experience / Tools as appropriate home-only organisms
- Contact / Footer
- Code Block
- Media Lightbox
- Media Figure
- Media Group
- Media Slider
- Mockup
- Mockup Deck

Primitive/delivery helpers such as Client Logo and Responsive Image are not forced into organism-level components.

## Specialized families

Remain separate unless a later abstraction lifecycle proves a generic contract:

- Justified Gallery
- Before / After
- Page Flip
- Animated Canvas Gallery
- Jestei Theme Organism
- Berserk Audio Player
- Awful Cases Game
- Jestei filter presentation/runtime
- Moves/browser/canvas art-direction compositions

Project-specific palettes and geometry do not become global Variables merely because they can be represented in Figma.

## Runtime-only services

Do not publish standalone Figma components for:

- Motion Preference
- Infinite Reel runtime
- Media Deck runtime
- Media Caption Numbering
- Lightbox runtime adapters

Their observable states are documented/presented on owning visual components.

## Responsive and interaction rule

There is no global mobile/tablet/desktop breakpoint token scale to invent.

Container queries, intrinsic layout, viewport thresholds, pointer capability, orientation and reduced-motion behavior belong to the relevant component contracts. Figma frame widths are checkpoints only.

## Screenshot evidence rule

A screenshot is valid design-system evidence only when it records:

- component/entity;
- variant/state;
- route/consumer;
- viewport and relevant container width;
- pointer/input mode when relevant;
- reduced-motion state when relevant;
- implementation SHA;
- relevant global token/component-local value when visually material;
- what the screenshot proves.

## Future Figma build package

A Figma UI Kit build must consume:

1. Foundations & Tokens;
2. Component Registry;
3. detailed Content Block contracts;
4. Shared Composition contracts;
5. Shared Runtime contracts;
6. component/CSS/token traceability (`11A`);
7. publication readiness (`11B`);
8. Responsive & Interaction contracts;
9. Screenshot Evidence Registry;
10. page/shell evidence and canonical architecture.

## Figma component metadata

Each published Figma component must record:

- Notion contract;
- hierarchy/status;
- CSS owner/selectors;
- TypeScript/render owner;
- global tokens consumed;
- component-local values;
- specialized values if applicable;
- variants/states;
- responsive/input/motion behavior;
- accessibility notes;
- screenshot evidence;
- known consumers;
- source SHA.

## Change synchronization

Any work package that changes component CSS, token ownership, responsive behavior or visual anatomy must report and update:

```text
AFFECTED COMPONENT CONTRACTS
CSS SELECTOR OWNERS CHANGED
GLOBAL TOKENS ADDED / REMOVED / REMAPPED
COMPONENT-LOCAL VALUES CHANGED
SPECIALIZED VALUES CHANGED
TRACEABILITY MATRIX UPDATED
READINESS STATUS BEFORE -> AFTER
SCREENSHOT EVIDENCE UPDATED
FIGMA/UI KIT IMPACT
```

## Documentation Definition of Done

This layer is documentation-complete when:

1. every visual entity has a detailed contract or explicit primitive/runtime classification;
2. every entity has CSS/token ownership mapping;
3. generic and specialized namespaces are explicit;
4. runtime services are not misclassified as visual components;
5. responsive/input/motion rules are linked;
6. screenshot evidence slots exist or are explicitly not applicable;
7. publication readiness is recorded;
8. future changes are required to reconcile the matrices.

The current package satisfies this definition for the audited documentation baseline. Final Figma publication intentionally waits for the post-refactor implementation SHA and filled visual evidence slots.