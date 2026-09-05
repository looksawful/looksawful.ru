import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import test from "node:test";

const componentRoot = new URL("../src/components/jestei-theme-organism/", import.meta.url);
const runtimeUrl = new URL("jestei-theme-organism.js", componentRoot);
const dataTsUrl = new URL("jestei-theme-organism-data.ts", componentRoot);
const dataJsUrl = new URL("jestei-theme-organism-data.js", componentRoot);
const shadersTsUrl = new URL("jestei-theme-organism-shaders.ts", componentRoot);
const shadersJsUrl = new URL("jestei-theme-organism-shaders.js", componentRoot);

test("Jestei theme static runtime data and shaders are TypeScript-owned without JS compatibility copies", async () => {
  assert.equal(existsSync(dataTsUrl), true, "theme runtime data must be owned by .ts");
  assert.equal(existsSync(shadersTsUrl), true, "theme shaders must be owned by .ts");
  assert.equal(existsSync(dataJsUrl), false, "legacy theme data .js must be removed");
  assert.equal(existsSync(shadersJsUrl), false, "legacy theme shaders .js must be removed");

  const runtime = await readFile(runtimeUrl, "utf8");
  assert.match(runtime, /from\s+["']\.\/jestei-theme-organism-data\.ts["']/);
  assert.match(runtime, /from\s+["']\.\/jestei-theme-organism-shaders\.ts["']/);
  assert.doesNotMatch(runtime, /jestei-theme-organism-(?:data|shaders)\.js/);
});

test("migrated Jestei theme modules preserve their public runtime values", async () => {
  const data = await import(`${dataTsUrl.href}?runtime-contract=${Date.now()}`);
  assert.deepEqual([...data.JESTEI_THEME_NAMES], ["neutral", "basic", "event", "pro", "feature"]);
  assert.equal(data.JESTEI_THEME_SETTINGS.passDuration, 5);
  assert.equal(data.JESTEI_THEME_MODEL_URL, "/media/projects/jestei/theme-organism/jestei-theme-organism.glb");
  assert.equal(data.JESTEI_THEME_DRACO_PATH, "/vendor/draco/gltf/");

  const shaders = await import(`${shadersTsUrl.href}?runtime-contract=${Date.now()}`);
  assert.match(shaders.VERTEX_SHADER, /varying vec3 vLocalPosition;/);
  assert.match(shaders.VERTEX_SHADER, /projectionMatrix/);
  assert.match(shaders.FRAGMENT_SHADER, /uniform float uIntroMode;/);
  assert.match(shaders.FRAGMENT_SHADER, /#include <colorspace_fragment>/);
});
