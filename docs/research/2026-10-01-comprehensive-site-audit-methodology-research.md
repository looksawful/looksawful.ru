# Research: evidence model for the comprehensive looksawful.ru site audit

Date: 2026-10-01  
Status: research input to `docs/research/2026-10-01-comprehensive-site-audit-program.md`  
Scope: audit methodology only; no implementation changes

## Research question

What should a rigorous UI/UX/design-system audit of looksawful.ru include so that the output is defensible, complete enough to drive serious improvement, and resistant to common failure modes such as checklist theatre, over-reliance on Lighthouse/axe, over-generalising a component library, or mistaking historical documentation for current runtime truth?

## Executive conclusions

The existing comprehensive audit charter is directionally strong, but primary-source research suggests seven important hardenings:

1. Use **WCAG-EM 2.0** as the formal evaluation skeleton for accessibility and as a useful model for the broader audit: scope → explore product → representative sample → evaluate → report.
2. Do not rely only on hand-picked route archetypes. Add a **small random sample** of enabled routes/states in addition to the structured sample to catch blind spots.
3. Treat isolated component checks and production-context checks as two separate gates. A component that passes in Storybook is not proven accessible or usable in the site.
4. For Vite-powered Storybook, verify whether the current test architecture should use the **Vitest addon** rather than the legacy test-runner, which Storybook now describes as superseded.
5. Require evidence of both **usefulness and uniqueness** before promoting a visual pattern into a canonical design-system primitive. Similar shape is not sufficient.
6. Treat field Core Web Vitals at p75 as outcome evidence; use lab traces as diagnostic evidence. Do not turn Lighthouse into a single “site quality score”.
7. Add an explicit assistive-technology / user-validation lane for complex and high-impact interactions. Automated checks remain a first line, not conformance proof.

## 1. Audit structure: WCAG-EM 2.0 is the strongest formal model

W3C published WCAG Evaluation Methodology (WCAG-EM) 2.0 on 23 July 2026. It now applies to digital products beyond ordinary web pages and gives a five-step procedure:

1. define evaluation scope;
2. explore the product;
3. select a representative sample;
4. evaluate the sample;
5. report findings.

Source:
- W3C WAI, WCAG-EM overview: https://www.w3.org/WAI/test-evaluate/conformance/wcag-em/

### Implication for looksawful.ru

The audit charter should preserve its domain-specific phases, but all evidence should fit a higher-order lifecycle:

- **Scope**: public routes, enabled hidden QA routes, supported devices/input modes, target standard.
- **Explore**: route manifest, page archetypes, component families, specialized surfaces, state model, technologies.
- **Sample**: structured archetypes plus random checks.
- **Evaluate**: runtime, source, test and content evidence.
- **Report**: finding ledger, root-cause clusters, decisions and implementation ownership.

This is preferable to treating the 16 audit sections as independent checklists.

## 2. Sampling: archetypes alone are not enough

WCAG-EM explicitly includes both structured and randomly selected views when complete evaluation is impractical.

Source:
- W3C WAI, WCAG-EM overview: https://www.w3.org/WAI/test-evaluate/conformance/wcag-em/

### Recommended sampling model

Use three layers:

### A. Exhaustive structural crawl

Every enabled route gets cheap checks:

- load succeeds;
- title / main landmark / H1 or documented equivalent;
- no console error;
- no accidental horizontal page overflow;
- canonical metadata / indexability state is coherent;
- primary navigation and return path exist where expected.

### B. Structured deep sample

Deep audit the known archetypes:

- Home;
- flagship Case;
- ordinary Project;
- specialized interactive Project;
- Gallery;
- Shootings;
- CV;
- Privacy;
- 404;
- Services when enabled/public.

### C. Random sample

At each audit cycle, select a small random subset from the remaining enabled pages or component-state combinations and run the same deep checklist used for its archetype.

Purpose:
- detect unexpected per-page divergence;
- prevent the audit from only proving the screens the auditor already expects to work;
- reveal content-length, media and uncommon-state failures.

Random sampling should supplement, not replace, deliberately chosen high-risk routes.

## 3. Accessibility: automation is necessary and insufficient

Storybook describes its accessibility addon as a **first line of QA**. The current documentation says axe-core can automatically catch up to 57% of WCAG issues; it also exposes “Incomplete” results that require manual confirmation.

