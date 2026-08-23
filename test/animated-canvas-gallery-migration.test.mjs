import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import test from "node:test";

const templateUrl = new URL("../src/templates/animated-canvas-gallery.ts", import.meta.url);

test("animated canvas gallery renderer supports production fallback and moves JSON profiles", async () => {
  assert.equal(existsSync(templateUrl), true, "animated-canvas-gallery.ts must exist");
  const { renderAnimatedCanvasGallery } = await import(templateUrl);

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

test("production canvas decks and Moves gallery are typed content and use Vite slots", async () => {
  const styx = await import("../src/data/content/styx.ts");
  const sensetique = await import("../src/data/content/sensetique.ts");
  const moves = await import("../src/data/content/moves-awful.ts");

  assert.notEqual(styx.styxProductionMockupDeck, undefined);
  assert.notEqual(sensetique.sensetiqueStudioMockupDeck, undefined);
  assert.notEqual(moves.movesAwfulCanvasGallery, undefined);

  const index = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const vite = await readFile(new URL("../vite.config.ts", import.meta.url), "utf8");
  const slots = [
    "STYX_PRODUCTION_MOCKUP_DECK",
    "SENSETIQUE_STUDIO_MOCKUP_DECK",
    "MOVES_AWFUL_CANVAS_GALLERY",
  ];

  for (const slot of slots) {
    const marker = `<!-- ${slot} -->`;
    assert.equal(index.split(marker).length - 1, 1, marker);
    assert.equal(vite.split(marker).length - 1, 1, marker);
  }

  assert.match(vite, /renderAnimatedCanvasGallery/);
  assert.match(vite, /renderMockupDeck\(styxProductionMockupDeck\)/);
  assert.match(vite, /renderMockupDeck\(sensetiqueStudioMockupDeck\)/);
});
