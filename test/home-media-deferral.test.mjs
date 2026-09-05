import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { createSitePagesPlugin } from "../src/site/build/site-pages-plugin.ts";
import { deferHomepageAutoplayMedia } from "../src/site/renderers/home/home-media-deferral.ts";

function deferredVideoBlocks(html) {
  return [...html.matchAll(/<video\b[\s\S]*?<\/video>/gi)]
    .map((match) => match[0])
    .filter((video) => /data-autoplay-deferred=""/i.test(video));
}

function lazyImageTags(html) {
  return [...html.matchAll(/<img\b[^>]*\bloading="lazy"[^>]*>/gi)]
    .map((match) => match[0]);
}

test("Homepage defers autoplay video sources across ordinary and managed media lifecycles", () => {
  const html = `
    <section>
      <video autoplay="" preload="auto" src="/plain.mp4"></video>
      <div data-media-deck="">
        <video autoplay="" preload="metadata"><source src="/deck.mp4" type="video/mp4"></video>
      </div>
      <div data-infinite-reel="">
        <video autoplay="" preload="metadata" src="/reel.mp4"></video>
      </div>
    </section>
  `;

  const result = deferHomepageAutoplayMedia(html);
  const videos = deferredVideoBlocks(result);

  assert.equal(videos.length, 3);
  assert.match(result, /data-autoplay-src="\/plain\.mp4"/);
  assert.match(result, /data-autoplay-src="\/deck\.mp4"/);
  assert.match(result, /data-autoplay-src="\/reel\.mp4"/);
  for (const video of videos) {
    assert.doesNotMatch(video, /<video\b[^>]*\ssrc="/i);
    assert.doesNotMatch(video, /<source\b[^>]*\ssrc="/i);
  }
});

test("built Homepage contains deferred autoplay media with no live network source", async () => {
  const source = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  const plugin = createSitePagesPlugin();
  const hook = plugin.transformIndexHtml;

  assert.equal(typeof hook, "object");
  assert.equal(typeof hook.handler, "function");

  const html = await hook.handler(source, { path: "/" });
  const videos = deferredVideoBlocks(html);

  assert.ok(videos.length > 0, "expected deferred Homepage autoplay videos");

  for (const video of videos) {
    assert.doesNotMatch(video, /<video\b[^>]*\ssrc="/i);
    assert.doesNotMatch(video, /<source\b[^>]*\ssrc="/i);
    assert.match(video, /data-autoplay-src="/i);
  }
});

test("built Homepage keeps the eager hero but removes live sources from lazy images", async () => {
  const source = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  const plugin = createSitePagesPlugin();
  const hook = plugin.transformIndexHtml;

  assert.equal(typeof hook, "object");
  assert.equal(typeof hook.handler, "function");

  const html = await hook.handler(source, { path: "/" });
  const lazyImages = lazyImageTags(html);

  assert.ok(lazyImages.length > 0, "expected lazy Homepage images");
  assert.match(html, /<img\b(?=[^>]*fetchpriority="high")(?=[^>]*hero-portrait\.webp)[^>]*>/i);

  for (const image of lazyImages) {
    assert.doesNotMatch(image, /\ssrc="/i);
    assert.doesNotMatch(image, /\ssrcset="/i);
    assert.match(image, /\bdata-home-src="/i);
  }

  assert.match(html, /\bdata-home-image-loader\b/i);
});
