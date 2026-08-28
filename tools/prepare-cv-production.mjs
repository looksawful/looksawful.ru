import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const target = resolve(process.argv[2] ?? "dist/cv/index.html");

const hiddenExperienceCardPattern = /<article\b(?=[^>]*\bclass=["'][^"']*\bexperience-card\b[^"']*["'])(?=[^>]*\bhidden(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?)[^>]*>[\s\S]*?<\/article>/gi;

const html = await readFile(target, "utf8");
const matches = html.match(hiddenExperienceCardPattern) ?? [];
const cleaned = html.replace(hiddenExperienceCardPattern, "");

if (hiddenExperienceCardPattern.test(cleaned)) {
  throw new Error(`Hidden CV experience cards remain in ${target}`);
}

await writeFile(target, cleaned, "utf8");
console.log(`Prepared production CV: removed ${matches.length} hidden experience card(s) from ${target}`);
