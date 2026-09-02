import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const root = new URL("../src/content/editorial/", import.meta.url);
const forbidden = new Set([
  "id",
  "slug",
  "route",
  "href",
  "url",
  "target",
  "pageType",
  "componentType",
  "component",
  "layout",
  "layoutKind",
  "renderMode",
  "breakpoint",
  "breakpoints",
  "media",
  "mediaSrc",
  "src",
  "sourceSrc",
  "assetId",
  "coverId",
  "cover",
  "visible",
  "titleVisible",
  "order",
  "width",
  "height",
]);

async function files(dir) {
  const result = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const child = new URL(entry.name + (entry.isDirectory() ? "/" : ""), dir);
    if (entry.isDirectory()) result.push(...await files(child));
    else if (entry.name.endsWith(".json")) result.push(child);
  }
  return result;
}

function isStructuralKey(key) {
  return forbidden.has(key) || /(?:Id|Ids|Src|Path|Route)$/.test(key);
}

function walk(value, location) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => walk(item, `${location}[${index}]`));
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value)) {
    assert.equal(isStructuralKey(key), false, `editorial structural key "${key}" at ${location}`);
    walk(child, `${location}.${key}`);
  }
}

test("editorial JSON owns authored copy only, never routing, IDs, visibility, media or runtime structure", async () => {
  const editorialFiles = await files(root);
  assert.ok(editorialFiles.length > 0, "editorial layer must contain authored copy files");
  for (const file of editorialFiles) {
    const value = JSON.parse(await readFile(file, "utf8"));
    walk(value, path.basename(file.pathname));
  }
});
