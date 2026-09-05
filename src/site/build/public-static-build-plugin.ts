import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import type { Plugin } from "vite";

import { cvContent } from "../../data/cv.ts";
import { sitePages } from "../pages/manifest.ts";
import { publicStaticOutputPath } from "./public-static.ts";

interface CvTransformResult {
  readonly html: string;
  readonly hidden: number;
  readonly removed: number;
}

interface CvContentModule {
  transformCvContent(
    html: string,
    content: unknown,
    options?: { readonly removeHidden?: boolean },
  ): CvTransformResult;
}

interface StaticAnalyticsModule {
  injectStaticSiteAnalytics(
    html: string,
    config?: {
      readonly cloudflareToken?: string;
      readonly yandexCounterId?: string;
    },
  ): string;
}

async function loadToolModule<T>(root: string, relativePath: string): Promise<T> {
  const moduleUrl = pathToFileURL(path.resolve(root, relativePath)).href;
  return await import(/* @vite-ignore */ moduleUrl) as T;
}

function getCvPage() {
  const page = sitePages.find((candidate) => candidate.enabled && candidate.renderer === "cv");
  if (!page || page.build.kind !== "public-static") {
    throw new Error("CV SitePage must be enabled and public-static");
  }
  return page;
}

export async function finalizeProductionCv(
  root = process.cwd(),
  env: Readonly<Record<string, string | undefined>> = process.env,
): Promise<{ readonly changed: boolean; readonly removed: number }> {
  const cvPage = getCvPage();
  const target = publicStaticOutputPath(cvPage, root);
  const [cvModule, analyticsModule, html] = await Promise.all([
    loadToolModule<CvContentModule>(root, "tools/lib/cv-content.mjs"),
    loadToolModule<StaticAnalyticsModule>(root, "tools/lib/static-site-analytics.mjs"),
    readFile(target, "utf8"),
  ]);

  const result = cvModule.transformCvContent(html, cvContent, { removeHidden: true });
  if (/<article\b(?=[^>]*\bclass=["'][^"']*\bexperience-card\b[^"']*["'])(?=[^>]*\bhidden(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?)[^>]*>/i.test(result.html)) {
    throw new Error(`Hidden CV experience card remains in ${target}`);
  }

  const productionHtml = analyticsModule.injectStaticSiteAnalytics(result.html, {
    cloudflareToken: env.VITE_CLOUDFLARE_WEB_ANALYTICS_TOKEN,
    yandexCounterId: env.VITE_YANDEX_METRIKA_COUNTER_ID,
  });
  const changed = productionHtml !== html;
  if (changed) await writeFile(target, productionHtml, "utf8");

  return { changed, removed: result.removed };
}

export function createPublicStaticBuildPlugin(root = process.cwd()): Plugin {
  return {
    name: "looksawful-public-static-build",
    apply: "build",
    enforce: "post",
    async closeBundle() {
      await finalizeProductionCv(root);
    },
  };
}
