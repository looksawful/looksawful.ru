import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import sharp from "sharp";

const [baselineUrl, currentUrl, outputDir] = process.argv.slice(2);
if (!baselineUrl || !currentUrl || !outputDir) {
  throw new Error("usage: node tools/tmp-css-strip-height-visual.mjs <baseline-url> <current-url> <output-dir>");
}

const routes = ["/", "/work/jestei-pool/", "/work/styx/", "/work/sensetique/", "/shootings/", "/work/berry-social-content-2020/", "/work/awful-cases/", "/work/moves-awful/"];
const viewports = [
  { name: "mobile", width: 390, height: 844, isMobile: true, hasTouch: true },
  { name: "tablet", width: 834, height: 1112, isMobile: false, hasTouch: true },
  { name: "desktop", width: 1728, height: 1000, isMobile: false, hasTouch: false },
];
const px = (n) => Math.round(n * 1000) / 1000;
const tolerance = 0.75;
const pixelThreshold = 8;
const pixelRatioThreshold = 0.0005;
const slug = (value) => value === "/" ? "home" : value.replace(/^\/+|\/+$/g, "").replaceAll("/", "-").replace(/[^a-z0-9-]+/gi, "-");

await mkdir(outputDir, { recursive: true });
await mkdir(path.join(outputDir, "screenshots"), { recursive: true });

