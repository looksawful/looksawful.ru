# Implementation Plan: looksawful.ru text review Round 2 corpus

## Overview

Populate the private Round 2 questionnaire with the complete current text corpus from every enabled `dev` route, then run one completion gate before any public-site copy patch is prepared.

Tasks are tracked in GitHub Issues under parent #1166.

## Architecture decisions

- Exact current source text is the review unit. No synthesized "before" copy.
- One dedicated Metadata/fact work package owns cross-site human-readable metadata and consistency checks.
- Page/case tickets own visible copy, captions, credits and problematic accessibility strings.
- Product data values remain excluded from editorial rewriting.
- Round 1 decisions carry only on exact current-text match.
- No public copy is applied until #1174 passes.

## Task list

### Phase 1: main public surfaces
- #1169 Home + global UI + Gallery + 404
- #1170 Jestei narrative/case sections
- #1171 Styx + Sensetique
- #1172 Shootings + existing hidden project pages

### Phase 2: heavy/new surfaces
- #1180 Jestei product/UI/filter/subscription/promo
- #1181 newly enabled hidden routes
- #1173 CV profile + skills + education
- #1182 CV experience
- #1183 Privacy

### Phase 3: cross-site validation
- #1184 Metadata + site-wide fact consistency

### Final gate
- #1174 complete questionnaire integration and review-state verification

## Checkpoints

### [35%] Corpus topology
- all 18 enabled routes have exactly one corpus owner;
- no metadata ownership overlap remains;
- each work package fits one fresh execution context.

### [75%] Questionnaire populated
- every owned page has exact current strings in Round 2;
- fact cards exist for unresolved factual conflicts;
- Round 1 exact-match inheritance has been applied only where valid.

### [100%] Completion gate
- questionnaire progress/grouping is correct;
- every item is resolved or explicitly fact-blocked;
- no excluded image/video/historical screenshot text leaked into the corpus;
- approved-manifest generation is possible;
- public copy remains untouched.

## Risks

- `dev` route inventory may continue changing during review. #1174 must reconcile against the current enabled manifest before completion.
- Source and production may disagree. Mismatches are review evidence, not an excuse to silently choose one.
- Large pages such as Jestei and CV can create low-quality proposals if audited as one giant agent task; hence the split above.
