# Storybook Token Visualizations Design

## Goal
Turn the existing `00 Foundations/Tokens` runtime CSS custom-property inventory into a useful visual design-system surface without creating a second token source.

## Source of truth
Storybook continues to read custom properties from the canonical site stylesheet graph through `document.styleSheets`/CSSOM. Raw declarations remain visible, while browser-computed values are read with `getComputedStyle(document.documentElement)` for alias resolution. No token values are copied into Storybook data files.

## Surfaces
`00 Foundations/Tokens` exposes Overview, Colors, Typography, Spacing, Radii, Shadows, Motion, Layout, and Inspector stories. Each category uses a visualization appropriate to the token type: swatches, type specimens, physical length bars, radius geometry, shadow surfaces, motion demonstrations, or readable resolved values. Inspector shows token name, raw declaration, and browser-resolved value.

## Presentation
Visualizations use a small Lab-only stylesheet colocated with the Foundations story. Cards are responsive and rely on canonical site tokens for their own foreground/background/border styling where available. Motion demonstrations honor `prefers-reduced-motion`.

## Safety and scope
The change is Lab/Storybook-only. It does not change site runtime behavior, `dev`, `prod`, CMS publication, production deploy, or canonical token values. Existing component stories remain untouched.

## Verification
A contract test ensures CSSOM remains the source, required visual stories exist, typed renderers remain present, and Inspector exposes raw/resolved values. The normal Lab Storybook build, design-system inventory, local-link checks, and Lab deployment remain the integration gates.
