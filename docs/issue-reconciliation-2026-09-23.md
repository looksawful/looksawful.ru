# Open issue reconciliation — 2026-09-23

Repository: `looksawful/looksawful.ru`  
Baseline: current GitHub open-state + issue contracts, reconciled against current successor/owner evidence  
Open issues classified: **208**  
Open pull requests observed: **42**

## Result

| Category | Count |
| --- | ---: |
| active | 167 |
| blocked | 32 |
| stale | 1 |
| superseded | 2 |
| duplicate | 1 |
| done-but-unclosed | 5 |
| **Total** | **208** |

## Classification contract

- **active** — real unresolved work can proceed now; parent/program issues may remain active while children execute.
- **blocked** — work cannot currently complete because an open dependency, explicit owner decision, external provider state, or quality gate is unresolved.
- **stale** — the issue's core diagnosis/premise no longer matches verified current reality; re-check or close rather than implement it literally.
- **superseded** — a newer issue/contract owns the same outcome under a materially newer architecture or more complete package.
- **duplicate** — another current issue owns essentially the same executable scope.
- **done-but-unclosed** — the issue's own scoped deliverable is already complete, but GitHub state is still open.

The classification is deliberately conservative: ambiguity stays **active**, not silently discarded.

## High-confidence reconciliation findings

- **#884 is stale.** #987 establishes that the CV file is tracked source and the old failure came from an incomplete sparse checkout.
- **#682 is superseded by #679.** The newer storage contract preserves Git-backed Media Catalog authority and treats Object Storage as a delivery/heavy-binary layer.
- **#680 duplicates #676.** Both specify the Yandex managed MCP Gateway; #676 is the broader/current package.
- **#733 is superseded at medium confidence by #1087.** The newer program requires production to be the only public rendered site and moves pre-production visual review into the authenticated Private Lab.
- **#1033, #1034, #1121 and #932 are audit deliverables that are already complete but remain open.**
- **#988 is done-but-unclosed** because its target #882 is already closed/completed with merged verification evidence.
- **#249 remains active**, despite an old completion audit, because its current body explicitly says REOPENED.
- **#256, #585, #861 and #615 remain active**; each has explicit remaining scope.
- **#552/#556 remain active**, but their old "wait for #397" blocker text is stale because the CSS program is already recorded as closed/completed elsewhere.
- **#746 remains active**; its old session-specific workstation blocker should not be treated as a current repository blocker.

## Mutation policy

This pass **does not mass-close or relabel issues**. It produces the evidence ledger first. Terminal buckets are closure/rewrite candidates, not silent destructive mutations. Applying GitHub state changes should use this ledger so each closure can name its canonical successor/evidence.


## active (167)

