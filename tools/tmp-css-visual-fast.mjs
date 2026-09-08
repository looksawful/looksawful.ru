import { chromium } from "playwright";
import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const [baselineUrl, currentUrl, outputDir] = process.argv.slice(2);
if (!baselineUrl || !currentUrl || !outputDir) throw new Error("usage: node tools/tmp-css-visual-fast.mjs <baseline-url> <current-url> <output-dir>");

const routes = ["/", "/work/jestei-pool/", "/work/styx/", "/work/sensetique/", "/shootings/", "/work/berry-social-content-2020/", "/work/awful-cases/", "/work/moves-awful/"];
const viewports = [
  { name: "mobile", width: 390, height: 844, isMobile: true, hasTouch: true },
  { name: "tablet", width: 834, height: 1112, isMobile: false, hasTouch: true },
  { name: "desktop", width: 1728, height: 1000, isMobile: false, hasTouch: false },
];
const selectors = ["body", ".site-nav", ".projects-grid", ".project-card", ".portfolio-showcase", ".project", ".project__head", ".project__intro", ".project__section", ".section-copy", ".media-group", ".media-group__items", ".media", ".media__surface", ".slider", ".mockup", ".justified-gallery"];
const styleProps = ["display", "position", "width", "height", "minWidth", "maxWidth", "minHeight", "maxHeight", "marginTop", "marginRight", "marginBottom", "marginLeft", "paddingTop", "paddingRight", "paddingBottom", "paddingLeft", "gap", "rowGap", "columnGap", "gridTemplateColumns", "gridTemplateRows", "gridAutoFlow", "flexDirection", "justifyContent", "alignItems", "alignContent", "overflowX", "overflowY", "fontSize", "lineHeight", "letterSpacing", "fontWeight", "textAlign", "borderRadius", "objectFit", "objectPosition", "aspectRatio", "transform", "opacity", "visibility"];
const pixelThreshold = 8;
const pixelRatioThreshold = 0.0005;
const geometryTolerance = 0.75;
const scrollFractions = [0, 0.5, 1];

await mkdir(outputDir, { recursive: true });
await mkdir(path.join(outputDir, "screenshots"), { recursive: true });
const slug = (value) => value === "/" ? "home" : value.replace(/^\/+|\/+$/g, "").replaceAll("/", "-").replace(/[^a-z0-9-]+/gi, "-");

async function settle(page, url) {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45_000 });
  await page.evaluate(async () => {
    await document.fonts?.ready;
    const visibleImages = [...document.images].filter((img) => {
      const r = img.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && r.bottom > -100 && r.top < innerHeight + 100;
    });
    await Promise.race([Promise.allSettled(visibleImages.map((img) => img.decode())), new Promise((resolve) => setTimeout(resolve, 4000))]);
    for (const video of document.querySelectorAll("video")) { video.pause(); try { video.currentTime = 0; } catch {} }
    scrollTo(0, 0);
  });
  await page.waitForTimeout(120);
}

async function snapshot(page) {
  return page.evaluate(({ selectors, styleProps }) => {
    const visible = (el) => { const s = getComputedStyle(el); const r = el.getBoundingClientRect(); return s.display !== "none" && s.visibility !== "hidden" && Number(s.opacity) !== 0 && r.width > 0 && r.height > 0; };
    const rect = (el) => { const r = el.getBoundingClientRect(); return { x: Math.round(r.x * 1000) / 1000, y: Math.round(r.y * 1000) / 1000, width: Math.round(r.width * 1000) / 1000, height: Math.round(r.height * 1000) / 1000 }; };
    const result = {};
    for (const selector of selectors) {
      const nodes = [...document.querySelectorAll(selector)].filter(visible);
      result[selector] = nodes.slice(0, 20).map((el) => {
        const s = getComputedStyle(el); const computed = {};
        for (const p of styleProps) computed[p] = s[p];
        return { tag: el.tagName, className: typeof el.className === "string" ? el.className : "", rect: rect(el), computed, vars: { groupGap: s.getPropertyValue("--group-gap").trim(), stripHeight: s.getPropertyValue("--strip-height").trim(), stripJustify: s.getPropertyValue("--strip-justify").trim(), reelJustify: s.getPropertyValue("--reel-justify").trim(), mediaFit: s.getPropertyValue("--media-fit").trim(), mediaPosition: s.getPropertyValue("--media-position").trim() } };
      });
    }
    return { scrollWidth: document.documentElement.scrollWidth, scrollHeight: document.documentElement.scrollHeight, horizontalOverflow: document.documentElement.scrollWidth > innerWidth + 1, selectors: result };
  }, { selectors, styleProps });
}

function compareValue(a, b, key = "root", out = []) {
  if (typeof a === "number" && typeof b === "number") { if (Math.abs(a - b) > geometryTolerance) out.push({ path: key, baseline: a, current: b }); return out; }
  if (Array.isArray(a) || Array.isArray(b)) { if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) { out.push({ path: key, baseline: a, current: b }); return out; } for (let i = 0; i < a.length; i += 1) { compareValue(a[i], b[i], `${key}[${i}]`, out); if (out.length >= 200) break; } return out; }
  if (a && b && typeof a === "object" && typeof b === "object") { for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) { compareValue(a[k], b[k], `${key}.${k}`, out); if (out.length >= 200) break; } return out; }
  if (a !== b) out.push({ path: key, baseline: a, current: b });
  return out;
}

