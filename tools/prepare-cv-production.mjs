import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { cvContent } from "../src/data/cv.ts";
import { publicStaticOutputPath } from "../src/site/build/public-static.ts";
import { sitePages } from "../src/site/pages/manifest.ts";
import {
  readCvContent,
  transformCvContent,
} from "./lib/cv-content.mjs";
import { injectStaticSiteAnalytics } from "./lib/static-site-analytics.mjs";

const cvPage = sitePages.find((page) => page.enabled && page.renderer === "cv");
if (!cvPage || cvPage.build.kind !== "public-static") {
  throw new Error("CV SitePage must be enabled and public-static");
}

const target = process.argv[2]
  ? resolve(process.argv[2])
  : publicStaticOutputPath(cvPage);
const content = process.argv[3]
  ? await readCvContent(resolve(process.argv[3]))
  : cvContent;

const html = await readFile(target, "utf8");
const result = transformCvContent(html, content, { removeHidden: true });

if (/<article\b(?=[^>]*\bclass=["'][^"']*\bexperience-card\b[^"']*["'])(?=[^>]*\bhidden(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?)[^>]*>/i.test(result.html)) {
  throw new Error(`Hidden CV experience card remains in ${target}`);
}

const productionHtml = injectStaticSiteAnalytics(result.html, {
  cloudflareToken: process.env.VITE_CLOUDFLARE_WEB_ANALYTICS_TOKEN,
  yandexCounterId: process.env.VITE_YANDEX_METRIKA_COUNTER_ID,
});

await writeFile(target, productionHtml, "utf8");
console.log(
  `Prepared production CV: applied CMS profile and removed ${result.removed} CMS-hidden experience card(s) from ${target}`,
);