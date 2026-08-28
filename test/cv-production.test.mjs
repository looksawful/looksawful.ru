import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const scriptUrl = new URL("../tools/prepare-cv-production.mjs", import.meta.url);

test("production CV build physically removes hidden experience cards", async () => {
  const dir = await mkdtemp(join(tmpdir(), "cv-production-"));
  const htmlPath = join(dir, "index.html");

  await writeFile(
    htmlPath,
    [
      "<!doctype html><html><body>",
      '<article class="experience-card">VISIBLE ENTRY</article>',
      '<article class="experience-card experience-card--private" hidden>PRIVATE ENTRY</article>',
      '<article hidden class="experience-card experience-card--private-2">PRIVATE ENTRY 2</article>',
      "</body></html>",
    ].join(""),
    "utf8",
  );

  const result = spawnSync(process.execPath, [scriptUrl.pathname, htmlPath], {
    encoding: "utf8",
  });

  assert.equal(
    result.status,
    0,
    `production CV preparation failed:\n${result.stderr || result.stdout}`,
  );

  const builtHtml = await readFile(htmlPath, "utf8");
  assert.match(builtHtml, /VISIBLE ENTRY/);
  assert.doesNotMatch(builtHtml, /PRIVATE ENTRY/);
  assert.doesNotMatch(builtHtml, /experience-card[^>]*hidden|hidden[^>]*experience-card/i);
});
