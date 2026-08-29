import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import {
  readCvContent,
  transformCvExperienceVisibility,
} from "./lib/cv-content.mjs";

const target = resolve(process.argv[2] ?? "dist/cv/index.html");
const contentPath = resolve(
  process.argv[3] ?? fileURLToPath(new URL("../src/content/cv.json", import.meta.url)),
);

const [html, content] = await Promise.all([
  readFile(target, "utf8"),
  readCvContent(contentPath),
]);

const result = transformCvExperienceVisibility(html, content);
await writeFile(target, result.html, "utf8");

console.log(
  `Applied CV content visibility: ${result.hidden} hidden experience card(s) in ${target}`,
);
