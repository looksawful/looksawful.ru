# Lab hidden surfaces

This document describes the Lab-only view of portfolio content that is intentionally absent from current public discovery.

## Rule

Lab shows the current canonical state, not frozen historical markup.

- Current cases, projects, collections and media come from `src/data/**`.
- Current CV data comes from `src/data/cv.ts` / `src/content/cv.json`.
- Current component and template inventory stays in `/lab/system/` and `/lab/system/inventory.html`.
- Historical pages are rebuilt only when there is a useful current source of truth. `/lab/about/` is therefore CV-backed instead of restoring the retired About HTML.
- Homepage sections with real current data may be revealed in `/?lab-hidden=1` through the Lab shell.
- Placeholder-only sections remain hidden. Lab must not present unfinished placeholder content as a finished current surface.
- These routes and overrides must not be added to the public `SitePage` manifest, sitemap, production navigation or search discovery.

## Routes

- `/lab/all/` — canonical inventory of pages, cases, projects, collections, hidden CV data and media outside the public catalog.
- `/lab/?route=%2F%3Flab-hidden%3D1` — homepage with current hidden surfaces enabled by the Lab parent shell.
- `/lab/about/` — current reconstruction of the historical About surface from canonical CV data.
- `/work/awful-cases/` — current Awful Cases project page.
- `/work/moves-awful/` — current Moves Awful project page.
- `/work/berry-social-content-2020/` — current hidden/direct Berry project page.
- `/pets/awful-cases/` — current Awful Cases pet runtime.
- `/pets/berserk-timer/` — current Berserk Timer runtime.
- `/lab/system/` — Storybook design-system viewer.
- `/lab/system/inventory.html` — generated component/style/template inventory.

## Homepage currentization

`src/lab/reveal-hidden.ts` runs only from the Lab workbench and only for the homepage route carrying `lab-hidden=1`.

- `.experience` is rendered by the current `mountExperience()` component.
- `.expertise` is reconstructed from current `cvContent.skills` instead of exposing the obsolete hardcoded list from `index.html`.
- hidden project and portfolio sections are revealed only when they do not contain `.placeholder-surface`.

## Data inventory

`/lab/all/` deliberately avoids a parallel hand-maintained content registry. It reads the current canonical sources and renders:

- all `SitePage` definitions with public versus hidden/direct discovery status;
- all cases;
- all projects, including projects without public routes;
- all collections, including hidden collections;
- current media associated with projects and collection work areas;
- current hidden CV experience and skill sections;
- media items that are hidden from the public catalog or archived, with their current project/work-area/deliverable relationships.

The page is `noindex,nofollow,noarchive` and exists only in Lab build inputs.
