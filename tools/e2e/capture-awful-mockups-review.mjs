import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "playwright";

const rawBaseUrl = (process.env.PREVIEW_URL || "").trim();
if (!rawBaseUrl) throw new Error("PREVIEW_URL is required.");

const url = new URL("/work/awful-mockups/", rawBaseUrl);
const outDir = process.env.VISUAL_REVIEW_DIR || "visual-review";

const targets = [
  { name: "mobile", viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
  { name: "tablet", viewport: { width: 820, height: 1180 }, isMobile: true, hasTouch: true },
  { name: "desktop", viewport: { width: 1440, height: 1100 }, isMobile: false, hasTouch: false },
];

await mkdir(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const manifest = {
  captured: true,
  sha: process.env.PR_HEAD_SHA || null,
  url: url.href,
  targets: [],
};

try {
  for (const target of targets) {
    const context = await browser.newContext({
      viewport: target.viewport,
      isMobile: target.isMobile,
      hasTouch: target.hasTouch,
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();
    const errors = [];

    page.on("pageerror", (error) => errors.push("pageerror: " + error.message));
    page.on("console", (message) => {
      if (message.type() === "error" && !message.text().startsWith("Failed to load resource:")) {
        errors.push("console: " + message.text());
      }
    });

    await page.goto(url.href, { waitUntil: "domcontentloaded", timeout: 30_000 });
    await page.evaluate(() => document.fonts?.ready);

    const scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    const step = Math.max(400, Math.floor(target.viewport.height * 0.7));
    for (let y = 0; y < scrollHeight; y += step) {
      await page.evaluate((nextY) => window.scrollTo(0, nextY), y);
      await page.waitForTimeout(50);
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(200);

    await page.screenshot({ path: outDir + "/" + target.name + "-viewport.png" });
    await page.screenshot({ path: outDir + "/" + target.name + "-full.png", fullPage: true });

    const state = await page.evaluate(() => ({
      title: document.querySelector("h1")?.textContent?.trim() || "",
      previewCount: document.querySelectorAll("#awful-mockups-showcase .media-group img").length,
      structureCount: document.querySelectorAll("#awful-mockups-structure .media-group img").length,
      presentationCount: document.querySelectorAll(
        "#awful-mockups-showcase [data-animated-canvas-gallery], #awful-mockups-showcase .mockup-deck",
      ).length,
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    }));

    manifest.targets.push({
      name: target.name,
      viewport: target.viewport,
      state,
      errors,
    });
    await context.close();
  }
} finally {
  await browser.close();
}

await writeFile(outDir + "/manifest.json", JSON.stringify(manifest, null, 2) + "\n");

const henConfig = {
  version: 1,
  name: "Awful Mockups review",
  profile: "portfolio-custom",
  customSize: { width: 1600, height: 1200 },
  device: "card",
  sourceLanguage: "ru",
  slides: [
    { image: "mobile-viewport.png", title: "Мобильная версия" },
    { image: "tablet-viewport.png", title: "Планшет" },
    { image: "desktop-viewport.png", title: "Десктоп" },
  ],
};

await writeFile(outDir + "/hen-config.json", JSON.stringify(henConfig, null, 2) + "\n");

const failed = manifest.targets.flatMap((target) => target.errors);
if (failed.length > 0) {
  throw new Error("Visual review capture found browser errors:\n" + failed.join("\n"));
}
