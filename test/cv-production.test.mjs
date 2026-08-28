import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const scriptUrl = new URL("../tools/prepare-cv-production.mjs", import.meta.url);
const sourceCvUrl = new URL("../public/cv/index.html", import.meta.url);
const manifestUrl = new URL("../src/data/cv-hidden-experience.json", import.meta.url);

test("production CV physically removes hidden and manifest-excluded experience cards", async () => {
  const dir = await mkdtemp(join(tmpdir(), "cv-production-"));
  const htmlPath = join(dir, "index.html");
  const manifestPath = join(dir, "hidden.json");

  await writeFile(
    htmlPath,
    [
      "<!doctype html><html><body>",
      '<article class="experience-card experience-card--visible">VISIBLE ENTRY</article>',
      '<article class="experience-card experience-card--hidden" hidden>HIDDEN ENTRY</article>',
      '<article class="experience-card experience-card--manifest-only">MANIFEST ENTRY</article>',
      "</body></html>",
    ].join(""),
    "utf8",
  );

  await writeFile(
    manifestPath,
    JSON.stringify({ classes: ["experience-card--manifest-only"] }),
    "utf8",
  );

  const result = spawnSync(
    process.execPath,
    [scriptUrl.pathname, htmlPath, manifestPath],
    { encoding: "utf8" },
  );

  assert.equal(
    result.status,
    0,
    `production CV preparation failed:\n${result.stderr || result.stdout}`,
  );

  const builtHtml = await readFile(htmlPath, "utf8");
  assert.match(builtHtml, /VISIBLE ENTRY/);
  assert.doesNotMatch(builtHtml, /HIDDEN ENTRY/);
  assert.doesNotMatch(builtHtml, /MANIFEST ENTRY/);
  assert.doesNotMatch(builtHtml, /experience-card[^>]*hidden|hidden[^>]*experience-card/i);
});

test("CV hidden manifest matches every hidden experience card in development source", async () => {
  const [sourceHtml, manifestRaw] = await Promise.all([
    readFile(sourceCvUrl, "utf8"),
    readFile(manifestUrl, "utf8"),
  ]);

  const manifest = JSON.parse(manifestRaw);
  const manifestClasses = [...manifest.classes].sort();
  const hiddenClasses = [];
  const articlePattern = /<article\b([^>]*)>[\s\S]*?<\/article>/gi;

  for (const match of sourceHtml.matchAll(articlePattern)) {
    const attrs = match[1];
    if (!/(?:^|\s)hidden(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?(?:\s|$)/i.test(attrs)) {
      continue;
    }

    const classMatch = attrs.match(/\bclass\s*=\s*["']([^"']*)["']/i);
    const classes = classMatch ? classMatch[1].split(/\s+/).filter(Boolean) : [];
    const privateClass = classes.find(
      (className) => className.startsWith("experience-card--"),
    );

    assert.ok(privateClass, `Hidden CV card has no stable experience-card--* class: ${attrs}`);
    hiddenClasses.push(privateClass);
  }

  assert.deepEqual(hiddenClasses.sort(), manifestClasses);
});
