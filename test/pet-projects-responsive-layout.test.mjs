import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const homeSlotsUrl = new URL("../src/site/renderers/home/home-slots.ts", import.meta.url);

test("Pet Projects keeps the mobile carousel and centers fixed desktop grids", async () => {
  const source = await readFile(homeSlotsUrl, "utf8");

  assert.match(source, /grid-auto-flow:\s*column;/, "mobile layout must remain a horizontal carousel");
  assert.match(source, /scroll-snap-type:\s*inline mandatory;/, "mobile carousel must keep snap behavior");

  assert.match(
    source,
    /@container pet-projects \(width > 42rem\)[\s\S]*grid-auto-flow:\s*row;[\s\S]*grid-template-columns:\s*repeat\(2, minmax\(0, var\(--pet-card-width\)\)\);[\s\S]*justify-content:\s*center;[\s\S]*scroll-snap-type:\s*none;/,
    "desktop/tablet layout must switch from the carousel to a centered two-column grid",
  );

  assert.match(
    source,
    /@container pet-projects \(width > 68rem\)[\s\S]*grid-template-columns:\s*repeat\(3, minmax\(0, var\(--pet-card-width\)\)\);/,
    "wide desktop layout must center three fixed-width columns",
  );
});
