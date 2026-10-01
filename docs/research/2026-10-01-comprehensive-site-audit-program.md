# looksawful.ru — comprehensive site audit program

Status: **ACTIVE / audit charter**
Created: 2026-10-01
Primary branch: `dev`
Scope owner: looksawful.ru site / portfolio program

## Purpose

Run a complete, evidence-led audit of looksawful.ru before major interface and design-system changes.

The audit is not a redesign by intuition and not a checklist-only exercise. It must establish:

1. what the site currently does and how it behaves;
2. what is intentionally authored versus accidental drift;
3. where user experience, visual system, accessibility, responsive behavior, performance, content, or implementation quality breaks down;
4. which patterns are genuinely reusable and belong in the design system;
5. which specialized project surfaces must remain visually distinct;
6. which improvements have enough evidence to enter implementation;
7. which changes require owner/art-direction decisions before engineering.

The output is a decision-ready improvement program, not a pile of findings.

## Existing evidence to preserve

This program supersedes neither previous audits nor their evidence.

Existing source material:

- `docs/research/2026-09-30-ui-surface-inventory.md` — source-complete first-pass UI surface inventory; live-browser measurement still pending.
- `docs/storybook/ui-inventory-audit.md` — historical Storybook/system inventory and denominator correction.
- GitHub #861 — system audit: project components, Storybook, CMS and media parity.
- GitHub #1106 — production UI primitives stream.
- GitHub #1112 — semantic UI inventory/taxonomy.
- GitHub #1113–#1118 — Button, compact labels, Tabs, Divider, Tooltip, production migration.
- GitHub #245 — site-wide responsive/accessibility baseline.
- GitHub #929 — Storybook coverage for responsive layouts/project scaffolds.
- GitHub #1142 — portfolio UX/IA rollout decisions.
- PR #1211 — Storybook layout primitive coverage.
- PR #1212 — intrinsic split for paired code blocks.

These become Phase 0 evidence. They are not automatically accepted as current runtime truth.

## Source-of-truth contract

- Repository code + current browser runtime: actual implementation truth.
- GitHub issues/PRs: technical ownership, acceptance, implementation state.
- This document + dated audit reports: audit methodology and evidence record.
- Asana audit project: execution sequencing, gates, human decisions, status.
- Storybook/LAB: approval/test surfaces, never a substitute for production runtime.
- Notion/Drive: supporting product/content/reference context when a question requires it.

No second implementation backlog is created inside audit documents.

## Research baseline

Primary sources used to define the audit standard:

### Accessibility and interaction semantics

- WCAG 2.2:
  https://www.w3.org/TR/WCAG22/
- WCAG 2.2 additions / focus, dragging, target-size, authentication:
  https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/
- WAI-ARIA Authoring Practices Guide:
  https://www.w3.org/WAI/ARIA/apg/
- APG patterns:
  https://www.w3.org/WAI/ARIA/apg/patterns/
- APG practices for keyboard, names, landmarks, range widgets and high-contrast behavior:
  https://www.w3.org/WAI/ARIA/apg/practices/

Target: WCAG 2.2 AA for public surfaces. AAA criteria may be adopted selectively where they materially improve usability.

### Component/system testing

- Storybook testing:
  https://storybook.js.org/docs/writing-tests
- Storybook accessibility testing:
  https://storybook.js.org/docs/writing-tests/accessibility-testing
- Storybook interaction testing:
  https://storybook.js.org/docs/writing-tests/interaction-testing

Automated accessibility checks are a first line of QA, not proof of full accessibility. Manual keyboard, screen-reader/accessibility-tree, zoom, responsive and perception checks remain required.

### Performance

- Core Web Vitals:
  https://web.dev/articles/vitals
- Web Vitals measurement:
  https://web.dev/articles/vitals-measurement-getting-started
- Core Web Vitals tooling workflow:
  https://web.dev/articles/vitals-tools

Initial target references:
- LCP <= 2.5 s at p75;
- INP <= 200 ms at p75;
- CLS <= 0.1 at p75;
- mobile and desktop measured separately.

Lab metrics are used for regression diagnosis; field/RUM data outranks lab for real-user conclusions.

### Design systems

- USWDS:
  https://designsystem.digital.gov/
- GOV.UK Design System components:
  https://design-system.service.gov.uk/components/
- GOV.UK accessibility strategy:
  https://design-system.service.gov.uk/accessibility/accessibility-strategy/
