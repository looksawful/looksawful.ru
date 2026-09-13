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
  assert.equal(await pet.count(), 1, "Awful launcher must exist exactly once in preview mode");
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
      animation: element.dataset.animation ?? "",
      frame: image?.dataset.frame ?? "",
      spriteTransform: imageStyle?.transform ?? "none",
      naturalWidth: image instanceof HTMLImageElement ? image.naturalWidth : 0,
      naturalHeight: image instanceof HTMLImageElement ? image.naturalHeight : 0,
    };
  });

  assert.equal(initial.position, "fixed", "Awful must float above the site without reflow");
  assert.ok(initial.width >= 120 && initial.height >= 120, "Awful must be visibly present, not a tiny launcher icon");
  assert.ok(initial.left >= 0 && initial.top >= 0, "Awful must start inside the viewport");
  assert.ok(initial.right <= initial.viewportWidth, "Awful must not clip horizontally");
  assert.ok(initial.bottom <= initial.viewportHeight, "Awful must not clip vertically");
  assert.equal(initial.cursor, "grab", "Awful must advertise pointer dragging");
  assert.equal(initial.animation, "idle", "Awful must start on the canonical idle sprite clip");
  assert.equal(initial.naturalWidth, 1536, "Awful atlas must decode at canonical width");
  assert.equal(initial.naturalHeight, 2288, "Awful atlas must decode at canonical height");
  await page.waitForTimeout(360);
  const animated = await pet.locator(".portfolio-pet__image").evaluate((image) => ({
    frame: image.dataset.frame ?? "",
    transform: getComputedStyle(image).transform,
  }));
  assert.notEqual(animated.frame, initial.frame, "Awful idle must advance through real sprite frames");
  assert.notEqual(animated.transform, initial.spriteTransform, "Awful idle must move the atlas, not CSS-wobble one bitmap");

  const startBox = await pet.boundingBox();
  assert.ok(startBox, "Awful must expose a draggable bounding box");
  const startX = startBox.x + (startBox.width / 2);
  const startY = startBox.y + (startBox.height / 2);
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + 180, startY - 96, { steps: 8 });
  await page.mouse.up();
  await settle(page);

  const draggedBox = await pet.boundingBox();
  assert.ok(draggedBox, "Awful must remain visible after dragging");
  assert.ok(draggedBox.x - startBox.x > 100, "Awful must move horizontally with the pointer");
  assert.ok(startBox.y - draggedBox.y > 50, "Awful must move vertically with the pointer");
  assert.equal(await pet.getAttribute("data-facing"), "right", "dragging right must face Awful right");
  const rightFacingScale = await pet.locator(".portfolio-pet__viewport").evaluate((element) => new DOMMatrix(getComputedStyle(element).transform).a);
  assert.ok(rightFacingScale > 0, "right-facing Awful must not mirror the sprite viewport");
  assert.equal(await page.locator("[data-contact-hub]").isVisible(), false, "dragging must not accidentally open chat");

  const rightBox = await pet.boundingBox();
  assert.ok(rightBox, "Awful must expose a draggable box before leftward drag");
  const rightX = rightBox.x + (rightBox.width / 2);
  const rightY = rightBox.y + (rightBox.height / 2);
  await page.mouse.move(rightX, rightY);
  await page.mouse.down();
  await page.mouse.move(rightX - 120, rightY, { steps: 8 });
  await page.mouse.up();
  await settle(page);
  assert.equal(await pet.getAttribute("data-facing"), "left", "dragging left must face Awful left");
  const leftFacingScale = await pet.locator(".portfolio-pet__viewport").evaluate((element) => new DOMMatrix(getComputedStyle(element).transform).a);
  assert.ok(leftFacingScale < 0, "left-facing Awful must mirror the sprite viewport");

  await pet.evaluate((element) => {
    element.style.setProperty("--pet-safe-top", "36px");
    element.style.setProperty("--pet-safe-right", "44px");
    element.style.setProperty("--pet-safe-bottom", "52px");
    element.style.setProperty("--pet-safe-left", "48px");
  });
  const safeAreaStart = await pet.boundingBox();
  assert.ok(safeAreaStart, "Awful must remain draggable while safe-area values are active");
  const safeStartX = safeAreaStart.x + (safeAreaStart.width / 2);
  const safeStartY = safeAreaStart.y + (safeAreaStart.height / 2);
  await page.mouse.move(safeStartX, safeStartY);
  await page.mouse.down();
  await page.mouse.move(-600, -420, { steps: 20 });
  await page.mouse.up();
  await settle(page);
  const safeAreaBox = await pet.boundingBox();
  assert.ok(safeAreaBox, "Awful must remain recoverable after safe-area clamp");
  assert.ok(safeAreaBox.x >= 48 - (safeAreaBox.width - 72) - 1, "PET-020: runtime clamp must use effective left safe area");
  assert.ok(safeAreaBox.y >= 36 - (safeAreaBox.height - 96) - 1, "PET-020: runtime clamp must use effective top safe area");

  await pet.click();
  await settle(page);

  const hub = page.locator("[data-contact-hub]");
  await hub.waitFor({ state: "visible", timeout: 2_000 });
  assert.equal(await hub.getAttribute("data-mode"), "ai", "clicking Awful must open Contact Hub in AI mode");
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
    "closing the Hub must restore focus to Awful",
  );

  await pet.evaluate((element) => {
    element.style.removeProperty("--pet-safe-top");
    element.style.removeProperty("--pet-safe-right");
    element.style.removeProperty("--pet-safe-bottom");
    element.style.removeProperty("--pet-safe-left");
    element.style.left = "220px";
    element.style.top = "320px";
  });
  await settle(page);
  const beforeHide = await pet.boundingBox();
  assert.ok(beforeHide, "Awful must be visible before deliberate swipe-to-hide");
  const hideStartX = beforeHide.x + (beforeHide.width / 2);
  const hideStartY = beforeHide.y + (beforeHide.height / 2);
  await page.mouse.move(hideStartX, hideStartY);
  await page.mouse.down();
  await page.mouse.move(18, hideStartY + 4, { steps: 2 });
  await page.mouse.up();
  await settle(page);
  assert.equal(await pet.isVisible(), false, "DR-006/PET-024: deliberate fast swipe to the left edge must hide Awful");
  assert.equal(await hub.isVisible(), false, "swipe-to-hide must not open Contact Hub");

  await page.close();
});
