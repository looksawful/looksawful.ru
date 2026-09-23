# Research: unresolved problems in looksawful.ru

Date: 2026-09-23  
Repository: `looksawful/looksawful.ru`  
Baseline: current `dev`

## Executive correction

The earlier conclusion that the repository had only a small amount of actionable debt was wrong because it sampled only `ponytail:` markers, a few recent hot spots and a narrow architecture slice. That is not a valid proxy for the repository's unresolved problem set.

GitHub's issue search currently reports **208 open issues** and **42 open pull requests** for this repository. That does not mean all 208 issues are equally current or equally valuable, but it proves that the unresolved-work surface is broad and materially larger than the earlier analysis.

Primary sources:

- Open issues query: https://api.github.com/search/issues?q=repo%3Alooksawful%2Flooksawful.ru+is%3Aissue+is%3Aopen
- Open PR query: https://api.github.com/search/issues?q=repo%3Alooksawful%2Flooksawful.ru+is%3Apr+is%3Aopen
- Repository roadmap: https://github.com/looksawful/looksawful.ru/issues/223

## What the previous pass missed

### 1. Unfinished page/template architecture migration

The architecture migration umbrella is explicitly still open. Issue #256 says that #251, #252, #253 and #320 remain unfinished:

- homepage still has hybrid marker/regex composition to retire;
- `src/components/*` is not yet the complete implementation authority;
- section assembly/presentation ownership still needs consolidation;
- unfinished authored content must be removed from public rendering/build while remaining recoverable in source.

Source: https://github.com/looksawful/looksawful.ru/issues/256

Current-tree evidence also shows legacy compatibility paths still exist:

- `src/content/pages/legacy-frame.ts`: https://github.com/looksawful/looksawful.ru/blob/dev/src/content/pages/legacy-frame.ts
- Jestei canonical Case composition is documented as "deliberately not registered yet" while the legacy page remains the runtime source: https://github.com/looksawful/looksawful.ru/blob/dev/src/content/pages/cases/jestei-pool.ts
- deprecated legacy media entry files still exist, for example: https://github.com/looksawful/looksawful.ru/blob/dev/src/data/media/entries/pets.ts

This is real architecture debt, not a hypothetical cleanup opportunity.

### 2. Content/media ownership governance is reopened

Issue #249 was completed once and then explicitly reopened because later audits found operational/governance drift. Its active reconciliation owners are #451, #452 and #453:

- authoring → integration → release branch/worktree contract;
- read-only-by-default desk / guarded write boundary;
- schema-authorized, optimistic-concurrency, atomic persistence.

Source: https://github.com/looksawful/looksawful.ru/issues/249

The repository roadmap #223 repeats that this is a current priority and states that Media Desk must remain an operator surface over canonical Git-backed ownership rather than becoming a second source of truth.

Source: https://github.com/looksawful/looksawful.ru/issues/223

### 3. Media Desk itself is not finished

The remote/unified Media Desk umbrella remains open and still requires a single network-accessible private media control surface, complete usage graph, cover/gallery/poster assignments, upload/replace/delete safety, UI integration, permanent tests and remote browser verification.

Source: https://github.com/looksawful/looksawful.ru/issues/808

Current code has an explicit unsupported branch:

`Media assignment target is not authorable yet`

Source: https://github.com/looksawful/looksawful.ru/blob/dev/tools/cloudflare/media-desk/worker.mjs

That is direct evidence of incomplete authoring capability.

### 4. Private visual review is a large unfinished program

The private visual review program is still open under #1087. The open work includes the thin slice, approval/lifecycle/Baseline semantics, automatic routing, deterministic runtime matrix, public-surface sanitization, repository privacy audit, Awful Mockups migration and final verification.

Primary umbrella:
https://github.com/looksawful/looksawful.ru/issues/1087

Open child work:
- #1089 Private Review Hub thin slice
- #1090 Exact Review approval, lifecycle and Baseline
- #1091 Automatic visual-impact and Review Target routing
- #1092 Deterministic visual runtime matrix
- #1093 Sanitize historical public review surfaces
- #1094 Repository privacy audit and rewrite decision
- #1095 Migrate Awful Mockups to private visual review
- #1096 Final private-review migration verification

These are not cosmetic backlog items. They include privacy, correctness, deterministic evidence and release-governance concerns.

### 5. Text review Round 2 is unfinished by design

The current editorial program #1166 is also a multi-ticket incomplete program:

- #1167 Round 2 contract + Home thin slice
- #1168 Mobile swipe review
- #1169 Home + global UI + Gallery + 404 corpus
- #1170 Jestei Pool full text corpus
- #1171 Styx + Sensetique full text corpus
- #1172 Shootings + hidden project pages corpus
- #1173 CV + Privacy + Metadata + site-wide fact pass
- #1174 integration + completion gate