- Design Tokens Community Group:
  https://www.designtokens.org/
- Design Tokens Format Module 2025.10:
  https://www.designtokens.org/TR/2025.10/format/

Principle: reusable components require semantics, usage guidance, states, accessibility behavior, tokens, tests and ownership. Similar shape alone is not a component taxonomy.

### Search/discoverability

- Google Search Central:
  https://developers.google.com/search/docs

SEO is audited as a product/discoverability layer: crawlability, indexability, metadata, structured page meaning, duplicate content, preview quality and performance interaction.

## Skill stack

Use specialized skills as bounded lenses, not as competing authorities.

### Installed / available in current environment

1. **Research**
   - primary-source investigation;
   - standards and implementation research;
   - findings captured in repository Markdown.

2. **engineering-suite-ui-audit / Impeccable audit**
   - technical quality audit;
   - accessibility;
   - responsive behavior;
   - performance;
   - production UI quality.

3. **Comprehensive QA**
   - user journeys;
   - states;
   - invalid/boundary behavior;
   - regressions;
   - browser/platform checks.

4. **Constraint-driven development**
   - converts audit conclusions into persistent measurable quality bars;
   - creates/maintains project constraints rather than relying on agent memory.

5. **Browser testing with DevTools**
   - real DOM;
   - computed styles;
   - screenshots;
   - console/network;
   - accessibility tree;
   - performance traces.

6. **Product Design audit**
   - screenshot/flow evidence model for product-facing UX review.
   - Use in an environment where the required browser capture workflow is available.

### Useful external skill references found through omgskills

- `addyosmani/web-quality-skills:web-quality-audit`
- `addyosmani/web-quality-skills:accessibility`
- `addyosmani/web-quality-skills:performance`
- `addyosmani/web-quality-skills:core-web-vitals`
- `wondelai/skills:ux-heuristics`
- `pbakaus/impeccable:impeccable`
- `daffy0208/ai-dev-standards:skills/design-system-architect`

Do not install duplicate skills merely because the catalogue contains them. Prefer current installed equivalents unless the external skill provides a missing procedure.

## Audit evidence hierarchy

Every finding must state its evidence class.

From strongest to weakest:

1. **runtime-observed** — reproduced in current browser/runtime;
2. **runtime-measured** — geometry, performance, contrast, focus, accessibility tree or interaction measured;
3. **source-confirmed** — current production source directly proves the behavior;
4. **test-confirmed** — existing automated test proves a contract;
5. **content-confirmed** — current canonical authored content/data;
6. **historical evidence** — old issue, screenshot, audit or document;
7. **hypothesis** — plausible but not yet verified.

A hypothesis cannot become an implementation task until verified or explicitly accepted by owner decision.

## Finding record

Every substantive finding must contain:

- ID;
- audit area;
- route/surface/component;
- user task affected;
- device/input/state;
- evidence type;
- screenshot / trace / DOM / source references;
- observed behavior;
- expected/desired behavior;
- standard or product principle;
- impact;
- reach;
- confidence;
- severity;
- recommendation;
- current canonical owner;
- implementation issue/task if created;
- regression test required;
- human decision required: yes/no;
- status.

## Severity model

Severity is not visual annoyance alone.

### S0 — release/correctness blocker
- inaccessible critical journey;
- data/action corruption;
- navigation trap;
- major public surface broken;
- severe runtime regression.

### S1 — high-impact
- blocks or materially harms a common task;
- major mobile/responsive failure;
- keyboard/accessibility failure on important interaction;
- severe performance/visual-stability issue;
- system inconsistency causing repeated defects.

### S2 — meaningful
- noticeable usability friction;
- inconsistent reusable pattern;
- confusing hierarchy/content;
- moderate accessibility or responsive problem;
- repeated local design debt.

### S3 — polish/opportunity
- visual refinement;
- microcopy;
- low-reach edge case;
- non-blocking craft improvement.

Priority is decided from **severity × reach × confidence × strategic value**, not severity alone.

## Coverage model

The audit matrix is:

**route archetype × component family × viewport × input × state × user task**

### Route archetypes

At minimum:
- Home;
- Work / flagship Case;
- ordinary Project;
- specialized interactive Project;
- Gallery;
- Shootings;
- CV;
- Privacy;
- 404;
- Services surfaces when enabled/public;
- hidden-but-enabled QA routes where relevant.

