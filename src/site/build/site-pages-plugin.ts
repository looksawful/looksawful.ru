import { readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import type { Plugin } from "vite";

import {
  assertHomepagePresentationSupported,
  homepageEntries,
} from "../pages/homepage.ts";
import { getPageByPath, sitePages } from "../pages/manifest.ts";
import type { SitePageDefinition } from "../pages/types.ts";
import { normalizePagePath } from "../pages/validation.ts";
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

function publicStaticSourceToRequestPath(sourcePath: string): string {
  const normalized = sourcePath.replaceAll("\\", "/").replace(/^\.\//, "");
  const prefix = "public/";
  if (!normalized.startsWith(prefix) || normalized.length === prefix.length) {
    throw new Error(`Public-static SitePage source must live under public/: ${sourcePath}`);
  }
  return `/${normalized.slice(prefix.length)}`;
}

export function rewritePublicStaticDevRequest(
  requestUrl: string,
  pages: readonly SitePageDefinition[] = sitePages,
): string {
  const suffixIndex = requestUrl.search(/[?#]/);
  const pathname = suffixIndex === -1 ? requestUrl : requestUrl.slice(0, suffixIndex);
  const suffix = suffixIndex === -1 ? "" : requestUrl.slice(suffixIndex);

  let normalizedPath: string;
  try {
    normalizedPath = normalizePagePath(pathname || "/");
  } catch {
    return requestUrl;
  }

  const page = pages.find((candidate) => (
    candidate.enabled
    && candidate.build.kind === "public-static"
    && candidate.path === normalizedPath
  ));

  if (!page || page.build.kind !== "public-static") return requestUrl;
  return `${publicStaticSourceToRequestPath(page.build.sourcePath)}${suffix}`;
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
        if (request.url) request.url = rewritePublicStaticDevRequest(request.url);
        next();
      });
    },
    transformIndexHtml: {
      order: "pre",
      async handler(html, context) {
        const pagePath = entryRequestToPagePath(context.path);
        const page = getPageByPath(pagePath);
        if (!page) return html;

        if (page.renderer === "cv") return renderCvDevHtml(html, root);
        if (page.renderer === "home") return renderHomepagePage(html);

        if (page.renderer === "entity") {
          const homepageTemplate = readFileSync(homepageTemplatePath, "utf8");
          return renderStandaloneEntityPage(homepageTemplate, page);
        }

        if (page.renderer === "not-found") return renderNotFoundPage(page);

        return html;
      },
    },
  };
}