async function settlePage(page, url) {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45_000 });
  await page.addStyleTag({ content: `*, *::before, *::after { transition: none !important; animation-play-state: paused !important; scroll-behavior: auto !important; }` });
  await page.evaluate(async () => {
    await document.fonts?.ready;
    for (const video of document.querySelectorAll("video")) { video.pause(); try { video.currentTime = 0; } catch {} }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(80);
}

async function visibleStrips(page) {
  return page.locator('.media-group[data-layout="strip"]').evaluateAll((groups) => groups.map((group, index) => {
    const r = group.getBoundingClientRect();
    const s = getComputedStyle(group);
    return { index, visible: s.display !== "none" && s.visibility !== "hidden" && r.width > 0 && r.height > 0, className: group.className };
  }).filter((x) => x.visible));
}

async function settleStrip(page, index) {
  const group = page.locator('.media-group[data-layout="strip"]').nth(index);
  await group.scrollIntoViewIfNeeded();
  await group.evaluate(async (root) => {
    const images = [...root.querySelectorAll("img")];
    for (const image of images) {
      image.loading = "eager";
      if (!image.complete) await new Promise((resolve) => {
        const done = () => resolve();
        image.addEventListener("load", done, { once: true });
        image.addEventListener("error", done, { once: true });
        setTimeout(done, 5000);
      });
      try { await image.decode(); } catch {}
    }
    for (const video of root.querySelectorAll("video")) { video.pause(); try { video.currentTime = 0; } catch {} }
  });
  await page.waitForTimeout(100);
  return group;
}

async function stripSnapshot(group) {
  return group.evaluate((root) => {
    const rr = root.getBoundingClientRect();
    const rootStyle = getComputedStyle(root);
    const items = root.querySelector(':scope > .media-group__items');
    const itemStyle = items ? getComputedStyle(items) : null;
    const rect = (node) => { const r = node.getBoundingClientRect(); return { x: Math.round((r.x - rr.x) * 1000) / 1000, y: Math.round((r.y - rr.y) * 1000) / 1000, width: Math.round(r.width * 1000) / 1000, height: Math.round(r.height * 1000) / 1000 }; };
    const surfaces = [...root.querySelectorAll(".media__surface")].map((surface) => {
      const s = getComputedStyle(surface);
      return { rect: rect(surface), blockSize: s.blockSize, inlineSize: s.inlineSize, aspectRatio: s.aspectRatio, objectFit: s.objectFit, objectPosition: s.objectPosition };
    });
    const media = [...root.querySelectorAll(':scope > .media-group__items > .media')].map((node) => rect(node));
    return {
      className: root.className,
      groupRect: { width: Math.round(rr.width * 1000) / 1000, height: Math.round(rr.height * 1000) / 1000 },
      scrollWidth: root.scrollWidth,
      clientWidth: root.clientWidth,
      stripHeight: rootStyle.getPropertyValue("--strip-height").trim(),
      portfolioStripHeight: rootStyle.getPropertyValue("--portfolio-strip-height").trim(),
      items: items ? { rect: rect(items), justifyContent: itemStyle.justifyContent, gap: itemStyle.gap, scrollWidth: items.scrollWidth, clientWidth: items.clientWidth } : null,
      media,
      surfaces,
    };
  });
}

function compareRendered(a, b) {
  const differences = [];
  const number = (name, left, right) => { if (Math.abs(left - right) > tolerance) differences.push({ name, baseline: left, current: right }); };
  number("group.width", a.groupRect.width, b.groupRect.width);
  number("group.height", a.groupRect.height, b.groupRect.height);
  if (a.scrollWidth !== b.scrollWidth) differences.push({ name: "group.scrollWidth", baseline: a.scrollWidth, current: b.scrollWidth });
  if (a.clientWidth !== b.clientWidth) differences.push({ name: "group.clientWidth", baseline: a.clientWidth, current: b.clientWidth });
  if ((a.items?.justifyContent ?? null) !== (b.items?.justifyContent ?? null)) differences.push({ name: "items.justifyContent", baseline: a.items?.justifyContent, current: b.items?.justifyContent });
  if ((a.items?.gap ?? null) !== (b.items?.gap ?? null)) differences.push({ name: "items.gap", baseline: a.items?.gap, current: b.items?.gap });
  if ((a.items?.scrollWidth ?? null) !== (b.items?.scrollWidth ?? null)) differences.push({ name: "items.scrollWidth", baseline: a.items?.scrollWidth, current: b.items?.scrollWidth });
  if (a.media.length !== b.media.length) differences.push({ name: "media.length", baseline: a.media.length, current: b.media.length });
  if (a.surfaces.length !== b.surfaces.length) differences.push({ name: "surfaces.length", baseline: a.surfaces.length, current: b.surfaces.length });
  const n = Math.min(a.surfaces.length, b.surfaces.length);
  for (let i = 0; i < n; i += 1) {
    for (const dim of ["x", "y", "width", "height"]) number(`surface[${i}].${dim}`, a.surfaces[i].rect[dim], b.surfaces[i].rect[dim]);
    for (const prop of ["blockSize", "inlineSize", "aspectRatio", "objectFit", "objectPosition"]) {
      if (a.surfaces[i][prop] !== b.surfaces[i][prop]) differences.push({ name: `surface[${i}].${prop}`, baseline: a.surfaces[i][prop], current: b.surfaces[i][prop] });
    }
  }
  return differences;
}

async function comparePng(aPath, bPath, diffPath) {
  const [am, bm] = await Promise.all([sharp(aPath).metadata(), sharp(bPath).metadata()]);
  if (!am.width || !am.height || am.width !== bm.width || am.height !== bm.height) return { sameDimensions: false, changedRatio: 1, changedPixels: null, maxDelta: 255 };
  const [a, b] = await Promise.all([sharp(aPath).ensureAlpha().raw().toBuffer(), sharp(bPath).ensureAlpha().raw().toBuffer()]);
  const diff = Buffer.alloc(a.length); let changedPixels = 0; let maxDelta = 0;
  for (let i = 0; i < a.length; i += 4) {
    const d = Math.max(Math.abs(a[i]-b[i]), Math.abs(a[i+1]-b[i+1]), Math.abs(a[i+2]-b[i+2]), Math.abs(a[i+3]-b[i+3]));
    maxDelta = Math.max(maxDelta, d); if (d > pixelThreshold) changedPixels += 1;
    const v = Math.min(255, d * 5); diff[i]=v; diff[i+1]=0; diff[i+2]=0; diff[i+3]=255;
  }
  await sharp(diff, { raw: { width: am.width, height: am.height, channels: 4 } }).png().toFile(diffPath);
  return { sameDimensions: true, changedPixels, changedRatio: changedPixels/(am.width*am.height), maxDelta };
}

const browser = await chromium.launch();
const records = [];
try {
  for (const viewport of viewports) {
    const opts = { viewport: { width: viewport.width, height: viewport.height }, deviceScaleFactor: 1, isMobile: viewport.isMobile, hasTouch: viewport.hasTouch, reducedMotion: "reduce", colorScheme: "light" };
    const [bc, cc] = await Promise.all([browser.newContext(opts), browser.newContext(opts)]);
    const [bp, cp] = await Promise.all([bc.newPage(), cc.newPage()]);
    for (const route of routes) {
      await Promise.all([settlePage(bp, new URL(route, baselineUrl).href), settlePage(cp, new URL(route, currentUrl).href)]);
      const [bl, cl] = await Promise.all([visibleStrips(bp), visibleStrips(cp)]);
      assert.equal(cl.length, bl.length, `${route} ${viewport.name} visible strip count`);
      for (let i = 0; i < bl.length; i += 1) {
        assert.equal(cl[i].index, bl[i].index, `${route} ${viewport.name} strip DOM index`);
        const [bg, cg] = await Promise.all([settleStrip(bp, bl[i].index), settleStrip(cp, cl[i].index)]);
        const [bs, cs] = await Promise.all([stripSnapshot(bg), stripSnapshot(cg)]);
        const renderedDifferences = compareRendered(bs, cs);
        const key = `${slug(route)}-${viewport.name}-strip-${i}`;
        const ap = path.join(outputDir, "screenshots", `${key}-baseline.png`);
        const bpPath = path.join(outputDir, "screenshots", `${key}-current.png`);
        const dp = path.join(outputDir, "screenshots", `${key}-diff.png`);
        const masksA = [bg.locator("canvas"), bg.locator("video"), bg.locator("iframe")];
        const masksB = [cg.locator("canvas"), cg.locator("video"), cg.locator("iframe")];
        await Promise.all([bg.screenshot({ path: ap, animations: "disabled", mask: masksA }), cg.screenshot({ path: bpPath, animations: "disabled", mask: masksB })]);
        const visual = await comparePng(ap, bpPath, dp);
        const visualFailure = !visual.sameDimensions || visual.changedRatio > pixelRatioThreshold;
        records.push({ key, route, viewport: viewport.name, domIndex: bl[i].index, className: bs.className, baselineStripHeight: bs.stripHeight, currentStripHeight: cs.stripHeight, renderedDifferences, visual, visualFailure });
        console.log(`${renderedDifferences.length || visualFailure ? "DIFF" : "PASS"} ${key} rendered=${renderedDifferences.length} visual=${visual.changedRatio}`);
      }
    }
    await Promise.all([bc.close(), cc.close()]);
  }
} finally { await browser.close(); }

const summary = {
  baseline: process.env.BASELINE_SHA ?? null,
  current: process.env.CURRENT_SHA ?? null,
  strips: records.length,
  renderedDifferenceCases: records.filter((x) => x.renderedDifferences.length).length,
  visualDifferenceCases: records.filter((x) => x.visualFailure).length,
  pixelRatioThreshold,
  tolerance,
};
await writeFile(path.join(outputDir, "report.json"), JSON.stringify({ summary, records }, null, 2));
await writeFile(path.join(outputDir, "summary.json"), JSON.stringify(summary, null, 2));
console.log(`SUMMARY ${JSON.stringify(summary)}`);
if (summary.renderedDifferenceCases || summary.visualDifferenceCases) process.exitCode = 1;
