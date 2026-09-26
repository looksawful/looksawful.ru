# Portfolio UX/IA decision reconciliation — 2026-09-24

## Research question

Which Portfolio UX/IA decisions were already settled before Wayfinder issue #1143, which were later superseded by the approved 2026-09-21 UX/IA decision record, and which exact decisions remain genuinely unresolved?

This note is research only. It does not approve Featured membership, Archive membership, discovery/indexability, copy, Gallery membership, or next-Case routing.

## Source hierarchy used

1. Explicit owner decisions recorded in first-party project sources.
2. Approved repository product/design decision record.
3. Later canonical positioning/editorial sources.
4. Earlier confirmed IA/positioning sources.
5. GitHub issues and draft PR state only as implementation/question records, never as implicit approval.

Primary sources:
- Notion: `12 — Homepage Featured & Recommendations Layer`, last edited 2026-09-06.
- Notion: `94 — Production background / career arc`, last edited 2026-09-06.
- Notion: `97 — Professional Positioning: One Brand / Three Routes`, last edited 2026-09-07.
- Notion: `Иван Крушинский — финальные тексты для поиска работы · 18.09.2026`.
- Repository: `docs/superpowers/specs/2026-09-21-portfolio-ux-ia.md`.
- Repository: `docs/superpowers/plans/2026-09-21-portfolio-ux-ia-rollout.md`.
- GitHub: #262, #478, #1142–#1148.
- Repository glossary: `CONTEXT.md`.

## Chronology

### 2026-09-06 — confirmed homepage hierarchy and Archive policy

The Notion page `12 — Homepage Featured & Recommendations Layer` explicitly marks the structure as confirmed while copy/naming remained unconfirmed.

Confirmed direction:
- Hero first.
- Selected Work immediately after Hero.
- Three flagship directions/work examples.
- Then lower-level discovery entrances named provisionally `Leadership`, `Experiments`, and `Archive`.
- No Skills, tools list, or long Gallery between Hero and flagship work.
- Homepage remains a curated presentation layer rather than the full portfolio catalog.

The same source records the working flagship structure at that time:
- Jestei Pool as the main product/leadership case.
- Styx Jewel as brand / photography / visual-system proof.
- Creative Technology as a separate route for interactive web / tools / 3D / generative systems.

It also defines Archive conceptually:
- earlier editorial / production / publishing / fashion-photo work belongs in Archive;
- this material remains available as career breadth;
- it must not read as the current primary specialization.

Source:
- Notion `12 — Homepage Featured & Recommendations Layer`
  - https://app.notion.com/p/3d1dcccfcf4d81038987d6da64982c32

### 2026-09-06 — production background is retained as career history

The Notion page `94 — Production background / career arc` records the career arc:

`Editorial design → photography & production → brand systems → digital products → design leadership → creative technology & AI`

Its explicit constraint is not to hide or detach the production background from the current professional story.

Source:
- Notion `94 — Production background / career arc`
  - https://app.notion.com/p/3d3dcccfcf4d81d29b36c7a27e42a63e

### 2026-09-07 — Creative Technology becomes a specialization route, not a separate identity

The positioning contract `97 — Professional Positioning: One Brand / Three Routes` establishes one professional identity with three routes:

1. Product & Design Leadership.
2. Design Engineering & Creative Technology.
3. Visual, 3D & Generative Direction.

Important consequences:
- Leadership is a level of responsibility inside the first route, not a separate profession.
- AI is a capability across routes, not a separate profession.
- 3D is a craft lane, not the primary title.
- Creative Technology is the preferred framing for the technical practice rather than generic frontend development.

Source:
- Notion `97 — Professional Positioning: One Brand / Three Routes`
  - https://app.notion.com/p/3d3dcccfcf4d81be9205f30d2edbf5ec
- GitHub #478
  - https://github.com/looksawful/looksawful.ru/issues/478

### 2026-09-18 — current career positioning further reduces technical work as primary identity

The private master document `Иван Крушинский — финальные тексты для поиска работы · 18.09.2026` makes the current narrative more explicit:

- core: creative/design leadership plus senior product and graphic design;
- 3D, AI production and creative development extend the working range;
- frontend, AI and 3D must not become the primary identity;
- older editorial/publishing, Styx, Sensetique and production experience remain part of one continuous career history.

This does not remove Creative Technology. It changes its narrative role from a competing top-level identity into supporting breadth under the current leadership/senior-design positioning.

Source:
- Notion `Иван Крушинский — финальные тексты для поиска работы · 18.09.2026`
  - https://app.notion.com/p/3dfdcccf-cf4d-81459ca6c6b78bd1a47f

### 2026-09-21 — approved Portfolio UX/IA replaces the earlier structural vocabulary

The repository decision record is explicitly owner-approved on 2026-09-21.

It establishes the current canonical portfolio structure:

Homepage:
1. Hero.
2. neutral Project index.
3. exactly three Flagship Cases.
4. three to five Featured entities.

