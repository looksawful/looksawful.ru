import { readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import type { Plugin } from "vite";

import {
  assertHomepagePresentationSupported,
  homepageEntries,
} from "../pages/homepage.ts";
import { getPageByPath } from "../pages/manifest.ts";
import { renderStandaloneEntityPage } from "../renderers/entity-page.ts";
import { renderHomepagePage } from "../renderers/home/home-page.ts";
import { renderPageShell } from "../shell/page-shell.ts";

interface CvContentModule {
  readCvContent(contentPath: string): Promise<unknown>;
  transformCvContent(html: string, content: unknown): { readonly html: string };
}

async function loadCvContentModule(root: string): Promise<CvContentModule> {
  const moduleUrl = pathToFileURL(path.resolve(root, "tools/lib/cv-content.mjs")).href;
  return await import(/* @vite-ignore */ moduleUrl) as CvContentModule;
}

export function entryRequestToPagePath(requestPath: string): string {
  const pathname = requestPath.split(/[?#]/, 1)[0] || "/";
  if (pathname === "/index.html") return "/";
  if (pathname.endsWith("/index.html")) {
    return pathname.slice(0, -"index.html".length);
  }
  return pathname;
}

export function rewriteCvDevRequest(requestUrl: string): string {
  const match = requestUrl.match(/^\/cv\/?([?#].*)?$/);
  if (!match) return requestUrl;
  return `/cv/index.html${match[1] ?? ""}`;
}

export async function renderCvDevHtml(html: string, root = process.cwd()): Promise<string> {
  const contentLib = await loadCvContentModule(root);
  const content = await contentLib.readCvContent(path.resolve(root, "src/content/cv.json"));
  return contentLib.transformCvContent(html, content).html;
}

export function renderNotFoundPage(page: NonNullable<ReturnType<typeof getPageByPath>>): string {
  return renderPageShell({
    page,
    title: "404 — Иван Крушинский",
    description: "Страница не найдена.",
    content: '<section class="wrapper stack"><h1>404</h1><p><a href="/">На главную</a></p></section>',
  });
}

export function createSitePagesPlugin(root = process.cwd()): Plugin {
  const homepageTemplatePath = path.resolve(root, "index.html");
  assertHomepagePresentationSupported(homepageEntries);

  return {
    name: "site-pages",
    enforce: "pre",
    configureServer(server) {
      server.middlewares.use((request, _response, next) => {
        if (request.url) request.url = rewriteCvDevRequest(request.url);
        next();
      });
    },
    transformIndexHtml: {
      order: "pre",
      async handler(html, context) {
        const pagePath = entryRequestToPagePath(context.path);
        if (pagePath === "/cv/") return renderCvDevHtml(html, root);

        const page = getPageByPath(pagePath);
        if (!page) return html;

        if (page.type === "home") return renderHomepagePage(html);

        if (page.type === "case" || page.type === "project" || page.type === "collection") {
          const homepageTemplate = readFileSync(homepageTemplatePath, "utf8");
          return renderStandaloneEntityPage(homepageTemplate, page);
        }

        if (page.type === "not-found") return renderNotFoundPage(page);

        return html;
      },
    },
  };
}