Source: https://github.com/looksawful/looksawful.ru/issues/1166

This program exists precisely because Round 1 was not a canonical exact-copy audit.

### 6. There are confirmed editorial/data defects, not merely future enhancements

Issue #615 contains already-confirmed defects that remain open, including:

- wrong Jestei metric wording in CV;
- a suspicious/incorrect Sensetique 2027 year;
- Sensetique spelling and broken credits;
- Berry period conflict;
- Mad Cow Films wrong year;
- LI-NE incomplete period;
- Russian titles in Styx English localization.

Source: https://github.com/looksawful/looksawful.ru/issues/615

Spelling-quality work also remains explicitly open:

- CV CSpell classification/cleanup, with 82 findings recorded in the issue: https://github.com/looksawful/looksawful.ru/issues/533
- public Jestei docs CSpell classification/cleanup, with 150 findings recorded in the issue: https://github.com/looksawful/looksawful.ru/issues/534

These are concrete content/data correctness problems and should have been included in any "what is unresolved?" analysis.

### 7. Portfolio UX/IA still has unresolved product decisions

The Wayfinder map #1142 is open and has six active decision tickets:

- #1143 Featured and Archive membership
- #1144 Flagship executive summaries
- #1145 manual next-Case routing
- #1146 Gallery curation and series
- #1147 public discovery for selected Work projects
- #1148 missing Featured intro copy

Source: https://github.com/looksawful/looksawful.ru/issues/1142

This is decision debt, not implementation debt, but it blocks downstream implementation and publication.

### 8. Gallery phase 2 remains unfinished

The Gallery umbrella #1105 still has open child work:

- #1108 typed multi-format curation/rendering contract
- #1109 approved 2D/production/video/character media curation and ingest
- #1110 validated 3D library consumption
- #1111 interaction/accessibility/release gate

Source: https://github.com/looksawful/looksawful.ru/issues/1105

### 9. Design-system primitive rollout remains unfinished

The production primitive program #1106 still has seven open child issues:

- #1112 semantic inventory
- #1113 Button
- #1114 Badge/Chip/Tag/Pill family
- #1115 Tabs
- #1116 Divider
- #1117 Tooltip
- #1118 migration/reconciliation

Source: https://github.com/looksawful/looksawful.ru/issues/1106

This means the repository still has known duplicated or non-canonical UI semantics and usage migration work.

### 10. Storybook/Lab/system parity gaps remain broad

Issue #861 documents a systemic mismatch between production surfaces and Lab/Storybook coverage, including incomplete production-surface evidence and historical Lab divergence.

Source: https://github.com/looksawful/looksawful.ru/issues/861

Open follow-ups include, among others:

- #880 orphan Subproject Card classification
- #889 Berserk Audio Player production-renderer extraction
- #894 Animated Canvas Gallery/Moves coverage
- #895 Jestei 3D theme organism coverage
- #896 Project Navigation lifecycle coverage
- #897 Analytics Consent UI coverage
- #898 Jestei Track Filter coverage
- #899 CV Experience/Expertise coverage
- #900 remaining canonical composition templates
- #902 Awful Cases game renderer/runtime boundary

This is verification/representation debt and is directly relevant to safe agent-driven work.

### 11. AI pet / Contact Hub program remains substantial

The AI pet parent #709 still has eight open child tickets:

- #710 pet + AI-mode UX
- #711 typed sprite runtime and accessible launcher
- #712 deterministic AI mode inside Contact Hub
- #713 public knowledge base/provenance/templates
- #714 public Yandex assistant gateway/retrieval/budgets
- #715 draft-first writer flows
- #716 local runner mini-game + release quality gates
- #718 owner-side sprites/facts/approvals

Source: https://github.com/looksawful/looksawful.ru/issues/709

The shared Contact Hub contract itself is tracked separately in #746:
https://github.com/looksawful/looksawful.ru/issues/746

### 12. Analytics and Yandex search still have known operational defects

The analytics/search program #747 explicitly lists unresolved items such as historical Webvisor asset replay, exact goal/event reconciliation, Yandex robots/sitemap/indexing diagnostics, automated private audits and weekly reporting.

Source: https://github.com/looksawful/looksawful.ru/issues/747

Open child issues include:
- #749 Webvisor historical hashed asset retention
- #751 Yandex robots/sitemap/canonical/indexing diagnostics

### 13. Legal/publication-rights work is not complete

The legal program #540 explicitly leaves asset-level publication rights and legacy/project-specific license uncertainty open.