Flagship:
- Case-only.
- exactly three.
- current working set: Jestei Pool, Styx, Sensetique.

Featured:
- presentation priority status, not an entity type;
- may be Case, Project or Collection;
- 3–5 on the homepage.

Work Archive:
- deeper public layer outside Flagship and Featured;
- only manually approved public Cases, Collections and Projects;
- explicit and fail-closed;
- technical readiness does not publish a work.

Shootings:
- remains a Collection;
- may be Featured;
- cannot be Flagship.

Source:
- `docs/superpowers/specs/2026-09-21-portfolio-ux-ia.md`
- `docs/superpowers/plans/2026-09-21-portfolio-ux-ia-rollout.md`

## Reconciliation

### Decisions that are already settled and must not be re-grilled in #1143

1. **Homepage is curated, not exhaustive.**
   The full body of work belongs in deeper discovery surfaces, not one equal-priority homepage stream.

2. **Current leadership/senior-design positioning outranks technical breadth.**
   Creative Technology, 3D and AI strengthen the narrative; they do not replace it as the primary identity.

3. **Historical editorial / production / publishing / fashion-photo work remains part of the career story.**
   It is not to be deleted merely because it is older.

4. **Historical work is deliberately de-emphasized relative to current flagship work.**
   The older `Archive` intention and the newer `Work Archive` definition are semantically aligned on this point.

5. **Technical readiness never implies portfolio publication.**
   Membership and discovery/indexability require explicit owner approval.

6. **Creative Technology remains a valid specialization route/capability family.**
   It is no longer required to be a standalone Flagship entity.

### Earlier decisions superseded by the 2026-09-21 approved spec

1. **Creative Technology as the third flagship direction.**
   The earlier 2026-09-06 structure used three flagship directions, one of which was Creative Technology. The later approved model defines Flagship as Case-only and records the current working Case set as Jestei Pool, Styx, Sensetique.

   Therefore the earlier Creative Technology flagship-direction concept should not be treated as a fourth Case or as evidence that the 2026-09-21 Case set is wrong. Its surviving role is a specialization/discovery route and a source of potential Featured Projects.

2. **Leadership / Experiments / Archive as literal homepage section names.**
   The earlier source explicitly said these names or their final equivalents. The later approved vocabulary is Project index / Flagship / Featured / Work Archive.

   The semantic intentions survive; the literal section taxonomy does not.

3. **Archive visible as a homepage layer.**
   The approved 2026-09-21 model places Work Archive on `/work/` and explicitly says not to render Archive on the homepage. This is a later structural decision and takes precedence.

## What #1143 genuinely still needs to decide

The older decisions do **not** contain exact current membership lists for the newer model.

Therefore #1143 is still valid, but its scope should be narrowed to:

1. Exact 3–5 Featured entity IDs.
2. Exact Work Archive entity IDs.
3. Editorial order of Featured.
4. Archive ordering metadata where the canonical entity data does not provide a usable year.
5. Whether any currently available newer Project should remain direct-link-only rather than be Featured/Archive.

It should **not** ask again:
- whether Archive should exist;
- whether historical production/editorial work should be preserved;
- whether Creative Technology is important;
- whether the homepage should be curated;
- whether technical Projects automatically become public;
- whether technical breadth should replace the leadership/design positioning.

## Important gap exposed by the reconciliation

The 2026-09-06 Archive policy referred broadly to the earlier editorial / production / publishing / fashion-photo period.

The current #1143 draft candidate proposes only:
- Featured: Awful Cases, Moves Awful, AWFUL STUDIO, Awful 3D Mockups.
- Archive: Berry Agency — social content (2020).

That candidate is explicitly marked as non-approved in #1143.

It also does not by itself represent the broader historical Archive policy from 2026-09-06. This does **not** mean additional Archive entities should be invented or published. It means the owner decision should distinguish:

- historical career material that conceptually belongs to the Archive;
- portfolio entities that actually exist as canonical SitePages and are eligible for Work Archive membership now;
- historical evidence that should remain represented through Cases, Collections, CV, or future authored portfolio entities rather than being forced into the current Archive list.

## Domain-model conclusion

No glossary rewrite is required before #1143.

The current `CONTEXT.md` definitions of:
- Flagship Case,
- Featured,
- Work Archive,
- Work index,
- Project,
- Collection,

are compatible with the reconciled history.

The previous words `Leadership` and `Experiments` should be treated as earlier information-architecture labels / specialization routes, not resurrected as new domain entity types.

No ADR is warranted: this is a chronology and authority reconciliation, not a new hard-to-reverse architecture choice.

## Recommended next step

Resume `grill-with-docs` for #1143 from the narrowed frontier only:

- exact Featured membership and order;
- exact currently eligible Work Archive membership;
- treatment of older historical material that has no current standalone SitePage.

Do not restart portfolio discovery from first principles.
