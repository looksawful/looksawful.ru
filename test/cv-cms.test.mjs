import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";

const cvDataModuleUrl = new URL("../src/data/cv.ts", import.meta.url);
const cvContentUrl = new URL("../src/content/cv.json", import.meta.url);
const cvSourceUrl = new URL("../public/cv/index.html", import.meta.url);
const cmsConfigUrl = new URL("../.pages.yml", import.meta.url);
const applyScriptUrl = new URL("../tools/apply-cv-content.mjs", import.meta.url);
const productionScriptUrl = new URL("../tools/prepare-cv-production.mjs", import.meta.url);

const expectedVisibility = new Map([
  ["jestei", true],
  ["styx", true],
  ["illumihand", false],
  ["madcow", true],
  ["sensetique", true],
  ["line", true],
  ["berry", false],
  ["ss", false],
  ["olovo", false],
  ["theatre", false],
  ["soroka", false],
  ["kursovoy", true],
  ["ran", false],
  ["progress", true],
  ["ria", true],
]);

const experienceIds = [...expectedVisibility.keys()];

function assertFileExists(url, label) {
  assert.equal(existsSync(fileURLToPath(url)), true, `${label} must exist`);
}

function articleFor(html, id) {
  const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(
    `<article\\b(?=[^>]*\\bclass=["'][^"']*\\bexperience-card--${escaped}\\b[^"']*["'])[^>]*>[\\s\\S]*?<\\/article>`,
    "i",
  );
  return html.match(pattern)?.[0] ?? null;
}

function fixtureContent(overrides = {}) {
  return {
    experience: experienceIds.map((id) => ({
      id,
      visible: Object.hasOwn(overrides, id) ? overrides[id] : expectedVisibility.get(id),
    })),
  };
}

function fixtureHtml(hiddenIds = new Set()) {
  const cards = experienceIds.map((id) => {
    const hidden = hiddenIds.has(id) ? " hidden" : "";
    return `<article class="experience-card experience-card--${id}"${hidden}>CARD ${id}</article>`;
  });
  return `<!doctype html><html><body>${cards.join("")}</body></html>`;
}

test("CV CMS data has one fixed visibility record for every authored experience card", async () => {
  assertFileExists(cvDataModuleUrl, "src/data/cv.ts");
  assertFileExists(cvContentUrl, "src/content/cv.json");

  const [{ cvContent, CV_EXPERIENCE_IDS }, sourceHtml] = await Promise.all([
    import(cvDataModuleUrl.href),
    readFile(cvSourceUrl, "utf8"),
  ]);

  assert.deepEqual(CV_EXPERIENCE_IDS, experienceIds);
  assert.deepEqual(
    cvContent.experience.map(({ id, visible }) => [id, visible]),
    [...expectedVisibility.entries()],
  );

  const authoredIds = [...sourceHtml.matchAll(/experience-card--([a-z0-9-]+)/g)].map((match) => match[1]);
  assert.deepEqual([...new Set(authoredIds)], CV_EXPERIENCE_IDS);
});

test("CV content adapter rejects incomplete, duplicate and unknown experience identity", async () => {
  assertFileExists(cvDataModuleUrl, "src/data/cv.ts");
  const { parseCvContent } = await import(cvDataModuleUrl.href);

  assert.throws(
    () => parseCvContent({ experience: fixtureContent().experience.slice(0, -1) }),
    /missing required CV experience id|experience count/i,
  );
  assert.throws(
    () => parseCvContent({ experience: [...fixtureContent().experience, { id: "jestei", visible: true }] }),
    /duplicate CV experience id/i,
  );
  assert.throws(
    () => parseCvContent({ experience: fixtureContent().experience.map((item, index) => index === 0 ? { ...item, id: "unknown" } : item) }),
    /unexpected CV experience id/i,
  );
});

