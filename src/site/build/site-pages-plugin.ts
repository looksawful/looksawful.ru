import type { Plugin } from "vite";

import { entityPageContentRegistry } from "../../content/pages/index.ts";
import { validateEntityPageArchitecture } from "../pages/content-validation.ts";
import { entityShellPresentationRegistry } from "../pages/entity-presentation.ts";
import {
  assertHomepagePresentationSupported,
  homepageEntries,
} from "../pages/homepage.ts";
import { getPageByPath, sitePages } from "../pages/manifest.ts";
import type { SitePageDefinition } from "../pages/types.ts";
import { normalizePagePath } from "../pages/validation.ts";
import { renderCvDevHtml } from "../renderers/cv-page.ts";
import { renderStandaloneEntityPage } from "../renderers/entity-page.ts";
import { renderHomepagePage } from "../renderers/home/home-page.ts";
import { renderNotFoundPage } from "../renderers/not-found-page.ts";
import { publicStaticRequestPath } from "./public-static.ts";

export function entryRequestToPagePath(requestPath: string): string {
  const pathname = requestPath.split(/[?#]/, 1)[0] || "/";
  if (pathname === "/index.html") return "/";
  if (pathname.endsWith("/index.html")) {
    return pathname.slice(0, -"index.html".length);
  }
  return pathname;
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
  return `${publicStaticRequestPath(page)}${suffix}`;
}

export function createSitePagesPlugin(root = process.cwd()): Plugin {
  validateEntityPageArchitecture(
    sitePages,
    entityPageContentRegistry,
    entityShellPresentationRegistry,
  );
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
        if (page.renderer === "entity") return renderStandaloneEntityPage(page);
        if (page.renderer === "not-found") return renderNotFoundPage(page);

        return html;
      },
    },
  };
}
