import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const previewUrl = process.env.PREVIEW_URL?.trim() ?? "";
const expectedSha = process.env.PREVIEW_SHA?.trim() ?? "";
if (!previewUrl || !expectedSha) throw new Error("PREVIEW_URL and PREVIEW_SHA are required");

const origin = new URL(previewUrl).origin;
const versionUrl = `${origin}/preview-version.txt?sha=${encodeURIComponent(expectedSha)}`;
let currentVersion = "";
for (let attempt = 0; attempt < 80; attempt += 1) {
  try {
    const response = await fetch(versionUrl, { cache: "no-store" });
    if (response.ok) {
      currentVersion = await response.text();
      if (currentVersion.includes(`commit=${expectedSha}`)) break;
    }
  } catch {}
  await new Promise((resolve) => setTimeout(resolve, 3_000));
}
assert.match(currentVersion, new RegExp(`commit=${expectedSha}`), "preview alias must serve the exact tested SHA");

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.addInitScript(() => {
    try { localStorage.setItem("looksawful:analytics-internal", "1"); } catch {}
  });
  await page.goto(`${origin}/?pet=1&sha=${expectedSha}`, { waitUntil: "networkidle" });

  const pet = page.locator("[data-portfolio-pet-launcher]");
  await pet.waitFor({ state: "visible", timeout: 5_000 });
  const image = pet.locator(".portfolio-pet__image");
  await image.waitFor({ state: "visible", timeout: 5_000 });
  await image.evaluate(async (node) => {
    if (!(node instanceof HTMLImageElement)) throw new Error("Venus image is not an img element");
    await node.decode();
    if (node.naturalWidth <= 0 || node.naturalHeight <= 0) throw new Error("Venus image has no decoded pixels");
  });

  const before = await pet.boundingBox();
  assert.ok(before && before.width > 100 && before.height > 100, "Venus must occupy a visible screen area");
  const animationName = await image.evaluate((node) => getComputedStyle(node).animationName);
  assert.notEqual(animationName, "none", "Venus must have a visible idle animation");

  const centerX = before.x + before.width / 2;
  const centerY = before.y + before.height / 2;
  await page.mouse.move(centerX, centerY);
  await page.mouse.down();
  await page.mouse.move(centerX + 190, centerY - 110, { steps: 10 });
  await page.mouse.up();
  await page.waitForTimeout(160);
  const after = await pet.boundingBox();
  assert.ok(after && after.x - before.x > 100 && before.y - after.y > 50, "Venus must follow pointer drag on published preview");
  assert.equal(await page.locator("[data-contact-hub]").isVisible(), false, "dragging must not open the chat");

  await pet.click();
  const hub = page.locator("[data-contact-hub]");
  await hub.waitFor({ state: "visible", timeout: 3_000 });
  assert.equal(await hub.getAttribute("data-mode"), "ai", "Venus must open AI mode");

  const composer = page.getByLabel("Сообщение AI");
  await composer.fill("привет");
  await composer.press("Enter");
  await page.locator(".contact-hub__message--user", { hasText: "привет" }).waitFor({ state: "visible", timeout: 3_000 });
  assert.equal(await composer.inputValue(), "", "composer must clear after sending");

  await mkdir("artifacts", { recursive: true });
  await page.screenshot({ path: "artifacts/venus-preview-desktop.png", fullPage: false });
  console.log(`Venus published-preview contract passed: ${origin}/?pet=1&sha=${expectedSha}`);
} finally {
  await browser.close();
}
