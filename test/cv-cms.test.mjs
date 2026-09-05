import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { transformCvContent } from "../tools/lib/cv-content.mjs";

const cvDataModuleUrl = new URL("../src/data/cv.ts", import.meta.url);
const cvStructureUrl = new URL("../src/content/cv.json", import.meta.url);
const cvEditorialUrl = new URL("../src/content/editorial/cv.json", import.meta.url);
const cvSourceUrl = new URL("../public/cv/index.html", import.meta.url);
const cmsConfigUrl = new URL("../.pages.yml", import.meta.url);

const experienceIds = ["jestei", "styx", "illumihand", "madcow", "sensetique", "line", "berry", "ss", "olovo", "theatre", "soroka", "kursovoy", "ran", "progress", "ria"];

function assertFileExists(url, label) {
  assert.equal(existsSync(fileURLToPath(url)), true, `${label} must exist`);
}

function articleFor(html, id) {
  const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return html.match(new RegExp(`<article\\b(?=[^>]*\\bclass=["'][^"']*\\bexperience-card--${escaped}\\b[^"']*["'])[^>]*>[\\s\\S]*?<\\/article>`, "i"))?.[0] ?? null;
}

async function fixtureContent(overrides = {}) {
  const { cvContent } = await import(cvDataModuleUrl.href);
  const current = structuredClone(cvContent);
  current.experience = current.experience.map((item) => ({
    ...item,
    visible: Object.hasOwn(overrides, item.id) ? overrides[item.id] : item.visible,
  }));
  return current;
}

async function fixtureHtml({ forceHidden = [] } = {}) {
  let html = await readFile(cvSourceUrl, "utf8");
  for (const id of forceHidden) {
    const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const openingPattern = new RegExp(`<article\\b(?=[^>]*\\bclass=["'][^"']*\\bexperience-card--${escaped}\\b[^"']*["'])[^>]*>`, "i");
    html = html.replace(openingPattern, (opening) => opening.replace(/\s+hidden(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?/gi, "").replace(/>$/, " hidden>"));
  }
  return html;
}

test("CV composed data keeps fixed experience identity and structural visibility", async () => {
  assertFileExists(cvDataModuleUrl, "src/data/cv.ts");
  assertFileExists(cvStructureUrl, "src/content/cv.json");
  assertFileExists(cvEditorialUrl, "src/content/editorial/cv.json");
  const [{ cvContent, CV_EXPERIENCE_IDS }, sourceHtml] = await Promise.all([import(cvDataModuleUrl.href), readFile(cvSourceUrl, "utf8")]);
  assert.deepEqual(CV_EXPERIENCE_IDS, experienceIds);
  assert.deepEqual(cvContent.experience.map(({ id }) => id), experienceIds);
  assert.ok(cvContent.experience.every(({ visible }) => typeof visible === "boolean"));
  assert.deepEqual([...sourceHtml.matchAll(/experience-card--([a-z0-9-]+)/g)].map((match) => match[1]), CV_EXPERIENCE_IDS);
});

test("full CV parser still rejects incomplete, duplicate and unknown runtime identity", async () => {
  const { parseCvContent } = await import(cvDataModuleUrl.href);
  const incomplete = await fixtureContent();
  incomplete.experience = incomplete.experience.slice(0, -1);
  assert.throws(() => parseCvContent(incomplete), /missing required CV experience id|experience count/i);
  const duplicate = await fixtureContent();
  duplicate.experience = [...duplicate.experience, structuredClone(duplicate.experience[0])];
  assert.throws(() => parseCvContent(duplicate), /duplicate CV experience id/i);
  const unknown = await fixtureContent();
  unknown.experience[0].id = "unknown";
  assert.throws(() => parseCvContent(unknown), /unexpected CV experience id/i);
});

test("CV composition visibility is controlled by composed content rather than legacy hidden attributes", async () => {
  const content = await fixtureContent({ jestei: true, styx: false });
  const builtHtml = transformCvContent(
    await fixtureHtml({ forceHidden: ["jestei"] }),
    content,
  ).html;

  assert.doesNotMatch(articleFor(builtHtml, "jestei"), /\bhidden(?:\s*=|\s|>)/i);
  assert.match(articleFor(builtHtml, "styx"), /\bhidden(?:\s*=|\s|>)/i);
});

test("CV composition fails closed when HTML and runtime registry drift apart", async () => {
  const content = await fixtureContent();
  const driftedHtml = (await fixtureHtml()).replace(
    /<article\b(?=[^>]*\bclass=["'][^"']*\bexperience-card--ria\b[^"']*["'])[^>]*>[\s\S]*?<\/article>/i,
    "",
  );

  assert.throws(
    () => transformCvContent(driftedHtml, content),
    /missing CV experience card.*ria/i,
  );
});

test("production CV transform physically removes exactly runtime-disabled entries", async () => {
  const content = await fixtureContent({ jestei: true, styx: false });
  const productionHtml = transformCvContent(
    await fixtureHtml({ forceHidden: ["jestei"] }),
    content,
    { removeHidden: true },
  ).html;

  for (const { id, visible } of content.experience) {
    assert.equal(Boolean(articleFor(productionHtml, id)), visible, id);
  }
  assert.doesNotMatch(productionHtml, /<article\b[^>]*\bexperience-card\b[^>]*\bhidden\b/i);
});

test("Pages CMS exposes authored CV copy only; visibility and identity remain structural", async () => {
  const cmsConfig = await readFile(cmsConfigUrl, "utf8");
  const cvConfig = cmsConfig.match(/\n  - name: cv\b[\s\S]*$/)?.[0] ?? "";
  assert.match(cvConfig, /path: src\/content\/editorial\/cv\.json/);
  assert.doesNotMatch(cvConfig, /- name: (id|visible|titleVisible|phone|telegram|instagram|email|website)\b/);
  const structure = JSON.parse(await readFile(cvStructureUrl, "utf8"));
  assert.ok(Object.values(structure.experience).every(({ visible }) => typeof visible === "boolean"));
});