Source:
- Storybook, Accessibility tests: https://storybook.js.org/docs/writing-tests/accessibility-testing

GOV.UK Design System explicitly says using the design system does not automatically make a service accessible. Their process combines automated tests with manual inspection, browser developer tools, accessibility-tree inspection and assistive-technology testing.

Source:
- GOV.UK Design System, Accessibility strategy: https://design-system.service.gov.uk/accessibility/accessibility-strategy/

W3C WCAG-EM also recommends involving users with disabilities to understand real-life experience.

Source:
- W3C WAI, WCAG-EM overview: https://www.w3.org/WAI/test-evaluate/conformance/wcag-em/

### Required split for looksawful.ru

Accessibility evidence should have four distinct layers:

1. **Static/automated**
   - axe / Storybook a11y;
   - HTML validation;
   - deterministic semantic checks.

2. **Browser/manual**
   - keyboard;
   - focus order and visibility;
   - target geometry;
   - zoom/reflow;
   - reduced motion;
   - forced colors/high contrast;
   - touch/no-hover;
   - accessibility tree.

3. **Pattern-contract**
   - dialogs, tabs, disclosure, slider/range and custom widget behavior checked against WAI-ARIA APG.

4. **Assistive-technology / user validation**
   - high-risk or unusual interactive surfaces;
   - especially Gallery/lightbox, Contact Hub, custom audio/seek control, Jestei filter, 3D viewer and any non-native custom widget.

A site-wide WCAG claim must not be inferred from Storybook or Lighthouse alone.

## 4. ARIA semantics imply behavior, not just roles

The WAI-ARIA Authoring Practices Guide establishes interaction conventions for common patterns.

Sources:
- APG Patterns: https://www.w3.org/WAI/ARIA/apg/patterns/
- Keyboard interface: https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/
- Tabs: https://www.w3.org/WAI/ARIA/apg/patterns/tabs/
- Dialog: https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
- Disclosure: https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/

Examples relevant to the current site:

- a disclosure control must expose expanded state and support activation via keyboard;
- tabs have a tablist/tab/tabpanel model with expected arrow-key behavior;
- modal dialogs require contained focus behavior, Escape handling and an accessible name;
- custom ARIA widgets require authors to implement keyboard interaction that native elements would otherwise supply automatically.

### Audit rule

Every custom role must create a **behavioral obligation** in the finding matrix.

For each role-based custom control, record:

- promised role;
- required states/properties;
- keyboard model;
- focus behavior;
- pointer/touch behavior;
- screen-reader/accessibility-tree representation;
- fallback if JS fails.

If the project can use an appropriate native element instead, native behavior should be the default comparison point.

## 5. Storybook: production parity is more important than story count

Current Storybook guidance supports:

- render tests;
- interaction tests through `play`;
- accessibility tests;
- browser-based component tests through the Vitest addon.

Sources:
- Storybook, How to test UIs: https://storybook.js.org/docs/writing-tests
- Storybook, Interaction tests: https://storybook.js.org/docs/writing-tests/interaction-testing
- Storybook, Accessibility tests: https://storybook.js.org/docs/writing-tests/accessibility-testing
- Storybook, Vitest addon: https://storybook.js.org/docs/writing-tests/integrations/vitest-addon

Storybook now states that its legacy test-runner has been superseded by the Vitest addon for Vite-powered projects.

Source:
- Storybook, Test runner: https://storybook.js.org/docs/11/writing-tests/integrations/test-runner

### Implication for looksawful.ru

Because looksawful.ru uses Vite, the audit should explicitly inspect the current Storybook test harness and classify it as:

- current/recommended;
- legacy-but-valid;
- migration candidate.

Do **not** migrate merely because newer tooling exists. Migration becomes justified only if it:

- removes an actual coverage gap;
- improves parity with the production Vite environment;
- consolidates duplicate testing infrastructure;
- or materially improves CI/runtime feedback.

### Coverage rule

A story counts as useful coverage only when it is tied to a canonical production owner and proves a meaningful state or behavior.

Do not reward:

- copied fixture APIs;
- Storybook-only component variants;
- experimental prototypes counted as production coverage;
- percentage growth from splitting one owner into several trivial stories.

## 6. Design-system promotion: useful + unique + proven in context

