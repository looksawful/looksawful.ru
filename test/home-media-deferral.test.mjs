import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { createSitePagesPlugin } from "../src/site/build/site-pages-plugin.ts";

function autoplayVideoBlocks(html) {
  return [...html.matchAll(/<video\b[\s\S]*?<\/video>/gi)]
    .map((match) => match[0])
    .filter((video) => /\bautoplay(?:="")?\b/i.test(video));
}

test("homepage defers network sources for autoplay videos until runtime eligibility", async () => {
  const source = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  const plugin = createSitePagesPlugin();
  const hook = plugin.transformIndexHtml;

  assert.equal(typeof hook, "object");
  assert.equal(typeof hook.handler, "function");

  const html = await hook.handler(source, { path: "/" });
  const videos = autoplayVideoBlocks(html);

  assert.ok(videos.length > 0, "expected Homepage autoplay videos");

  for (const video of videos) {
    assert.doesNotMatch(video, /<video\b[^>]*\ssrc="/i);
    assert.doesNotMatch(video, /<source\b[^>]*\ssrc="/i);
  }
});
