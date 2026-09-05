import assert from "node:assert/strict";
import test from "node:test";

import { renderAnimatedCanvasGallery } from "../src/components/specialized/index.ts";

test("animated canvas gallery renderer supports production fallback and moves JSON profiles", () => {
  const production = renderAnimatedCanvasGallery({
    profile: "production",
    variant: "masonry",
    ariaLabel: "Production masonry gallery",
    className: "production-gallery",
    sources: [
      {
        entryId: "styx-07-source-01-4x5-use-01",
        sourceIndex: 98,
        mediaTitle: "Title",
        mediaCredits: "Credits",
      },
    ],
  });

  assert.match(production, /data-gallery-profile="production"/);
  assert.match(production, /data-gallery-variant="masonry"/);
  assert.match(production, /data-gallery-state="loading"/);
  assert.match(production, /class="production-gallery"/);
  assert.match(production, /<canvas aria-label="Production masonry gallery"><\/canvas>/);
  assert.match(production, /data-masonry-source=""/);
  assert.match(production, /data-source-index="98"/);
  assert.match(production, /data-media-title="Title"/);
  assert.match(production, /data-media-credits="Credits"/);
  assert.match(production, /src="\/media\/projects\/styx\/07\/source\/01-4x5\.webp"/);

  const moves = renderAnimatedCanvasGallery({
    profile: "moves",
    variant: "arc",
    id: "real-gallery",
    className: "animated-canvas-gallery",
    items: [
      { entryId: "obladaet-01-source-02-2x3-use-01", title: "" },
    ],
  });

  assert.match(moves, /data-gallery-profile="moves"/);
  assert.match(moves, /data-animated-canvas-gallery-canvas=""/);
  assert.match(moves, /data-gallery-items="" type="application\/json"/);
  assert.match(moves, /"src": "\/media\/projects\/shootings\/01\/source\/02-2x3\.webp"/);
});