import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  awfulMockupsCanvasGallery,
  awfulMockupsMedia,
  awfulMockupsPreviewGroup,
} from "../src/data/content/awful-mockups.ts";
import { awfulMockupsPageContent } from "../src/content/pages/projects/awful-mockups.ts";

const runtimeSource = await readFile(
  new URL("../src/components/animated-canvas-gallery.js", import.meta.url),
  "utf8",
);
const componentStyles = await readFile(
  new URL("../src/styles/components.css", import.meta.url),
  "utf8",
);

test("Awful Mockups presents the curated set statically and in the Moves showcase", () => {
  const curatedIds = awfulMockupsMedia.map(({ entryId }) => entryId);
  const staticIds = awfulMockupsPreviewGroup.items.map(({ entryId }) => entryId);
  const animatedIds = awfulMockupsCanvasGallery.items.map(({ entryId }) => entryId);
  const showcase = awfulMockupsPageContent.sections.find(
    (section) => section.id === "awful-mockups-showcase",
  );

  assert.equal(curatedIds.length, 8);
  assert.deepEqual(staticIds, curatedIds);
  assert.deepEqual(animatedIds, curatedIds);
  assert.equal(awfulMockupsCanvasGallery.variant, "showcase-diagonal");
  assert.equal(awfulMockupsCanvasGallery.id, "awful-mockups-canvas");
  assert.ok(showcase && "blocks" in showcase);
  assert.notEqual(awfulMockupsCanvasGallery.id, showcase.id);
  assert.deepEqual(
    showcase.blocks.map((block) => block.type),
    ["mockup-deck", "media-group"],
  );
});

test("Moves runtime preserves authored variants and has reusable base sizing", () => {
  assert.match(
    runtimeSource,
    /const initialVariant = gallery\.dataset\.galleryVariant \|\| tabs\[0\]\?\.dataset\.variant \|\| "arc";/,
  );
  assert.doesNotMatch(runtimeSource, /setVariant\("arc", 0\)/);
  assert.match(
    componentStyles,
    /\[data-animated-canvas-gallery\]\[data-gallery-profile="moves"\] \{[\s\S]*?inline-size: 100%;[\s\S]*?block-size: 100%;/,
  );
  assert.match(
    componentStyles,
    /\[data-animated-canvas-gallery\]\[data-gallery-profile="moves"\] > canvas \{[\s\S]*?inline-size: 100%;[\s\S]*?block-size: 100%;/,
  );
});
