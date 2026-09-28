# Webcmd / WebMCP placement research — 2026-09-28

## Decision

- **Webcmd** is workstation-level tooling. Its official quickstart installs the CLI globally with npm for plugin-free setups, while the Codex plugin already bundles the `webcmd-browser` skill and can install the CLI when missing. Do not add a second copy of that skill to a repository just to mirror the plugin.
- **WebMCP** is a site-level browser API, not a workstation daemon. The browser exposes `document.modelContext`; sites feature-detect it and register page-scoped imperative tools with `registerTool`.
- **Parallel Search** and **Stack Overflow for Agents** are hosted integrations in the current ChatGPT workflow. They are not application dependencies for this repository.
- For this portfolio, WebMCP should expose narrow public-site actions backed by the existing canonical navigation model. It should not introduce a second route registry.
- Machine-control or private operational dashboards are outside this integration. Exposing those surfaces through browser tools requires a separate security and authorization design.

## Portfolio integration

The initial site integration exposes only two page-scoped tools:

1. `list_portfolio_pages` — read-only discovery of canonical primary portfolio pages.
2. `open_portfolio_page` — navigation only to an href returned by the canonical page list.

The implementation uses the existing `getPrimaryNavigationItems()` model, rejects unknown paths, feature-detects WebMCP support, and unregisters tools through an `AbortSignal` lifecycle.

No runtime npm dependency is required for this integration.

## Primary sources

- Webcmd Quickstart: https://webcmd.dev/docs/quickstart
- Webcmd documentation: https://docs.webcmd.dev/
- Webcmd source repository: https://github.com/agentrhq/webcmd
- WebMCP source repository: https://github.com/webmachinelearning/webmcp
- WebMCP specification: https://webmachinelearning.github.io/webmcp/
