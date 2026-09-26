# Portfolio UX / IA decision record

Status: approved by owner on 2026-09-21.

This document records the agreed portfolio information architecture and UX model. It is a product/design decision record, not an implementation plan.

## Primary goal

The portfolio's primary job is to support hiring Ivan Krushinsky as an art/design director. Commissioning project work is secondary.

## Homepage

Order:

1. Hero.
2. Project index.
3. Three Flagship Cases.
4. Three to five Featured entities.

The Project index is a neutral navigation map, not a second ranking layer. The current compact index pattern should be preserved where possible rather than redesigned for its own sake.

## Portfolio entity model

### Case

A substantial body of work with its own identity, narrative and media.

Every Case starts with a compact Case summary:

- Role.
- Task.
- Contribution.
- Result.

After the summary, the body is authored freely. There is no single visual template for all Cases.

Result statements must be demonstrable. If no metric exists, use concrete qualitative outcomes such as launched, created, implemented, published, or system established. Do not invent impact.

### Project

A smaller standalone portfolio work that does not require a full Case narrative.

Project intro:

- What it is.
- Author role.
- Result or intended purpose.

A Project can be Featured without being reclassified as a Case.

### Collection

A grouped portfolio surface containing related works. Shootings is a Collection.

Collection intro:

- Author role.
- Relevant period.
- What the Collection contains.

Collection entries remain Collection entries. They do not graduate into Cases.

## Portfolio priority

### Flagship

- Exactly three at a time.
- Flagship status is available only to Cases.
- Selection is based on the combination of evidence that best supports the target art/design-director positioning, not simply visual quality or recency.
- Current working set: Jestei Pool, Styx, Sensetique.
- The set may change when a stronger Case replaces one of them.

### Featured

Featured is a priority status, not an entity type.

It can apply to:

- Case.
- Project.
- Collection.

Keep three to five Featured entities visible on the homepage. Order them editorially for contrast and visual rhythm.

### Work Archive

The deeper public portfolio layer outside the main Flagship and Featured selection.

It may include manually approved public:

- Cases.
- Collections.
- Standalone Projects.

It must not expose raw Media Catalog inventory.

Archive content is sorted by year, newest first. Public Archive entities are indexable by search engines.

## /work/

Create a canonical `/work/` Work index.

It is an index, not a duplicate of the homepage.

Structure:

- Compact Project index covering the main selection.
- Closed Archive accordion below it.

The Archive accordion:

- Uses smaller, quieter cards with previews.
- Is closed by default.
- Remembers its open/closed state within the current tab/session.
- Does not persist that state indefinitely.

Only manually approved entities become public Archive entries. Technical readiness, `enabled` state, or an existing route does not automatically publish a work.

## Project index

The Project index can contain Case, Project and Collection destinations.

It is intentionally neutral. It should not visually reproduce the Flagship/Featured hierarchy.

Collection destinations get a small `Collection` type label. Case and Project do not need type labels.

## Shootings

Shootings remains a Collection and appears in the same Project index as the other portfolio destinations.

It can be Featured, but it cannot be Flagship because Flagship is Case-only.

Individual shootings remain Collection entries and do not become Cases.

## Gallery

Gallery is a curated visual showcase, not an archive.

Target selection:

- Roughly 20 to 30 works.
- Prioritize quality while preserving range across disciplines.
- Allow standalone works and very short series.
- Series should generally be limited to up to three selected frames.
- Gallery may reuse selected images from Cases, but must not duplicate the Work index or Case structure.

Presentation:

- Visible `Gallery` h1.
- Minimal continuous visual presentation with explicit but quiet series grouping.
- Captions stay minimal in the grid and appear on hover/focus or in the lightbox.
- Lightbox shows work/series context together with the counter.

## Navigation

Desktop primary navigation:

- work
- gallery
- cv

The site identity/AwfulFace provides the home action.

The current direct primary-navigation links to Jestei, Styx, Sensetique and Shootings move under `work` as second-level shortcuts.

The `work` submenu contains:

- Three current Flagship Cases.
- Shootings.

Mobile keeps the compact AwfulFace/menu model. The menu exposes:

- work
- gallery
- cv

Within work, provide the same fast links to the three Flagship Cases plus Shootings.

## Case-to-case navigation

The next destination at the bottom of a Case is chosen manually for semantic or visual contrast. It is not derived from array order, year, or entity type.

## Existing homepage patterns

Preserve and reuse the existing strong patterns where appropriate:

- Compact Project index / project-card grid.
- Individual larger Case presentation sections.
- Existing small-card treatment for lower-priority projects where suitable.

The goal is to remap these patterns onto the agreed information architecture, not to rewrite working components without reason.