| Issue | Title | Confidence | Reconciliation reason |
| ---: | --- | --- | --- |
| #57 | Media catalog: authenticated CMS acceptance and real upload lifecycle | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #58 | Media catalog: editorial review of automated taxonomy | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #223 | Post-release backlog after content-ready checkpoint | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #240 | product: complete Project/Case UX after canonical PageContent cutover | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #241 | content: complete project media, evidence and source-material backlog | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #242 | design: complete intentional project covers and social preview system | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #245 | quality: complete site-wide responsive and accessibility baseline | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #246 | i18n: establish bilingual site architecture and localization contract | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #249 | content: establish canonical source ownership and round-trip governance | high | Explicitly REOPENED after governance drift; #451/#452/#453 are its active reconciliation owners. |
| #250 | cv: complete resume page consistency and content-readiness pass | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #251 | architecture: replace hybrid Homepage composition with canonical renderer | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #252 | architecture: move template implementations behind canonical components | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #253 | architecture: simplify Section rendering and move visual presets to CSS | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #256 | architecture: close out canonical page/template migration | high | Umbrella explicitly lists remaining execution scope #251/#252/#253/#320 plus final reconciliation. |
| #258 | design: implement dedicated 404 experience with restrained dither interaction | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #262 | product: define Homepage curation and featured-project hierarchy | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #267 | cms: add project section and content-block visibility controls | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #269 | cms: add placement-level media editing, captions and lightbox controls | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #270 | pets: consolidate Awful Cases and Berserk code surfaces on shared primitives | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #271 | cms: add safe slider and media-deck editorial controls | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #275 | portfolio: reconcile canonical public profiles and contact links | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #277 | content: reconcile project external links, credits and source references | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #280 | i18n: translate canonical site content to English after bilingual contract | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #281 | content: complete English copy editing after translation coverage | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #320 | publication: remove unfinished hidden content from public output without losing source | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #398 | maintenance(cv): remove display-time lowercase normalization after canonical copy approval | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #407 | Jestei Color System: raise 3D logo render quality without performance regression | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #408 | WebGL: adaptive performance tiers and progressive 3D render quality | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #409 | Jestei Color System: verify final palette token values against canonical brand colors | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #410 | Media captions: define a readable maximum length and edit overlong copy | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #412 | Media pipeline: preserve desktop quality for large standalone images | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #413 | Media loading UX: add skeletons and preloaders for heavy media | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #414 | Jestei Pool case: add semantic subheadings to long multi-paragraph sections | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #421 | Jestei track filter: replace seeded summary text with a real selected-filter state summary | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #424 | Scenography media block: restore canonical image order and preserve panorama continuity | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #426 | Styx Lookbook 2025: expand and clarify the section with representative photography | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #427 | Styx social instructions: redesign the section and remove duplicated copy | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #428 | Ofelia 2023: remove the black strip from photo 3 at the asset level | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #429 | Shootings: expand every horizontal reel with the full available photo set | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #440 | media: replace five technical video fallbacks with manual posters | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #451 | cms: formalize isolated authoring branches and safe integration into dev | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #452 | desk: make local editorial tooling read-only by default and guard write mode | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #453 | desk: make content/media writes schema-validated, conflict-aware and atomic | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #470 | cv: remove duplicate tools source and move results/experience ahead of toolbox | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #473 | Jestei Pool case — clarify role, team ownership and credits | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #478 | positioning: one professional brand with three specialization routes | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #501 | [BEFORE-AFTER/CAPTION] summary text is hidden while component is excluded from lightbox | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #531 | content: repair print line-break corruption in Sensetique equipment metadata | high | The Sensetique print-hyphenation defect remains actionable; its historical integration-freeze blocker is stale, so this is active work from fresh dev. |
| #533 | quality: classify and clean public CV spelling before enabling CSpell scope | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #534 | quality: classify public Jestei docs spelling before enabling CSpell scope | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #535 | [MEDIA CI INCIDENT] metadata-only CMS media verification path | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #537 | test(media): decouple dedupe semantic baseline from legitimate editorial metadata updates | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #539 | ci(media): verify placement-only MediaEntry semantic changes in required workflow | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #540 | legal(program): portfolio licensing, rights and provenance | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #546 | audit: verify media, client and collaborator publication rights | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #552 | legal(release): activate Portfolio License 1.0 on production after CSS refactor | high | Post-CSS production legal activation still remains, but the body’s old CSS blocker is no longer current; the issue needs execution/reconciliation rather than waiting on #397. |
| #553 | legal(media): separate internal reuse from rights metadata | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #554 | legal(fonts): verify Pixelated MS Sans Serif provenance | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #556 | legal(release): activate Portfolio License 1.0 after CSS refactor closeout | high | Post-CSS production legal activation still remains, but the body’s old CSS blocker is no longer current; the issue needs execution/reconciliation rather than waiting on #397. |
| #570 | [VISUAL DEBT] preserve documented compensation patches until source assets are corrected | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #580 | [RUNTIME DEBT] Infinite reel cloned-track width and computed duration are timing-dependent | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #585 | [CSS ARCHITECTURE] lifecycle v2 — durable ownership, primitives and gradual components.css retirement | high | Issue explicitly says OPEN / STAGE B EVOLUTIONARY MAINTENANCE. |
| #615 | Editorial audit: исправить пункты 3–9 и закрыть регрессии | high | Confirmed editorial/data defects remain unchecked; focused #647/#648/#649/#651 slices refine parts of the work but do not close this umbrella. |
| #647 | copy(audit): verify and correct Jestei CV cost claim | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #648 | copy(audit): verify and correct Sensetique dates, typos, credits and mirrors | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #649 | copy(audit): verify Berry, Mad Cow and LI-NE engagement periods | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #651 | copy(audit): translate remaining Russian Styx credit titles in EN content | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #667 | cms(home): add reversible logo-wall section visibility control | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #670 | cms(home): expose whole logo-wall visibility toggle in Pages CMS | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #676 | infra: expose AWFUL tools through Yandex MCP Gateway for ChatGPT and Codex | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #677 | infra: define Cloudflare boundary for Yandex-backed AWFUL subdomains | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #678 | cloud: complete AWFUL Yandex control-plane deployment | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #679 | media: add Yandex Object Storage delivery layer without replacing Git-backed Media Catalog | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #681 | agents: maintain a curated capability and skill registry for looksawful.ru | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #683 | infra: define least-privilege Cloudflare boundary for AWFUL cloud services | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #684 | agents: add cloud-integration skill and audit external skill sources | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #687 | refactor: establish deep-refactor characterization baseline and stage gates | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #688 | quality(pets): bring standalone pet/game surfaces under explicit lint, style and test ownership | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #689 | design: audit cross-site UX flows and state transitions before redesign | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #701 | [yandex-control] webmaster-status | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #702 | [yandex-control] metrika-access-check | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #709 | feat(ai-pet): build Yandex-backed portfolio assistant pet | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #710 | design(ai-pet): define pet + AI-mode UX inside shared Contact Hub | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #713 | content(ai-pet): define strict public knowledge base, provenance and answer templates | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #719 | analytics: eliminate live /cdn-cgi/trace 404 from country resolution | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #720 | test(e2e): align production CV smoke with analytics bootstrap contract | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #721 | test(e2e): add per-suite deadlines to full browser regression runner | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #732 | debug: preserve Lab as private full-site and organism workspace | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #745 | [maintenance] analytics-seo-upgrade | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #746 | feat(contact): design Contact Hub with direct form and future AI mode | high | Contact Hub implementation remains open. The body’s old 'workstation unavailable' blocker is session-stale; current work is represented by the active implementation stream/PR rather than a present infrastructure block. |
| #747 | analytics: reliable portfolio measurement + Yandex search program | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #749 | analytics(webvisor): retain historical hashed assets for reliable replay | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #751 | seo(yandex): reconcile robots, sitemap, canonical URLs and indexing diagnostics | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #765 | Test suite audit & refactor: replace migration/source-regex guards with durable behavior and contract tests | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #781 | [yandex-control] metrika-access-check | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #791 | ci: scope GitHub Pages deployment permissions per job | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #793 | seo: separate homepage previews from standalone case search content | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #803 | preview: source-side contract for private control plane | medium | Private-control-plane preview source contract is still open; #1087 changes visual-review publication policy but does not explicitly retire this source-side control-plane contract. |
| #808 | Media Desk Remote + Unified Media Graph | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #835 | content(styx): rewrite social-instructions copy before restoring section | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #836 | content(съёмки): rewrite intro and shooting headings before restoring text | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #840 | lab: make immutable auth propagation verification fail closed | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #861 | System audit: project components, Storybook, CMS and media parity | high | Canonical audit tracker remains open for Storybook/Lab parity, browser coverage, CMS pet-card work and media ownership despite completed quick-pass slices. |
| #868 | retro/audit: harden compact homepage rollout after #834 | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #873 | lab/storybook: keep compact preview stories synchronized with production renderer | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #875 | preview: garbage-collect expired cms-preview source refs | medium | Source-ref garbage collection remains an open source-repository hygiene task; no verified successor closes it yet. |
| #880 | Storybook inventory: classify orphan Subproject Card before canonical coverage | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #889 | Storybook: extract a production renderer for Berserk Audio Player before canonical coverage | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #894 | Storybook: cover Animated Canvas Gallery and Moves composition | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #895 | Storybook: cover Jestei 3D theme organism | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #896 | Storybook: cover Project Navigation lifecycle | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #897 | Storybook: cover Analytics Consent UI without analytics side effects | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #898 | Storybook: cover Jestei Track Filter specialized UI | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #899 | Storybook: cover CV Experience and Expertise states | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #900 | Storybook: cover remaining canonical content composition templates | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #902 | Storybook: cover Awful Cases game renderer/runtime boundary | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #929 | Storybook: canonical coverage for «Полезное» states, responsive layouts and project scaffolds | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #930 | architecture: scaffold future Useful project pages without publishing routes | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #931 | QA gate: Useful / Pet Projects preview before visual approval | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #933 | Lab 3D model viewer: asset provenance, visual regression and delivery contract | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #935 | 3D logo library: canonical SVG → GLB → Storybook for all projects/clients | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #936 | Lab infrastructure: verify custom lab.looksawful.ru domain end-to-end | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #942 | Investigate duplicate Moves Awful video resource requests in browser smoke | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #943 | Test suite #765 handoff: finish runtime/E2E guard replacement, CSS wave cleanup, and source-regex cleanup | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #953 | #765 blocker: make PhotoSwipe guard-removal PR pass exact-head preview/CI | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #954 | #765 blocker: replay Embla behavior slice as a scoped current-dev PR | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #955 | #765 blocker: add missing navigation behavior proof before deleting source-regex guard | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #967 | Implement ProjectTeaser renderer before declaring Storybook parity | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #968 | storybook: static LAB build stalls under concurrent repository workload | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #969 | storybook: add deterministic viewport preview evidence for canonical state stories | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #970 | storybook: reconcile generated responsive media with static LAB asset contract | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #971 | tooling: document sparse-checkout requirements for repository verification worktrees | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #972 | storybook: finish Media Lightbox overlay and focus lifecycle coverage | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #973 | storybook: add integration runbook and reconciliation record for coverage-ci | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #975 | storybook: add PR preview artifact for static LAB system | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #976 | storybook: reconcile remaining 79 inventory sources after coverage waves | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #978 | storybook: audit dependency/install warnings from LAB verification | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #979 | storybook: add automated accessibility gate for canonical stories | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #980 | storybook: make reduced-motion verification deterministic | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #982 | storybook: verify canonical stories have no console/page errors | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #984 | storybook: verify keyboard interaction contracts in browser | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #985 | storybook: define Storybook package installation strategy for LAB builds | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #987 | storybook: reconcile issue #884 after sparse-checkout root-cause correction | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #989 | storybook: run CodeRabbit review before final coverage integration release | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #997 | test(e2e): align full motion coverage contract with current homepage composition | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #1000 | Media Desk: add constrained Useful card cover assignment | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #1008 | Useful: reconcile remaining contract-closure requirements | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #1009 | Branch cleanup ledger: 2026-09-17 | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #1087 | Private visual review pipeline and public-preview retirement | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #1089 | Private Review Hub thin slice | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #1093 | Sanitize historical public review surfaces | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #1094 | Repository privacy audit and rewrite decision | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #1105 | Gallery phase 2: curated multi-format portfolio archive from Media Catalog | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #1106 | Design system: production primitives for actions, labels, navigation and help | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #1108 | Gallery phase 2: define typed multi-format curation and rendering contract | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #1109 | Gallery phase 2: curate and ingest approved 2D, production, video and character-sheet media | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #1112 | Design system primitives: inventory existing usages and define semantic taxonomy | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #1113 | Design system primitive: Button | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #1114 | Design system primitives: Badge, Chip, Tag and Pill family | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #1115 | Design system primitive: Tabs | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #1116 | Design system primitive: Divider | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #1117 | Design system primitive: Tooltip | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #1141 | test: audit and simplify browser/E2E suite ownership | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #1142 | Wayfinder: finish portfolio UX/IA rollout decisions | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #1146 | Lock Gallery curation and series | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #1166 | Spec: exhaustive text review Round 2 | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |
| #1167 | Round 2 contract + Home thin slice | medium | Open scope remains; no verified terminal state or current blocking condition was found in the issue contract. |

