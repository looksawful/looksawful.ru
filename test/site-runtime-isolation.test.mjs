import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import test from "node:test";

const main = await readFile(new URL("../src/main.js", import.meta.url), "utf8");

test("project-specific side-effect runtimes are loaded only when matching DOM exists", () => {
  assert.doesNotMatch(main, /^import\s+["']\.\/components\/awful-cases-game\.js["'];/m);
  assert.doesNotMatch(main, /^import\s+["']\.\/components\/animated-canvas-gallery\.js["'];/m);
  assert.doesNotMatch(
    main,
    /^import\s+\{\s*createJesteiThemeOrganisms\s*\}\s+from\s+["']\.\/components\/jestei-theme-organism\/jestei-theme-organism\.js["'];/m,
  );

  assert.match(
    main,
    /querySelector\(["']\.awful-cases-game["']\)[\s\S]*import\(["']\.\/components\/awful-cases-game\.js["']\)/,
  );
  assert.match(
    main,
    /querySelector\(["']\[data-animated-canvas-gallery\]["']\)[\s\S]*import\(["']\.\/components\/animated-canvas-gallery\.js["']\)/,
  );
  assert.match(
    main,
    /querySelector\(["']\[data-jestei-theme-organism\]\[data-jestei-theme-instance="inline"\]["']\)[\s\S]*import\(["']\.\/components\/jestei-theme-organism\/jestei-theme-organism\.js["']\)/,
  );
});

test("TEMP Three.js 0.185.1 starts the real Jestei WebGL experience in Chromium", () => {
  const result = spawnSync(process.execPath, ["tools/e2e/validate-three-jestei-temp.mjs"], {
    encoding: "utf8",
    stdio: "pipe",
    timeout: 120_000,
  });
  assert.equal(result.status, 0, `Three.js WebGL validation failed:\n${result.stdout}\n${result.stderr}`);
});
