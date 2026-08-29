import type { SitePageDefinition } from "../pages/types.ts";
import { escapeHtml } from "../../utils/html.ts";
import { renderPageMetadata } from "./metadata.ts";
import { renderSiteNavigation } from "./navigation.ts";

export interface PageShellOptions {
  page: SitePageDefinition;
  title: string;
  description: string;
  content: string;
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

export function renderPageShell({
  page,
  title,
  description,
  content,
}: PageShellOptions): string {
  return `<!DOCTYPE html>
<html lang="ru">
  <head>
    <meta charset="utf-8">
    <meta content="width=device-width, initial-scale=1.0" name="viewport">
    ${renderPageMetadata({ page, title, description })}
    <link rel="icon" href="/favicon.svg" type="image/svg+xml">
    <link href="/src/styles/index.css" rel="stylesheet">
    <script src="/src/main.js" type="module"></script>
  </head>
  <body ${renderBodyAttributes(page)}>
    ${renderSiteNavigation(page)}
    <main>
      ${content}
    </main>
  </body>
</html>`;
}