All enabled routes still get automated structural checks. Representative archetypes get deep manual review.

### Canonical viewport matrix

Primary:
- 1440×1000 — desktop, fine pointer;
- 834×1112 — tablet/touch;
- 390×844 — modern mobile/coarse pointer;
- 320×568 — narrow/reflow stress;
- 844×390 — short landscape.

Additional:
- 200% text zoom;
- browser zoom where relevant;
- reduced motion;
- forced/high contrast where supported;
- keyboard-only;
- touch/coarse pointer;
- no-hover;
- slow CPU/network performance profile.

### Browser matrix

Deep pass:
- current Chromium.

Regression smoke:
- Firefox;
- WebKit/Safari-compatible engine.

Cross-browser differences must be recorded rather than silently normalized away.

## Phase plan

# Phase 0 — audit contract and baseline

Outputs:
- this charter;
- authoritative source map;
- current route manifest;
- current component/surface inventory;
- current open-issue reconciliation;
- quality-bar draft;
- baseline browser/test/tool capabilities.

Tasks:
1. Freeze audit scope and non-goals.
2. Reconcile old audit evidence with current `dev`.
3. Inventory routes, templates, compositions, components and specialized surfaces.
4. Record current test/Storybook/LAB coverage.
5. Record measurement/tooling availability and blockers.

Gate:
No broad design-system implementation begins until Phase 0 inventory is trustworthy.

# Phase 1 — user goals, UX and information architecture

Audit:
- first-visit comprehension;
- portfolio positioning;
- Work/Gallery/CV discovery;
- project-to-project navigation;
- route hierarchy;
- breadcrumbs/current-location signals;
- contact path;
- external links;
- dead ends;
- click/step count for key journeys;
- cognitive load;
- naming consistency;
- discoverability of hidden/secondary content;
- mobile navigation;
- back/forward/deep-link behavior.

Key journeys:
1. Home → understand role/specialization → open strongest work.
2. Home → Work → another relevant case.
3. Home → Gallery → lightbox/series → return.
4. Home/project → CV.
5. Home/project → contact.
6. Mobile menu → Work/Gallery/CV.
7. Specialized project → interact → recover/navigation.
8. Direct deep link → understand context → continue exploring.

Outputs:
- journey map;
- IA issues;
- navigation decision list;
- UX finding ledger.

# Phase 2 — visual hierarchy and editorial design

Audit:
- hierarchy;
- typography scale and roles;
- line length;
- rhythm;
- spacing;
- alignment;
- density;
- section boundaries;
- foreground/background contrast;
- emphasis;
- consistency versus intentional variance;
- image/copy balance;
- caption/metadata hierarchy;
- visual affordance;
- authored asymmetry versus accidental misalignment.

Portfolio-specific principle:
The artifact should lead; the interface should recede unless interaction needs stronger affordance.

Outputs:
- visual-system map;
- typography/spacing/layout findings;
- intentional-exception register.

# Phase 3 — design tokens and foundations

Inventory and evaluate:
- color tokens;
- typography tokens;
- spacing;
- radii;
- borders;
- focus ring;
- control sizes;
- z-index/layers;
- motion durations/easings;
- container/layout primitives;
- breakpoints/container queries;
- safe-area behavior;
- semantic versus raw tokens;
- duplicated magic values.

Check whether token organization can move toward stable semantic ownership and DTCG-compatible concepts without forcing a migration for its own sake.

Outputs:
- token map;
- duplicate-value map;
- semantic-token proposal;
- migration risks.

# Phase 4 — component taxonomy and design system

Use semantic role first, visual shape second.

Families:
- Button/action;
- Links;
- Badge;
- Chip;
- Tag;
- Tabs;
- Divider;
- Tooltip;
- Counters/labels;
- navigation;
- cards;
- media controls;
- overlays/dialogs/sheets;
- sliders/ranges;
- Gallery/lightbox;
- forms/contact;
- consent;
- project navigation.

For every candidate:
- semantic role;
- native element/ARIA model;
- interactive/noninteractive;
- variants;
- states;
- responsive behavior;
- keyboard/touch;
- long-content behavior;
- tokens;
- current call sites;
- duplicates;
- Storybook owner;
- tests;
- exceptions.