Source: https://github.com/looksawful/looksawful.ru/issues/540

Open child work includes, among others:
- #546 media/client/collaborator publication rights
- #553 media rights metadata separation
- #554 Pixelated MS Sans Serif provenance
- #552/#556 production activation/release items

These are risk/compliance issues, not architecture cleanup, and should not be ignored by a repository-wide "debt" view.

### 14. Internationalization is still an architectural and editorial backlog

The bilingual architecture itself remains open in #246:
https://github.com/looksawful/looksawful.ru/issues/246

Translation and English editing remain separate open work in:
- #280 translation
- #281 English copy editing

The CV readiness pass #250 is also still open and explicitly depends on canonical consistency and future bilingual participation:
https://github.com/looksawful/looksawful.ru/issues/250

### 15. Project covers/social-preview ownership remains unfinished

The intentional per-project cover/social-preview system remains open in #242, including canonical cover ownership, audit of every indexable page, crop policy and metadata verification.

Source: https://github.com/looksawful/looksawful.ru/issues/242

## What the raw issue count means and does not mean

**208 open issues is evidence of breadth, not a priority ranking.**

Open issues mix different kinds of unresolved work:

1. **known defects** — e.g. #615;
2. **architecture debt** — e.g. #256;
3. **governance/ownership debt** — e.g. #249;
4. **operational/release debt** — e.g. #1087, #747;
5. **verification debt** — e.g. #861 and Storybook follow-ups;
6. **decision debt** — e.g. #1142;
7. **feature/program backlog** — e.g. #709, #1105, #1106;
8. **content/editorial debt** — e.g. #1166, #533, #534;
9. **risk/compliance debt** — e.g. #540.

Therefore, counting `ponytail:` comments is useful only for one very narrow class: **consciously accepted simplifications explicitly annotated in code**. A clean Ponytail ledger says nothing about the other eight classes.

## Corrected use of the three-skill pipeline

The useful pipeline is still:

1. **ponytail-debt**
   - input: explicit `ponytail:` markers only;
   - current finding: no markers in current `dev`;
   - interpretation: no explicitly annotated Ponytail shortcuts, **not** "no unresolved debt".

2. **improve-codebase-architecture**
   - input: current architecture, hot spots, interfaces/seams, known architecture issues;
   - must incorporate existing architecture issues such as #256 and #249 rather than rediscovering the repository from a few files.

3. **technical-debt-capitalizer**
   - input must be the union of:
     - explicit Ponytail debt;
     - architecture findings;
     - confirmed defects;
     - governance/operational debt;
     - verification debt;
     - risk/compliance issues;
     - blockers from active programs.
   - then classify what is worth paying now versus later.

Running the capitalizer only on the earlier tiny architecture sample would produce a confidently wrong portfolio.

## Priority implications for the next debt-capitalization pass

The next pass should not start by asking "what code looks ugly?" It should first reconcile the open issue portfolio into active vs stale/superseded work, then score only the surviving unresolved items.

High-value inputs to prioritize first:

- #256 architecture migration because it changes the cost of future page work;
- #249 / #451–#453 ownership and authoring governance because drift can corrupt canonical content workflows;
- #1087 program because privacy/review/release correctness is high-risk;
- #615 because it contains known public factual/editorial defects;
- #861 because missing verification surfaces reduce confidence in future agent changes;
- #747 because analytics/search defects reduce measurement and discovery quality;
- #540/#546 because publication-rights uncertainty is a stop-ship category when affected assets are involved;
- #1166 because the current editorial program is actively being implemented and intersects multiple known content defects.

This is an input list for prioritization, not a final ranking.

## Missing data / limitations

- GitHub open state alone does not prove an issue is still active. Some issues may be stale, duplicated, partially completed or superseded.
- Some parent issues remain open even after several child items have landed; each umbrella needs reconciliation against current code before remediation.
- The repository has **42 open PRs**; some are active, some may be superseded. PR state must be reconciled alongside issue state before estimating remediation cost.
- Current code search found few traditional `TODO`/`FIXME` markers. That confirms that unresolved work is primarily tracked in issues/docs/contracts rather than inline comments.
- A complete prioritization requires an issue-reconciliation pass that marks each open item as active, blocked, superseded, stale, duplicate or done-but-unclosed.

## Conclusion

The repository does have a large unresolved problem surface. The earlier small-debt conclusion was an artifact of using the wrong evidence set.

The correct next step is not another narrow source scan. It is:

**208 open issues + 42 open PRs → reconcile status → group by debt/problem type → feed the surviving active set into architecture review and technical-debt capitalization.**

Only after that can "what should we fix now?" be answered with any confidence.
