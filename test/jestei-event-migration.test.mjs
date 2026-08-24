import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { jesteiEventGroup } from "../src/data/content/jestei-pool.ts";
import { renderMediaGroup } from "../src/templates/media-group.ts";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

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

  assert.match(html, /data-lightbox-caption-copy[^>]*>\s*Для лендинга мы начали активно использовать canvas-анимации/);
  assert.equal((html.match(/class="media__caption-line"/g) ?? []).length, 4);
  assert.doesNotMatch(html, /class="media__index"/);
});

test("raw index has one Jestei Event slot and no direct project media after migration", async () => {
  const index = await read("index.html");
  const vite = await read("vite.config.ts");

  assert.equal((index.match(/<!-- JESTEI_EVENT_GROUP -->/g) ?? []).length, 1);
  assert.match(vite, /JESTEI_EVENT_GROUP/);
  assert.doesNotMatch(index, /shared\/moves-awful/);
  assert.doesNotMatch(index, /(?:src|poster)="\.\/media\/projects\//);
});
