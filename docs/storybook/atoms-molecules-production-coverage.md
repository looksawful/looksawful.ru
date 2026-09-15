# Storybook Atoms + Molecules production coverage

Baseline: `storybook/atoms-coverage` at `6ba9e02635333297586a6842a11039fa0f344921`.

## Covered owners

Atoms remain complete for the high-confidence audited atom owner set:

- `src/templates/client-logo.ts` -> `01 Atoms/Client Logo`.
- `src/templates/responsive-image.ts` -> `01 Atoms/Responsive Image`.

This slice adds the remaining high-confidence isolated molecule owners from the audited inventory that were still missing on the baseline:

- `src/templates/media-figure.ts` -> `02 Molecules/Media Figure`, using `awfulCasesDemo` and the production renderer.
- `src/templates/mockup.ts` -> `02 Molecules/Mockup`, using `berryStoryMockups[0]` and the production renderer.
- `src/templates/subproject-card.ts` -> `02 Molecules/Subproject Card`, using `petProjectCards[0]` and the production renderer.
- `src/components/composition/resource-links.ts` -> `02 Molecules/Resource Links`, using `jesteiEditorialResources` and the production renderer.

Existing molecule coverage for Before After, Code Block, Project Card and Section Intro is preserved. No production markup, CSS or authored user copy is duplicated or rewritten by this slice.

## Inventory evidence

`npm run lab:inventory` after the new stories reports `96 sources, 13 stories, 0 structural errors`, with `covered 11, partial 4, missing 78` on this branch. Direct owner inspection through `collectDesignSystemInventory()` reports `covered` for all four owners added above.

`Section Intro` and shared `home-slots` can remain `composition-only` where the current Storybook metadata deliberately models embedded production composition rather than falsifying isolated ownership. They are not relabeled merely to inflate the inventory number.

## State and responsive policy

Stories expose only production-backed states. Media Figure preserves the real autoplay video policy from `awfulCasesDemo`; Mockup and Subproject Card expose their real default states; Resource Links uses the canonical renderer and its default reveal policy. No Storybook-only controls, fake disabled states or copied interaction markup are introduced.

All four stories declare canonical LAB review at desktop, tablet and mobile. Verification uses the LAB Storybook build plus the repository's Storybook metadata/inventory contracts and responsive browser pass.
