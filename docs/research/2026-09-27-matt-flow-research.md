# Matt Flow research — looksawful.ru — 2026-09-27

Status: **Research complete; no SetupMatt or architecture implementation in this branch.**

Next phase: repository-wide `CodebaseDesign` / architecture scan focused on current hot spots.

## Question

How should the canonical owner workflow

`Research → CodebaseDesign → SetupMatt audit → Domain Modeling → Wayfinder or Grill → Spec → Tickets → TDD/Implement → Code Review`

fit `looksawful.ru` without replacing its stronger repository-local contracts?

## Primary sources

Repository sources inspected on `dev@e85599b1e8621e39502cc929b7429f012b0ec5a1`:

- `AGENTS.md`
- `README.md`
- `CONTEXT.md`
- `docs/README.md`
- `docs/repository-structure.md`
- `docs/testing-policy.md`
- `docs/testing-pipeline.md`
- `docs/cms-architecture.md`
- `docs/agent-context/**`
- `docs/agents/issue-tracker.md`
- `docs/agents/domain.md`
- `docs/agents/triage-labels.md`
- `docs/agents/skill-sources.md`
- repository-local `codebase-design`, `architecture-review`, `domain-modeling`, `tdd`, `code-review`, and `writing-for-agents` skills
- current GitHub Issues, PRs and recent commit history

Representative current work inspected:

- #1190 — **Spec: full-site text review Round 3**
- #1192 — **Round 3: Home + global UI + Gallery + 404**
- #1202 — **Round 3 approved-chunk apply + PR + QA + deploy**
- #1203 — **Round 3 final consistency + closure gate**
- #861 — **System audit: project components, Storybook, CMS and media parity**
- #687 — **refactor: establish deep-refactor characterization baseline and stage gates**
- #249 — **content: establish canonical source ownership and round-trip governance**
- PR #1136 — **docs: configure Matt agent skills**
- PR #1138 — **chore(agents): configure Matt engineering skills**

Current upstream Matt sources checked:

- https://github.com/mattpocock/skills/blob/main/skills/engineering/setup-matt-pocock-skills/SKILL.md
- https://github.com/mattpocock/skills/blob/main/skills/engineering/setup-matt-pocock-skills/domain.md
- https://github.com/mattpocock/skills/blob/main/skills/engineering/wayfinder/SKILL.md
- https://github.com/mattpocock/skills/blob/main/skills/engineering/to-spec/SKILL.md
- https://github.com/mattpocock/skills/blob/main/skills/engineering/grill-with-docs/SKILL.md
- https://github.com/mattpocock/skills/blob/main/skills/engineering/ask-matt/SKILL.md
- https://www.aihero.dev/skills-setup-matt-pocock-skills

## Executive finding

`looksawful.ru` already has a mature engineering workflow that implements much of the Matt philosophy more strongly than a default SetupMatt scaffold.

The correct direction is **not to install a second generic workflow**. Matt Flow should become an orchestration layer over existing repository authority:

- keep the current GitHub Issues + Notion planning split;
- keep repository-local policy, testing lifecycle, CMS/media ownership, branch topology and publication guards;
- reuse the existing glossary and local deep-module/TDD/review skills;
- add or route only the missing phases needed to make the whole lifecycle explicit;
- do not duplicate local skills merely because equivalent upstream skills exist.

## Current lifecycle coverage

