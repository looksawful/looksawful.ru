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

export function renderBodyAttributes(page: SitePageDefinition): string {
  const attributes = [
    `data-page-type="${escapeHtml(page.type)}"`,
    `data-page-id="${escapeHtml(page.id)}"`,
    `data-surface-default="${escapeHtml(page.surface)}"`,
    `data-surface="${escapeHtml(page.surface)}"`,
  ];

  if (page.type === "case" || page.type === "project" || page.type === "collection") {
    attributes.push(`data-entity-id="${escapeHtml(page.entityId)}"`);
  }

  return attributes.join(" ");
}

export function applyPageBodyAttributes(html: string, page: SitePageDefinition): string {
  const bodyTags = html.match(/<body\b[^>]*>/gi);
  if (bodyTags?.length !== 1) {
    throw new Error(`Expected exactly one body tag, found ${bodyTags?.length ?? 0}`);
  }
  return html.replace(/<body\b([^>]*)>/i, (_tag, existing: string) => {
    const prefix = existing.trim();
    return `<body${prefix ? ` ${prefix}` : ""} ${renderBodyAttributes(page)}>`;
  });
}

export function renderPageShell({ page, title, description, content }: PageShellOptions): string {
  return `<!DOCTYPE html>
<html lang="ru">
  <head>
    <meta charset="utf-8">
    <meta content="width=device-width, initial-scale=1.0" name="viewport">
    ${renderPageMetadata({ page, title, description })}
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
