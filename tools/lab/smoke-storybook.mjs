import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
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
    for (const [name, id, selector] of cases) {
      await page.goto(`${baseUrl}/iframe.html?id=${id}&viewMode=story`, { waitUntil: "networkidle" });
      const canvas = page.locator("#storybook-root");
      await canvas.waitFor({ state: "attached" });
      await page.locator(selector).first().waitFor({ state: "attached", timeout: 10000 });
      const errors = await page.locator("#error-message, .sb-errordisplay").count();
      assert.equal(errors, 0, `${viewportName}/${name}: Storybook error surface present`);
      if (name === "site-navigation-open") {
        assert.equal(await page.locator("[data-site-menu-toggle]").getAttribute("aria-expanded"), "true");
      }
      if (name === "media-lightbox-open") {
        assert.equal(await page.locator("[data-lightbox-source]").getAttribute("aria-haspopup"), "dialog");
      }
      results.push({ viewport: viewportName, story: name, status: "passed" });
    }
    await context.close();
  }
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
console.log(`[lab-storybook-smoke] ${results.length}/${viewports.length * cases.length} passed`);
for (const result of results) console.log(`[lab-storybook-smoke] ${result.viewport} ${result.story} passed`);
