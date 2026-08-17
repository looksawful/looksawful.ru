import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const repo = new URL("../", import.meta.url);

async function read(path) {
  return readFile(new URL(path, repo), "utf8");
}

function articleForTrigger(html, triggerId) {
  const marker = `id="${triggerId}"`;
  const markerIndex = html.indexOf(marker);

  assert.notEqual(markerIndex, -1, marker);

  const start = html.lastIndexOf("<article", markerIndex);
  assert.notEqual(start, -1, "article start");

  const tags = /<\/?article\b[^>]*>/gi;
  tags.lastIndex = start;

  let depth = 0;

  for (let match = tags.exec(html); match; match = tags.exec(html)) {
    depth += match[0].startsWith("</") ? -1 : 1;

    if (depth === 0) {
      return html.slice(start, match.index + match[0].length);
    }
  }

  assert.fail("article end");
}

async function mediaExists(src) {
  const relative = src.replace(/^\.\//, "");
  const candidates = [
    new URL(`../${relative}`, import.meta.url),
    new URL(`../public/${relative}`, import.meta.url),
  ];

  for (const candidate of candidates) {
    try {
      await access(candidate);
      return true;
    } catch {
      // Try the next repository location.
    }
  }

  return false;
}

test("S&S preserves the existing accordion scene contract", async () => {
  const html = await read("index.html");
  const article = articleForTrigger(html, "cv-trigger-06");

  assert.match(article, /class="cv-item cv-item--sands"/);
  assert.match(article, /data-cv-theme="ss"/);
  assert.match(article, /data-sands-showcase=""/);
  assert.equal(article.includes("<script"), false);
  assert.equal(article.includes("data-media-slider"), false);
  assert.equal(article.includes("raw.githubusercontent.com"), false);
});

test("S&S contains one custom phone with two CSS swipe frames", async () => {
  const html = await read("index.html");
  const article = articleForTrigger(html, "cv-trigger-06");

  assert.equal((article.match(/class="mobile-mockup"/g) ?? []).length, 1);
  assert.equal(
    (article.match(/class="sands-showcase__phone-slide /g) ?? []).length,
    2,
  );
  assert.match(article, /data-media-id="sands-01-01"/);
  assert.match(article, /data-media-id="sands-05-16"/);
  assert.equal(article.includes("sands-showcase__phone-caption"), false);
});

test("S&S contains exactly one marquee and its intended frames", async () => {
  const html = await read("index.html");
  const article = articleForTrigger(html, "cv-trigger-06");

  assert.equal((article.match(/data-media-marquee=""/g) ?? []).length, 1);
  assert.equal(article.includes("data-media-marquee-pause-on-hover"), false);

  const actual = [
    ...article.matchAll(
      /data-media-id="(sands-(?:01-0[2-4]|02-0[1-3]|04-0[1-5]))"/g,
    ),
  ].map(([, id]) => id);

  assert.deepEqual(actual, [
    "sands-01-02",
    "sands-01-03",
    "sands-01-04",
    "sands-02-01",
    "sands-02-02",
    "sands-02-03",
    "sands-04-01",
    "sands-04-02",
    "sands-04-03",
    "sands-04-04",
    "sands-04-05",
  ]);
});

test("marquee captions use focusable surfaces for touch without JS state", async () => {
  const html = await read("index.html");
  const article = articleForTrigger(html, "cv-trigger-06");
  const css = await read(
    "src/components/sands-showcase/sands-showcase.css",
  );

  assert.equal(
    (article.match(/data-media-caption-surface=""\s+data-media-marquee-surface=""\s+tabindex="0"/g) ?? []).length,
    11,
  );
  assert.equal(
    (article.match(/data-sands-media-caption=""/g) ?? []).length,
    11,
  );
  assert.match(css, /:is\(:focus, :focus-within\)/);
  assert.match(css, /@media \(hover: hover\) and \(pointer: fine\)/);
  assert.equal(css.includes("IntersectionObserver"), false);
  assert.equal(css.includes("ResizeObserver"), false);
  assert.equal(css.includes("MutationObserver"), false);
});

test("removed S&S content stays removed", async () => {
  const html = await read("index.html");
  const article = articleForTrigger(html, "cv-trigger-06");

  assert.equal(article.includes('data-media-id="sands-03-01"'), false);
  assert.equal(article.includes('data-media-id="sands-04-06"'), false);
  assert.equal(article.includes("Каталоги бренда"), false);
  assert.equal(article.includes("Для бренда мы также снимали каталоги"), false);
  assert.equal(article.includes('data-sands-marquee="catalog"'), false);

  for (const id of [
    "sands-05-03",
    "sands-05-04",
    "sands-05-06",
    "sands-05-07",
    "sands-05-08",
    "sands-05-09",
    "sands-05-10",
    "sands-05-11",
    "sands-05-12",
    "sands-05-13",
    "sands-05-14",
    "sands-05-15",
  ]) {
    assert.equal(article.includes(`data-media-id="${id}"`), false, id);
  }
});

test("all live S&S media paths resolve inside the repository", async () => {
  const html = await read("index.html");
  const article = articleForTrigger(html, "cv-trigger-06");
  const sources = [
    ...article.matchAll(/src="(\.\/media\/projects\/sands\/[^"]+)"/g),
  ].map(([, src]) => src);

  assert.equal(sources.length, 13);

  for (const src of sources) {
    assert.equal(await mediaExists(src), true, src);
  }
});

test("S&S CSS stays local and does not redefine global theme or font", async () => {
  const css = await read(
    "src/components/sands-showcase/sands-showcase.css",
  );

  assert.match(css, /var\(--cv-ss-background\)/);
  assert.match(css, /var\(--cv-ss-foreground\)/);
  assert.equal(css.includes("font-family"), false);
  assert.equal(css.includes("!important"), false);
  assert.equal(css.includes("[data-media-marquee-sizing"), false);
  assert.match(css, /--sands-marquee-ratio/);
});

test("S&S installation changes no JS lifecycle", async () => {
  const main = await read("src/main.js");

  assert.match(
    main,
    /import "\.\/components\/mobile-mockup\/mobile-mockup\.css";/,
  );
  assert.match(
    main,
    /import "\.\/components\/sands-showcase\/sands-showcase\.css";/,
  );

  assert.equal(
    main.includes('import { createSandsShowcase'),
    false,
  );
  assert.equal(main.includes("createSandsShowcase("), false);
});
