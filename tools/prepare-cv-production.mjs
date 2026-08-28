import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const target = resolve(process.argv[2] ?? "dist/cv/index.html");
const manifestPath = resolve(
  process.argv[3] ?? new URL("../src/data/cv-hidden-experience.json", import.meta.url).pathname,
);

const [html, manifestRaw] = await Promise.all([
  readFile(target, "utf8"),
  readFile(manifestPath, "utf8"),
]);

const manifest = JSON.parse(manifestRaw);
const excludedClasses = new Set(manifest.classes ?? []);

const articlePattern = /<article\b([^>]*)>[\s\S]*?<\/article>/gi;
let removed = 0;

const cleaned = html.replace(articlePattern, (article, attrs) => {
  const classMatch = attrs.match(/\bclass\s*=\s*["']([^"']*)["']/i);
  const classes = classMatch ? classMatch[1].split(/\s+/).filter(Boolean) : [];
  const isExperienceCard = classes.includes("experience-card");

  if (!isExperienceCard) return article;

  const hasHiddenAttribute = /(?:^|\s)hidden(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?(?:\s|$)/i.test(attrs);
  const isManifestExcluded = classes.some((className) => excludedClasses.has(className));

  if (!hasHiddenAttribute && !isManifestExcluded) return article;

  removed += 1;
  return "";
});

const remainingHiddenCard = cleaned.match(
  /<article\b(?=[^>]*\bclass=["'][^"']*\bexperience-card\b[^"']*["'])(?=[^>]*\bhidden(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?)[^>]*>/i,
);

if (remainingHiddenCard) {
  throw new Error(`Hidden CV experience card remains in ${target}`);
}

for (const excludedClass of excludedClasses) {
  const escaped = excludedClass.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const forbidden = new RegExp(
    `<article\\b[^>]*\\bclass=["'][^"']*\\b${escaped}\\b[^"']*["']`,
    "i",
  );

  if (forbidden.test(cleaned)) {
    throw new Error(`Excluded CV experience ${excludedClass} remains in ${target}`);
  }
}

await writeFile(target, cleaned, "utf8");
console.log(
  `Prepared production CV: removed ${removed} hidden/excluded experience card(s) from ${target}`,
);
