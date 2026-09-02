export async function waitForAnimationFrames(page, count = 2) {
  await page.evaluate((frames) => new Promise((resolve) => {
    const tick = () => --frames <= 0 ? resolve() : requestAnimationFrame(tick);
    requestAnimationFrame(tick);
  }), count);
}
export async function waitForDocumentReady(page, selector = "main") {
  await page.locator(selector).first().waitFor({ state: "attached" });
  await page.evaluate(() => document.fonts.ready);
  await waitForAnimationFrames(page);
}
export async function waitForLightboxOpen(page) {
  await page.waitForFunction(() => {
    const dialog = document.querySelector("[data-media-lightbox]");
    return Boolean(document.querySelector(".pswp")) || (dialog instanceof HTMLDialogElement && dialog.open);
  });
}
export async function waitForLightboxClosed(page) {
  await page.waitForFunction(() => !document.querySelector(".pswp") && !document.querySelector("[data-media-lightbox][open]"));
}
