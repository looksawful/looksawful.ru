# Global Site Navigation Design

## Goal

Add a simple, fully functional, scalable global navigation to the static MPA without changing project content or the existing internal project navigator.

## Visible model

The global navigation is the same interaction model on mobile, tablet, and desktop:

- `looksawful` brand link to `/`.
- Compact breadcrumb context in the header.
- One hamburger button on every viewport.
- A clean full-viewport menu surface using the existing page background, typography, spacing, and color tokens.
- No cards, drawer chrome, shadows, blur, rounded panels, or decorative containers.

The first production menu contains exactly:

1. Главная → `/`
2. Jestei Pool → `/work/jestei-pool/`
3. Styx → `/work/styx/`
4. Sensetique → `/work/sensetique/`
5. Shootings → `/shootings/`
6. Резюме → `/cv/`

There is no `Work` menu item. Direct-link-only Project routes (`Awful Cases`, `Moves Awful`, `Berry`) do not appear in the menu.

## Breadcrumbs

Breadcrumbs are deliberately shallow and contextual rather than a second navigation tree.

- Home: no redundant breadcrumb trail.
- Public case/collection: `Главная / Current page`.
- Direct-link Project pages: `Главная / Current page`.
- 404: `Главная / 404`.

The first breadcrumb is a real link. The current item is plain text with `aria-current="page"` semantics where appropriate. Breadcrumb labels come from the same navigation/page metadata used by the menu rather than being duplicated in templates.

## Data model

The page manifest remains the source of canonical paths and route identity. Add a small navigation model that references page IDs and derives hrefs from `sitePages`. `/cv/` remains outside the Vite page manifest because it is still owned by `public/cv/`; it is represented as one explicit static navigation item only.

Public menu membership is explicit. It must not be inferred from every `discovery.listed` route because future listed pages may belong to other navigation groups.

## Rendering

`renderSiteNavigation(page)` renders:

- sticky header shell;
- brand;
- breadcrumb nav when useful;
- hamburger `<button>` with `aria-expanded`, `aria-controls`, and accessible label;
- menu container with the six primary destinations;
- `aria-current="page"` on the active menu destination.

The same markup is used at every viewport. CSS controls only layout and sizing.

## Runtime behavior

A focused TypeScript component manages the menu state:

- hamburger toggles open/closed;
- `Escape` closes;
- menu link activation closes;
- focus returns to the trigger when closing via Escape;
- body scroll is locked only while open and restored on destroy;
- lifecycle cleanup works with the existing non-persisted `pagehide` cleanup model;
- no viewport-size calculations or duplicate breakpoint logic in JavaScript.

Without JavaScript, the header and canonical links remain valid; the menu enhancement requires JS to toggle visibility.

## CSS

Use existing tokens: `--page-padding-inline`, `--fs-*`, `--fw-*`, `--clr-*`, `--border-width-*`, and logical properties. Keep the component in its own stylesheet imported into `src/styles/index.css`.

Design constraints:

- white/current page surface;
- thin existing border token;
- minimal 44px trigger hit target;
- small header typography;
- large but restrained menu typography with fluid `clamp()`;
- no device-specific alternate component;
- reduced-motion support;
- focus-visible states;
- no horizontal overflow at 390px or wider.

## Relationship to existing project navigation

The new component is site-level navigation between documents. Existing `.project-nav` remains the document-level navigator for long content and is not merged with the hamburger menu.

## Prototype

A standalone visual prototype shows mobile (390px), tablet (900px), and desktop (1440px) states without project content. Production implementation follows the same geometry and interaction model but consumes the real manifest and shared tokens.

## Verification

Required before merge:

- unit/contract tests for menu membership, labels, hrefs, breadcrumbs, active state, and accessible markup;
- runtime test for toggle/Escape/focus/scroll-lock cleanup;
- MPA smoke exercises hamburger navigation at mobile and desktop widths;
- all existing `npm run verify` checks green;
- PR mergeable against `prod`;
- production Pages deployment green;
- live checks for `/`, four public work routes, and `/cv/` after deploy.
