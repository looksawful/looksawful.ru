import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const main = await readFile(new URL("../src/main.ts", import.meta.url), "utf8");

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
