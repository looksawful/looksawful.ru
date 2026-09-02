import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { cvContent } from "../src/data/cv.ts";
import { publicStaticOutputPath } from "../src/site/build/public-static.ts";
import { sitePages } from "../src/site/pages/manifest.ts";

const cvPage = sitePages.find((page) => page.enabled && page.renderer === "cv");
if (!cvPage || cvPage.build.kind !== "public-static") {
  throw new Error("CV SitePage must be enabled and public-static");
}

const target = process.argv[2]
  ? resolve(process.argv[2])
  : publicStaticOutputPath(cvPage);

const html = await readFile(target, "utf8");
const openingPattern = /<article\b(?=[^>]*\bclass=["'][^"']*\bexperience-card\b[^"']*["'])[^>]*>/gi;
const openings = [...html.matchAll(openingPattern)].map((match) => match[0]);
const actualIds = [];

for (const opening of openings) {
  if (/\bhidden(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?/i.test(opening)) {
    throw new Error(`Hidden CV experience card remains in ${target}: ${opening}`);
  }

  const idMatch = opening.match(/\bexperience-card--([A-Za-z0-9_-]+)\b/);
  if (!idMatch) {
    throw new Error(`CV experience card is missing its stable experience-card--* class in ${target}`);
  }
  actualIds.push(idMatch[1]);
}

const expectedVisibleIds = cvContent.experience
  .filter((entry) => entry.visible)
  .map((entry) => entry.id);
const expectedHiddenIds = cvContent.experience
  .filter((entry) => !entry.visible)
  .map((entry) => entry.id);
const knownIds = new Set(cvContent.experience.map((entry) => entry.id));

for (const id of actualIds) {
  if (!knownIds.has(id)) {
    throw new Error(`Unexpected CV experience card in ${target}: ${id}`);
  }
}

for (const id of expectedVisibleIds) {
  const count = actualIds.filter((candidate) => candidate === id).length;
  if (count !== 1) {
    throw new Error(`Visible CV experience ${id} must appear exactly once in ${target}; got ${count}`);
  }
}

for (const id of expectedHiddenIds) {
  if (actualIds.includes(id)) {
    throw new Error(`Production CV still contains disabled experience ${id} in ${target}`);
  }
}

if (actualIds.length !== expectedVisibleIds.length) {
  throw new Error(
    `Production CV experience count mismatch in ${target}: expected ${expectedVisibleIds.length}, got ${actualIds.length}`,
  );
}

console.log(
  `Verified production CV: ${expectedVisibleIds.length} visible experience card(s), ${expectedHiddenIds.length} disabled card(s) absent in ${target}`,
);
