import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const rootHtmlUrl = new URL("../index.html", import.meta.url);
const cvHtmlUrl = new URL("../public/cv/index.html", import.meta.url);
const cvCssUrl = new URL("../public/cv/cv.css", import.meta.url);
const portraitUrl = new URL("../public/media/hero/hero-portrait.webp", import.meta.url);
const pagesWorkflowUrl = new URL("../.github/workflows/pages.yml", import.meta.url);
const packageUrl = new URL("../package.json", import.meta.url);

test("CV remains a direct-link-only page", async () => {
  const rootHtml = await readFile(rootHtmlUrl, "utf8");

  assert.doesNotMatch(
    rootHtml,
    /href=["']\/cv\/?["']/,
    "Main portfolio must not link to /cv/",
  );
});

test("CV remains indexable", async () => {
  const cvHtml = await readFile(cvHtmlUrl, "utf8");

  assert.doesNotMatch(
    cvHtml,
    /<meta\b[^>]*name=["']robots["'][^>]*content=["'][^"']*noindex/i,
    "Public CV should remain indexable",
  );
});

test("production deployment strips hidden CV experience cards before upload", async () => {
  const [workflow, packageRaw] = await Promise.all([
    readFile(pagesWorkflowUrl, "utf8"),
    readFile(packageUrl, "utf8"),
  ]);
  const { scripts } = JSON.parse(packageRaw);

  assert.match(workflow, /run: npm run cv:prod:prepare(?:\n|$)/);
  assert.equal(scripts["cv:prod:prepare"], "node tools/prepare-cv-production.mjs");
  assert.doesNotMatch(workflow, /node tools\/prepare-cv-production\.mjs\s+dist\/cv\/index\.html/);
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

test("CV source preserves authored hidden experience entries for development", async () => {
  const cvHtml = await readFile(cvHtmlUrl, "utf8");

  const hiddenCards = cvHtml.match(/<article\b[^>]*\bhidden\b[^>]*class=["'][^"']*experience-card|<article\b[^>]*class=["'][^"']*experience-card[^"']*["'][^>]*\bhidden\b/g) ?? [];
  assert.ok(hiddenCards.length > 0, "Expected hidden experience cards to remain in the development CV source");
});
