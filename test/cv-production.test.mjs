import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";

const scriptUrl = new URL("../tools/prepare-cv-production.mjs", import.meta.url);
const sourceCvUrl = new URL("../public/cv/index.html", import.meta.url);
const editorialContentUrl = new URL("../src/content/editorial/cv.json", import.meta.url);
const cvDataModuleUrl = new URL("../src/data/cv.ts", import.meta.url);
const scriptPath = fileURLToPath(scriptUrl);

function articleExists(html, id) {
  const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(
    `<article\\b[^>]*\\bclass=["'][^"']*\\bexperience-card--${escaped}\\b[^"']*["']`,
    "i",
  ).test(html);
}

test("production CV composes editorial override with canonical structural visibility", async () => {
  const dir = await mkdtemp(join(tmpdir(), "cv-production-"));
  const htmlPath = join(dir, "index.html");
  const editorialPath = join(dir, "editorial-cv.json");
  const [sourceHtml, editorialRaw, { cvContent }] = await Promise.all([
    readFile(sourceCvUrl, "utf8"),
    readFile(editorialContentUrl, "utf8"),
    import(cvDataModuleUrl.href),
  ]);
  const editorial = JSON.parse(editorialRaw);
  await writeFile(htmlPath, sourceHtml, "utf8");
  await writeFile(editorialPath, JSON.stringify(editorial), "utf8");

  const result = spawnSync(process.execPath, [scriptPath, htmlPath, editorialPath], { encoding: "utf8" });
  assert.equal(result.status, 0, `production CV preparation failed:\n${result.stderr || result.stdout}`);

  const builtHtml = await readFile(htmlPath, "utf8");
  for (const { id, visible } of cvContent.experience) {
    assert.equal(articleExists(builtHtml, id), visible, `production visibility mismatch for CV experience ${id}`);
  }
  assert.doesNotMatch(builtHtml, /<article\b(?=[^>]*\bclass=["'][^"']*\bexperience-card\b[^"']*["'])(?=[^>]*\bhidden(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?)[^>]*>/i);
});
