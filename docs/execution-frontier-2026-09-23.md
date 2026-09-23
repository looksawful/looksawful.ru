# Execution frontier — 2026-09-23

Repository: `looksawful/looksawful.ru`

This is the post-reconciliation execution view. Terminal issues were closed before this snapshot, so the live open set is **199 issues**.

## Current state

| Bucket | Count |
| --- | ---: |
| Active | 167 |
| Blocked | 32 |
| **Open total** | **199** |

Open pull requests: **42**.

## Blocked graph contract

A blocked issue must have one current gate: an open issue dependency, an explicit human decision, an external provider condition, or a quality/release gate. Closed dependencies are not counted, so an issue naturally returns to the active pool on the next reconciliation pass.

| Blocker type | Count |
| --- | ---: |
| external-provider | 3 |
| human-decision | 6 |
| issue-dependency | 19 |
| quality-gate | 4 |

### Blocked issues

| Issue | Gate type | Current gate |
| ---: | --- | --- |
| #170 | external-provider | Yandex Metrika dashboard/provider configuration requires owner/provider-side action. |
| #260 | issue-dependency | Open dependency: #249, #246, #251, #256 |
| #706 | external-provider | Yandex Metrika Management API authorization remains HTTP 403 until OAuth is repaired. |
| #708 | external-provider | Yandex Webmaster/Metrika OAuth token is rejected with HTTP 403 / INVALID_OAUTH_TOKEN. |
| #711 | issue-dependency | Open dependency: #710 |
| #712 | issue-dependency | Open dependency: #710 |
| #714 | issue-dependency | Open dependency: #713 |
| #715 | issue-dependency | Open dependency: #712, #714 |
| #716 | issue-dependency | Open dependency: #711, #688 |
| #718 | human-decision | Owner-side sprites/public facts/account approvals are required for the AI-pet stream. |
| #977 | quality-gate | Final Storybook coverage release gate waits on the underlying coverage/evidence stream. |
| #990 | quality-gate | Reconciliation waits until the Storybook coverage integration stream stabilizes. |
| #1090 | issue-dependency | Open dependency: #1089 |
| #1091 | issue-dependency | Open dependency: #1089 |
| #1092 | issue-dependency | Open dependency: #1089, #1091 |
| #1095 | issue-dependency | Open dependency: #1090, #1091, #1092 |
| #1096 | issue-dependency | Open dependency: #1093, #1094, #1095 |
| #1110 | issue-dependency | Open dependency: #935 |
| #1111 | quality-gate | Gallery phase-2 release gate waits on the remaining Gallery implementation slices. |
| #1118 | quality-gate | Design-system migration/reconciliation waits on semantic inventory and primitive implementation slices. |
| #1143 | human-decision | Awaiting explicit owner decision (`wayfinder:grilling`). |
| #1144 | human-decision | Awaiting explicit owner decision (`wayfinder:grilling`). |
| #1145 | human-decision | Awaiting explicit owner decision (`wayfinder:grilling`). |
| #1147 | human-decision | Awaiting explicit owner decision (`wayfinder:grilling`). |
| #1148 | human-decision | Awaiting explicit owner decision (`wayfinder:grilling`). |
| #1168 | issue-dependency | Open dependency: #1167 |
| #1169 | issue-dependency | Open dependency: #1167 |
| #1170 | issue-dependency | Open dependency: #1167 |
| #1171 | issue-dependency | Open dependency: #1167 |
| #1172 | issue-dependency | Open dependency: #1167 |
| #1173 | issue-dependency | Open dependency: #1167 |
| #1174 | issue-dependency | Open dependency: #1168, #1169, #1170, #1171, #1172, #1173 |

## Active routing

The active pool is not one FIFO queue. Each issue is routed to the smallest suitable Matt flow.

| Flow | Count |
| --- | ---: |
| /implement | 96 |
| /to-spec → /to-tickets | 30 |
| /wayfinder | 12 |
| coordination-only | 10 |
| /improve-codebase-architecture | 8 |
| /diagnosing-bugs | 6 |
| finish-existing-pr | 5 |

