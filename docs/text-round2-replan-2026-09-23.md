# Round 2 text audit re-plan — 2026-09-23

## Review result

The current Round 2 specification is still valid, but the execution tickets no longer match the current `dev` site surface.

### 1. Route inventory drift

The earlier corpus research used the production manifest and found 13 enabled routes.

Current `dev` has 18 enabled routes. The five additional enabled routes are:

- `/work/berserk-timer/`
- `/work/awful-mockups/`
- `/work/awful-3d-mockups/`
- `/work/keys/`
- `/work/sea/`

These routes are enabled but absent from the current #1172 corpus ticket, so the previous ticket set cannot satisfy the Round 2 requirement that all enabled routes be audited.

Primary source: `src/site/pages/manifest.ts` on `dev`.

### 2. Oversized work packages

Two current tickets are materially larger than a fresh execution context:

- #1170 combines all Jestei narrative/editorial copy, captions, ordinary product UI, fact conflicts and Round 1 carry-forward on the largest case route.
- #1173 combines the full 160-fragment CV corpus, Privacy, all metadata and a site-wide fact-consistency pass.

For reliable parallel execution these need narrower vertical slices.

### 3. Metadata ownership overlaps

Metadata is currently mentioned in page-specific tickets and also owned by #1173. Round 2 requires a dedicated Metadata section, so human-readable metadata should have one canonical work package instead of being duplicated across page tickets.

### 4. Corpus source reality

Current source inspection confirms distinct editorial owners:

- Jestei canonical editorial copy: `src/content/cases/jestei-pool.json`
- CV editorial copy: `src/content/editorial/cv.json`
- Privacy: `public/privacy/index.html`
- Awful Cases: `src/data/content/awful-cases.ts` + editorial source
- Awful Studio: `src/data/content/awful-studio.ts`
- Moves Awful: `src/data/content/moves-awful.ts`
- Berry: `src/data/content/berry.ts` + editorial source
- Awful Mockups: `src/data/content/awful-mockups.ts`
- Awful 3D Mockups: `src/data/content/awful-3d-mockups.ts`
- KEYS: `src/data/content/keys.ts`
- SEA: `src/data/content/sea.ts`
- Berserk Timer: `public/work/berserk-timer/index.html`

The questionnaire contract already supports independent item rows and does not require these source families to be loaded in one monolithic commit.

## Revised execution shape

Keep #1169 and #1171 as-is except remove duplicated metadata ownership.

Split the remaining work into these independently verifiable slices:

1. Home + global UI + Gallery + 404
2. Jestei narrative/case sections
3. Jestei product/UI/filter/subscription/promo slice
4. Styx + Sensetique
5. Shootings + existing hidden project pages
6. Newly enabled hidden project routes
7. CV profile + skills + education
8. CV experience
9. Privacy
10. Metadata + site-wide fact consistency
11. Final integration/completion gate

Every corpus slice must emit exact current strings and exact proposed strings only. Good copy stays Keep + Custom. Factual conflicts stay separate fact cards.

## Review conclusion

The infrastructure phase is complete enough. The remaining critical path is now corpus authoring and owner review. No further platform redesign is justified before the text corpus is populated.
