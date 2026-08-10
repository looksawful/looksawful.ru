import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("migrated CV consumers do not observe aria-expanded through MutationObserver", async () => {
  const paths = [
    "src/components/jestei-theme-organism/jestei-theme-organism.js",
    "src/components/animated-canvas-gallery/animated-canvas-gallery.js",
    "src/components/animated-canvas-gallery/animated-canvas-gallery-preview.js",
    "src/components/digital-scroll-gallery/digital-scroll-gallery.js",
  ];
  for (const path of paths) {
    const source = await read(path);
    assert.equal(source.includes("new MutationObserver"), false, path);
  }
});

test("Jestei has one active canvas ResizeObserver and a static HTML loop clone", async () => {
  const source = await read("src/components/jestei-theme-organism/jestei-theme-organism.js");
  const html = await read("index.html");
  assert.equal(source.includes("trackResizeObserver"), false);
  assert.match(source, /new ResizeObserver\(refresh\)/);
  assert.match(html, /data-loop-clone/);
});

test("accordion no longer dispatches DOM frame events", async () => {
  const [accordion, gallery, scroll] = await Promise.all([
    read("src/components/cv-accordion/cv-accordion.js"),
    read("src/components/digital-scroll-gallery/digital-scroll-gallery.js"),
    read("src/components/cv-accordion/cv-accordion-scroll.js"),
  ]);
  assert.equal(accordion.includes("cvaccordionframe"), false);
  assert.equal(gallery.includes("cvaccordionframe"), false);
  assert.match(scroll, /let observedRecordIndex = null;/);
});
