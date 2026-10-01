# Runtime baseline and representative sample — 2026-10-02

Status: BASELINE / source-complete, runtime-incomplete  
Parent: #1244  
Ticket: #1245  
Baseline branch: `dev`  
Baseline commit: `a9170b6d3fd5e6095e71f39f9184793aaf772de3`

## Purpose

This document freezes the first reusable audit baseline. It records what the current repository proves, what the current audit can measure, which routes receive deep review, and which claims remain untested.

It does not redesign or fix the site.

## 1. Canonical enabled Site pages

Source: `src/site/pages/manifest.ts` at the baseline commit.

| ID | Path | Type | Listed | Indexable |
| --- | --- | --- | --- | --- |
| home | `/` | home | yes | yes |
| gallery | `/gallery/` | gallery | yes | yes |
| case:jestei-pool | `/work/jestei-pool/` | case | yes | yes |
| case:styx | `/work/styx/` | case | yes | yes |
| case:sensetique | `/work/sensetique/` | case | yes | yes |
| collection:music-photography | `/shootings/` | collection | yes | yes |
| project:awful-cases | `/work/awful-cases/` | project | no | no |
| project:berserk-timer | `/work/berserk-timer/` | project | no | no |
| project:awful-mockups | `/work/awful-mockups/` | project | no | no |
| project:awful-3d-mockups | `/work/awful-3d-mockups/` | project | no | no |
| project:awful-studio | `/work/awful-studio/` | project | no | no |
| project:keys | `/work/keys/` | project | no | no |
| project:sea | `/work/sea/` | project | no | no |
| project:moves-awful | `/work/moves-awful/` | project | no | no |
| project:berry-social-content-2020 | `/work/berry-social-content-2020/` | project | no | no |
| cv | `/cv/` | static | yes | yes |
| privacy | `/privacy/` | static | yes | yes |
| not-found | `/404.html` | not-found | no | no |

Total: **18 enabled pages**. Listed/indexable is a discovery contract, not a visual-visibility contract.

## 2. Structured deep sample

The following sample covers the required archetypes without pretending every page is equivalent:

| Archetype | Route | Reason |
| --- | --- | --- |
| Home | `/` | global shell, first-visit comprehension, Work entry |
| Gallery | `/gallery/` | dense media + lightbox/series journey |
| Flagship Case | `/work/jestei-pool/` | longest/highest-complexity Case |
| Ordinary Case | `/work/styx/` | representative non-specialized Case |
| Specialized interactive Project | `/work/berserk-timer/` | custom audio/runtime interaction |
| Shootings | `/shootings/` | Collection/editorial media surface |
| CV | `/cv/` | static professional document surface |
| Privacy | `/privacy/` | static utility surface |
| 404 | `/404.html` | recovery/error surface |

Other specialized surfaces remain eligible for their dedicated slice even when they are not in this first structured sample.

## 3. Deterministic random sample

A small blind-spot sample is selected from enabled routes not already in the structured sample.

Method: SHA-256 of `<baseline commit>:<route id>`, sorted ascending; take the first three. This makes the sample reproducible for this baseline instead of relying on auditor preference.

Selected:

1. `project:awful-cases` → `/work/awful-cases/` — hash `1be835a1…`
2. `project:sea` → `/work/sea/` — hash `478401be…`
3. `project:awful-3d-mockups` → `/work/awful-3d-mockups/` — hash `482e7286…`

When the baseline commit changes materially, regenerate rather than carrying this sample forward by habit.

## 4. Evidence model

Evidence strength, strongest first:

Parent spec #1244 is canonical for this ordering. The older charter has the first two classes reversed; that single older ordering is superseded by #1244 and must not create a second precedence rule.

1. **runtime-measured** — geometry, trace, contrast, accessibility tree, timing, input behavior;
2. **runtime-observed** — reproduced behavior in current browser/runtime;
3. **source-confirmed** — current canonical source directly proves the condition;
4. **test-confirmed** — current automated test proves a bounded contract;
5. **content-confirmed** — canonical current authored data/content;
6. **historical** — older audit, issue, screenshot or report;
7. **hypothesis** — plausible but not verified.

A hypothesis cannot create an implementation task unless the owner explicitly accepts it as a decision.

Finding lifecycle:

`DISCOVERED → VERIFIED → TRIAGED → DECISION_NEEDED | READY → IMPLEMENTING → VERIFYING → CLOSED`

Terminal classifications:
`DUPLICATE / INTENTIONAL_EXCEPTION / DEFERRED / NOT_REPRODUCIBLE`.

## 5. What current tooling can prove

### Repository contracts

- `typecheck` — TypeScript correctness at configured boundaries.
- `test:fast` — cheap allowlisted permanent contracts only.
- `build:site` — CMS check, Vite build, static discovery/meta/link post-build.
- `test:e2e:smoke` — Chromium runtime smoke at 390×844 and 1440×900 plus selected touch-caption cases.
- `test:ui:responsive` — targeted Chromium geometry for 390×844, 393×852, 412×915 and 1728×1000, including navigation/Jestei responsive invariants.
- focused E2E suites — navigation, lightbox, media deck, MPA, project pages, CV.
- `lighthouse` — one-run lab monitoring over sitemap-derived URLs, with warning thresholds.
- `lab:inventory` — current production-owner/Storybook inventory with explicit source declarations, canonical/experimental policy, route discovery and structural errors.