Existing conclusion remains provisional until runtime pass:
- Pill is shape/token unless distinct semantics appear;
- Tag should not exist as a wrapper without a real use;
- specialized Jestei/Berserk/Moves/Awful Cases visual language remains local.

Outputs:
- canonical taxonomy;
- component API/state matrix;
- migration map;
- exception registry.

# Phase 5 — responsive/adaptive behavior

Audit every representative surface for:
- reflow;
- width constraints;
- horizontal overflow;
- accidental two-column mobile layouts;
- horizontal rails;
- container query transitions;
- viewport height constraints;
- safe areas;
- image/video/object sizing;
- typography wrapping;
- cards;
- navigation;
- lightbox;
- bottom sheets;
- touch controls;
- orientation changes;
- 3D/model viewer.

No breakpoint is accepted because it exists in CSS. It must correspond to observed layout intent.

Outputs:
- viewport evidence set;
- responsive defect ledger;
- canonical layout-condition map.

# Phase 6 — accessibility

Target: WCAG 2.2 AA plus selected stronger criteria where practical.

Automated:
- axe/Storybook a11y;
- Lighthouse accessibility;
- semantic/static checks.

Manual/runtime:
- keyboard order;
- focus visible/not obscured;
- accessible names;
- landmarks;
- headings;
- dialogs;
- tabs;
- sliders/ranges;
- current/selected/pressed states;
- target sizes;
- contrast;
- 200% zoom/reflow;
- reduced motion;
- forced colors/high contrast;
- touch alternatives;
- meaningful alt/captions;
- dynamic announcements;
- screen-reader/accessibility-tree review.

Outputs:
- criterion-linked findings;
- accessibility exception list;
- regression candidates.

# Phase 7 — interactions, motion and feedback

Audit:
- hover dependencies;
- pointer/touch parity;
- keyboard parity;
- active/pressed/selected/current distinctions;
- loading;
- disabled;
- empty;
- error;
- success;
- retry;
- dismissal;
- Escape behavior;
- focus restoration;
- drag alternatives;
- motion purpose;
- reduced-motion behavior;
- scroll-driven effects;
- transition interruption;
- accidental layout-animation;
- microinteraction consistency.

Outputs:
- state matrix;
- motion map;
- interaction defects.

# Phase 8 — media, Gallery, 3D and specialized experiences

Audit:
- image quality and cropping;
- responsive sources;
- video/autoplay/poster behavior;
- captions;
- loading/deferred behavior;
- Gallery curation behavior;
- lightbox context;
- series counters/navigation;
- 3D viewer controls;
- GLB/model performance;
- fallback behavior;
- Jestei filter;
- Berserk audio;
- Moves;
- Awful Cases;
- other experimental surfaces.

Rule:
Shared accessibility/system contracts do not require shared art direction.

Outputs:
- specialized-surface reports;
- reusable-contract candidates;
- explicit exceptions.

# Phase 9 — content, UX copy and editorial consistency

Audit:
- headings;
- labels;
- CTA wording;
- role/project naming;
- metadata;
- terminology;
- repetitive copy;
- unclear labels;
- long Russian copy behavior;
- English-readiness where architecture depends on it;
- alt/caption quality;
- error/help copy;
- stale content;
- invented/unsupported claims.

This phase references existing text-review tracks rather than duplicating their rewrite backlog.

Outputs:
- UI-copy findings;
- terminology map;
- cross-links to canonical content issues.

# Phase 10 — performance and runtime quality

Measure:
- LCP;
- INP or lab proxy/TBT where field interaction data is unavailable;
- CLS;
- JS execution/long tasks;
- media transfer;
- fonts;
- 3D cost;
- image/video loading;
- lazy/deferred behavior;
- layout shifts;
- unnecessary listeners/observers;
- animation cost;
- console errors/warnings;
- network failures;
- cache behavior.

Separate:
- lab baseline;
- field data;
- hypotheses.

Outputs:
- performance baseline;
- bottleneck ledger;
- budgets/ratchets proposed from actual baseline.

# Phase 11 — Storybook, LAB, tests and system parity

Audit:
- production owner coverage;
- page archetypes;
- component states;
- responsive states;
- interaction tests;
- a11y checks;
- visual tests;
- experimental versus canonical stories;
- real production data/styles;
- source metadata;
- inventory denominator;
- missing regression coverage.

Do not optimize a coverage percentage until the denominator is trustworthy.