| Canonical phase | Current repository state | Research conclusion |
| --- | --- | --- |
| Research | No repository-local `research` skill. Research notes/specs exist, but there is no single routed research phase. | **Missing orchestration**, not necessarily missing capability. Use the installed Matt/Engineering Research workflow and decide later whether a thin local adapter is warranted. |
| CodebaseDesign | Local `codebase-design` plus `architecture-review` exist and use Matt's deep-module vocabulary. | **Strong foundation.** The next phase should use these, with a repo-wide scan focused on recently changing hotspots. |
| SetupMatt audit | `AGENTS.md` has Agent skills pointers; tracker/domain/triage docs exist. Two older SetupMatt PRs remain open. | **Partially configured, needs audit rather than reinstall.** |
| Domain Modeling | Root `CONTEXT.md` is a real glossary. Local `domain-modeling` is adapted to the project. | **Strong.** Keep active domain modeling. Create ADRs lazily only when a real durable decision clears the bar. |
| Wayfinder / Grill | No repository-local Wayfinder or Grill workflow. Current tracker docs do not define Wayfinding operations. | **Missing integration layer.** Needed for genuinely foggy multi-session work; Grill for bounded design/spec work. |
| Spec | No local `to-spec` skill, but issue #1190 is already essentially the upstream spec shape: problem, solution, user stories, implementation/testing decisions, out of scope. | **Behavior exists; routing is implicit.** |
| Tickets | No local `to-tickets` skill, but #1192–#1203 already use parent, vertical deliverable, acceptance criteria and blocking edges. | **Behavior exists; routing is implicit.** |
| TDD / Implement | Local `tdd` exists; repository has strong test-tier policy and many executable gates. No `implement` orchestrator. | **TDD is strong.** Implementation orchestration is the missing part, not testing discipline. |
| Code Review | Local two-axis `code-review` exists and separates Standards from Spec. CodeRabbit is advisory. | **Strong and already aligned.** |

## SetupMatt audit findings to carry into the later SetupMatt phase

### 1. Issue tracker configuration is stronger than the default seed

`docs/agents/issue-tracker.md` deliberately defines:

- Notion as planning / long-lived decision context;
- GitHub Issues as executable implementation packets;
- explicit Work Package / Wave / Slice / Quality Gate / Audit / Spike vocabulary;
- non-ceremonial issue creation;
- real blocker semantics;
- evidence reconciliation across issue / PR / runtime / Notion.

This must **not** be replaced with a generic GitHub-only seed.

However, canonical Wayfinder expects tracker-specific **Wayfinding operations**. Those are absent today. If Wayfinder is adopted, add them to this existing tracker contract rather than replacing it.

### 2. Domain setup is under-specified

Current `docs/agents/domain.md` is only four lines and points at `docs/adr/`, which does not currently exist.

That absence is **not a defect by itself**. Upstream Matt explicitly says missing ADR directories are normal and domain-modeling should create them lazily.

The later SetupMatt audit should make `domain.md` express this lazy behavior and the repository's authority precedence without creating empty ADR scaffolding.

### 3. Triage mapping exists, and `ready-for-agent` is already in real use

Round 3 issues #1190 and #1192–#1203 use `ready-for-agent`.

The SetupMatt audit should verify the complete label vocabulary against the actual repository before declaring the mapping complete. It should not create a second state machine: `docs/agents/skill-sources.md` explicitly rejects workflow packs that impose one.

### 4. Duplicate SetupMatt PRs are stale coordination debt

PR #1136 and PR #1138 are nearly equivalent SetupMatt proposals and remain open while current `dev` already contains an Agent skills block plus the generated docs from commit `e85599b1...`.

This is not an implementation blocker, but it makes provenance ambiguous. The later SetupMatt phase should reconcile/close the duplicates rather than merge another copy.

### 5. The 2026-09-27 baseline review is not a meaningful repository review

`docs/agents/review-2026-09-27.md` only records stack/domain/test presence and explicitly did not execute dependency/browser/runtime checks.

Treat it as a historical rollout marker, not as evidence that the repository has been code-reviewed.

## Existing strengths that Matt Flow must preserve

### Domain vocabulary

`CONTEXT.md` already defines important canonical concepts such as:

- Case
- Collection
- Project card
- Site page
- Media asset
- Media Catalog
- Registered asset
- Uploaded asset
- Placement
- Source master
- Delivery asset
- Editorial copy
- Text review item
- Text review option
- Fact check

Architecture and ticket output should use those names rather than inventing synonyms.

### Deep source ownership

Current architecture already has meaningful seams:

