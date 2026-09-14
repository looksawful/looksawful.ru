# Project component system audit implementation plan

Issue: #861

## Goal

Make the project-page UI system inspectable and enforceable across production code, Storybook/Lab, CMS, media catalog, tests, documentation and release gating. A production component must not be able to exist only as opaque page markup or specialized runtime.

## Source-of-truth boundaries

- `prod` owns canonical contracts, renderers, page content, public/gated route state and media IDs.
- `lab` owns approval surfaces and experimental prototypes, but production-backed Storybook stories must render production contracts/data/CSS rather than copied markup.
- `.pages.yml` exposes authored editorial/configuration surfaces that are safe to edit. Release-gating stays in typed production code.
- `src/data/media` / `src/content/media-*` own canonical media identities and usages. Project/card media must resolve by catalog identity rather than ad-hoc file paths when a catalog entry exists.
- GitHub issue #861 tracks parity and intentional exceptions.

## Phase 1 — Hidden-content regression

1. Change the Berserk page contract test to require the canonical visible project intro.
2. Observe RED on current `showIntro: false` / hidden-H1 behavior.
3. Remove the Berserk-only `showIntro: false` presentation override.
4. Remove the duplicate `h1.visually-hidden` from the specialized showcase.
5. Keep deck/audio/caption-numbering regression assertions intact.

## Phase 2 — Canonical component-surface registry

Create `src/devtools/project-component-surfaces.ts` describing user-facing project surfaces:

- all `CONTENT_BLOCK_TYPES`;
- all specialized section kinds;
- section/composition primitives used by entity pages;
- main project cards and pet-project cards;
- status (`production`, `gated`, `experimental`);
- Storybook surface ID;
- CMS ownership (`editorial`, `structural`, `none`);
- media ownership (`catalog`, `none`);
- interaction/browser-QA requirement.

Add a Fast CI contract that fails when:

- a canonical content-block or specialized-section kind has no surface entry;
- a production surface lacks a Storybook ID;
- a media-bearing production surface does not declare catalog ownership;
- an interactive specialized surface has no browser-QA requirement.

## Phase 3 — CMS/card integration

- Keep pet-project state/href release gating typed in code.
- Move safe authored pet-project card copy to `src/content/editorial/pet-project-cards.json`.
- Parse and validate that editorial source in `src/data/pet-project-cards.ts`.
- Add a Pages CMS file editor for that copy.
- Keep card covers bound by canonical `coverEntryId` so Media Desk/catalog remains the media source.
- Add a Fast CI CMS/card contract.

## Phase 4 — Storybook parity on Lab branch

Work from `audit/storybook-component-parity` based on `lab`, never by merging the full divergent branches.

- Sync only the production files required for current component contracts, beginning with Berserk specialized section/renderer and its shared runtime dependencies.
- Add production-backed Storybook surfaces for every canonical content block and specialized section.
- Add composition/card stories for entity intro, section intro, resources, main project card and pet-project card families.
- Prefer fixtures extracted from canonical PageContent/media IDs over invented duplicate markup.
- Add a Lab parity check that compares the expected surface IDs with Storybook source exports/inventory.
- Keep Lab-only experimental model-viewer stories under `90 Experimental` and outside the production parity count.

## Phase 5 — visibility and browser audit

Audit enabled entity pages/cards for:

- `showIntro: false`;
- `hidden`;
- visually hidden authored headings/content;
- `visible: false` card records;
- `aria-hidden` on meaningful content;
- specialized controls with implementation/debug labels;
- interactive components missing browser smoke coverage.

Classify intentional accessibility/release states separately from regressions. AWFUL STUDIO remains gated until explicit release approval.

## Verification

Production branch candidate must pass:

- typecheck;
- Fast CI;
- CMS check;
- production build;
- exact-SHA PR Preview and remote browser QA.

Lab branch candidate must pass:

- typecheck;
- Fast tests relevant to shared contracts;
- `cms:check`;
- Storybook build;
- design-system inventory/link checks;
- Lab Preview browser verification.

No production merge is implied by Storybook/Lab coverage.