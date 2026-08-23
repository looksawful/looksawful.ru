import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

import { mediaAssets } from "../src/data/media/assets/index.ts";
import { responsiveMediaVariants } from "../src/data/media/responsive-generated.ts";
import {
  responsiveVariantSrc,
  responsiveVariantWidths,
} from "../src/data/media/responsive-policy.ts";

test("responsive manifest, generated TS catalog and physical variants stay in one contract", async () => {
  const manifestUrl = new URL("../public/media/generated/responsive-manifest.json", import.meta.url);
  const manifest = JSON.parse(await readFile(manifestUrl, "utf8"));
  const registryIds = new Set(mediaAssets.map((asset) => asset.id));
  const catalogIds = new Set(Object.keys(responsiveMediaVariants));

  assert.equal(manifest.generatedAt, undefined, "manifest must not contain volatile timestamps");
  assert.deepEqual(catalogIds, new Set(manifest.assets.map((entry) => entry.id)));

  for (const entry of manifest.assets) {
    assert.ok(registryIds.has(entry.id), `manifest references unknown registry asset ${entry.id}`);
    const widths = responsiveVariantWidths(entry.sourceWidth, manifest.widthPolicy);
    assert.deepEqual(
      entry.variants.map((variant) => variant.width),
      widths,
      `${entry.id}: generated width policy drift`,
    );
    assert.deepEqual(
      entry.variants.map((variant) => variant.src),
      widths.map((width) => responsiveVariantSrc(entry.src, width)),
      `${entry.id}: generated path policy drift`,
    );
    assert.deepEqual(
      responsiveMediaVariants[entry.id],
      entry.variants.map(({ src, width, height }) => ({ src, width, height })),
      `${entry.id}: TS delivery catalog drift`,
    );

    for (const variant of entry.variants) {
      await access(new URL(`../public${variant.src}`, import.meta.url));
    }
  }
});
