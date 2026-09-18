import assert from "node:assert/strict";
import test from "node:test";

import { buildTokenRegistry } from "../src/lab/token-visualization.mjs";

test("preserves duplicate token declarations across selectors and media contexts", () => {
  const registry = buildTokenRegistry([
    { name: "--clr-bg", raw: "#fff", selector: ":root", media: null, source: "base.css" },
    { name: "--clr-bg", raw: "#000", selector: "[data-theme=dark]", media: null, source: "theme.css" },
    { name: "--space-page", raw: "24px", selector: ":root", media: "(max-width: 700px)", source: "responsive.css" },
  ]);

  assert.equal(registry.length, 3);
  assert.deepEqual(registry.map(({ name, selector, media, source }) => ({ name, selector, media, source })), [
    { name: "--clr-bg", selector: ":root", media: null, source: "base.css" },
    { name: "--clr-bg", selector: "[data-theme=dark]", media: null, source: "theme.css" },
    { name: "--space-page", selector: ":root", media: "(max-width: 700px)", source: "responsive.css" },
  ]);
});
