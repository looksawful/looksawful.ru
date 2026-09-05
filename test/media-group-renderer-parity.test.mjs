import assert from "node:assert/strict";
import test from "node:test";

import {
  renderMediaFigure,
  renderMediaGroup,
} from "../src/components/content/index.ts";

test("media group renderer preserves authored wrapper, head presentation and surface class", () => {
  const html = renderMediaGroup({
    layout: "grid",
    mode: "overflow-reel",
    element: "div",
    captionView: "overlay",
    head: {
      className: "split split-always",
      style: "--split-min: 12rem; --split-gap: 1rem",
      credits: { title: "Test" },
    },
    items: [
      {
        entryId: "sensetique-11-source-98-187x280-use-02",
        surfaceClassName: "surface-muted",
      },
    ],
  });

  assert.match(html, /<div\s+class="media-group"/);
  assert.match(html, /class="media-group__head split split-always"/);
  assert.match(html, /style="--split-min: 12rem; --split-gap: 1rem"/);
  assert.match(html, /class="media__surface surface-muted"/);
  assert.match(html, /<\/div>\s*$/);
});

test("video renderer can preserve an authored source MIME type", () => {
  const html = renderMediaFigure({
    entryId: "sensetique-11-source-97-16x9-use-02",
    captionView: "overlay",
    video: {
      autoplay: true,
      loop: true,
      muted: true,
      playsInline: true,
      preload: "metadata",
      mimeType: "video/mp4",
    },
  });

  assert.doesNotMatch(html, /<video[^>]+\ssrc=/);
  assert.match(
    html,
    /<source src="\/media\/generated\/video\/projects\/sensetique\/11\/source\/97-16x9\.web\.mp4" type="video\/mp4">/,
  );
});
