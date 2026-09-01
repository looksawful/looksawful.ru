import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { publicStaticOutputPath } from "../src/site/build/public-static.ts";
import { sitePages } from "../src/site/pages/manifest.ts";
import {
  readCvContent,
  transformCvContent,
} from "./lib/cv-content.mjs";

const cvPage = sitePages.find((page) => page.enabled && page.renderer === "cv");
if (!cvPage || cvPage.build.kind !== "public-static") {
  throw new Error("CV SitePage must be enabled and public-static");
}

const target = process.argv[2]
  ? resolve(process.argv[2])
  : publicStaticOutputPath(cvPage);
const contentPath = resolve(
  process.argv[3] ?? fileURLToPath(new URL("../src/content/cv.json", import.meta.url)),
);

const [html, content] = await Promise.all([
  readFile(target, "utf8"),
  readCvContent(contentPath),
]);

const result = transformCvContent(html, content);
await writeFile(target, result.html, "utf8");

console.log(
  `Applied CV content: ${result.hidden} hidden experience card(s) in ${target}`,
);
