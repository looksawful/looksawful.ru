import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Storybook preview keeps canonical CSS and the three Lab review viewports", async () => {
  const preview = await read("tools/lab/storybook/preview.mjs");

  assert.match(preview, /src\/styles\/index\.css/);
  assert.match(preview, /viewport\s*:\s*\{[\s\S]*options\s*:/);
  assert.match(preview, /width:\s*"1440px"[\s\S]*height:\s*"1000px"/);
  assert.match(preview, /width:\s*"834px"[\s\S]*height:\s*"1112px"/);
  assert.match(preview, /width:\s*"390px"[\s\S]*height:\s*"844px"/);
});

test("Storybook a11y findings are blocking evidence instead of todo metadata", async () => {
  const preview = await read("tools/lab/storybook/preview.mjs");
  assert.match(preview, /a11y\s*:\s*\{[\s\S]*test\s*:\s*"error"/);
  assert.doesNotMatch(preview, /a11y\s*:\s*\{[\s\S]*test\s*:\s*"todo"/);
});

test("global experimental model-viewer CSS stays namespaced to the prototype stage", async () => {
  const css = await read("src/lab/model-viewer-controls-prototype.css");
  const selectors = css
    .split("{")
    .slice(0, -1)
    .map((chunk) => chunk.split("}").at(-1)?.trim())
    .filter((selector) => selector && !selector.startsWith("@"));

  assert.ok(selectors.length > 0);
  for (const selector of selectors) {
    assert.match(selector, /\.mv-stage\s/);
  }
});

test("Storybook launcher uses a fixed Windows command interpreter without shell mode", async () => {
  const buildScript = await read("tools/lab/build-storybook.mjs");

  assert.match(buildScript, /isWindows \? "cmd\.exe" : command/);
  assert.match(buildScript, /\["\/d",\s*"\/s",\s*"\/c",\s*command,\s*\.\.\.args\]/);
  assert.doesNotMatch(buildScript, /shell:\s*true|shell:\s*process\.platform/);
});