- `src/site/pages/manifest.ts` owns Site page / route identity;
- `src/content/**` owns explicitly CMS-authored/editorial sources;
- `src/data/**` owns typed domain identity, relations, adapters and code-owned semantics;
- Media Catalog owns reusable media identity/metadata;
- repository tools own deterministic generated media/indexes;
- CSS owns responsive layout and visual composition;
- `dev` is integration; `prod` is the release/deploy source.

The CodebaseDesign phase should test whether these are actually deep interfaces in implementation, not redesign them from prose.

### Test lifecycle

The repository already has a stronger test lifecycle than generic “keep every regression test” TDD:

- temporary RED/GREEN tests are deleted unless they protect a durable contract;
- permanent tests are classified CONTRACT / AFFECTED / PRODUCTION SMOKE / FULL-QUALITY;
- `test:fast` is an explicit cheap allowlist;
- final work classifies changed tests as KEEP / MOVE / DELETE.

Matt TDD must remain subordinate to this policy.

### Specs and tracer-bullet tickets already exist in practice

Round 3 demonstrates that the repository already knows how to express:

- a user-facing problem/solution spec;
- extensive user stories;
- implementation/testing decisions;
- explicit out-of-scope;
- vertical work packages;
- dependency edges;
- review/approval/deploy gates.

The missing value is a repeatable **routing path** into this shape, not a new issue template religion.

## CodebaseDesign focus for the next phase

Do not scan 2.8 GB uniformly. Follow Matt's YAGNI/hotspot rule and recent repository activity.

Start with four high-value architecture clusters:

1. **Site page / renderer / content composition**
   - page manifest;
   - Site page identity;
   - renderers;
   - project/case/collection composition;
   - Storybook/Lab parity pressure from #861.

2. **Editorial / review / approval pipeline**
   - current Round 3 decision-lock and review state;
   - authored source vs review storage vs application/deploy;
   - boundaries between `looksawful.ru` and `looksawful-editorial`.

3. **Media Catalog / placement / generated delivery**
   - reusable identity versus placement data;
   - registered versus uploaded assets;
   - generator/tooling interfaces;
   - CMS/media publication path.

4. **CMS / publication / branch topology**
   - typed ownership;
   - Pages CMS;
   - Content/Media Desk;
   - publication classifier;
   - `dev → prod` release seam.

Secondary cluster if evidence warrants it:

5. **Testing/CI routing**
   - whether test tier selection and change-scope classification are deep modules or scattered policy.

The scan should look for shallow modules, duplicated ownership, shotgun edits, weak test seams and interface leakage. It should not reopen settled product/design decisions merely because a refactor is imaginable.

## Recommended canonical workflow for this repository

```text
Research
  ↓
CodebaseDesign / architecture scan
  ↓
SetupMatt audit
  ↓
Domain Modeling (continuous, only when language/decisions change)
  ↓
┌──────────────────────────────┬──────────────────────────────┐
│ Wayfinder                    │ Grill / grill-with-docs      │
│ foggy, multi-session effort  │ bounded design/problem       │
└──────────────────────────────┴──────────────────────────────┘
  ↓
Spec
  ↓
Tracer-bullet Tickets
  ↓
TDD / Implement
  ↓
Fixed-point Code Review
  ↓
if findings → ticket/TDD loop → review again
```

Repository-local policy and executable guards remain above this flow at every step.

## Research completion criteria

- [x] current repository policy and branch model inspected;
- [x] current Matt-adapted local skills inspected;
- [x] SetupMatt files inspected;
- [x] domain glossary inspected;
- [x] test lifecycle inspected;
- [x] representative Specs/Tickets/blockers inspected;
- [x] duplicate SetupMatt PRs identified;
- [x] current architecture/source-ownership map inspected;
- [x] next CodebaseDesign scope identified;
- [x] no product/runtime implementation performed.

## Next action

Run the **CodebaseDesign** phase against the four primary architecture clusters above. Produce architecture findings and candidate deepening opportunities only. Do not modify SetupMatt configuration until that phase is complete.
