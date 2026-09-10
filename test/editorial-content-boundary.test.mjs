import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

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

test("Jestei section visibility uses a separate strict CMS boundary", async () => {
  const visibilityUrl = new URL("../src/content/visibility/jestei-pool.json", import.meta.url);
  const adapterUrl = new URL("../src/data/content/section-visibility.ts", import.meta.url);

  assert.equal(
    existsSync(fileURLToPath(visibilityUrl)),
    true,
    "Jestei section visibility must live outside the copy-only editorial layer",
  );
  assert.equal(
    existsSync(fileURLToPath(adapterUrl)),
    true,
    "section visibility must have a typed validation boundary",
  );

  const [{ jesteiPoolPageContent }, visibility, adapter] = await Promise.all([
    import("../src/content/pages/cases/jestei-pool.ts"),
    readFile(visibilityUrl, "utf8").then(JSON.parse),
    import("../src/data/content/section-visibility.ts"),
  ]);

  const expectedIds = jesteiPoolPageContent.sections.map(({ id }) => id);
  assert.equal(typeof adapter.parseSectionVisibility, "function");
  assert.deepEqual(visibility.map(({ id }) => id), expectedIds);
  assert.ok(visibility.every(({ visible }) => typeof visible === "boolean"));

  assert.doesNotThrow(() => adapter.parseSectionVisibility(visibility, expectedIds));
  assert.throws(
    () => adapter.parseSectionVisibility([...visibility, visibility[0]], expectedIds),
    /duplicate section visibility id/i,
  );
  assert.throws(
    () => adapter.parseSectionVisibility(visibility.slice(0, -1), expectedIds),
    /missing section visibility id/i,
  );
  assert.throws(
    () => adapter.parseSectionVisibility(
      visibility.map((item, index) => index === 0 ? { ...item, id: "unknown-section" } : item),
      expectedIds,
    ),
    /unexpected section visibility id/i,
  );
});
