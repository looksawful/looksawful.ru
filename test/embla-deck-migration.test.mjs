import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Embla is installed as the exact deck dependency", async () => {
  const pkg = JSON.parse(await read("package.json"));

  assert.equal(pkg.dependencies?.["embla-carousel"], "8.6.0");
});

test("media deck facade delegates horizontal track ownership to an Embla adapter", async () => {
  assert.equal(
    existsSync(new URL("../src/components/embla-deck.ts", import.meta.url)),
    true,
    "embla-deck.ts must own Embla setup and selected snap synchronization",
  );

  const [main, facade, adapter] = await Promise.all([
    read("src/main.ts"),
    read("src/components/media-deck.ts"),
    read("src/components/embla-deck.ts"),
  ]);

  assert.match(main, /from "\.\/components\/media-deck\.ts"/);
  assert.match(facade, /from "\.\/embla-deck\.ts"/);
  assert.match(facade, /createEmblaDeck/);
  assert.doesNotMatch(facade, /pointerScrollStart|closestTrackSlide|slideLeft|scrollTo\(/);

  assert.match(adapter, /embla-carousel/);
  assert.match(adapter, /selectedScrollSnap/);
  assert.match(adapter, /scrollTo/);
  assert.match(adapter, /reInit/);
});