Outputs:
- parity matrix;
- missing-story/test backlog;
- CI candidates.

# Phase 12 — SEO, metadata and public discoverability

Audit:
- title/description;
- canonical URL;
- OG/social previews;
- indexability/listing;
- robots/sitemap;
- structured semantics;
- internal linking;
- duplicate or thin pages;
- image metadata where relevant;
- performance/search interaction;
- public/private route boundaries.

Outputs:
- SEO/discovery findings;
- metadata corrections;
- explicit route publication decisions.

# Phase 13 — synthesis and improvement program

Cluster findings by root cause instead of creating one issue per symptom.

Examples:
- focus-ring ownership;
- control-size scale;
- layout primitive misuse;
- duplicated media control grammar;
- navigation IA;
- Gallery interaction contract;
- token duplication;
- Storybook parity;
- mobile rail regression.

For each cluster:
1. evidence;
2. affected surfaces;
3. user impact;
4. system/root cause;
5. proposed direction;
6. dependency/risk;
7. implementation owner;
8. regression proof;
9. human decision if required.

Outputs:
- ranked improvement program;
- quick wins;
- structural changes;
- deferred opportunities;
- decision-ready human gates.

# Phase 14 — implementation handoff and re-audit

Audit project does not silently implement redesigns.

For approved findings:
- route to existing GitHub owner where possible;
- create a new issue only when no canonical owner exists;
- add acceptance criteria and evidence;
- implement separately;
- verify against exact evidence matrix;
- rerun affected audit slice;
- update finding status.

Final gate:
No finding is considered fixed solely because code changed.

## Quality-bar strategy

Use constraint-driven development after the baseline is measured.

Initial hard targets may include:
- zero S0 unresolved public-route defects;
- zero critical/serious automated a11y violations;
- no known keyboard traps;
- WCAG 2.2 AA target for public surfaces;
- no accidental horizontal page overflow at canonical narrow widths;
- LCP/INP/CLS target references from Core Web Vitals;
- clean production console for representative routes;
- canonical interactive primitives have explicit focus/keyboard/touch contracts;
- production-backed Storybook for shared primitives;
- no new duplicated component semantics.

If current baseline fails a target badly, record current value and ratchet. Do not weaken a standard merely to make CI green.

## Documentation structure

Planned durable artifacts:

```
docs/research/
  2026-10-01-comprehensive-site-audit-program.md   # this charter

docs/audit/
  index.md
  surface-matrix.md
  findings.md
  decisions.md
  exceptions.md
  baseline/
    routes.md
    browser-runtime.md
    accessibility.md
    performance.md
  ux/
  visual/
  design-system/
  responsive/
  accessibility/
  interaction-motion/
  media-3d/
  performance/
  storybook/
  seo/
  reports/
```

Do not create every file empty. Create a document only when that workstream produces evidence.

## Finding lifecycle

`DISCOVERED → VERIFIED → TRIAGED → DECISION_NEEDED | READY → IMPLEMENTING → VERIFYING → CLOSED`

Alternate terminal states:
- `DUPLICATE`
- `INTENTIONAL_EXCEPTION`
- `DEFERRED`
- `NOT_REPRODUCIBLE`

## Human gates

Owner/art-direction review is required for:
- navigation model changes;
- visual hierarchy changes that alter portfolio identity;
- typography/font changes;
- major color/token changes;
- Gallery membership/curation;
- project visibility/publication;
- copy/claim changes;
- specialized-project art direction;
- removal of intentionally authored interaction.

No human gate is needed for obvious correctness defects when the intended behavior is already documented, such as broken keyboard semantics, accidental overflow, inaccessible labels or implementation regressions.

## Project completion criteria

The audit is complete when:

- every enabled public route is represented in the structural crawl;
- every route archetype has deep evidence;
- every major reusable UI family has a semantic/system classification;
- canonical viewport/input/state matrices are executed;
- accessibility manual + automated passes are recorded;
- performance baseline exists;
- Storybook/LAB/system parity is measured truthfully;
- all findings are evidence-linked and deduplicated by root cause;
- each high-impact finding has an owner or explicit decision gate;
- approved improvements are represented in canonical GitHub owners;
- a final audit report explains current strengths, weaknesses, system opportunities and recommended execution order.

The output should make a later redesign or refinement substantially safer because the team knows what is intentional, what is broken, what is shared, what is exceptional, and how success will be verified.
