import { readFileSync } from "node:fs";
import path from "node:path";
import type { Plugin } from "vite";

import { getPageByPath } from "../pages/manifest.ts";
import { renderStandaloneEntityPage } from "../renderers/entity-page.ts";
import { renderHomepage } from "../renderers/home/home-slots.ts";
import { renderPageShell } from "../shell/page-shell.ts";

export function entryRequestToPagePath(requestPath: string): string {
  const pathname = requestPath.split(/[?#]/, 1)[0] || "/";
  if (pathname === "/index.html") return "/";
  if (pathname.endsWith("/index.html")) {
    return pathname.slice(0, -"index.html".length);
  }
  return pathname;
}

function renderNotFoundPage(page: NonNullable<ReturnType<typeof getPageByPath>>): string {
  return renderPageShell({
    page,
    title: "404 — Иван Крушинский",
    description: "Страница не найдена.",
    content: '<section class="wrapper stack"><h1>404</h1></section>',
  });
}

export function createSitePagesPlugin(root = process.cwd()): Plugin {
  const homepageTemplatePath = path.resolve(root, "index.html");

  return {
    name: "site-pages",
    enforce: "pre",
    transformIndexHtml(html, context) {
      const pagePath = entryRequestToPagePath(context.path);
      const page = getPageByPath(pagePath);
      if (!page) return html;

      if (page.type === "home") return renderHomepage(html);

      if (page.type === "case" || page.type === "project" || page.type === "collection") {
        const homepageTemplate = readFileSync(homepageTemplatePath, "utf8");
        return renderStandaloneEntityPage(homepageTemplate, page);
      }

      if (page.type === "not-found") return renderNotFoundPage(page);

      return html;
    },
  };
}
