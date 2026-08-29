import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const scriptUrl = new URL("../tools/prepare-cv-production.mjs", import.meta.url);
const sourceCvUrl = new URL("../public/cv/index.html", import.meta.url);
const contentUrl = new URL("../src/content/cv.json", import.meta.url);

function articleExists(html, id) {
  const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(
    `<article\\b[^>]*\\bclass=["'][^"']*\\bexperience-card--${escaped}\\b[^"']*["']`,
    "i",
  ).test(html);
}

test("production CV physically removes exactly the experience hidden by structured CMS content", async () => {
  const dir = await mkdtemp(join(tmpdir(), "cv-production-"));
  const htmlPath = join(dir, "index.html");
  const [sourceHtml, contentRaw] = await Promise.all([
    readFile(sourceCvUrl, "utf8"),
    readFile(contentUrl, "utf8"),
  ]);
  const content = JSON.parse(contentRaw);

  await writeFile(htmlPath, sourceHtml, "utf8");

  const result = spawnSync(
    process.execPath,
    [scriptUrl.pathname, htmlPath, contentUrl.pathname],
    { encoding: "utf8" },
  );

  assert.equal(
    result.status,
    0,
    `production CV preparation failed:\n${result.stderr || result.stdout}`,
  );

  const builtHtml = await readFile(htmlPath, "utf8");
  for (const { id, visible } of content.experience) {
    assert.equal(
      articleExists(builtHtml, id),
      visible,
      `production visibility mismatch for CV experience ${id}`,
    );
  }

  assert.doesNotMatch(
    builtHtml,
    /<article\b(?=[^>]*\bclass=["'][^"']*\bexperience-card\b[^"']*["'])(?=[^>]*\bhidden(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?)[^>]*>/i,
  );
});
