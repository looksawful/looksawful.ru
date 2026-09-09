import { waitForDocumentReady } from "./readiness.mjs";
import { withE2ERuntime } from "./runtime.mjs";

await withE2ERuntime(async ({ browser, baseUrl }) => {
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 1440, height: 900 },
  ]) {
    const context = await browser.newContext({
      viewport,
      isMobile: viewport.width === 390,
      hasTouch: viewport.width === 390,
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();
    try {
      const response = await page.goto(`${baseUrl}/`, { waitUntil: "domcontentloaded" });
      await waitForDocumentReady(page);
      const images = await page.locator("img:visible").evaluateAll((nodes) =>
        nodes.slice(0, 5).map((node) => ({
          src: node.getAttribute("src"),
          currentSrc: node.currentSrc,
          complete: node.complete,
          naturalWidth: node.naturalWidth,
          naturalHeight: node.naturalHeight,
        })),
      );
      const image = page.locator("img:visible").first();
      await image.scrollIntoViewIfNeeded();
      const currentSrc = await image.evaluate((node) => node.currentSrc || node.src);
      const assetResponse = await page.request.get(currentSrc);
      const body = await assetResponse.body();
      let decodeError = null;
      try {
        await image.evaluate(async (node) => node.decode());
      } catch (error) {
        decodeError = String(error);
      }
      const after = await image.evaluate((node) => ({
        src: node.getAttribute("src"),
        currentSrc: node.currentSrc,
        complete: node.complete,
        naturalWidth: node.naturalWidth,
        naturalHeight: node.naturalHeight,
      }));
      console.log("[DEBUG-638]", JSON.stringify({
        viewport,
        documentStatus: response?.status() ?? null,
        images,
        asset: {
          url: currentSrc,
          status: assetResponse.status(),
          contentType: assetResponse.headers()["content-type"] ?? null,
          contentLength: body.length,
          prefixHex: body.subarray(0, 16).toString("hex"),
        },
        decodeError,
        after,
      }));
    } finally {
      await context.close();
    }
  }
});
