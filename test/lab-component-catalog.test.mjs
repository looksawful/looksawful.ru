import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { CONTENT_BLOCK_TYPES } from "../src/content/contracts/content-block.ts";
import { LAB_COMPONENT_CATALOG } from "../src/devtools/lab/component-catalog.ts";

const repoRoot = fileURLToPath(new URL("../", import.meta.url));

const requiredStandaloneIds = [
  "hero",
  "site-navigation",
  "project-navigator",
  "entity-intro",
  "home-expertise",
  "home-experience",
  "contact-footer",
  "media-lightbox",
  "berserk-audio-player",
  "jestei-track-filter",
  "moves-canvas-demo",
];

test("Lab component catalog covers every canonical ContentBlock type", () => {
  for (const blockType of CONTENT_BLOCK_TYPES) {
    assert.ok(
      LAB_COMPONENT_CATALOG.some((entry) => entry.id === blockType),
      `missing canonical ContentBlock ${blockType}`,
    );
  }
});

test("Lab component catalog includes required internal organisms", () => {
  for (const id of requiredStandaloneIds) {
    assert.ok(
      LAB_COMPONENT_CATALOG.some((entry) => entry.id === id),
      `missing internal Lab organism ${id}`,
    );
  }

  assert.ok(
    LAB_COMPONENT_CATALOG.some((entry) => entry.id === "berserk-audio-player"),
    "Berserk must remain visible to Lab even when its public consumer is hidden",
  );
});

test("Lab component identities are unique and all entries stay Lab-visible", () => {
  const ids = LAB_COMPONENT_CATALOG.map((entry) => entry.id);
  assert.equal(new Set(ids).size, ids.length, "Lab component ids must be unique");
  assert.ok(
    LAB_COMPONENT_CATALOG.every((entry) => entry.labVisible === true),
    "internal component visibility must not inherit public visibility",
  );
});

test("Lab component source owners are safe repository-relative paths that exist", () => {
  for (const entry of LAB_COMPONENT_CATALOG) {
    assert.match(entry.source, /^src\//, `${entry.id} source must live under src/`);
    assert.ok(!entry.source.includes(".."), `${entry.id} source must not traverse directories`);
    assert.ok(!entry.source.includes("\\"), `${entry.id} source must use POSIX separators`);
    assert.ok(!/^[a-z]+:/i.test(entry.source), `${entry.id} source must not be a URL/scheme`);
    assert.ok(
      existsSync(path.join(repoRoot, entry.source)),
      `${entry.id} source owner does not exist: ${entry.source}`,
    );
  }
});
