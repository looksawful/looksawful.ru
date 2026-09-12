import assert from "node:assert/strict";
import { withE2ERuntime } from "./runtime.mjs";

async function settle(page) {
  await page.evaluate(() => new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  }));
  await page.waitForTimeout(220);
}

await withE2ERuntime(async ({ browser, baseUrl }) => {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto(`${baseUrl}/?pet=1`, { waitUntil: "networkidle" });

  const pet = page.locator("[data-portfolio-pet-launcher]");
  assert.equal(await pet.count(), 1, "Venus launcher must exist exactly once in preview mode");
  await pet.waitFor({ state: "visible", timeout: 2_000 });

  const initial = await pet.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    const image = element.querySelector(".portfolio-pet__image");
    const imageStyle = image ? getComputedStyle(image) : null;
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
      cursor: style.cursor,
      animationName: imageStyle?.animationName ?? "none",
    };
  });

  assert.equal(initial.position, "fixed", "Venus must float above the site without reflow");
  assert.ok(initial.width >= 120 && initial.height >= 120, "Venus must be visibly present, not a tiny launcher icon");
  assert.ok(initial.left >= 0 && initial.top >= 0, "Venus must start inside the viewport");
  assert.ok(initial.right <= initial.viewportWidth, "Venus must not clip horizontally");
  assert.ok(initial.bottom <= initial.viewportHeight, "Venus must not clip vertically");
  assert.equal(initial.cursor, "grab", "Venus must advertise pointer dragging");
  assert.notEqual(initial.animationName, "none", "Venus must have an idle motion state");

  const startBox = await pet.boundingBox();
  assert.ok(startBox, "Venus must expose a draggable bounding box");
  const startX = startBox.x + (startBox.width / 2);
  const startY = startBox.y + (startBox.height / 2);
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + 180, startY - 96, { steps: 8 });
  await page.mouse.up();
  await settle(page);

  const draggedBox = await pet.boundingBox();
  assert.ok(draggedBox, "Venus must remain visible after dragging");
  assert.ok(draggedBox.x - startBox.x > 100, "Venus must move horizontally with the pointer");
  assert.ok(startBox.y - draggedBox.y > 50, "Venus must move vertically with the pointer");
  assert.equal(await page.locator("[data-contact-hub]").isVisible(), false, "dragging must not accidentally open chat");

  await pet.click();
  await settle(page);

  const hub = page.locator("[data-contact-hub]");
  await hub.waitFor({ state: "visible", timeout: 2_000 });
  assert.equal(await hub.getAttribute("data-mode"), "ai", "clicking Venus must open Contact Hub in AI mode");
  assert.equal(await hub.getAttribute("data-visibility"), "open");

  const composerInput = page.getByLabel("Сообщение AI");
  await composerInput.fill("привет");
  await composerInput.press("Enter");
  await page.locator(".contact-hub__message--user", { hasText: "привет" }).waitFor({ state: "visible", timeout: 2_000 });
  await page.locator(".contact-hub__message--bot").last().waitFor({ state: "visible", timeout: 2_000 });
  assert.equal(await composerInput.inputValue(), "", "submitted chat text must clear from the composer");

  await page.keyboard.press("Escape");
  await hub.waitFor({ state: "hidden", timeout: 2_000 });
  assert.equal(
    await pet.evaluate((element) => document.activeElement === element),
    true,
    "closing the Hub must restore focus to Venus",
  );

  await page.close();
});
