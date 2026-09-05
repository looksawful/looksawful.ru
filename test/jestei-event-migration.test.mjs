import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { jesteiEventGroup } from "../src/data/content/jestei-pool.ts";
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
