import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const root = new URL("../src/content/editorial/", import.meta.url);
const forbidden = new Set([
  "route", "pageType", "componentType", "layout", "layoutKind", "renderMode",
  "breakpoint", "breakpoints", "mediaSrc", "src", "assetId", "coverId",
  "visible", "order", "width", "height",
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

function walk(value, location) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => walk(item, `${location}[${index}]`));
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value)) {
    assert.equal(forbidden.has(key), false, `editorial structural key "${key}" at ${location}`);
    walk(child, `${location}.${key}`);
  }
}

test("editorial JSON cannot own routing, layout, visibility or media structure", async () => {
  for (const file of await files(root)) {
    const value = JSON.parse(await readFile(file, "utf8"));
    walk(value, path.basename(file.pathname));
  }
});