async function comparePng(aPath, bPath, diffPath) {
  const [aMeta, bMeta] = await Promise.all([sharp(aPath).metadata(), sharp(bPath).metadata()]);
  if (!aMeta.width || !aMeta.height || aMeta.width !== bMeta.width || aMeta.height !== bMeta.height) return { sameDimensions: false, changedRatio: 1, changedPixels: null, maxDelta: 255 };
  const [a, b] = await Promise.all([sharp(aPath).ensureAlpha().raw().toBuffer(), sharp(bPath).ensureAlpha().raw().toBuffer()]);
  const diff = Buffer.alloc(a.length); let changedPixels = 0; let maxDelta = 0;
  for (let i = 0; i < a.length; i += 4) { const d = Math.max(Math.abs(a[i] - b[i]), Math.abs(a[i + 1] - b[i + 1]), Math.abs(a[i + 2] - b[i + 2]), Math.abs(a[i + 3] - b[i + 3])); maxDelta = Math.max(maxDelta, d); if (d > pixelThreshold) changedPixels += 1; const v = Math.min(255, d * 5); diff[i] = v; diff[i + 1] = 0; diff[i + 2] = 0; diff[i + 3] = 255; }
  await sharp(diff, { raw: { width: aMeta.width, height: aMeta.height, channels: 4 } }).png().toFile(diffPath);
  return { sameDimensions: true, changedPixels, changedRatio: changedPixels / (aMeta.width * aMeta.height), maxDelta };
}

const browser = await chromium.launch(); const cases = [];
try {
  for (const viewport of viewports) {
    const options = { viewport: { width: viewport.width, height: viewport.height }, deviceScaleFactor: 1, isMobile: viewport.isMobile, hasTouch: viewport.hasTouch, reducedMotion: "reduce", colorScheme: "light", locale: "en-US" };
    const [baseContext, currentContext] = await Promise.all([browser.newContext(options), browser.newContext(options)]); const [basePage, currentPage] = await Promise.all([baseContext.newPage(), currentContext.newPage()]);
    for (const route of routes) {
      const key = `${slug(route)}-${viewport.name}`; console.log(`CASE ${key}`);
      await Promise.all([settle(basePage, new URL(route, baselineUrl).href), settle(currentPage, new URL(route, currentUrl).href)]);
      const [baseSnapshot, currentSnapshot] = await Promise.all([snapshot(basePage), snapshot(currentPage)]); const structuralDifferences = compareValue(baseSnapshot, currentSnapshot); const visual = [];
      for (const fraction of scrollFractions) {
        await Promise.all([basePage.evaluate((f) => scrollTo(0, Math.max(0, (document.documentElement.scrollHeight - innerHeight) * f)), fraction), currentPage.evaluate((f) => scrollTo(0, Math.max(0, (document.documentElement.scrollHeight - innerHeight) * f)), fraction)]); await Promise.all([basePage.waitForTimeout(80), currentPage.waitForTimeout(80)]);
        const label = fraction === 0 ? "top" : fraction === 0.5 ? "middle" : "bottom"; const aPath = path.join(outputDir, "screenshots", `${key}-${label}-baseline.png`); const bPath = path.join(outputDir, "screenshots", `${key}-${label}-current.png`); const dPath = path.join(outputDir, "screenshots", `${key}-${label}-diff.png`);
        await Promise.all([basePage.screenshot({ path: aPath, animations: "disabled", mask: basePage.locator("canvas, video, iframe") }), currentPage.screenshot({ path: bPath, animations: "disabled", mask: currentPage.locator("canvas, video, iframe") })]); visual.push({ label, ...(await comparePng(aPath, bPath, dPath)) });
      }
      const visualFailures = visual.filter((v) => !v.sameDimensions || v.changedRatio > pixelRatioThreshold); const record = { key, route, viewport: viewport.name, structuralDifferenceCount: structuralDifferences.length, structuralDifferences, visual, visualFailureCount: visualFailures.length, newHorizontalOverflow: currentSnapshot.horizontalOverflow && !baseSnapshot.horizontalOverflow }; cases.push(record); console.log(`${visualFailures.length || structuralDifferences.length ? "DIFF" : "PASS"} ${key} structure=${structuralDifferences.length} visual=${visualFailures.length}`);
    }
    await Promise.all([baseContext.close(), currentContext.close()]);
  }
} finally { await browser.close(); }
const summary = { baseline: process.env.BASELINE_SHA ?? null, current: process.env.CURRENT_SHA ?? null, cases: cases.length, casesWithStructuralDifferences: cases.filter((c) => c.structuralDifferenceCount > 0).length, casesWithVisualDifferences: cases.filter((c) => c.visualFailureCount > 0).length, newHorizontalOverflowCases: cases.filter((c) => c.newHorizontalOverflow).length, pixelRatioThreshold, geometryTolerance };
await writeFile(path.join(outputDir, "report.json"), JSON.stringify({ summary, cases }, null, 2)); await writeFile(path.join(outputDir, "summary.json"), JSON.stringify(summary, null, 2)); console.log(`SUMMARY ${JSON.stringify(summary)}`);