GOV.UK Design System contribution criteria require component/pattern proposals to be both useful and unique, with evidence that they solve a real repeated need rather than duplicate an existing component.

Source:
- GOV.UK Design System, Contribution criteria: https://design-system.service.gov.uk/community/contribution-criteria/

USWDS likewise couples components with UX, accessibility and implementation guidance rather than treating components as styled wrappers.

Source:
- USWDS: https://designsystem.digital.gov/

USWDS component accessibility pages explicitly warn that isolated component success still needs verification in the context of the consuming site.

Example:
- USWDS Collection accessibility tests: https://designsystem.digital.gov/components/collection/accessibility-tests/

### Promotion rule for looksawful.ru

A visual pattern becomes a canonical primitive only if at least one of these is true:

1. it appears in multiple genuinely independent production contexts with the same semantic role;
2. it is a cross-site interaction contract that must be centralized for correctness/accessibility;
3. it has a single current use but is clearly a site-shell primitive with an expected reuse contract.

Otherwise:
- keep it local;
- keep it as a token/variant;
- or defer extraction.

This directly supports the current conclusions:
- Pill is a shape/token unless a distinct semantic role appears;
- Tag should not exist merely to fill a taxonomy;
- specialized Jestei/Berserk/Moves/Awful Cases visuals should remain local unless a shared behavioral contract is proven.

## 7. Tokens: standardize exchange format only when it helps ownership

The Design Tokens Community Group published a stable 2025.10 format specification. It defines token values, explicit types, groups and aliases/references.

Source:
- DTCG Format Module 2025.10: https://www.designtokens.org/TR/2025.10/format/

Important nuance from the specification:
- token type has defined meaning;
- groups are arbitrary organizational containers and tools should not infer type/purpose from them;
- aliases can express relationships between tokens.

### Implication

The audit should not equate “we have grouped CSS variables” with a semantic token system.

For each token family inspect:

- value owner;
- semantic intent;
- alias/reference relationship;
- call sites;
- whether variants derive from a semantic token or repeat literals;
- whether changing the token would have coherent consequences.

Adopting DTCG JSON is optional. The audit goal is semantic ownership and interoperability, not a format migration ceremony.

## 8. Performance: field outcome, lab diagnosis

Core Web Vitals currently define:

- LCP: good at ≤ 2.5 s;
- INP: good at ≤ 200 ms;
- CLS: good at ≤ 0.1;

measured at the 75th percentile and segmented across mobile and desktop.

Sources:
- Web Vitals: https://web.dev/articles/vitals
- LCP: https://web.dev/articles/lcp
- INP: https://web.dev/articles/inp
- CLS: https://web.dev/articles/cls
- Threshold methodology: https://web.dev/articles/defining-core-web-vitals-thresholds
- Field measurement: https://web.dev/articles/vitals-field-measurement-best-practices

### Audit rule

Separate three evidence classes:

1. **Field**
   - CrUX / RUM;
   - p75;
   - mobile and desktop separately.

2. **Lab**
   - Lighthouse / trace / throttled profile;
   - repeatable diagnosis;
   - not a substitute for real-user distributions.

3. **Component/runtime**
   - long tasks;
   - layout shifts;
   - media cost;
   - 3D/model viewer cost;
   - event handler/observer lifecycle.

The audit should not collapse accessibility, SEO, performance and best-practice scores into one synthetic “site score”.

## 9. SEO/discoverability: treat it as site behavior, not a ranking superstition layer

Google Search documentation emphasizes technical accessibility to crawlers, canonicalization, search appearance, structured data and overall page experience rather than a single optimization trick.

Sources:
- Search appearance: https://developers.google.com/search/docs/appearance
- Canonicalization: https://developers.google.com/search/docs/crawling-indexing/canonicalization
- Page experience: https://developers.google.com/search/docs/appearance/page-experience
- Search help / SEO Starter Guide entry: https://developers.google.com/search/help

### Audit implication

For a portfolio, SEO/discovery review should focus on:

- whether intended public routes are crawlable/indexable;
- whether intentionally private/hidden routes remain excluded;
- canonical URL consistency;
- unique and descriptive titles/snippets;
- internal links that let users and crawlers discover important work;
- image/video search metadata where relevant;
- mobile usability and Core Web Vitals;
- duplicate/thin page risks.

