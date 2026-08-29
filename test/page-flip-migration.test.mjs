import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { sensetiqueDigitalFearPageFlip } from "../src/data/content/sensetique.ts";

const templateUrl = new URL("../src/templates/page-flip.ts", import.meta.url);

test("page-flip production data is typed content, not inline HTML", () => {
  assert.equal(sensetiqueDigitalFearPageFlip.pages.length, 6);
  assert.deepEqual(
    sensetiqueDigitalFearPageFlip.pages.map((page) => page.index),
    [111, 112, 113, 114, 115, 116],
  );
  assert.equal(
    sensetiqueDigitalFearPageFlip.credits.title,
    "Digital-fear-of-love — адверториал для ювелирного бренда MIMI MOSCOW",
  );
});

test("page-flip renderer preserves the existing runtime contract", async () => {
  const { renderPageFlip } = await import(templateUrl);
  const html = renderPageFlip(sensetiqueDigitalFearPageFlip);

  assert.match(html, /class="page-flip" data-lightbox="off" data-page-flip=""/);
  assert.equal((html.match(/class="page-flip__page"/g) ?? []).length, 6);
  assert.equal((html.match(/data-density="soft"/g) ?? []).length, 6);
  assert.match(html, /data-page-flip-book=""/);
  assert.match(html, /data-page-flip-prev=""/);
  assert.match(html, /data-page-flip-next=""/);
  assert.match(html, /data-page-flip-count="">01 \/ 03/);
  assert.doesNotMatch(html, /(?:width|height)="[0-9]+"/);
});

test("index and site composition use a single page-flip slot", async () => {
  const index = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const composition = await readFile(
    new URL("../src/site/renderers/home/home-slots.ts", import.meta.url),
    "utf8",
  );
  const marker = "<!-- SENSETIQUE_DIGITAL_FEAR_PAGE_FLIP -->";

  assert.equal(index.split(marker).length - 1, 1);
  assert.equal(composition.split(marker).length - 1, 1);
  assert.match(composition, /renderPageFlip/);
});
