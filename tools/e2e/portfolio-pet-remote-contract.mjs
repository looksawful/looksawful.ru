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
  const runtimeErrors = [];
  page.on("pageerror", (error) => runtimeErrors.push(error.message));
  await page.addInitScript(() => {
    try { localStorage.setItem("looksawful:analytics-internal", "1"); } catch {}
  });
  await page.goto(`${origin}/?pet=1&sha=${expectedSha}`, { waitUntil: "networkidle" });

  const pet = page.locator("[data-portfolio-pet-launcher]");
  assert.equal(await pet.count(), 1, "published preview must mount exactly one Venus launcher");
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
  const atlas = await image.evaluate((node) => ({
    width: node.naturalWidth,
    height: node.naturalHeight,
    frame: node.dataset.frame ?? "",
    transform: getComputedStyle(node).transform,
  }));
  assert.equal(atlas.width, 1536, "published preview must decode the canonical Venus atlas width");
  assert.equal(atlas.height, 2288, "published preview must decode the canonical Venus atlas height");
  assert.equal(await pet.getAttribute("data-animation"), "idle", "published Venus must use the idle sprite clip");
  await page.waitForTimeout(360);
  const animated = await image.evaluate((node) => ({
    frame: node.dataset.frame ?? "",
    transform: getComputedStyle(node).transform,
  }));
  assert.notEqual(animated.frame, atlas.frame, "published Venus must advance real sprite frames");
  assert.notEqual(animated.transform, atlas.transform, "published Venus must animate the atlas itself");

  const centerX = before.x + before.width / 2;
  const centerY = before.y + before.height / 2;
  await page.mouse.move(centerX, centerY);
  await page.mouse.down();
  await page.mouse.move(centerX + 190, centerY - 110, { steps: 10 });
  await page.mouse.up();
  await page.waitForTimeout(160);
  const after = await pet.boundingBox();
  assert.ok(after && after.x - before.x > 100 && before.y - after.y > 50, "Venus must follow pointer drag on published preview");
  assert.equal(await pet.getAttribute("data-facing"), "right", "published Venus must face right while dragging right");
  const rightScale = await pet.locator(".portfolio-pet__viewport").evaluate((node) => new DOMMatrix(getComputedStyle(node).transform).a);
  assert.ok(rightScale > 0, "published right-facing Venus must not be mirrored");
  assert.equal(await page.locator("[data-contact-hub]").isVisible(), false, "dragging must not open the chat");

  const afterX = after.x + after.width / 2;
  const afterY = after.y + after.height / 2;
  await page.mouse.move(afterX, afterY);
  await page.mouse.down();
  await page.mouse.move(afterX - 120, afterY, { steps: 8 });
  await page.mouse.up();
  await page.waitForTimeout(160);
  assert.equal(await pet.getAttribute("data-facing"), "left", "published Venus must face left while dragging left");
  const leftScale = await pet.locator(".portfolio-pet__viewport").evaluate((node) => new DOMMatrix(getComputedStyle(node).transform).a);
  assert.ok(leftScale < 0, "published left-facing Venus must mirror the sprite viewport");

  await pet.click();
  const hub = page.locator("[data-contact-hub]");
  assert.equal(await hub.count(), 1, "published preview must mount exactly one Contact Hub");
  await hub.waitFor({ state: "visible", timeout: 3_000 });
  assert.equal(await hub.getAttribute("data-mode"), "ai", "Venus must open AI mode");

  const composer = page.getByLabel("\u0421\u043e\u043e\u0431\u0449\u0435\u043d\u0438\u0435 AI");
  const sendButton = page.getByRole("button", { name: "\u041e\u0442\u043f\u0440\u0430\u0432\u0438\u0442\u044c" });
  await sendButton.waitFor({ state: "visible", timeout: 3_000 });
  assert.equal((await sendButton.textContent())?.trim(), "\u043e\u0442\u043f\u0440\u0430\u0432\u0438\u0442\u044c", "published AI composer must show an explicit send button");
  const botMessages = page.locator(".contact-hub__message--bot");
  const botCountBefore = await botMessages.count();
  const question = "\u041a\u0430\u043a\u0438\u043c\u0438 \u0438\u043d\u0441\u0442\u0440\u0443\u043c\u0435\u043d\u0442\u0430\u043c\u0438 \u0438 \u0442\u0435\u0445\u043d\u043e\u043b\u043e\u0433\u0438\u044f\u043c\u0438 \u0440\u0430\u0431\u043e\u0442\u0430\u0435\u0442 \u0418\u0432\u0430\u043d?";
  await composer.fill(question);
  await sendButton.click();
  const answer = botMessages.nth(botCountBefore);
  await answer.waitFor({ state: "visible", timeout: 15_000 });
  await page.waitForFunction((index) => {
    const nodes = document.querySelectorAll(".contact-hub__message--bot");
    const node = nodes[index];
    return node && !node.hasAttribute("data-pending") && (node.textContent?.trim().length ?? 0) > 0;
  }, botCountBefore, { timeout: 15_000 });
  const answerText = (await answer.textContent())?.trim() ?? "";
  assert.match(answerText, /Figma|Blender|TypeScript|Photoshop|ComfyUI|JavaScript/i, "published preview must return a grounded Yandex answer");
  assert.doesNotMatch(answerText, /\u043d\u0435\u0442 \u0441\u043e\u0433\u043b\u0430\u0441\u043e\u0432\u0430\u043d\u043d\u044b\u0445 \u0434\u0430\u043d\u043d\u044b\u0445|\u0447\u0430\u0442 \u0441\u0435\u0439\u0447\u0430\u0441 \u043d\u0435\u0434\u043e\u0441\u0442\u0443\u043f\u0435\u043d/i);
  assert.equal(await composer.inputValue(), "", "composer must clear after sending");

  await mkdir("artifacts", { recursive: true });
  await page.screenshot({ path: "artifacts/venus-preview-desktop.png", fullPage: false });

  await page.evaluate(() => {
    window.addEventListener("pagehide", (event) => {
      sessionStorage.setItem("looksawful:venus-pagehide-audit", JSON.stringify({
        persisted: event.persisted,
        petCount: document.querySelectorAll("[data-portfolio-pet-launcher]").length,
        hubCount: document.querySelectorAll("[data-contact-hub]").length,
      }));
    });
  });
  await page.goto(`${origin}/?sha=${expectedSha}&lifecycle=1`, { waitUntil: "domcontentloaded" });
  const lifecycle = await page.evaluate(() => {
    const raw = sessionStorage.getItem("looksawful:venus-pagehide-audit");
    return raw ? JSON.parse(raw) : null;
  });
  assert.ok(lifecycle, "pagehide lifecycle audit marker must be recorded");
  if (lifecycle.persisted) {
    assert.equal(lifecycle.petCount, 1, "bfcache pagehide must preserve Venus DOM for restoration");
    assert.equal(lifecycle.hubCount, 1, "bfcache pagehide must preserve Contact Hub DOM for restoration");
  } else {
    assert.equal(lifecycle.petCount, 0, "non-bfcache pagehide must destroy Venus DOM");
    assert.equal(lifecycle.hubCount, 0, "non-bfcache pagehide must destroy Contact Hub DOM");
  }

  assert.deepEqual(runtimeErrors, [], `published preview must not raise runtime exceptions: ${runtimeErrors.join(" | ")}`);
  console.log(`Venus published-preview contract passed: ${origin}/?pet=1&sha=${expectedSha}`);
} finally {
  await browser.close();
}
