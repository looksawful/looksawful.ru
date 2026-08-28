import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const cvHtmlUrl = new URL("../public/cv/index.html", import.meta.url);
const cvCssUrl = new URL("../public/cv/cv.css", import.meta.url);

test("CV uses root-relative internal portfolio links", async () => {
  const cvHtml = await readFile(cvHtmlUrl, "utf8");

  assert.doesNotMatch(
    cvHtml,
    /href=["']https:\/\/www\.looksawful\.ru\/#/,
    "Internal portfolio links should remain same-origin and work in local preview",
  );
});

test("CV navigation remains visually separate from the authored resume", async () => {
  const [cvHtml, cvCss] = await Promise.all([
    readFile(cvHtmlUrl, "utf8"),
    readFile(cvCssUrl, "utf8"),
  ]);

  assert.match(cvHtml, /<nav\b[^>]*class=["'][^"']*resume-nav/);
  assert.match(cvHtml, /<main\b[^>]*class=["']resume["']/);
  assert.match(cvCss, /@media\s+print\s*\{[\s\S]*?\.resume-nav\s*\{\s*display:\s*none;/i);
});

test("CV remains a static page without portfolio runtime hooks", async () => {
  const cvHtml = await readFile(cvHtmlUrl, "utf8");

  assert.doesNotMatch(cvHtml, /data-reveal(?:=|\s|>)/);
  assert.doesNotMatch(cvHtml, /data-lightbox-source/);
  assert.doesNotMatch(cvHtml, /data-media-deck/);
});
