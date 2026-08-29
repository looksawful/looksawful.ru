import assert from "node:assert/strict";
import test from "node:test";

import {
  assertHomepagePresentationSupported,
  homepageEntries,
} from "../src/site/pages/homepage.ts";

const expected = [
  ["case", "jestei-pool", "full", 10],
  ["case", "styx", "full", 20],
  ["case", "sensetique", "full", 30],
  ["collection", "music-photography", "full", 40],
];

test("homepage presentation is independent from routing and keeps the current full order", () => {
  assert.deepEqual(
    homepageEntries.map((entry) => [entry.entity.type, entry.entity.id, entry.mode, entry.order]),
    expected,
  );
  assert.doesNotThrow(() => assertHomepagePresentationSupported(homepageEntries));
});

test("unsupported compact mode cannot silently fall back to CSS-hidden full rendering", () => {
  const unsupported = homepageEntries.map((entry, index) =>
    index === 0 ? { ...entry, mode: "compact" } : entry,
  );
  assert.throws(
    () => assertHomepagePresentationSupported(unsupported),
    /Homepage render mode is not implemented: case:jestei-pool -> compact/,
  );
});
