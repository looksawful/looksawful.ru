import assert from "node:assert/strict";
import test from "node:test";
import { resolveLegacyCaptionView } from "../src/components/media-caption.js";

test("caption view is explicit and stable", () => {
  assert.equal(resolveLegacyCaptionView({ view: "full" }), "full");
  assert.equal(resolveLegacyCaptionView({ view: "summary" }), "summary");
  assert.equal(resolveLegacyCaptionView({ view: "overlay" }), "overlay");
  assert.equal(resolveLegacyCaptionView({ view: "lightbox-only" }), "lightbox-only");
});

test("legacy overlay wins over legacy rest state", () => {
  assert.equal(resolveLegacyCaptionView({ mode: "overlay", rest: "summary" }), "overlay");
});

test("legacy rest states map without losing caption content", () => {
  assert.equal(resolveLegacyCaptionView({ rest: "summary" }), "summary");
  assert.equal(resolveLegacyCaptionView({ rest: "none" }), "lightbox-only");
  assert.equal(resolveLegacyCaptionView({}), "full");
});
