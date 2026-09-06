import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  jesteiEventGroup,
  jesteiInstagramPlayerStrip,
} from "../src/data/content/jestei-pool.ts";
import { jesteiPoolPageContent } from "../src/content/pages/cases/jestei-pool.ts";
import { renderMediaGroup } from "../src/templates/media-group.ts";

const indexCss = readFileSync(new URL("../src/styles/index.css", import.meta.url), "utf8");

test("Jestei Event is typed content and uses registry-backed Moves Awful media", () => {
  const html = renderMediaGroup(jesteiEventGroup);

  assert.equal(jesteiEventGroup.layout, "grid");
  assert.equal(jesteiEventGroup.mode, "compact-reel");
  assert.equal(jesteiEventGroup.items.length, 4);

  assert.match(html, /jestei-event-video-deck/);
  assert.match(html, /data-deck-advance-on-ended=""/);
  assert.match(html, /data-deck-autoplay="off"/);
  assert.match(html, /\/media\/projects\/jestei\/landings\/moves-awful\/source\/01-2044x1112\.mp4/);
  assert.match(html, /\/media\/projects\/jestei\/landings\/moves-awful\/source\/02-2540x790\.mp4/);
  assert.match(html, /\/media\/projects\/jestei\/landings\/moves-awful\/source\/03-1914x1208\.mp4/);
  assert.doesNotMatch(html, /shared\/moves-awful/);

  assert.equal((html.match(/data-lightbox-caption-copy/g) ?? []).length, 4);
  assert.equal((html.match(/class="media__caption-line"/g) ?? []).length, 4);
  assert.doesNotMatch(html, /class="media__index"/);
});

test("Jestei landing video deck fills its fixed surface instead of letterboxing", () => {
  assert.match(
    indexCss,
    /\.jestei-event-video-deck\s+\.slider__slide\s*>\s*video\s*\{[^}]*object-fit:\s*cover\s*;/s,
  );
});

test("Jestei media visuals inherit the surface radius instead of relying on ancestor clipping alone", () => {
  assert.match(
    indexCss,
    /:is\(\s*\.jestei-interface-group,\s*\.jestei-event-group\s*\)\s+\.media__surface\s*>\s*:is\(img,\s*video,\s*picture\)[\s\S]*?border-radius:\s*inherit\s*;/s,
    "Jestei raster media must share the exact radius owned by its media surface",
  );
});

test("Jestei Instagram player copy belongs to the section, not hover captions", () => {
  const section = jesteiPoolPageContent.sections.find(
    (candidate) => candidate.id === "jestei-instagram-player",
  );

  assert.ok(section, "Instagram player section must exist");
  assert.equal(
    jesteiInstagramPlayerStrip.captionView,
    "lightbox-only",
    "player media must not expose repeated overlay captions",
  );
  assert.deepEqual(section.intro, {
    title: "Промокоммуникация Jestei Pool",
    paragraphs: ["Интерактивный плеер для Instagram-постов."],
  });
});
