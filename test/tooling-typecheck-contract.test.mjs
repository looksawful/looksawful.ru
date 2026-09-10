import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

test("typecheck keeps browser and Node tooling environments separate", async () => {
  const appConfig = await readJson("tsconfig.json");
  const toolsConfig = await readJson("tsconfig.tools.json");
  const packageJson = await readJson("package.json");

  assert.deepEqual(appConfig.include, ["src/**/*.ts", "vite.config.ts"]);
  assert.equal(appConfig.compilerOptions.types.includes("node"), false);

  assert.equal(toolsConfig.compilerOptions.strict, true);
  assert.deepEqual(toolsConfig.compilerOptions.types, ["node"]);
  assert.equal(toolsConfig.compilerOptions.lib.includes("DOM"), false);
  assert.deepEqual(toolsConfig.include, ["tools/**/*.ts"]);

  assert.match(packageJson.scripts.typecheck, /tsc -p tsconfig\.json/);
  assert.match(packageJson.scripts.typecheck, /tsc -p tsconfig\.tools\.json/);
});

test("integrity tooling boundary contains no readonly any arrays", async () => {
  const source = await readFile("tools/check-data-integrity.ts", "utf8");
  assert.doesNotMatch(source, /readonly\s+any\[\]/);
});
