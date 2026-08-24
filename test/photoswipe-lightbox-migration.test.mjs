import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("PhotoSwipe is installed as the exact lightbox dependency", async () => {
  const pkg = JSON.parse(await read("package.json"));

  assert.equal(pkg.dependencies?.photoswipe, "5.4.4");
});

test("media lightbox facade delegates the shell to a PhotoSwipe adapter", async () => {
  assert.equal(
    existsSync(new URL("../src/components/photoswipe-lightbox.ts", import.meta.url)),
    true,
    "photoswipe-lightbox.ts must own the PhotoSwipe instance and custom slide lifecycle",
  );

  const [facade, adapter] = await Promise.all([
    read("src/components/media-lightbox.ts"),
    read("src/components/photoswipe-lightbox.ts"),
  ]);

  assert.match(facade, /from "\.\/photoswipe-lightbox\.ts"/);
  assert.match(facade, /createPhotoSwipeLightbox/);
  assert.doesNotMatch(facade, /showModal\(|HTMLDialogElement|data-lightbox-image|data-lightbox-video/);

  assert.match(adapter, /photoswipe\/lightbox/);
  assert.match(adapter, /photoswipe\/style\.css/);
  assert.match(adapter, /kind:\s*"image"/);
  assert.match(adapter, /kind:\s*"video"/);
});

test("legacy lightbox dialog markup is removed after PhotoSwipe owns the shell", async () => {
  const index = await read("index.html");

  assert.doesNotMatch(index, /data-media-lightbox/);
  assert.doesNotMatch(index, /data-lightbox-image/);
  assert.doesNotMatch(index, /data-lightbox-video/);
});
