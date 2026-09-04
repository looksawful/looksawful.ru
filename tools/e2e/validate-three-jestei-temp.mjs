import assert from "node:assert/strict";
import { withE2ERuntime } from "./runtime.mjs";

await withE2ERuntime(async ({ browser, baseUrl }) => {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } });
  const pageErrors = [];
  const relevantConsoleErrors = [];

  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error" && /three|webgl|shader|gltf|draco|jestei/i.test(message.text())) {
      relevantConsoleErrors.push(message.text());
    }
  });

  await page.goto(baseUrl, { waitUntil: "networkidle" });
  const root = page.locator('[data-jestei-theme-organism][data-jestei-theme-instance="inline"]').first();
  await root.waitFor({ state: "attached" });
  await root.scrollIntoViewIfNeeded();

  await page.waitForFunction(() => {
    const node = document.querySelector('[data-jestei-theme-organism][data-jestei-theme-instance="inline"]');
    return node?.dataset?.motionState === "animated" || node?.dataset?.motionState === "error";
  }, null, { timeout: 15_000 });

  const state = await root.getAttribute("data-motion-state");
  const errorCode = await root.getAttribute("data-motion-error");
  const dimensions = await root.locator("[data-jestei-theme-canvas]").evaluate((node) => ({
    width: node.width,
    height: node.height,
  }));

  assert.equal(state, "animated", `Three.js runtime failed; error=${errorCode ?? "none"}`);
  assert.ok(dimensions.width > 0 && dimensions.height > 0, `invalid WebGL canvas ${dimensions.width}x${dimensions.height}`);
  assert.deepEqual(pageErrors, []);
  assert.deepEqual(relevantConsoleErrors, []);
});
