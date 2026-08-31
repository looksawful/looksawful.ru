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

const experienceIds = [
  "jestei",
  "styx",
  "illumihand",
  "madcow",
  "sensetique",
  "line",
  "berry",
  "ss",
  "olovo",
  "theatre",
  "soroka",
  "kursovoy",
  "ran",
  "progress",
  "ria",
];

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

async function fixtureContent(overrides = {}) {
  const current = JSON.parse(await readFile(cvContentUrl, "utf8"));
  return {
    ...current,
    experience: current.experience.map((item) => ({
      ...item,
      visible: Object.hasOwn(overrides, item.id) ? overrides[item.id] : item.visible,
    })),
  };
}

async function fixtureHtml({ forceHidden = [] } = {}) {
  let html = await readFile(cvSourceUrl, "utf8");
  for (const id of forceHidden) {
    const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const openingPattern = new RegExp(
      `<article\\b(?=[^>]*\\bclass=["'][^"']*\\bexperience-card--${escaped}\\b[^"']*["'])[^>]*>`,
      "i",
    );
    html = html.replace(openingPattern, (opening) => {
      const normalized = opening.replace(/\s+hidden(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?/gi, "");
      return normalized.replace(/>$/, " hidden>");
    });
  }
  return html;
}

test("CV CMS data keeps fixed experience identity while visibility remains editable", async () => {
  assertFileExists(cvDataModuleUrl, "src/data/cv.ts");
  assertFileExists(cvContentUrl, "src/content/cv.json");

  const [{ cvContent, CV_EXPERIENCE_IDS }, sourceHtml] = await Promise.all([
    import(cvDataModuleUrl.href),
    readFile(cvSourceUrl, "utf8"),
  ]);

  assert.deepEqual(CV_EXPERIENCE_IDS, experienceIds);
  assert.deepEqual(cvContent.experience.map(({ id }) => id), experienceIds);
  assert.ok(cvContent.experience.every(({ visible }) => typeof visible === "boolean"));

  const authoredIds = [...sourceHtml.matchAll(/experience-card--([a-z0-9-]+)/g)].map((match) => match[1]);
  assert.deepEqual(authoredIds, CV_EXPERIENCE_IDS);
});

test("CV content adapter rejects incomplete, duplicate and unknown experience identity", async () => {
  assertFileExists(cvDataModuleUrl, "src/data/cv.ts");
  const { parseCvContent } = await import(cvDataModuleUrl.href);

  const incomplete = await fixtureContent();
  incomplete.experience = incomplete.experience.slice(0, -1);
  assert.throws(
    () => parseCvContent(incomplete),
    /missing required CV experience id|experience count/i,
  );

  const duplicate = await fixtureContent();
  duplicate.experience = [...duplicate.experience, structuredClone(duplicate.experience[0])];
  assert.throws(
    () => parseCvContent(duplicate),
    /duplicate CV experience id/i,
  );

  const unknown = await fixtureContent();
  unknown.experience = unknown.experience.map((item, index) => index === 0 ? { ...item, id: "unknown" } : item);
  assert.throws(
    () => parseCvContent(unknown),
    /unexpected CV experience id/i,
  );
});

test("CV build visibility is controlled by content data rather than legacy hidden attributes", async () => {
  assertFileExists(applyScriptUrl, "tools/apply-cv-content.mjs");

  const dir = await mkdtemp(join(tmpdir(), "cv-content-"));
  const htmlPath = join(dir, "index.html");
  const contentPath = join(dir, "cv.json");

  await writeFile(htmlPath, await fixtureHtml({ forceHidden: ["jestei"] }), "utf8");
  await writeFile(
    contentPath,
    JSON.stringify(await fixtureContent({ jestei: true, styx: false })),
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
  const sourceHtml = await fixtureHtml();

  await writeFile(
    htmlPath,
    sourceHtml.replace(
      /<article\b(?=[^>]*\bclass=["'][^"']*\bexperience-card--ria\b[^"']*["'])[^>]*>[\s\S]*?<\/article>/i,
      "",
    ),
    "utf8",
  );
  await writeFile(contentPath, JSON.stringify(await fixtureContent()), "utf8");

  const result = spawnSync(
    process.execPath,
    [fileURLToPath(applyScriptUrl), htmlPath, contentPath],
    { encoding: "utf8" },
  );

  assert.notEqual(result.status, 0);
  assert.match(`${result.stderr}\n${result.stdout}`, /missing CV experience card.*ria/i);
});

test("production CV physically removes exactly the entries disabled by current content", async () => {
  const dir = await mkdtemp(join(tmpdir(), "cv-production-content-"));
  const htmlPath = join(dir, "index.html");
  const contentPath = join(dir, "cv.json");
  const content = await fixtureContent({ jestei: true, styx: false });

  await writeFile(htmlPath, await fixtureHtml({ forceHidden: ["jestei"] }), "utf8");
  await writeFile(contentPath, JSON.stringify(content), "utf8");

  const result = spawnSync(
    process.execPath,
    [fileURLToPath(productionScriptUrl), htmlPath, contentPath],
    { encoding: "utf8" },
  );
  assert.equal(result.status, 0, result.stderr || result.stdout);

  const productionHtml = await readFile(htmlPath, "utf8");
  for (const { id, visible } of content.experience) {
    assert.equal(Boolean(articleFor(productionHtml, id)), visible, `production visibility mismatch for ${id}`);
  }
  assert.doesNotMatch(productionHtml, /<article\b[^>]*\bexperience-card\b[^>]*\bhidden\b/i);
});

test("Pages CMS exposes CV experience visibility without exposing identity or layout controls", async () => {
  const cmsConfig = await readFile(cmsConfigUrl, "utf8");
  const cvConfig = cmsConfig.match(/\n  - name: cv\b[\s\S]*$/)?.[0] ?? "";
  const experienceConfig = cvConfig.match(/\n      - name: experience\b[\s\S]*$/)?.[0] ?? "";

  assert.match(cvConfig, /path: src\/content\/cv\.json/);
  assert.match(experienceConfig, /name: experience\b[\s\S]*?type: object[\s\S]*?list:/);
  assert.match(experienceConfig, /name: id\b[\s\S]*?readonly: true/);
  assert.match(experienceConfig, /name: visible\b[\s\S]*?type: boolean/);
  assert.doesNotMatch(experienceConfig, /name: (className|route|canonical|listed|indexable|pageType)\b/);
});
