import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const rootHtmlUrl = new URL("../index.html", import.meta.url);
const cvHtmlUrl = new URL("../public/cv/index.html", import.meta.url);
const cvCssUrl = new URL("../public/cv/cv.css", import.meta.url);
const portraitUrl = new URL("../public/media/hero/hero-portrait.webp", import.meta.url);
const pagesWorkflowUrl = new URL("../.github/workflows/pages.yml", import.meta.url);

test("CV remains a direct-link-only page", async () => {
  const rootHtml = await readFile(rootHtmlUrl, "utf8");

  assert.doesNotMatch(
    rootHtml,
    /href=["']\/cv\/?["']/,
    "Main portfolio must not link to /cv/",
  );
});

test("CV opts out of search indexing and caching", async () => {
  const cvHtml = await readFile(cvHtmlUrl, "utf8");

  assert.match(
    cvHtml,
    /<meta\b[^>]*name=["']robots["'][^>]*content=["'][^"']*noindex[^"']*nofollow[^"']*noarchive[^"']*["'][^>]*>/i,
  );
});

test("production deployment strips hidden CV experience cards before upload", async () => {
  const workflow = await readFile(pagesWorkflowUrl, "utf8");

  assert.match(
    workflow,
    /node tools\/prepare-cv-production\.mjs dist\/cv\/index\.html/,
  );
});

test("CV exposes only navigation back to the portfolio", async () => {
  const cvHtml = await readFile(cvHtmlUrl, "utf8");

  assert.match(cvHtml, /class=["'][^"']*resume-nav[^"']*["']/);
  assert.match(cvHtml, /class=["'][^"']*resume-nav__back[^"']*["'][^>]*href=["']\/["']/);
  assert.doesNotMatch(cvHtml, /src=["'][^"']*src\/main\.js["']/);
});

test("CV keeps its own white editorial surface and external stylesheet", async () => {
  const [cvHtml, cvCss] = await Promise.all([
    readFile(cvHtmlUrl, "utf8"),
    readFile(cvCssUrl, "utf8"),
  ]);

  assert.match(cvHtml, /href=["']\/cv\/cv\.css["']/);
  assert.doesNotMatch(cvHtml, /<style[\s>]/i);
  assert.match(cvCss, /--bg:\s*#fff\b/i);
  assert.match(cvCss, /font-family:\s*Arial,\s*Helvetica,\s*sans-serif/i);
});

test("CV displays the portrait that already exists on the main site", async () => {
  const [cvHtml, cvCss] = await Promise.all([
    readFile(cvHtmlUrl, "utf8"),
    readFile(cvCssUrl, "utf8"),
  ]);

  assert.doesNotMatch(cvHtml, /data:image\//);
  assert.match(
    cvCss,
    /\.portrait-wrap\s*\{[^}]*background-image:\s*url\(["']?\/media\/hero\/hero-portrait\.webp["']?\)/s,
  );
  assert.match(cvCss, /@media\s+screen[^{]*\{[\s\S]*?\.portrait\s*\{[^}]*opacity:\s*0/s);
  await access(portraitUrl);
});

test("CV preserves authored hidden experience entries", async () => {
  const cvHtml = await readFile(cvHtmlUrl, "utf8");

  const hiddenCards = cvHtml.match(/<article\b[^>]*\bhidden\b[^>]*class=["'][^"']*experience-card|<article\b[^>]*class=["'][^"']*experience-card[^"']*["'][^>]*\bhidden\b/g) ?? [];
  assert.ok(hiddenCards.length > 0, "Expected hidden experience cards to remain in the CV source");
});