## blocked (32)

| Issue | Title | Confidence | Reconciliation reason |
| ---: | --- | --- | --- |
| #170 | analytics: finish Yandex Metrica goals and privacy settings | high | Requires owner/provider-side Yandex Metrika dashboard configuration that the current repository workflow cannot perform by itself. |
| #260 | product: establish Blog v1 as a canonical public content surface | high | Current open dependency: #249, #246, #251, #256. |
| #706 | Yandex Metrika API authorization + goal contract verification | high | Explicit current blocker: Yandex Metrika Management API authorization returns HTTP 403 until OAuth is repaired. |
| #708 | Yandex API: repair OAuth credential for Webmaster + Metrika control bridge | high | Explicit provider-side blocker: Yandex Webmaster/Metrika OAuth token is rejected with HTTP 403 / INVALID_OAUTH_TOKEN. |
| #711 | feat(ai-pet): implement typed sprite runtime and accessible launcher | high | Current open dependency: #710. |
| #712 | feat(ai-pet): build deterministic AI mode inside Contact Hub | high | Current open dependency: #710. |
| #714 | infra(ai-pet): add separate public Yandex assistant gateway, retrieval and hard budgets | high | Current open dependency: #713. |
| #715 | feat(ai-pet): add draft-first message and application writer flows | high | Current open dependency: #712, #714. |
| #716 | feat(ai-pet): add local runner mini-game and release quality gates | high | Current open dependency: #711, #688. |
| #718 | handoff(ai-pet): Ваня — спрайты, публичные факты и account-side approvals | high | Owner-side handoff: sprites/public facts/account approvals are required before dependent AI-pet work can finish. |
| #977 | storybook: record final coverage-ci → prod release gate | high | Final Storybook coverage release gate; it cannot complete while the underlying coverage/evidence stream remains open. |
| #990 | storybook: reconcile duplicate/follow-up issues after coverage integration | high | Reconciliation issue explicitly waits until the Storybook coverage integration stream stabilizes. |
| #1090 | Exact Review approval, lifecycle and Baseline | high | Current open dependency: #1089. |
| #1091 | Automatic visual-impact and Review Target routing | high | Current open dependency: #1089. |
| #1092 | Deterministic visual runtime matrix | high | Current open dependency: #1089, #1091. |
| #1095 | Migrate Awful Mockups to private visual review | high | Current open dependency: #1090, #1091, #1092. |
| #1096 | Final private-review migration verification | high | Current open dependency: #1093, #1094, #1095. |
| #1110 | Gallery phase 2: consume validated 3D library outputs | high | Current open dependency: #935. |
| #1111 | Gallery phase 2: interaction, accessibility and production release gate | high | Gallery phase-2 final interaction/accessibility/release gate depends on the still-open phase-2 implementation slices. |
| #1118 | Design system primitives: migrate usages and reconcile Storybook/system audit | high | Design-system migration/reconciliation is downstream of the still-open semantic inventory and primitive implementation slices. |
| #1143 | Lock Featured and Archive membership | high | Waiting on an explicit owner product/editorial decision (`wayfinder:grilling`). |
| #1144 | Approve Flagship executive summaries | high | Waiting on an explicit owner product/editorial decision (`wayfinder:grilling`). |
| #1145 | Choose manual next-Case route | high | Waiting on an explicit owner product/editorial decision (`wayfinder:grilling`). |
| #1147 | Approve public discovery for selected Work projects | high | Waiting on an explicit owner product/editorial decision (`wayfinder:grilling`). |
| #1148 | Approve missing Featured intro copy | high | Waiting on an explicit owner product/editorial decision (`wayfinder:grilling`). |
| #1168 | Mobile swipe review | high | Current open dependency: #1167. |
| #1169 | Home + global UI + Gallery + 404 corpus | high | Current open dependency: #1167. |
| #1170 | Jestei Pool full text corpus | high | Current open dependency: #1167. |
| #1171 | Styx + Sensetique full text corpus | high | Current open dependency: #1167. |
| #1172 | Shootings + hidden project pages corpus | high | Current open dependency: #1167. |
| #1173 | CV + Privacy + Metadata + site-wide fact pass | high | Current open dependency: #1167. |
| #1174 | Round 2 integration + completion gate | high | Current open dependency: #1168, #1169, #1170, #1171, #1172, #1173. |

