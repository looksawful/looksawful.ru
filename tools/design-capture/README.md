# Design Capture

`tools/design-capture` is a **manual, development-only design documentation tool**.

It exists to produce local screenshots for design review, Notion, Figma, visual inventories, and breakpoint inspection. It is not a test suite, production feature, deployment step, monitoring task, or client-side capability.

## Safety contract

Do not weaken these rules:

- Run this tool only when a human explicitly requests design screenshots/capture.
- Never add it to `test`, `test:*`, `verify`, `verify:*`, `build`, deploy scripts, pre-commit hooks, scheduled jobs, or GitHub Actions.
- Never import anything from this directory into `src/` or other client code.
- The CLI refuses to run when `CI=true` or `GITHUB_ACTIONS=true`.
- An interactive human run requires a `y` confirmation.
- A non-interactive agent run requires the explicit `--manual` flag and is valid only when the user directly requested the capture.
- Output must stay below `_local/design-capture/`. That directory is ignored by Git and must never be copied into `public/` or `dist/`.

## Commands

From the repository root:

```powershell
npm run design:capture
```

Runs both passes after interactive confirmation.

```powershell
npm run design:capture:pages
```

Captures every discovered site page at the three canonical design viewports:

- desktop: `1440 × 1000`
- tablet: `834 × 1112`
- mobile: `390 × 844`

Each page gets a viewport screenshot and a full-page screenshot.

```powershell
npm run design:capture:components
```

Runs only the component-breakpoint pass. Components are configured in `config.mjs`. For each breakpoint the tool captures the real component immediately before and after the transition (`breakpoint - 1px` and `breakpoint + 1px`). Multiple matching component instances are stored separately.

```powershell
npm run design:capture:selfcheck
```

Runs fast deterministic checks for this tool. This command is intentionally separate from the repository's normal test suites.

## Explicit agent invocation

When the user has directly requested screenshot generation and the agent has a local repository checkout, the non-interactive form is:

```powershell
npm run design:capture -- --manual
```

Or one pass only:

```powershell
npm run design:capture:pages -- --manual
npm run design:capture:components -- --manual
```

The `--manual` flag means "this run was explicitly requested". It is not permission to wire the tool into automation.

## Output

Every run creates a timestamped local directory:

```text
_local/design-capture/
└── 2026-09-05T19-30-00/
    ├── pages/
    │   ├── desktop/
    │   ├── tablet/
    │   └── mobile/
    ├── components/
    │   └── <component>/
    │       └── <breakpoint>/
    │           └── <instance>/
    └── manifest.json
```

`manifest.json` records the source branch/commit, routes, viewports, component instances, breakpoint sides, generated files, and warnings. This is the preferred index for later Notion/Figma import tooling.

## Page discovery

The page pass discovers root `index.html` plus HTML files under `public/`. Directory `index.html` files map to directory routes. Fixture/test/tool paths configured in `PAGE_EXCLUSIONS` are skipped.

If a real page should not be included, add a narrow exclusion to `PAGE_EXCLUSIONS`. Do not replace discovery with a long hand-maintained page list unless the site architecture changes enough to require it.

## Component breakpoints

`COMPONENTS` in `config.mjs` is intentionally explicit. A component can declare:

```js
{
  name: "example",
  route: "/",
  selector: ".example",
  selectorHints: [".example"],
  stylesheetHints: ["src/styles/components.css"],
  breakpoints: [768],
  optional: false,
}
```

The tool reads responsive `@media` and `@container` blocks in the hinted stylesheets and associates them using `selectorHints`. Explicit `breakpoints` supplement discovered values and are useful for JS-driven transitions, container behavior that cannot be inferred reliably, or intentional design checkpoints.

A component may also define an async `prepare(page, context)` callback for a deliberate interactive state such as an opened menu. Keep such states deterministic and design-focused.

## Determinism

The Playwright context requests reduced motion. Before capture the tool disables CSS animation/transition timing, hides the caret, pauses videos, waits for fonts and images, and waits two animation frames. This makes the archive useful for design comparison instead of recording arbitrary animation frames.

## What this tool deliberately does not do

- no visual regression assertions;
- no screenshot baselines committed to Git;
- no automatic diffs;
- no CI artifacts;
- no production browser code;
- no scheduled capture runs;
- no upload to Notion/Figma by itself.

Those are separate workflows. Keeping capture local prevents a design utility from quietly becoming another mandatory test subsystem.