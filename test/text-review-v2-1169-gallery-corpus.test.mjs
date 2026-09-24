import assert from "node:assert/strict";
import test from "node:test";
import { getGalleryItems, getGalleryModelItems } from "../src/data/media/gallery.ts";
import { round2Issue1169GalleryItems } from "../tools/supabase/text-review-v2/round2-1169-gallery.mjs";

function representedTexts(items) {
  const texts = new Set();
  for (const item of items) {
    if (item.pageId !== "gallery") continue;
    const current = item.current?.source?.trim();
    if (current) texts.add(current);
    for (const evidence of item.evidence ?? []) {
      const text = evidence.text?.trim();
      if (text) texts.add(text);
    }
  }
  return texts;
}

function uniqueNonEmpty(values) {
  return [...new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean))];
}

test("#1169 Gallery corpus covers every runtime title and credit", () => {
  const runtime = getGalleryItems();
  const expected = uniqueNonEmpty([
    ...runtime.map((item) => item.title),
    ...runtime.flatMap((item) => item.credits ?? []),
  ]);
  const represented = representedTexts(round2Issue1169GalleryItems);
  assert.deepEqual(expected.filter((text) => !represented.has(text)), []);
});

test("#1169 Gallery corpus surfaces every current 3D accessibility label", () => {
  const expected = uniqueNonEmpty(getGalleryModelItems().map((item) => item.alt));
  const represented = representedTexts(round2Issue1169GalleryItems);
  assert.deepEqual(expected.filter((text) => !represented.has(text)), []);
});

test("#1169 Gallery corpus keeps stable unique ids", () => {
  const ids = round2Issue1169GalleryItems.map((item) => item.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(ids.every((id) => id.startsWith("r2-gallery-") || id.startsWith("fact-gallery-")));
});
