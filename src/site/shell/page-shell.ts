import type { SitePageDefinition } from "../pages/types.ts";
import { escapeHtml } from "../../utils/html.ts";
import { renderPageMetadata } from "./metadata.ts";
import { renderSiteNavigation } from "./navigation.ts";

export interface PageAssets {
  readonly stylesheet: string;
  readonly script: string;
}

export const DEFAULT_PAGE_ASSETS: PageAssets = Object.freeze({
  stylesheet: "/src/styles/index.css",
  script: "/src/main.js",
});

export interface PageShellOptions {
  page: SitePageDefinition;
  title: string;
  description: string;
  content: string;
  assets?: PageAssets;
}

function renderBodyAttributes(page: SitePageDefinition): string {
  const attributes = [
    `data-page-type="${escapeHtml(page.type)}"`,
    `data-page-id="${escapeHtml(page.id)}"`,
  ];

  if (page.type === "case" || page.type === "project" || page.type === "collection") {
    attributes.push(`data-entity-id="${escapeHtml(page.entityId)}"`);
  }

  return attributes.join(" ");
}

function renderPageAssets(assets: PageAssets): string {
  return `<link href="${escapeHtml(assets.stylesheet)}" rel="stylesheet">
    <script src="${escapeHtml(assets.script)}" type="module"></script>`;
}

export function renderPageShell({
  page,
  title,
  description,
  content,
  assets = DEFAULT_PAGE_ASSETS,
}: PageShellOptions): string {
  return `<!DOCTYPE html>
<html lang="ru">
  <head>
    <meta charset="utf-8">
    <meta content="width=device-width, initial-scale=1.0" name="viewport">
    ${renderPageMetadata({ page, title, description })}
    <link rel="icon" href="/favicon.svg" type="image/svg+xml">
    ${renderPageAssets(assets)}
  </head>
  <body ${renderBodyAttributes(page)}>
    ${renderSiteNavigation(page)}
    <main>
      ${content}
    </main>
  </body>
</html>`;
}
