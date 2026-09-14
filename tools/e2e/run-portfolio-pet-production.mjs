import { isDirectExecution, withE2ERuntime } from "./runtime.mjs";

export async function runPortfolioPetProductionSanity({ browser, baseUrl }) {
  for (const viewport of [
    { width: 320, height: 480 },
    { width: 390, height: 844 },
    { width: 1440, height: 900 },
  ]) {
    const context = await browser.newContext({
      viewport,
      hasTouch: viewport.width <= 390,
      isMobile: viewport.width <= 390,
    });
    const page = await context.newPage();
    const chatRequests = [];
    page.on("request", (request) => {
      if (/portfolio-chat|assistant/i.test(request.url())) chatRequests.push(request.url());
    });
    await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
    const pet = page.locator("[data-portfolio-pet-launcher]");
    if ((await pet.count()) === 0) {
      const contactLink = page.locator('a[href="mailto:i@lookawful.ru"]').first();
      await contactLink.dispatchEvent("click");
      const form = page.locator("[data-contact-form-hub]");
      await form.waitFor({ state: "visible" });
      if (await page.locator("[data-contact-hub-ai], [data-contact-hub-ai-composer]").count()) {
        throw new Error("AI controls are present in the contact-only release");
      }
      await form.locator("[data-contact-form-hub-close]").click();
      if (chatRequests.length) throw new Error(`unexpected AI requests: ${chatRequests.join(", ")}`);
      console.log(`[portfolio-pet-production] ${viewport.width}x${viewport.height}: mascot disabled, contact form OK`);
      await context.close();
      continue;
    }
    await pet.waitFor({ state: "visible" });
    const assetVersion = await pet.getAttribute("data-asset-version");
    if (assetVersion !== "v6") throw new Error(`expected v6 pet, got ${assetVersion}`);
    const image = pet.locator("img");
    await image.evaluate(async (node) => node.decode());

    await pet.click();
    const form = page.locator("[data-contact-form-hub]");
    await form.waitFor({ state: "visible" });
    if (await page.locator("[data-contact-hub-ai], [data-contact-hub-ai-composer]").count()) {
      throw new Error("AI controls are present in the contact-only release");
    }
    const dismiss = page.locator("[data-portfolio-pet-dismiss]");
    if (await dismiss.isVisible()) throw new Error("pet dismiss control stayed visible behind contact form");
    const messageField = form.locator('textarea[name="message"]');
    await messageField.focus();
    const quietFocus = await messageField.evaluate((node) => {
      const inputStyle = getComputedStyle(node);
      const fieldStyle = getComputedStyle(node.closest(".contact-form-hub__field"));
      return inputStyle.outlineStyle === "none" && fieldStyle.boxShadow === "none";
    });
    if (!quietFocus) throw new Error("contact text field shows a heavy focus ring");
    const formBody = form.locator("[data-contact-form]");
    await formBody.evaluate((node) => {
      const formElement = node;
      formElement.elements.namedItem("email").value = "test@example.com";
      formElement.elements.namedItem("message").value = "test";
    });
    const overflowY = await formBody.evaluate((node) => getComputedStyle(node).overflowY);
    if (overflowY !== "auto") throw new Error(`form body is not scrollable: ${overflowY}`);
    const footer = form.locator(".contact-form-hub__footer");
    await footer.scrollIntoViewIfNeeded();
    const footerAligned = await footer.evaluate((node) => getComputedStyle(node).alignItems === "center");
    if (!footerAligned) throw new Error("contact footer controls are not vertically aligned");
    await form.locator("[data-contact-form-hub-close]").click();

    const before = await pet.boundingBox();
    if (!before) throw new Error("pet has no bounding box");
    await page.mouse.move(before.x + before.width / 2, before.y + before.height / 2);
    await page.mouse.down();
    await page.mouse.move(before.x + before.width / 2 + 48, before.y + before.height / 2 - 24, {
      steps: 4,
    });
    await page.mouse.up();
    const after = await pet.boundingBox();
    if (!after || Math.abs(after.x - before.x) < 10) throw new Error("pet did not move after drag");

    await page.mouse.move(after.x + after.width / 2, after.y + after.height / 2);
    await page.mouse.down();
    await page.mouse.move(after.x + after.width / 2 - 72, after.y + after.height / 2, { steps: 4 });
    await page.mouse.move(after.x + after.width / 2 - 69, after.y + after.height / 2, { steps: 1 });
    if ((await pet.getAttribute("data-facing")) !== "left") throw new Error("pet facing flipped on pointer jitter");
    await page.mouse.up();
    if ((await pet.getAttribute("data-facing")) !== "left") throw new Error("pet did not face left after left drag");
    const visualOk = await pet.locator(".portfolio-pet__viewport").evaluate((node) => {
      const facing = node.querySelector(".portfolio-pet__facing");
      const image = node.querySelector("img");
      if (!(facing instanceof HTMLElement) || !(image instanceof HTMLImageElement)) return false;
      const viewportRect = node.getBoundingClientRect();
      const facingRect = facing.getBoundingClientRect();
      return image.naturalWidth > 0 && facingRect.right > viewportRect.left && facingRect.left < viewportRect.right;
    });
    if (!visualOk) throw new Error("pet sprite disappeared after left drag");

    await page.locator("[data-portfolio-pet-dismiss]").click();
    if (await pet.isVisible()) throw new Error("pet remained visible after hide");
    const restore = page.locator("[data-portfolio-pet-restore]");
    await restore.click();
    await pet.waitFor({ state: "visible" });
    if (chatRequests.length) throw new Error(`unexpected AI requests: ${chatRequests.join(", ")}`);
    console.log(`[portfolio-pet-production] ${viewport.width}x${viewport.height}: OK`);
    await context.close();
  }

  const forcedContext = await browser.newContext({ viewport: { width: 1440, height: 900 }, forcedColors: "active" });
  const forcedPage = await forcedContext.newPage();
  await forcedPage.goto(baseUrl, { waitUntil: "domcontentloaded" });
  const forcedPet = forcedPage.locator("[data-portfolio-pet-launcher]");
  if ((await forcedPet.count()) > 0) await forcedPet.click();
  else await forcedPage.locator('a[href="mailto:i@lookawful.ru"]').first().dispatchEvent("click");
  const forcedForm = forcedPage.locator("[data-contact-form-hub]");
  await forcedForm.waitFor({ state: "visible" });
  const forcedMessage = forcedForm.locator('textarea[name="message"]');
  await forcedMessage.focus();
  await forcedPage.waitForFunction(() => document.activeElement?.getAttribute("name") === "message");
  const forcedFocusVisible = await forcedMessage.evaluate((node) => {
    const style = getComputedStyle(node.closest(".contact-form-hub__field"));
    return style.outlineStyle !== "none" && Number.parseFloat(style.outlineWidth) > 0;
  });
  if (!forcedFocusVisible) throw new Error("forced-colors text field has no visible focus indicator");
  await forcedContext.close();
}

if (isDirectExecution(import.meta.url)) {
  await withE2ERuntime(runPortfolioPetProductionSanity);
}
