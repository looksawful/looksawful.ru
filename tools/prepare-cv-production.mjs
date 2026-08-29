import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import {
  readCvContent,
  transformCvContent,
} from "./lib/cv-content.mjs";

const target = resolve(process.argv[2] ?? "dist/cv/index.html");
const contentPath = resolve(
  process.argv[3] ?? fileURLToPath(new URL("../src/content/cv.json", import.meta.url)),
);

const [html, content] = await Promise.all([
  readFile(target, "utf8"),
  readCvContent(contentPath),
]);

const result = transformCvContent(html, content, { removeHidden: true });

if (/<article\b(?=[^>]*\bclass=["'][^"']*\bexperience-card\b[^"']*["'])(?=[^>]*\bhidden(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?)[^>]*>/i.test(result.html)) {
  throw new Error(`Hidden CV experience card remains in ${target}`);
}

await writeFile(target, result.html, "utf8");
console.log(
  `Prepared production CV: applied CMS profile and removed ${result.removed} CMS-hidden experience card(s) from ${target}`,
);