## stale (1)

| Issue | Title | Confidence | Reconciliation reason |
| ---: | --- | --- | --- |
| #884 | ci: test:fast assumes generated public/cv artifact in clean Storybook worktrees | high | The issue's generated-CV-artifact diagnosis is invalidated by #987: public/cv/index.html is tracked source; the failing worktree omitted /public/ via sparse checkout. |

## superseded (2)

| Issue | Title | Confidence | Reconciliation reason |
| ---: | --- | --- | --- |
| #682 | media: add private Yandex Object Storage backend for Media Desk | high | #679 is the later canonical Object Storage boundary: Git-backed Media Catalog stays authoritative while Object Storage is a delivery/heavy-binary layer. |
| #733 | preview: exact-SHA protected PR Preview for PRs into dev | medium | #1087 replaces public PR-preview visual review with authenticated Private Lab review and explicitly requires the old public preview publication mechanism to remain absent. |

## duplicate (1)

| Issue | Title | Confidence | Reconciliation reason |
| ---: | --- | --- | --- |
| #680 | mcp: expose AWFUL tools through a Yandex MCP gateway | high | Duplicate scope of #676: both define the AWFUL Yandex managed MCP Gateway for ChatGPT/Codex; #676 is the broader and later-maintained canonical package. |

## done-but-unclosed (5)