### What these do not prove

- Chromium GREEN does not prove Firefox/WebKit behavior.
- basic E2E accessibility checks do not prove WCAG 2.2 conformance.
- Lighthouse category scores do not prove field Core Web Vitals or total product quality.
- source CSS does not prove rendered target geometry or contrast.
- Storybook presence does not prove production-context usability.
- hidden/unlisted routes are not necessarily present in sitemap/Lighthouse sampling.

## 6. Runtime/tool availability in this audit session

Available:
- current GitHub `dev` source and issue/PR state;
- current GitHub Actions evidence when a branch/PR runs it;
- Titan file/source inspection through the authorized remote connector;
- repository-declared Playwright/Lighthouse/LAB procedures.

Unavailable or not authoritative in this pass:
- Chrome DevTools MCP is not configured in the current tool surface;
- Opera Browser Connector access was declined by the owner and was not retried;
- a clean Titan clone requested interactive Git authentication, so it was stopped rather than touching credentials;
- no fresh accessibility-tree capture;
- no fresh exact hit-box/contrast measurement;
- no fresh Firefox/WebKit runtime pass;
- no assistive-technology/user validation;
- no current field/RUM Core Web Vitals dataset.

Therefore this baseline is **source-complete but runtime-incomplete**.

## 7. Historical evidence reconciliation

| Evidence | Classification | Current use |
| --- | --- | --- |
| comprehensive audit charter (2026-10-01) | CURRENT | audit contract and quality model |
| charter's older `runtime-observed > runtime-measured` ordering | SUPERSEDED | #1244 now governs evidence precedence as `runtime-measured > runtime-observed` |
| methodology research (2026-10-01) | CURRENT | sampling/evidence method |
| `docs/testing-policy.md` | CURRENT | test-lifecycle authority |
| #245 responsive/accessibility baseline | CURRENT OWNER | executable engineering owner; findings still require current evidence |
| #861 system audit | CURRENT OWNER | component/Storybook/CMS parity owner; dated quantitative claims must be remeasured |
| #929 Storybook useful states/scaffolds | CURRENT OWNER | production-backed story constraints |
| #1106 / #1112 | CURRENT OWNERS | primitive implementation/taxonomy ownership |
| #1142 | CURRENT DECISION MAP | UX/IA decisions, not runtime evidence |
| `2026-09-30-ui-surface-inventory.md` | HISTORICAL | useful source inventory; live measurements explicitly pending |
| `docs/storybook/ui-inventory-audit.md` | HISTORICAL | valuable baseline, but its counts are not current |
| old Storybook gap: `src/site/**` absent from denominator | SUPERSEDED | current inventory includes site navigation/renderers/rendering/shell/pages |
| old Storybook gap: `.stories.mjs` omitted | SUPERSEDED | current inventory recognizes `.stories.mjs` |
| old Storybook gap: basename-only coverage matching | SUPERSEDED | current inventory uses declared source relationships + imports |
| old Storybook gap: experimental/canonical not separated | SUPERSEDED | current inventory records canonical/experimental/policy state |
| PR #1211 / #1212 | CURRENT WIP | implementation evidence only; not baseline truth until merged |
| Berserk seek pointer-only on baseline `dev` | CURRENT / SOURCE-CONFIRMED | verified defect; #1254 / draft PR #1255 may fix it but are not yet canonical |
| Code Copy under 24px target | HYPOTHESIS | requires rendered geometry before pass/fail |
| current WCAG conformance | HYPOTHESIS | cannot be inferred from automation/source |
| current field CWV health | HYPOTHESIS | field/RUM evidence not captured |
| current Firefox/WebKit parity | HYPOTHESIS | no fresh engine-specific pass |

## 8. Explicit untested states

The following remain open evidence gaps for later slices:

- 834×1112 tablet/touch;
- 320×568 narrow/reflow stress;
- 844×390 short landscape outside existing targeted cases;
- 200% text zoom/reflow;
- forced/high-contrast mode;
- complete keyboard traversal per representative journey;
- accessibility tree/screen-reader semantics;
- exact interactive target geometry;
- rendered contrast;
- reduced-motion behavior across every complex surface;
- slow CPU/network traces;
- current Firefox/WebKit compatibility;
- field Core Web Vitals;
- random-sample runtime results.

## 9. Gate for downstream audit slices

This baseline is sufficient to start evidence collection in #1246–#1251 because it fixes:

- the route corpus;
- structured and blind-spot samples;
- evidence vocabulary;
- finding lifecycle;
- exact limits of existing automated checks;
- explicit runtime gaps.

It does **not** authorize broad design-system implementation or convert historical findings into defects.

Downstream rule: if a finding is only HISTORICAL or HYPOTHESIS, verify it first. Human taste is not a test runner, however enthusiastically humans sometimes deploy it as one.