test("CV build visibility is controlled by content data rather than legacy hidden attributes", async () => {
  assertFileExists(applyScriptUrl, "tools/apply-cv-content.mjs");

  const dir = await mkdtemp(join(tmpdir(), "cv-content-"));
  const htmlPath = join(dir, "index.html");
  const contentPath = join(dir, "cv.json");

  await writeFile(htmlPath, fixtureHtml(new Set(["jestei"])), "utf8");
  await writeFile(
    contentPath,
    JSON.stringify(fixtureContent({ jestei: true, styx: false })),
    "utf8",
  );

  const result = spawnSync(
    process.execPath,
    [fileURLToPath(applyScriptUrl), htmlPath, contentPath],
    { encoding: "utf8" },
  );
  assert.equal(result.status, 0, result.stderr || result.stdout);

  const builtHtml = await readFile(htmlPath, "utf8");
  const jestei = articleFor(builtHtml, "jestei");
  const styx = articleFor(builtHtml, "styx");
  assert.ok(jestei);
  assert.ok(styx);
  assert.doesNotMatch(jestei, /\bhidden(?:\s*=|\s|>)/i);
  assert.match(styx, /\bhidden(?:\s*=|\s|>)/i);
});

test("CV build fails closed when the HTML and visibility registry drift apart", async () => {
  assertFileExists(applyScriptUrl, "tools/apply-cv-content.mjs");

  const dir = await mkdtemp(join(tmpdir(), "cv-content-drift-"));
  const htmlPath = join(dir, "index.html");
  const contentPath = join(dir, "cv.json");

  await writeFile(
    htmlPath,
    fixtureHtml().replace(/<article class="experience-card experience-card--ria">[\s\S]*?<\/article>/, ""),
    "utf8",
  );
  await writeFile(contentPath, JSON.stringify(fixtureContent()), "utf8");

  const result = spawnSync(
    process.execPath,
    [fileURLToPath(applyScriptUrl), htmlPath, contentPath],
    { encoding: "utf8" },
  );

  assert.notEqual(result.status, 0);
  assert.match(`${result.stderr}\n${result.stdout}`, /missing CV experience card.*ria/i);
});

test("production CV physically removes experience entries whose CMS visibility is false", async () => {
  const dir = await mkdtemp(join(tmpdir(), "cv-production-content-"));
  const htmlPath = join(dir, "index.html");
  const contentPath = join(dir, "cv.json");

  await writeFile(htmlPath, fixtureHtml(new Set(["jestei"])), "utf8");
  await writeFile(
    contentPath,
    JSON.stringify(fixtureContent({ jestei: true, styx: false })),
    "utf8",
  );

  const result = spawnSync(
    process.execPath,
    [fileURLToPath(productionScriptUrl), htmlPath, contentPath],
    { encoding: "utf8" },
  );
  assert.equal(result.status, 0, result.stderr || result.stdout);

  const productionHtml = await readFile(htmlPath, "utf8");
  assert.match(productionHtml, /CARD jestei/);
  assert.doesNotMatch(productionHtml, /CARD styx/);
  for (const [id, visible] of Object.entries(Object.fromEntries(expectedVisibility))) {
    if (id === "styx") continue;
    const expected = id === "jestei" ? true : visible;
    if (expected) assert.match(productionHtml, new RegExp(`CARD ${id}\\b`));
    else assert.doesNotMatch(productionHtml, new RegExp(`CARD ${id}\\b`));
  }
  assert.doesNotMatch(productionHtml, /<article\b[^>]*\bexperience-card\b[^>]*\bhidden\b/i);
});

test("Pages CMS exposes CV experience visibility without exposing identity or layout controls", async () => {
  const cmsConfig = await readFile(cmsConfigUrl, "utf8");

  assert.match(cmsConfig, /name: cv\b[\s\S]*?path: src\/content\/cv\.json/);
  assert.match(cmsConfig, /name: experience\b[\s\S]*?type: object[\s\S]*?list:/);
  assert.match(cmsConfig, /name: id\b[\s\S]*?readonly: true/);
  assert.match(cmsConfig, /name: visible\b[\s\S]*?type: boolean/);
  assert.doesNotMatch(cmsConfig, /name: (className|route|canonical|listed|indexable|pageType)\b/);
});