| Issue | Title | Confidence | Reconciliation reason |
| ---: | --- | --- | --- |
| #932 | audit: make Useful cards CMS/Desk-owned without leaking route identity | high | Audit-only Useful/CMS/Desk analysis is complete; later work split into focused implementation owners including #1000 and the editorial stream. |
| #988 | storybook: merge static public asset fix #882 after final runner verification | high | Its only purpose was to finish the #882 static-asset fix; #882 is now closed with state_reason=completed and records the merged verification evidence. |
| #1033 | [AUDIT] cluster pattern adoption across current site and design system | high | Audit scope is complete: final cluster audit summary is recorded; the issue explicitly authorizes audit only. |
| #1034 | Audit: prose + pile pattern adoption across current UI | high | Audit scope is complete: final prose/pile audit summary is recorded and no implementation belongs to this issue. |
| #1121 | UIAudit baseline: Gallery and shared site UI before phase 2 | high | Baseline UI audit is complete; findings and sequencing were recorded, with remediation owned by the follow-up implementation stream. |

## Recommended mutation wave

1. Close **done-but-unclosed** issues with a short evidence comment.
2. Close **duplicate** and **superseded** issues only after linking the canonical owner.
3. For **stale** issues, either close as not-planned/stale or rewrite the issue around a still-reproducible defect.
4. Leave **blocked** open and make the blocker explicit/current.
5. Leave **active** open; use this set as the input to technical-debt capitalization and execution prioritization.

If comments are posted through the Matt Pocock triage workflow, each generated triage comment must begin exactly with:

`> *This was generated by AI during triage.*`
