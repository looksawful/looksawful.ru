# Manual Design Capture Tool — Design

## Goal

Add a repository-owned, development-only Playwright tool that a human or explicitly instructed agent can run locally to capture design documentation screenshots. It must never run as part of build, test, verify, CI, deployment, or client runtime paths.

## Scope

The tool captures two distinct sets of screenshots:

1. **Canonical page pass** at the three required design viewports:
   - desktop: 1440×1000
   - tablet: 834×1112
   - mobile: 390×844
2. **Component breakpoint pass** in separate component folders. Each configured component is captured immediately before and after each of its own layout breakpoints. Breakpoints may be discovered from matching stylesheet rules and may be supplemented or overridden explicitly in the component configuration.

The tool also writes a machine-readable `manifest.json` describing every capture for later Notion/Figma ingestion.

## Isolation and safety

- Implementation lives only under `tools/design-capture/` plus explicit package scripts, documentation, `.gitignore`, and agent guidance.
- No module under `src/` imports it.
- No build, test, verify, preview, deploy, or GitHub Actions command invokes it.
- The CLI refuses to run when `CI=true` or `GITHUB_ACTIONS=true`.
- Interactive runs require an explicit confirmation.
- Non-interactive runs require an explicit `--manual` flag. This is the supported path for an agent that has been directly asked to create captures.
- Output is written under `_local/design-capture/`, which is ignored by Git and is never copied into `public/`, `dist/`, or another client-visible directory.
- Existing Playwright devDependency is reused; no client/runtime dependency is added.

## Commands

- `npm run design:capture` — interactive full run; equivalent to page and component passes.
- `npm run design:capture:pages` — required desktop/tablet/mobile page pass only.
- `npm run design:capture:components` — component breakpoint pass only.
- `npm run design:capture:selfcheck` — fast deterministic checks for the capture tool itself; not part of normal test suites.

An explicitly instructed agent may append `-- --manual` to bypass the interactive prompt locally. The guard still rejects CI/GitHub Actions.

## Page discovery

The page pass discovers real site HTML entry points from the repository instead of maintaining a long manual route list. Root `index.html` is `/`; public `index.html` files map to their directory routes; standalone public HTML files map to their copied public path. Internal tooling, fixture pages, and configured exclusions are skipped.

The discovery module exposes pure functions so routing behavior can be self-checked without launching a browser.

## Runtime

The capture CLI:

1. Validates safety guards and requested mode.
2. Discovers pages and component definitions.
3. Starts a dedicated Vite dev server on loopback using an automatically selected free port.
4. Launches Playwright Chromium headlessly.
5. For each requested page/viewport, waits for DOM content, fonts, images, and a short two-frame settle; disables CSS animations/transitions and requests reduced motion for deterministic design captures.
6. Captures the viewport image and a full-page image.
7. For component mode, loads the configured route, locates each component instance, chooses breakpoint widths, and captures the element immediately below and above each breakpoint.
8. Writes PNGs and `manifest.json` to a timestamped `_local/design-capture/<timestamp>/` directory.
9. Closes browser and server even on failure.

The tool should continue past an individual missing optional component and record a warning in the manifest, but page navigation failures are fatal because an incomplete page archive would be misleading.

## Component configuration

`tools/design-capture/config.mjs` contains a small explicit registry. A component definition includes:

- stable `name`
- `route`
- CSS `selector`
- optional `breakpoints` array for JS/container-query/custom layout transitions
- optional `stylesheetHints` array used by breakpoint discovery to associate media queries with a component
- optional `state` callback for a specific interactive state

A component with multiple matching elements is captured as separate numbered instances. Generated folders are grouped by component, then breakpoint, then instance.

Breakpoint screenshots use `breakpoint - 1` and `breakpoint + 1` widths, clamped to sensible browser widths, so the output visibly documents both sides of the transition.

## Output layout

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

The manifest records mode, timestamp, source branch/commit when available, viewport, route, component selector/instance, breakpoint side, output path, and warnings.

## Agent guidance

`AGENTS.md` receives a short rule stating that `tools/design-capture` is a manual design-documentation tool. Agents must not run it unless the user explicitly requests screenshots/design capture, must never add it to CI/build/test workflows, and must keep output under `_local/design-capture/`.

`tools/design-capture/README.md` documents the same contract for humans and future agents, with commands and expected output.

## Verification

A dedicated self-check validates pure safety and discovery behavior without launching screenshots. It is intentionally not named as a default Node test file and is not referenced by `test`, `test:fast`, `test:ci`, `verify`, or `verify:full`.

Before merge, inspect package scripts and workflow files to confirm there is no reference to `design:capture` outside its explicit manual scripts/documentation. Run the self-check. A real screenshot smoke run remains a local verification step because browser execution is intentionally local-only and the connected editing environment does not expose a runnable repository checkout.