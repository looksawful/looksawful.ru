import assert from "node:assert/strict";
import { withE2ERuntime } from "./runtime.mjs";

async function settle(page) {
  await page.evaluate(() => new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  }));
  await page.waitForTimeout(180);
}

await withE2ERuntime(async ({ browser, baseUrl }) => {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto(`${baseUrl}/?pet=1`, { waitUntil: "networkidle" });

  const pet = page.locator("[data-portfolio-pet-launcher]");
  assert.equal(await pet.count(), 1, "Venus launcher must exist exactly once in preview mode");
  await pet.waitFor({ state: "visible", timeout: 2_000 });

  const geometry = await pet.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    return {
      position: style.position,
      width: rect.width,
      height: rect.height,
      left: rect.left,
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom,
      viewportWidth: innerWidth,
      viewportHeight: innerHeight,
    };
  });

  assert.equal(geometry.position, "fixed", "Venus must float above the site without reflow");
  assert.ok(geometry.width >= 120 && geometry.height >= 120, "Venus must be visibly present, not a tiny launcher icon");
  assert.ok(geometry.left >= 0 && geometry.top >= 0, "Venus must start inside the viewport");
  assert.ok(geometry.right <= geometry.viewportWidth, "Venus must not clip horizontally");
  assert.ok(geometry.bottom <= geometry.viewportHeight, "Venus must not clip vertically");

  await pet.focus();
  await pet.click();
  await settle(page);

  const hub = page.locator("[data-contact-hub]");
  await hub.waitFor({ state: "visible", timeout: 2_000 });
  assert.equal(await hub.getAttribute("data-mode"), "ai", "clicking Venus must open Contact Hub in AI mode");
  assert.equal(await hub.getAttribute("data-visibility"), "open");

  await page.keyboard.press("Escape");
  await hub.waitFor({ state: "hidden", timeout: 2_000 });
  assert.equal(
    await pet.evaluate((element) => document.activeElement === element),
    true,
    "closing the Hub must restore focus to Venus",
  );

  await page.close();
});
