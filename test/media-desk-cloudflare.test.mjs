import assert from "node:assert/strict";
import test from "node:test";

import {
  applyCloudflareMediaPatch,
  isAllowedTextSource,
  replaceTextLeaf,
} from "../tools/cloudflare/media-desk/domain.mjs";

test("Cloudflare Media Desk allows only editorial media fields", () => {
  const source = {
    id: "asset-1",
    title: "Old",
    alt: "",
    description: "",
    date: "",
    projectIds: [],
    workAreaIds: [],
    projectTypeIds: [],
    deliverableIds: [],
    tags: [],
    credits: [],
    showInCatalog: false,
    reusable: false,
    archived: false,
    src: "/media/source.jpg",
  };

  const next = applyCloudflareMediaPatch(source, { title: "New", archived: true }, "upload");
  assert.equal(next.title, "New");
  assert.equal(next.archived, true);
  assert.equal(next.src, "/media/source.jpg");
  assert.throws(
    () => applyCloudflareMediaPatch(source, { src: "https://evil.invalid/file.jpg" }, "upload"),
    /protected field/,
  );
});

test("registered media cannot acquire project membership", () => {
  const source = { id: "asset-1", title: "Old", projectIds: [] };
  assert.throws(
    () => applyCloudflareMediaPatch(source, { projectIds: ["styx"] }, "registered"),
    /protected field/,
  );
});

test("Cloudflare Content Desk source allowlist mirrors the local Desk boundary", () => {
  assert.equal(isAllowedTextSource("src/content/navigation.json"), true);
  assert.equal(isAllowedTextSource("src/content/cases/jestei-pool.json"), true);
  assert.equal(isAllowedTextSource("src/data/projects.ts"), false);
  assert.equal(isAllowedTextSource("../package.json"), false);
});

test("Cloudflare Content Desk replaces only an existing string leaf", () => {
  const source = { hero: { title: "Old", count: 2 } };
  const next = replaceTextLeaf(structuredClone(source), "hero.title", "New");
  assert.equal(next.hero.title, "New");
  assert.equal(next.hero.count, 2);
  assert.throws(() => replaceTextLeaf(structuredClone(source), "hero.count", "3"), /must still be a string/);
  assert.throws(() => replaceTextLeaf(structuredClone(source), "hero.missing", "x"), /no longer exists/);
});
