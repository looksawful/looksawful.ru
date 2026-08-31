# CMS for CV and Four Main Projects — Design

## Goal

Finish the existing Pages CMS implementation so the owner can safely edit CV content and the four main homepage projects — Jestei Pool, Styx, Sensetique and Shootings — through the hosted editor, verify changes on `dev`, and publish reviewed changes to `prod`.

The implementation extends the repository's current file-backed CMS architecture. It does not introduce a database, a new CMS product or a parallel content model.

## Observable outcome

The finished system provides one usable editorial path:

```text
Pages CMS on dev
  -> edit a configured CV or project field
  -> save a Git commit to dev
  -> run focused and automatic verification
  -> prepare a dev-to-prod pull request
  -> review and merge
  -> GitHub Pages deploys the production site
```

An edit is complete only when the CMS field changes the corresponding rendered output, protected architecture remains unchanged, repository verification passes, and the production publication path remains reviewable.

## Existing architecture retained

The repository already uses:

- Pages CMS configured by `.pages.yml`;
- `dev` as the editorial and integration branch;
- `prod` as the production branch;
- structured JSON under `src/content/` as CMS-owned authored data;
- strict TypeScript adapters under `src/data/`;
- typed renderers and templates for project pages;
- an HTML transformation step for the standalone CV document;
- GitHub Actions for dev verification, pull-request verification, publication preparation and GitHub Pages deployment.

This design finishes that architecture instead of replacing it.

## CMS scope

### Shared homepage project cards

`src/content/projects.json` remains the editorial source for exactly four fixed cards:

1. `jestei`;
2. `styx`;
3. `sensetique`;
4. `shootings`.

Pages CMS may edit:

- visibility on the homepage;
- visible title;
- short description;
- role;
- period;
- optional accessible link label;
- scoped WebP cover source;
- cover alt text;
- explicit source width and height.

Card IDs, routes and page ownership remain code-owned. Cover width and height remain explicit in CMS v1. Automatic dimension derivation is not part of this implementation because the closed project-cover metadata branch contains only an unimplemented failing contract test.

### Jestei Pool

`src/content/cases/jestei-pool.json` owns:

- role;
- period;
- lead;
- seven fixed section titles and paragraph lists;
- six fixed brand-system overlay texts.

The Jestei logo identities, route, media entries, section order, layouts, filter runtime, animation runtime and presentation settings remain code-owned.

### Styx

`src/content/cases/styx.json` owns:

- role;
- period;
- lead;
- five fixed section titles and paragraph lists;
- three fixed editorial credit titles.

The Styx logo identity, route, media entries, section order, reels, sliders, mockups, lightbox behavior and presentation settings remain code-owned.

### Sensetique

`src/content/cases/sensetique.json` owns:

- intro role, period and lead;
- fixed section titles and paragraph lists;
- fixed credit titles and credit lines;
- fixed editorial note text.

The Sensetique logo identity, route, media entries, section order, galleries, reels, PageFlip behavior, sliders, lightbox behavior and presentation settings remain code-owned.

### Shootings

`src/content/collections/shootings.json` owns the existing collection head, title, role, summary and lead.

Files under `src/content/shootings/` own the stable ID, title, date or period, and short description of each existing shooting record.

Record creation, deletion, renaming, routing, order, media identity, credits, layout and presentation remain code-owned in CMS v1.

### CV

`src/content/cv.json` remains the single structured editorial source for:

- profile copy;
- contacts;
- key statements and languages;
- skills and tools;
- education copy;
- exactly fifteen fixed experience records.

Each experience record exposes:

- readonly stable ID;
- visibility;
- company;
- context;
- period;
- role;
- optional description text where the existing card has a description slot;
- fixed-count case labels;
- fixed-count fact labels and fact texts;
- fixed-count external or portfolio link labels.

Experience hrefs, card classes, layout classes, targets, `rel` attributes, structural IDs and production removal behavior remain code-owned.

## CV rendering contract

The existing CV is authored as `public/cv/index.html` and transformed during dev/build operations. The CMS implementation must preserve this model.

The transformer must:

1. resolve every experience article by its single stable `experience-card--<id>` class;
2. require all fifteen known records exactly once;
3. replace only text in existing semantic slots;
4. escape CMS text before insertion;
5. preserve existing link hrefs and attributes;
6. preserve experience-card and layout classes;
7. preserve the existing element types, including `h3.experience-role`;
8. update case and link labels inside their existing `div` containers;
9. preserve `span.experience-value` wrappers for facts and cases;
10. keep the existing period emphasis form where the source card uses italic markup;
11. keep hidden cards in authored/dev HTML and physically remove them only in the production transformation;
12. fail closed on missing cards, duplicate cards, unexpected IDs, count drift or missing required markup.

The current CV feature branch is not mergeable as finished work even though Git reports it as structurally mergeable. Its CI currently fails because it targets `h4.experience-role` while production markup uses `h3`, treats experience `div` containers as `section` elements, and does not expose the new experience fields in `.pages.yml`.

