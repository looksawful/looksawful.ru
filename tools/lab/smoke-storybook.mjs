import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import axe from "axe-core";
import { chromium } from "playwright";

const root = process.cwd();
const storybookDir = path.join(root, "dist-lab", "lab", "system");
const MIME = new Map([[".html", "text/html"], [".js", "text/javascript"], [".css", "text/css"], [".json", "application/json"], [".svg", "image/svg+xml"], [".png", "image/png"], [".jpg", "image/jpeg"], [".jpeg", "image/jpeg"], [".webp", "image/webp"], [".woff2", "font/woff2"]]);

const viewports = [
  ["desktop", { width: 1440, height: 1000 }],
  ["tablet", { width: 834, height: 1112 }],
  ["mobile", { width: 390, height: 844 }],
];

const cases = [
  ["site-navigation-open", "03-organisms-site-navigation--open", "[data-site-navigation][data-menu-open]"],
  ["project-navigation-docked", "03-organisms-project-navigation--docked", "[data-projects-navigation][data-project-nav-docked]"],
  ["media-deck-next", "03-organisms-media-deck--next-selected", "[data-slide][data-active]"],
  ["media-lightbox-open", "03-organisms-media-lightbox--open", ".pswp"],
  ["gallery-runtime-keyboard", "03-organisms-gallery-controller--open-keyboard", ".pswp"],
  ["gallery-runtime-pointer", "03-organisms-gallery-controller--open-pointer", ".pswp"],
  ["gallery-runtime-deep-link", "03-organisms-gallery-controller--deep-linked", ".pswp"],
  ["gallery-loading", "03-organisms-animated-canvas-gallery--loading", "[data-gallery-state=\"loading\"]"],
  ["gallery-error", "03-organisms-animated-canvas-gallery--error", "[data-gallery-state=\"error\"]"],
];

function safeFile(urlPath) {
  const relative = decodeURIComponent(urlPath.split("?")[0]).replace(/^\/+/, "") || "index.html";
  const candidate = path.resolve(storybookDir, relative);
  if (!candidate.startsWith(path.resolve(storybookDir))) return null;
  return candidate;
}

const server = createServer(async (request, response) => {
  try {
    let file = safeFile(request.url || "/");
    if (!file) throw new Error("invalid path");
    if ((await stat(file)).isDirectory()) file = path.join(file, "index.html");
    const body = await readFile(file);
    response.writeHead(200, { "content-type": MIME.get(path.extname(file)) || "application/octet-stream" });
    response.end(body);
  } catch {
    response.writeHead(404).end("not found");
  }
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const address = server.address();
assert(address && typeof address === "object");
const baseUrl = `http://127.0.0.1:${address.port}`;

const browser = await chromium.launch({ headless: true });
const results = [];
try {
  for (const [viewportName, viewport] of viewports) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    const diagnostics = [];
    page.on("console", (message) => {
      if (message.type() === "error") diagnostics.push(`console:error ${message.text()}`);
    });
    page.on("pageerror", (error) => diagnostics.push(`pageerror ${error.message}`));
    page.on("requestfailed", (request) => {
      diagnostics.push(`requestfailed ${request.method()} ${request.url()} ${request.failure()?.errorText ?? "unknown"}`);
    });
    for (const [name, id, selector] of cases) {
      diagnostics.length = 0;
      console.log(`[lab-storybook-smoke] start viewport=${viewportName} story=${name} id=${id}`);
      try {
        const response = await page.goto(`${baseUrl}/iframe.html?id=${id}&viewMode=story`, { waitUntil: "networkidle" });
        assert(response, `${viewportName}/${name}: iframe navigation returned no response`);
        assert.equal(response.status(), 200, `${viewportName}/${name}: iframe navigation returned ${response.status()}`);
        const canvas = page.locator("#storybook-root");
        await canvas.waitFor({ state: "attached" });
      await page.locator(selector).first().waitFor({ state: "attached", timeout: 10000 });
      const errorSurfaces = page.locator("#error-message, .sb-errordisplay");
      const errorCount = await errorSurfaces.count();
      let visibleErrors = 0;
      for (let index = 0; index < errorCount; index += 1) {
        if (await errorSurfaces.nth(index).isVisible()) visibleErrors += 1;
      }
      assert.equal(visibleErrors, 0, `${viewportName}/${name}: Storybook error surface present`);
      if (name === "site-navigation-open") {
        assert.equal(await page.locator("[data-site-menu-toggle]").getAttribute("aria-expanded"), "true");
      }
      if (name === "media-lightbox-open") {
        assert.equal(await page.locator("[data-lightbox-source]").getAttribute("aria-haspopup"), "dialog");
      }
      if (name.startsWith("gallery-runtime-")) {
        assert.match(page.url(), /\/gallery\/\?item=[^#&]+/);
        assert.equal(await page.locator("[data-gallery-card]").first().getAttribute("aria-haspopup"), "dialog");
      }
      await page.addScriptTag({ content: axe.source });
      const a11y = await page.evaluate(async () => {
        const result = await globalThis.axe.run({
          include: document.querySelector(".pswp")
            ? [["#storybook-root"], [".pswp"]]
            : [["#storybook-root"]],
        }, {
          rules: { region: { enabled: false } },
          resultTypes: ["violations"],
        });
        return result.violations.map((violation) => ({
          id: violation.id,
          impact: violation.impact,
          nodes: violation.nodes.length,
        }));
      });
      assert.deepEqual(a11y, [], `${viewportName}/${name}: axe violations ${JSON.stringify(a11y)}`);
      if (name === "gallery-runtime-keyboard") {
        await page.keyboard.press("Escape");
        await page.locator(".pswp").waitFor({ state: "detached", timeout: 10000 });
        await page.waitForFunction(() => !new URL(window.location.href).searchParams.has("item"));
        assert.equal(
          await page.locator("[data-gallery-card]").first().evaluate((element) => document.activeElement === element),
          true,
          `${viewportName}/${name}: focus was not restored to the opening card`,
        );
      }
        results.push({ viewport: viewportName, story: name, status: "passed" });
      } catch (error) {
        console.error(
          `[lab-storybook-smoke] fail viewport=${viewportName} story=${name} id=${id} url=${page.url()} diagnostics=${JSON.stringify(diagnostics.slice(-20))}`,
        );
        throw error;
      }
    }
    await context.close();
  }
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
console.log(`[lab-storybook-smoke] ${results.length}/${viewports.length * cases.length} passed with axe`);
for (const result of results) console.log(`[lab-storybook-smoke] ${result.viewport} ${result.story} passed`);