Routing rules:
- **finish-existing-pr**: do not start a second implementation; finish/review the existing PR.
- **/implement**: already-shaped executable leaf/work package.
- **/diagnosing-bugs**: concrete failure/regression with an executable verification target.
- **coordination-only**: umbrella already has open child tickets; do not implement the umbrella directly.
- **/to-spec → /to-tickets**: broad but understandable work with no adequate executable slices yet.
- **/wayfinder**: genuinely decision-heavy/foggy work.
- **/improve-codebase-architecture**: broad architecture-health work where the seam itself still needs discovery; already-specific architecture tickets stay implementation work.

## Execution frontier

Sorted first by **how many currently blocked issues the leaf directly unlocks**, then by existing-PR work.

| Issue | Flow | Unlocks | Existing PR | Confidence | Title |
| ---: | --- | ---: | --- | --- | --- |
| #1167 | finish-existing-pr | 6 | #1175 | high | Round 2 contract + Home thin slice |
| #1089 | finish-existing-pr | 3 | #1122 | high | Private Review Hub thin slice |
| #251 | /implement | 1 | — | medium | architecture: replace hybrid Homepage composition with canonical renderer |
| #688 | /implement | 1 | — | medium | quality(pets): bring standalone pet/game surfaces under explicit lint, style and test ownership |
| #1093 | /implement | 1 | — | high | Sanitize historical public review surfaces |
| #1094 | /implement | 1 | — | high | Repository privacy audit and rewrite decision |
| #720 | finish-existing-pr | 0 | #722 | high | test(e2e): align production CV smoke with analytics bootstrap contract |
| #721 | finish-existing-pr | 0 | #727 | high | test(e2e): add per-suite deadlines to full browser regression runner |
| #1108 | finish-existing-pr | 0 | #1130 | high | Gallery phase 2: define typed multi-format curation and rendering contract |
| #252 | /implement | 0 | — | medium | architecture: move template implementations behind canonical components |
| #258 | /diagnosing-bugs | 0 | — | high | design: implement dedicated 404 experience with restrained dither interaction |
| #270 | /implement | 0 | — | medium | pets: consolidate Awful Cases and Berserk code surfaces on shared primitives |
| #275 | /implement | 0 | — | medium | portfolio: reconcile canonical public profiles and contact links |
| #277 | /implement | 0 | — | medium | content: reconcile project external links, credits and source references |
| #398 | /implement | 0 | — | medium | maintenance(cv): remove display-time lowercase normalization after canonical copy approval |
| #407 | /diagnosing-bugs | 0 | — | high | Jestei Color System: raise 3D logo render quality without performance regression |
| #408 | /implement | 0 | — | medium | WebGL: adaptive performance tiers and progressive 3D render quality |
| #409 | /implement | 0 | — | medium | Jestei Color System: verify final palette token values against canonical brand colors |
| #412 | /implement | 0 | — | medium | Media pipeline: preserve desktop quality for large standalone images |
| #413 | /implement | 0 | — | medium | Media loading UX: add skeletons and preloaders for heavy media |
| #414 | /implement | 0 | — | medium | Jestei Pool case: add semantic subheadings to long multi-paragraph sections |
| #421 | /implement | 0 | — | medium | Jestei track filter: replace seeded summary text with a real selected-filter state summary |
| #424 | /implement | 0 | — | medium | Scenography media block: restore canonical image order and preserve panorama continuity |
| #426 | /implement | 0 | — | medium | Styx Lookbook 2025: expand and clarify the section with representative photography |
| #428 | /implement | 0 | — | medium | Ofelia 2023: remove the black strip from photo 3 at the asset level |
| #429 | /implement | 0 | — | medium | Shootings: expand every horizontal reel with the full available photo set |
| #440 | /implement | 0 | — | medium | media: replace five technical video fallbacks with manual posters |
| #451 | /implement | 0 | — | medium | cms: formalize isolated authoring branches and safe integration into dev |
| #452 | /implement | 0 | — | medium | desk: make local editorial tooling read-only by default and guard write mode |
| #453 | /implement | 0 | — | medium | desk: make content/media writes schema-validated, conflict-aware and atomic |
| #473 | /implement | 0 | — | medium | Jestei Pool case — clarify role, team ownership and credits |
| #478 | /implement | 0 | — | medium | positioning: one professional brand with three specialization routes |
| #531 | /diagnosing-bugs | 0 | — | high | content: repair print line-break corruption in Sensetique equipment metadata |
| #533 | /implement | 0 | — | medium | quality: classify and clean public CV spelling before enabling CSpell scope |
| #534 | /implement | 0 | — | medium | quality: classify public Jestei docs spelling before enabling CSpell scope |
| #535 | /diagnosing-bugs | 0 | — | high | [MEDIA CI INCIDENT] metadata-only CMS media verification path |
| #537 | /implement | 0 | — | medium | test(media): decouple dedupe semantic baseline from legitimate editorial metadata updates |
| #539 | /implement | 0 | — | medium | ci(media): verify placement-only MediaEntry semantic changes in required workflow |
| #546 | /implement | 0 | — | medium | audit: verify media, client and collaborator publication rights |
| #553 | /implement | 0 | — | medium | legal(media): separate internal reuse from rights metadata |
| #554 | /implement | 0 | — | medium | legal(fonts): verify Pixelated MS Sans Serif provenance |
| #570 | /implement | 0 | — | medium | [VISUAL DEBT] preserve documented compensation patches until source assets are corrected |
| #580 | /implement | 0 | — | medium | [RUNTIME DEBT] Infinite reel cloned-track width and computed duration are timing-dependent |
| #647 | /implement | 0 | — | medium | copy(audit): verify and correct Jestei CV cost claim |
| #648 | /implement | 0 | — | medium | copy(audit): verify and correct Sensetique dates, typos, credits and mirrors |
| #649 | /implement | 0 | — | medium | copy(audit): verify Berry, Mad Cow and LI-NE engagement periods |
| #651 | /implement | 0 | — | medium | copy(audit): translate remaining Russian Styx credit titles in EN content |
| #667 | /implement | 0 | — | medium | cms(home): add reversible logo-wall section visibility control |
| #670 | /implement | 0 | — | medium | cms(home): expose whole logo-wall visibility toggle in Pages CMS |
| #679 | /implement | 0 | — | medium | media: add Yandex Object Storage delivery layer without replacing Git-backed Media Catalog |
| #681 | /implement | 0 | — | medium | agents: maintain a curated capability and skill registry for looksawful.ru |
| #701 | /implement | 0 | — | medium | [yandex-control] webmaster-status |
| #702 | /implement | 0 | — | medium | [yandex-control] metrika-access-check |
| #719 | /diagnosing-bugs | 0 | — | high | analytics: eliminate live /cdn-cgi/trace 404 from country resolution |
| #732 | /diagnosing-bugs | 0 | — | high | debug: preserve Lab as private full-site and organism workspace |
| #745 | /implement | 0 | — | medium | [maintenance] analytics-seo-upgrade |
| #749 | /implement | 0 | — | medium | analytics(webvisor): retain historical hashed assets for reliable replay |
| #751 | /implement | 0 | — | medium | seo(yandex): reconcile robots, sitemap, canonical URLs and indexing diagnostics |
| #781 | /implement | 0 | — | medium | [yandex-control] metrika-access-check |
| #791 | /implement | 0 | — | medium | ci: scope GitHub Pages deployment permissions per job |