## Validation boundaries

Every CMS-owned JSON source must pass through a strict adapter before it reaches a renderer or CV transformer.

Adapters must:

- reject unknown top-level and nested keys;
- reject missing required keys;
- reject whitespace-only required strings;
- validate fixed IDs and reject duplicates;
- restore code-owned ordering by stable ID;
- enforce fixed section, overlay, credit, note, record and experience counts;
- enforce existing CV per-card counts for cases, facts and link labels;
- reject non-empty CV descriptions for cards that have no description slot;
- preserve route, media, taxonomy and presentation ownership outside CMS data.

Pages CMS must expose the same editable fields as the adapters accept. A field accepted by the adapter but absent from `.pages.yml` is considered an incomplete feature.

## Error handling

CMS saves are commits to `dev`; they do not directly publish production.

Malformed content must fail verification with a specific error identifying the affected source and field. Verification must not silently drop content, rewrite routes, weaken fixed-count contracts or create placeholder media.

If a content save fails verification:

1. the change remains isolated on `dev`;
2. publication to `prod` is blocked operationally;
3. the failing content is corrected or reverted through Git;
4. verification is rerun before publication.

## Verification design

### Focused tests

The implementation must provide and pass focused tests for:

- Jestei role, period, lead, section and overlay edits reaching rendered data;
- Styx role, period, lead, section and credit edits reaching rendered data;
- legitimate Sensetique editorial edits reaching rendered data;
- Shootings overview and record edits reaching catalog and rendered copy;
- all four homepage card fields and scoped cover ownership;
- CV experience parsing, HTML escaping, fixed-count enforcement and architecture-field rejection;
- CV experience transformation while preserving hrefs, attributes, classes and wrappers;
- authored CV visibility and production-only removal;
- Pages CMS field exposure without route, href, class, layout or indexability controls.

### Broad verification

Before integration or publication, run the repository's available full contract:

```text
npm run verify
```

The verification result must include type checking, core tests, the production build, postbuild validation and browser smoke tests. GitHub Actions must independently pass on the final remote commit.

### CMS smoke test

After the code is integrated into `dev`, verify the hosted Pages CMS repository on the `dev` branch:

1. all five editor areas load: CV, Jestei Pool, Styx, Sensetique and Shootings;
2. the four homepage project-card records load;
3. fixed IDs are readonly;
4. create, rename and delete are unavailable for fixed records;
5. representative editable fields render without configuration errors;
6. `Проверить сайт` targets the current branch workflow;
7. `Подготовить публикацию` prepares, but never automatically merges, `dev -> prod`.

An authenticated owner session may be required for the final hosted-editor interaction. Automated repository tests remain mandatory and are not replaced by that UI check.

## Integration and publication

Implementation proceeds from the current `dev` head.

1. Integrate the already-green main Case editability change.
2. repair and complete the CV experience feature against the integrated state;
3. run focused and full local verification;
4. publish the implementation branch and require green pull-request checks;
5. integrate the verified result into `dev`;
6. require the automatic `Verify dev` and CodeQL runs to pass;
7. prepare a reviewable `dev -> prod` pull request;
8. inspect the final diff and required checks;
9. merge to `prod` under the user's explicit publication approval;
10. wait for GitHub Pages deployment and run the production smoke check.

No direct file copy into the Pages artifact and no direct production content write is allowed.

## Non-goals

This implementation does not:

- replace Pages CMS;
- introduce a content database or API;
- make routes, slugs, canonical URLs or indexability editable;
- expose renderer names or Vite inputs;
- expose CSS classes, layout settings or responsive behavior;
- expose GSAP, Three.js, canvas, PhotoSwipe, PageFlip or media-deck runtime settings;
- expose internal project media ordering or identity;
- expose the complete `public/media` tree;
- implement automatic project-cover dimensions;
- add or rewrite user-facing copy;
- redesign the website or CMS UI;
- add new projects, shooting records or CV experience records.

## Acceptance criteria

The task is complete only when all of the following are true:

- Pages CMS on `dev` exposes CV plus Jestei Pool, Styx, Sensetique and Shootings;
- the four homepage project cards remain editable with scoped WebP covers;
- Jestei and Styx role and period values come from their CMS sources;
- valid editorial changes to all four project areas reach their existing rendered output;
- all fifteen CV experience records expose their approved editorial fields;
- valid CV experience edits reach built HTML with escaped text;
- CV hrefs, classes, structure and production visibility behavior remain protected;
- invalid identities, fields, counts and structures fail closed;
- targeted tests pass;
- `npm run verify` passes on the integrated revision, or any environment-only limitation is explicitly identified and remote CI proves the full contract;
- pull-request and `dev` verification are green;
- the final `dev -> prod` diff is reviewed;
- production deployment completes and the CV plus four project routes pass a smoke check.