Avoid treating Lighthouse SEO score as a proxy for actual public discoverability.

## 10. Recommended changes to the existing audit charter

The current charter does not need a structural rewrite. It should be hardened with the following additions when the project moves to spec/tickets:

### Add to Phase 0

- Explicit WCAG-EM 2.0 framing.
- Structured sample + random sample.
- Baseline of available field data versus lab-only evidence.
- Test-harness status: current, legacy-but-valid, or migration candidate.

### Add to accessibility phase

- Four-layer evidence model: automated, browser/manual, APG pattern-contract, assistive-tech/user validation.
- Explicit statement that automated “pass” is not a conformance conclusion.

### Add to design-system phase

- Promotion gate: useful + unique + production-proven.
- Require isolated and in-context verification for shared primitives.
- Record local exceptions as intentional, not as “missing standardization”.

### Add to Storybook phase

- Audit current Vite/Storybook test architecture against Vitest-addon recommendation.
- Keep migration evidence-driven.
- Coverage denominator based on production owners, not story-module count.

### Add to performance phase

- Field/lab separation.
- p75 mobile/desktop CWV.
- Runtime cost of specialized media and 3D treated as first-class.

### Add to closure gate

A complete audit must include:
- the structured deep sample;
- the random sample;
- an explicit list of untested or inaccessible states;
- no claims of complete accessibility from automation alone.

## What should NOT be added

Research does not support expanding the project with:

- another parallel component inventory;
- another design-system tool merely for governance;
- a new dependency just to store design tokens;
- a mandatory DTCG migration;
- a generic score combining UX, accessibility and performance;
- one GitHub issue per screenshot defect;
- full assistive-technology testing on every trivial static component;
- a new Storybook API that does not exist in production.

Those would increase audit machinery without increasing evidence quality.

## Proposed final audit logic

```
DEFINE SCOPE
  ↓
EXPLORE CURRENT PRODUCT
  ↓
BUILD STRUCTURED SAMPLE + RANDOM SAMPLE
  ↓
CAPTURE BASELINE
  ↓
AUDIT BY JOURNEY + SYSTEM FAMILY
  ↓
VERIFY FINDINGS AGAINST PRIMARY STANDARD / PRODUCT INTENT
  ↓
CLUSTER BY ROOT CAUSE
  ↓
OWNER / HUMAN DECISION
  ↓
IMPLEMENT OUTSIDE AUDIT
  ↓
RETEST ORIGINAL EVIDENCE
```

This keeps the audit exhaustive where cheap, representative where deep testing is expensive, and evidence-led throughout.

## Sources

Primary sources only:

- W3C WAI — WCAG-EM 2.0 overview  
  https://www.w3.org/WAI/test-evaluate/conformance/wcag-em/
- W3C WAI — ARIA Authoring Practices Guide  
  https://www.w3.org/WAI/ARIA/apg/
- W3C WAI — APG patterns  
  https://www.w3.org/WAI/ARIA/apg/patterns/
- W3C WAI — Keyboard Interface  
  https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/
- Storybook — UI testing  
  https://storybook.js.org/docs/writing-tests
- Storybook — accessibility testing  
  https://storybook.js.org/docs/writing-tests/accessibility-testing
- Storybook — interaction testing  
  https://storybook.js.org/docs/writing-tests/interaction-testing
- Storybook — Vitest addon  
  https://storybook.js.org/docs/writing-tests/integrations/vitest-addon
- Storybook — test-runner migration status  
  https://storybook.js.org/docs/11/writing-tests/integrations/test-runner
- GOV.UK Design System — Accessibility strategy  
  https://design-system.service.gov.uk/accessibility/accessibility-strategy/
- GOV.UK Design System — Contribution criteria  
  https://design-system.service.gov.uk/community/contribution-criteria/
- U.S. Web Design System  
  https://designsystem.digital.gov/
- Design Tokens Community Group — Format Module 2025.10  
  https://www.designtokens.org/TR/2025.10/format/
- web.dev — Web Vitals  
  https://web.dev/articles/vitals
- web.dev — Field measurement best practices  
  https://web.dev/articles/vitals-field-measurement-best-practices
- Google Search Central — Search appearance  
  https://developers.google.com/search/docs/appearance
- Google Search Central — Page experience  
  https://developers.google.com/search/docs/appearance/page-experience
