# Engineering quality baseline

This repository uses a deliberately small first-pass quality layer. The goal is to catch obvious mistakes quickly without turning every edit into a multi-minute ceremony.

## Current stack

- `npm run typecheck` — existing TypeScript compiler check; already part of Fast CI.
- `npm run lint` — Oxlint correctness baseline for `src` and `tools`.
- `npm run lint:style` — pinned Stylelint correctness baseline for `src/**/*.css`; available locally but intentionally not a required verification gate yet.
- `npm run spell` — CSpell over selected source/docs paths with English + Russian dictionaries and the project glossary in `cspell-words.txt`.
- `npm run format -- <paths...>` — Oxfmt write mode for explicit paths only.
- `npm run format:check -- <paths...>` — Oxfmt check mode for explicit paths only.

Oxlint is used instead of ESLint/typescript-eslint while this repository is on TypeScript 7. Oxfmt avoids adding a separate formatter stack. CSpell is the only text checker in the first stage. Stylelint uses a tiny repository-owned correctness-only config rather than a convention-heavy shared config.

## Safety rules

1. Do not run repository-wide formatting as a cleanup project. The formatter wrapper intentionally refuses to run without explicit paths.
2. Technical formatting must not change authored wording, spelling choices, names or meaning. Editorial corrections are separate work.
3. The first stage is local and non-blocking. Do not add these commands to required CI until the baseline is measured and false positives are under control.
4. Keep generated output, large media areas, vendored code and legacy archive material outside the initial scan.
5. Add project names, brands and intentional terms to `cspell-words.txt` instead of disabling spelling globally.
6. Add a new tool only when a recurring problem demonstrates that the existing stack cannot cover it cheaply.
7. Do not repair production CSS merely to make the first Stylelint rollout green. Narrow or stage the lint rule/scope first; CSS behavior changes remain separate evidence-backed work.

## Why the CLIs are pinned through `npx`

The repository is under active parallel development and `package.json` / `package-lock.json` are common conflict surfaces. The first rollout pins exact CLI versions in the npm scripts but does not add new devDependencies, avoiding a large lockfile edit and dependency churn while the checks are still optional.

Once the baseline is stable, a later maintenance issue can move the tools into devDependencies in one controlled lockfile update if that is still desirable.

## Scope today

### Oxlint

Runs against `src` and `tools`. Only the `correctness` category is enabled, as warnings. Style, pedantic, restriction and experimental categories are intentionally off.

### Stylelint

Runs only against `src/**/*.css` in the first rollout. The config enables a small built-in error set for unknown at-rules/properties/units/media features/pseudo classes/pseudo elements plus invalid hex colors and invalid named grid areas.

It intentionally does **not** extend `stylelint-config-standard`, enforce selector naming, sort properties, format CSS, or police stylistic conventions. It is not invoked by `verify`, `verify:core`, `verify:full` or `test:fast`; the Fast suite only contains a cheap wiring contract proving that this non-blocking policy does not silently change.

Baseline characterization on 2026-09-09 found one Stylelint false positive: the valid modern `:target-current` pseudo-class used by project navigation. The rule stays enabled with the narrow documented `ignorePseudoClasses: ["target-current"]` exception. After that exception, the full `src/**/*.css` baseline is GREEN. The disposable CI probe measured the lint command at about 4.4 seconds and was removed from the final tree; no production CSS was changed for lint adoption.

Promote Stylelint into a required gate only after this low-noise baseline remains stable through normal CSS work and the gate location provides more value than friction.

### CSpell

Scans source, tooling, Markdown documentation and root Markdown files. `public`, generated output, media-heavy paths, archives and lockfiles are ignored for the first pass. The Russian dictionary is loaded alongside English.

### Oxfmt

Formatting is opt-in per file or directory. Example:

```sh
npm run format:check -- src/components/example.ts
npm run format -- src/components/example.ts
```

Running either command without an explicit path exits with code 2 instead of touching the repository.

## Rollout

### Stage 1 — baseline

- local, pinned commands;
- conservative scope;
- no required CI;
- collect false positives and expand the project dictionary;
- measure command duration on normal changes;
- characterize Stylelint without changing production CSS merely to satisfy the tool.

### Stage 2 — harden

Only after the baseline is calm:

- make Oxlint blocking for changed files;
- promote Stylelint only for scopes/rules that are already clean and low-noise;
- make Oxfmt blocking only for changed or already-clean areas;
- keep CSpell warning-only until the glossary is mature, then block only newly introduced obvious typos.

### Stage 3 — optional additions

Consider only from observed defects:

- a tiny typography/punctuation rule set;
- `css:check` ownership/manifest guards if recurring CSS ownership mistakes justify them;
- `css:affected` by extending the existing change-scope/E2E router instead of creating a second dispatcher;
- stable component visual regression using the existing Playwright/design-capture stack;
- image/video poster/fallback validation as a separate lightweight media check;
- broader spelling coverage of public/editorial content after the initial dictionary is stable.

Do not fold heavy Playwright, Caption QA, ffmpeg or media regeneration into this baseline.