## Full active routing ledger

| Issue | Route | Type | Confidence | Open children / PRs | Title |
| ---: | --- | --- | --- | --- | --- |
| #57 | /to-spec → /to-tickets | broad-clear-work | medium | — | Media catalog: authenticated CMS acceptance and real upload lifecycle |
| #58 | /wayfinder | foggy-program | medium | — | Media catalog: editorial review of automated taxonomy |
| #223 | /to-spec → /to-tickets | broad-clear-work | medium | — | Post-release backlog after content-ready checkpoint |
| #240 | /to-spec → /to-tickets | broad-clear-work | medium | — | product: complete Project/Case UX after canonical PageContent cutover |
| #241 | coordination-only | umbrella-with-children | high | #277 | content: complete project media, evidence and source-material backlog |
| #242 | /to-spec → /to-tickets | broad-clear-work | medium | — | design: complete intentional project covers and social preview system |
| #245 | /to-spec → /to-tickets | broad-clear-work | medium | — | quality: complete site-wide responsive and accessibility baseline |
| #246 | /improve-codebase-architecture | architecture-health | medium | — | i18n: establish bilingual site architecture and localization contract |
| #249 | /improve-codebase-architecture | architecture-health | medium | — | content: establish canonical source ownership and round-trip governance |
| #250 | /to-spec → /to-tickets | broad-clear-work | medium | — | cv: complete resume page consistency and content-readiness pass |
| #251 | /implement | executable-leaf | medium | — | architecture: replace hybrid Homepage composition with canonical renderer |
| #252 | /implement | executable-leaf | medium | — | architecture: move template implementations behind canonical components |
| #253 | /improve-codebase-architecture | architecture-health | medium | — | architecture: simplify Section rendering and move visual presets to CSS |
| #256 | /improve-codebase-architecture | architecture-health | medium | — | architecture: close out canonical page/template migration |
| #258 | /diagnosing-bugs | hard-bug-or-regression | high | — | design: implement dedicated 404 experience with restrained dither interaction |
| #262 | /wayfinder | foggy-program | medium | — | product: define Homepage curation and featured-project hierarchy |
| #267 | /to-spec → /to-tickets | broad-clear-work | medium | — | cms: add project section and content-block visibility controls |
| #269 | /to-spec → /to-tickets | broad-clear-work | medium | — | cms: add placement-level media editing, captions and lightbox controls |
| #270 | /implement | executable-leaf | medium | — | pets: consolidate Awful Cases and Berserk code surfaces on shared primitives |
| #271 | /to-spec → /to-tickets | broad-clear-work | medium | — | cms: add safe slider and media-deck editorial controls |
| #275 | /implement | executable-leaf | medium | — | portfolio: reconcile canonical public profiles and contact links |
| #277 | /implement | executable-leaf | medium | — | content: reconcile project external links, credits and source references |
| #280 | /to-spec → /to-tickets | broad-clear-work | medium | — | i18n: translate canonical site content to English after bilingual contract |
| #281 | /to-spec → /to-tickets | broad-clear-work | medium | — | content: complete English copy editing after translation coverage |
| #320 | /to-spec → /to-tickets | broad-clear-work | medium | — | publication: remove unfinished hidden content from public output without losing source |
| #398 | /implement | executable-leaf | medium | — | maintenance(cv): remove display-time lowercase normalization after canonical copy approval |
| #407 | /diagnosing-bugs | hard-bug-or-regression | high | — | Jestei Color System: raise 3D logo render quality without performance regression |
| #408 | /implement | executable-leaf | medium | — | WebGL: adaptive performance tiers and progressive 3D render quality |
| #409 | /implement | executable-leaf | medium | — | Jestei Color System: verify final palette token values against canonical brand colors |
| #410 | /wayfinder | foggy-program | medium | — | Media captions: define a readable maximum length and edit overlong copy |
| #412 | /implement | executable-leaf | medium | — | Media pipeline: preserve desktop quality for large standalone images |
| #413 | /implement | executable-leaf | medium | — | Media loading UX: add skeletons and preloaders for heavy media |
| #414 | /implement | executable-leaf | medium | — | Jestei Pool case: add semantic subheadings to long multi-paragraph sections |
| #421 | /implement | executable-leaf | medium | — | Jestei track filter: replace seeded summary text with a real selected-filter state summary |
| #424 | /implement | executable-leaf | medium | — | Scenography media block: restore canonical image order and preserve panorama continuity |
| #426 | /implement | executable-leaf | medium | — | Styx Lookbook 2025: expand and clarify the section with representative photography |
| #427 | /wayfinder | foggy-program | medium | — | Styx social instructions: redesign the section and remove duplicated copy |
| #428 | /implement | executable-leaf | medium | — | Ofelia 2023: remove the black strip from photo 3 at the asset level |
| #429 | /implement | executable-leaf | medium | — | Shootings: expand every horizontal reel with the full available photo set |
| #440 | /implement | executable-leaf | medium | — | media: replace five technical video fallbacks with manual posters |
| #451 | /implement | executable-leaf | medium | — | cms: formalize isolated authoring branches and safe integration into dev |
| #452 | /implement | executable-leaf | medium | — | desk: make local editorial tooling read-only by default and guard write mode |
| #453 | /implement | executable-leaf | medium | — | desk: make content/media writes schema-validated, conflict-aware and atomic |
| #470 | /to-spec → /to-tickets | broad-clear-work | medium | — | cv: remove duplicate tools source and move results/experience ahead of toolbox |
| #473 | /implement | executable-leaf | medium | — | Jestei Pool case — clarify role, team ownership and credits |
| #478 | /implement | executable-leaf | medium | — | positioning: one professional brand with three specialization routes |
| #501 | /to-spec → /to-tickets | broad-clear-work | medium | — | [BEFORE-AFTER/CAPTION] summary text is hidden while component is excluded from lightbox |
| #531 | /diagnosing-bugs | hard-bug-or-regression | high | — | content: repair print line-break corruption in Sensetique equipment metadata |
| #533 | /implement | executable-leaf | medium | — | quality: classify and clean public CV spelling before enabling CSpell scope |
| #534 | /implement | executable-leaf | medium | — | quality: classify public Jestei docs spelling before enabling CSpell scope |
| #535 | /diagnosing-bugs | hard-bug-or-regression | high | — | [MEDIA CI INCIDENT] metadata-only CMS media verification path |
| #537 | /implement | executable-leaf | medium | — | test(media): decouple dedupe semantic baseline from legitimate editorial metadata updates |
| #539 | /implement | executable-leaf | medium | — | ci(media): verify placement-only MediaEntry semantic changes in required workflow |
| #540 | coordination-only | umbrella-with-children | high | #546, #554, #553 | legal(program): portfolio licensing, rights and provenance |
| #546 | /implement | executable-leaf | medium | — | audit: verify media, client and collaborator publication rights |
| #552 | /improve-codebase-architecture | architecture-health | medium | — | legal(release): activate Portfolio License 1.0 on production after CSS refactor |
| #553 | /implement | executable-leaf | medium | — | legal(media): separate internal reuse from rights metadata |
| #554 | /implement | executable-leaf | medium | — | legal(fonts): verify Pixelated MS Sans Serif provenance |
| #556 | /improve-codebase-architecture | architecture-health | medium | — | legal(release): activate Portfolio License 1.0 after CSS refactor closeout |
| #570 | /implement | executable-leaf | medium | — | [VISUAL DEBT] preserve documented compensation patches until source assets are corrected |
| #580 | /implement | executable-leaf | medium | — | [RUNTIME DEBT] Infinite reel cloned-track width and computed duration are timing-dependent |
| #585 | /improve-codebase-architecture | architecture-health | medium | — | [CSS ARCHITECTURE] lifecycle v2 — durable ownership, primitives and gradual components.css retirement |
| #615 | /to-spec → /to-tickets | broad-clear-work | medium | — | Editorial audit: исправить пункты 3–9 и закрыть регрессии |
| #647 | /implement | executable-leaf | medium | — | copy(audit): verify and correct Jestei CV cost claim |
| #648 | /implement | executable-leaf | medium | — | copy(audit): verify and correct Sensetique dates, typos, credits and mirrors |
| #649 | /implement | executable-leaf | medium | — | copy(audit): verify Berry, Mad Cow and LI-NE engagement periods |
| #651 | /implement | executable-leaf | medium | — | copy(audit): translate remaining Russian Styx credit titles in EN content |
| #667 | /implement | executable-leaf | medium | — | cms(home): add reversible logo-wall section visibility control |
| #670 | /implement | executable-leaf | medium | — | cms(home): expose whole logo-wall visibility toggle in Pages CMS |
| #676 | /to-spec → /to-tickets | broad-clear-work | medium | — | infra: expose AWFUL tools through Yandex MCP Gateway for ChatGPT and Codex |
| #677 | /wayfinder | foggy-program | medium | — | infra: define Cloudflare boundary for Yandex-backed AWFUL subdomains |
| #678 | /to-spec → /to-tickets | broad-clear-work | medium | — | cloud: complete AWFUL Yandex control-plane deployment |
| #679 | /implement | executable-leaf | medium | — | media: add Yandex Object Storage delivery layer without replacing Git-backed Media Catalog |
| #681 | /implement | executable-leaf | medium | — | agents: maintain a curated capability and skill registry for looksawful.ru |
| #683 | /wayfinder | foggy-program | medium | — | infra: define least-privilege Cloudflare boundary for AWFUL cloud services |
| #684 | /to-spec → /to-tickets | broad-clear-work | medium | — | agents: add cloud-integration skill and audit external skill sources |
| #687 | /improve-codebase-architecture | architecture-health | medium | — | refactor: establish deep-refactor characterization baseline and stage gates |
| #688 | /implement | executable-leaf | medium | — | quality(pets): bring standalone pet/game surfaces under explicit lint, style and test ownership |
| #689 | /wayfinder | foggy-program | medium | — | design: audit cross-site UX flows and state transitions before redesign |
| #701 | /implement | executable-leaf | medium | — | [yandex-control] webmaster-status |
| #702 | /implement | executable-leaf | medium | — | [yandex-control] metrika-access-check |
| #709 | coordination-only | umbrella-with-children | high | #718, #714, #711, #712, #710, #715, #716, #713 | feat(ai-pet): build Yandex-backed portfolio assistant pet |
| #710 | /wayfinder | foggy-program | medium | — | design(ai-pet): define pet + AI-mode UX inside shared Contact Hub |
| #713 | /wayfinder | foggy-program | medium | — | content(ai-pet): define strict public knowledge base, provenance and answer templates |
| #719 | /diagnosing-bugs | hard-bug-or-regression | high | — | analytics: eliminate live /cdn-cgi/trace 404 from country resolution |
| #720 | finish-existing-pr | leaf-with-open-pr | high | PR #722 | test(e2e): align production CV smoke with analytics bootstrap contract |
| #721 | finish-existing-pr | leaf-with-open-pr | high | PR #727 | test(e2e): add per-suite deadlines to full browser regression runner |
| #732 | /diagnosing-bugs | hard-bug-or-regression | high | — | debug: preserve Lab as private full-site and organism workspace |
| #745 | /implement | executable-leaf | medium | — | [maintenance] analytics-seo-upgrade |
| #746 | /to-spec → /to-tickets | broad-clear-work | medium | — | feat(contact): design Contact Hub with direct form and future AI mode |
| #747 | coordination-only | umbrella-with-children | high | #751, #749 | analytics: reliable portfolio measurement + Yandex search program |
| #749 | /implement | executable-leaf | medium | — | analytics(webvisor): retain historical hashed assets for reliable replay |
| #751 | /implement | executable-leaf | medium | — | seo(yandex): reconcile robots, sitemap, canonical URLs and indexing diagnostics |
| #765 | coordination-only | umbrella-with-children | high | #953, #955, #954 | Test suite audit & refactor: replace migration/source-regex guards with durable behavior and contract tests |
| #781 | /implement | executable-leaf | medium | — | [yandex-control] metrika-access-check |
| #791 | /implement | executable-leaf | medium | — | ci: scope GitHub Pages deployment permissions per job |
| #793 | /implement | executable-leaf | medium | — | seo: separate homepage previews from standalone case search content |
| #803 | coordination-only | umbrella-with-children | high | #875 | preview: source-side contract for private control plane |
| #808 | /implement | executable-leaf | medium | — | Media Desk Remote + Unified Media Graph |
| #835 | /implement | executable-leaf | medium | — | content(styx): rewrite social-instructions copy before restoring section |
| #836 | /implement | executable-leaf | medium | — | content(съёмки): rewrite intro and shooting headings before restoring text |
| #840 | /implement | executable-leaf | medium | — | lab: make immutable auth propagation verification fail closed |
| #861 | /to-spec → /to-tickets | broad-clear-work | medium | — | System audit: project components, Storybook, CMS and media parity |
| #868 | coordination-only | umbrella-with-children | high | #873 | retro/audit: harden compact homepage rollout after #834 |
| #873 | /implement | executable-leaf | medium | — | lab/storybook: keep compact preview stories synchronized with production renderer |
| #875 | /to-spec → /to-tickets | broad-clear-work | medium | — | preview: garbage-collect expired cms-preview source refs |
| #880 | /implement | executable-leaf | medium | — | Storybook inventory: classify orphan Subproject Card before canonical coverage |
| #889 | /implement | executable-leaf | medium | — | Storybook: extract a production renderer for Berserk Audio Player before canonical coverage |
| #894 | /implement | executable-leaf | medium | — | Storybook: cover Animated Canvas Gallery and Moves composition |
| #895 | /implement | executable-leaf | medium | — | Storybook: cover Jestei 3D theme organism |
| #896 | /to-spec → /to-tickets | broad-clear-work | medium | — | Storybook: cover Project Navigation lifecycle |
| #897 | /implement | executable-leaf | medium | — | Storybook: cover Analytics Consent UI without analytics side effects |
| #898 | /implement | executable-leaf | medium | — | Storybook: cover Jestei Track Filter specialized UI |
| #899 | /implement | executable-leaf | medium | — | Storybook: cover CV Experience and Expertise states |
| #900 | /implement | executable-leaf | medium | — | Storybook: cover remaining canonical content composition templates |
| #902 | /to-spec → /to-tickets | broad-clear-work | medium | — | Storybook: cover Awful Cases game renderer/runtime boundary |
| #929 | /implement | executable-leaf | medium | — | Storybook: canonical coverage for «Полезное» states, responsive layouts and project scaffolds |
| #930 | /implement | executable-leaf | medium | — | architecture: scaffold future Useful project pages without publishing routes |
| #931 | /implement | executable-leaf | medium | — | QA gate: Useful / Pet Projects preview before visual approval |
| #933 | /implement | executable-leaf | medium | — | Lab 3D model viewer: asset provenance, visual regression and delivery contract |
| #935 | /to-spec → /to-tickets | broad-clear-work | medium | — | 3D logo library: canonical SVG → GLB → Storybook for all projects/clients |
| #936 | /implement | executable-leaf | medium | — | Lab infrastructure: verify custom lab.looksawful.ru domain end-to-end |
| #942 | /to-spec → /to-tickets | broad-clear-work | medium | — | Investigate duplicate Moves Awful video resource requests in browser smoke |
| #943 | /to-spec → /to-tickets | broad-clear-work | medium | — | Test suite #765 handoff: finish runtime/E2E guard replacement, CSS wave cleanup, and source-regex cleanup |
| #953 | /implement | executable-leaf | medium | — | #765 blocker: make PhotoSwipe guard-removal PR pass exact-head preview/CI |
| #954 | /implement | executable-leaf | medium | — | #765 blocker: replay Embla behavior slice as a scoped current-dev PR |
| #955 | /implement | executable-leaf | medium | — | #765 blocker: add missing navigation behavior proof before deleting source-regex guard |
| #967 | /implement | executable-leaf | medium | — | Implement ProjectTeaser renderer before declaring Storybook parity |
| #968 | /implement | executable-leaf | medium | — | storybook: static LAB build stalls under concurrent repository workload |
| #969 | /implement | executable-leaf | medium | — | storybook: add deterministic viewport preview evidence for canonical state stories |
| #970 | /implement | executable-leaf | medium | — | storybook: reconcile generated responsive media with static LAB asset contract |
| #971 | /implement | executable-leaf | medium | — | tooling: document sparse-checkout requirements for repository verification worktrees |
| #972 | /to-spec → /to-tickets | broad-clear-work | medium | — | storybook: finish Media Lightbox overlay and focus lifecycle coverage |
| #973 | /implement | executable-leaf | medium | — | storybook: add integration runbook and reconciliation record for coverage-ci |
| #975 | /implement | executable-leaf | medium | — | storybook: add PR preview artifact for static LAB system |
| #976 | /implement | executable-leaf | medium | — | storybook: reconcile remaining 79 inventory sources after coverage waves |
| #978 | /implement | executable-leaf | medium | — | storybook: audit dependency/install warnings from LAB verification |
| #979 | /to-spec → /to-tickets | broad-clear-work | medium | — | storybook: add automated accessibility gate for canonical stories |
| #980 | /implement | executable-leaf | medium | — | storybook: make reduced-motion verification deterministic |
| #982 | /implement | executable-leaf | medium | — | storybook: verify canonical stories have no console/page errors |
| #984 | /implement | executable-leaf | medium | — | storybook: verify keyboard interaction contracts in browser |
| #985 | /wayfinder | foggy-program | medium | — | storybook: define Storybook package installation strategy for LAB builds |
| #987 | /implement | executable-leaf | medium | — | storybook: reconcile issue #884 after sparse-checkout root-cause correction |
| #989 | /implement | executable-leaf | medium | — | storybook: run CodeRabbit review before final coverage integration release |
| #997 | /implement | executable-leaf | medium | — | test(e2e): align full motion coverage contract with current homepage composition |
| #1000 | /implement | executable-leaf | medium | — | Media Desk: add constrained Useful card cover assignment |
| #1008 | /to-spec → /to-tickets | broad-clear-work | medium | — | Useful: reconcile remaining contract-closure requirements |
| #1009 | /implement | executable-leaf | medium | — | Branch cleanup ledger: 2026-09-17 |
| #1087 | /implement | executable-leaf | high | — | Private visual review pipeline and public-preview retirement |
| #1089 | finish-existing-pr | leaf-with-open-pr | high | PR #1122 | Private Review Hub thin slice |
| #1093 | /implement | executable-leaf | high | — | Sanitize historical public review surfaces |
| #1094 | /implement | executable-leaf | high | — | Repository privacy audit and rewrite decision |
| #1105 | coordination-only | umbrella-with-children | high | #1111, #1108, #1109, #1110 | Gallery phase 2: curated multi-format portfolio archive from Media Catalog |
| #1106 | coordination-only | umbrella-with-children | high | #1118, #1112, #1114, #1113, #1117, #1116, #1115 | Design system: production primitives for actions, labels, navigation and help |
| #1108 | finish-existing-pr | leaf-with-open-pr | high | PR #1130 | Gallery phase 2: define typed multi-format curation and rendering contract |
| #1109 | /implement | executable-leaf | medium | — | Gallery phase 2: curate and ingest approved 2D, production, video and character-sheet media |
| #1112 | /wayfinder | foggy-program | medium | — | Design system primitives: inventory existing usages and define semantic taxonomy |
| #1113 | /implement | executable-leaf | medium | — | Design system primitive: Button |
| #1114 | /implement | executable-leaf | medium | — | Design system primitives: Badge, Chip, Tag and Pill family |
| #1115 | /implement | executable-leaf | medium | — | Design system primitive: Tabs |
| #1116 | /implement | executable-leaf | medium | — | Design system primitive: Divider |
| #1117 | /to-spec → /to-tickets | broad-clear-work | medium | — | Design system primitive: Tooltip |
| #1141 | /implement | executable-leaf | medium | — | test: audit and simplify browser/E2E suite ownership |
| #1142 | coordination-only | umbrella-with-children | high | #1146, #1148, #1147, #1145, #1144, #1143 | Wayfinder: finish portfolio UX/IA rollout decisions |
| #1146 | /wayfinder | foggy-program | medium | — | Lock Gallery curation and series |
| #1166 | /implement | executable-leaf | high | — | Spec: exhaustive text review Round 2 |
| #1167 | finish-existing-pr | leaf-with-open-pr | high | PR #1175 | Round 2 contract + Home thin slice |

## Operating rule

Work the frontier **blockers-first / leaves-first**:

1. finish existing PRs before creating parallel implementations;
2. prefer leaves that unlock blocked work;
3. run hard regressions through `/diagnosing-bugs`;
4. implement already-shaped leaves with `/implement`;
5. do not implement coordination umbrellas directly;
6. only create new specs/tickets for broad active work that genuinely lacks executable children;
7. reserve `/wayfinder` for unresolved decisions, not as another backlog layer.

Umbrellas close as their children and final verification close them. The frontier should be regenerated whenever dependencies are closed or new child tickets are created.
