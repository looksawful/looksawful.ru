import assert from "node:assert/strict";
import { withE2ERuntime } from "./runtime.mjs";

const VIEWPORTS = [
  { width: 1440, height: 900, minRatio: 0.28, maxRatio: 0.38 },
  { width: 1280, height: 800, minRatio: 0.28, maxRatio: 0.38 },
  { width: 390, height: 844, minRatio: 0.20, maxRatio: 0.34 },
];

await withE2ERuntime(async ({ browser, baseUrl }) => {
  for (const viewport of VIEWPORTS) {
    const context = await browser.newContext({
      viewport,
      isMobile: viewport.width <= 680,
      hasTouch: viewport.width <= 680,
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();
    try {
      await page.goto(`${baseUrl}/?pet=1`, { waitUntil: "networkidle" });
      const pet = page.locator("[data-portfolio-pet-launcher]");
      await pet.waitFor({ state: "visible", timeout: 2_000 });
      const character = pet.locator(".portfolio-pet__viewport");
      const rect = await character.boundingBox();
      assert.ok(rect, `${viewport.width}x${viewport.height}: Awful character viewport must render`);
      const ratio = rect.height / viewport.height;
      assert.ok(
        ratio >= viewport.minRatio,
        `${viewport.width}x${viewport.height}: PET-004/PET-005 Awful is too small (${ratio.toFixed(3)} viewport height)`,
      );
      assert.ok(
        ratio <= viewport.maxRatio,
        `${viewport.width}x${viewport.height}: Awful is too large (${ratio.toFixed(3)} viewport height)`,
      );
      const petRect = await pet.boundingBox();
      assert.ok(petRect, `${viewport.width}x${viewport.height}: Awful launcher must have geometry`);
      assert.ok(rect.x >= petRect.x - 1 && rect.x + rect.width <= petRect.x + petRect.width + 1,
        `${viewport.width}x${viewport.height}: character visual must remain inside launcher hitbox horizontally`);
      assert.ok(rect.y >= petRect.y - 1 && rect.y + rect.height <= petRect.y + petRect.height + 1,
        `${viewport.width}x${viewport.height}: character visual must remain inside launcher hitbox vertically`);
    } finally {
      await context.close();
    }
  }

  console.log("Awful visual scale contract passed for desktop and representative mobile viewports");
});
