import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { mediaAssets } from "../src/data/media/assets/index.ts";
import {
  responsiveImageSrcSet,
  responsiveVariantsFor,
} from "../src/data/media/responsive.ts";
import { renderMediaElement } from "../src/templates/media-figure.ts";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("registry-backed images use generated responsive variants without duplicating CSS breakpoints", async () => {
  const lazy = renderMediaElement("styx-09-source-01-1x1-use-01", { loading: "lazy" });
  const eager = renderMediaElement("styx-09-source-01-1x1-use-01", { loading: "eager" });

  assert.match(lazy, /srcset="[^"]+@480\.webp 480w[^"]+@768\.webp 768w/);
  assert.match(lazy, /sizes="auto, 100vw"/);
  assert.match(eager, /sizes="100vw"/);
  assert.match(lazy, /src="\/media\/projects\/styx\/09\/source\/01-1x1\.webp"/);

  const policy = await read("src/data/media/responsive.ts");
  const builder = await read("tools/build-responsive-media.mjs");
  assert.match(policy, /RESPONSIVE_WIDTHS/);
  assert.match(builder, /responsiveVariantWidths/);
  assert.match(builder, /responsiveVariantSrc/);

  const spaced = responsiveImageSrcSet({
    id: "styx-screenshot-2026-08-19-135302",
    type: "image",
    src: "/media/projects/styx/Screenshot 2026-08-19 135302.png",
    width: 1920,
    height: 1174,
  });
  assert.match(spaced, /Screenshot%202026-08-19%20135302@480\.webp 480w/);
  assert.doesNotMatch(spaced, /Screenshot 2026/);
});

test("responsive delivery fails closed when an asset path changes before its catalog is regenerated", () => {
  const currentAsset = mediaAssets.find(({ id }) => id === "project-index-jestei-pool-cover");
  assert.ok(currentAsset && currentAsset.type === "image");

  const changedAsset = {
    ...currentAsset,
    src: "/media/projects/index/cms-uploaded-cover.webp",
  };

  assert.deepEqual(responsiveVariantsFor(changedAsset), []);
  assert.equal(responsiveImageSrcSet(changedAsset), "");
});
