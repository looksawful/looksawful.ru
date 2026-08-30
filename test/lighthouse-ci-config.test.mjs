import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const configPath = fileURLToPath(new URL("../lighthouserc.cjs", import.meta.url));

test("Lighthouse config launches CI Chromium without a Linux sandbox", async () => {
  const fixtureRoot = await mkdtemp(path.join(tmpdir(), "looksawful-lhci-"));
  const previousCwd = process.cwd();

  await mkdir(path.join(fixtureRoot, "dist"), { recursive: true });
  await writeFile(
    path.join(fixtureRoot, "dist", "sitemap.xml"),
    '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://www.looksawful.ru/</loc></url></urlset>',
  );

  try {
    process.chdir(fixtureRoot);
    delete require.cache[require.resolve(configPath)];
    const config = require(configPath);

    assert.equal(config.ci.collect.settings?.chromeFlags, "--no-sandbox");
  } finally {
    process.chdir(previousCwd);
    delete require.cache[require.resolve(configPath)];
    await rm(fixtureRoot, { recursive: true, force: true });
  }
});
