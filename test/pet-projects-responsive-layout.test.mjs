import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const homeSlotsUrl = new URL("../src/site/renderers/home/home-slots.ts", import.meta.url);

test("Pet Projects stays a horizontal focus carousel at every width", async () => {
  const source = await readFile(homeSlotsUrl, "utf8");

  assert.match(source, /grid-auto-flow:\s*column;/, "layout must remain a horizontal carousel");
  assert.match(source, /grid-template-columns:\s*none;/, "legacy responsive grid columns must be neutralized");
  assert.match(
    source,
    /(?:scroll-snap-type|--reel-snap-type):\s*inline mandatory;/,
    "carousel must keep centered snap behavior",
  );
  assert.match(
    source,
    /(?:scroll-snap-align|--reel-snap-align):\s*center;/,
    "cards must keep centered snap alignment",
  );
  assert.match(source, /animation-timeline:\s*view\(inline\);/, "focus animation must track inline scroll position");
  assert.match(
    source,
    /@keyframes pet-project-card-focus[\s\S]*?scale:\s*0\.94;[\s\S]*?scale:\s*1;[\s\S]*?translate:\s*calc\(var\(--pet-card-gap\) \* 0\.35\)/,
    "cards must scale and shift subtly as they move through focus",
  );

  assert.doesNotMatch(source, /grid-auto-flow:\s*row;/);
  assert.doesNotMatch(source, /(?:scroll-snap-type|--reel-snap-type):\s*none;/);
  assert.doesNotMatch(source, /--reel-overflow-x:\s*visible;/);
  assert.doesNotMatch(source, /@container pet-projects \(width > 42rem\)/);
  assert.doesNotMatch(source, /@container pet-projects \(width > 68rem\)/);
});
