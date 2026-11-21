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
  ["narrow", { width: 320, height: 700 }],
];

const cases = [
  ["foundations-palette", "00-foundations-design-tokens--palette", ".token-foundations .token-card"],
  ["foundations-typography", "00-foundations-design-tokens--typography", ".token-foundations .token-card"],
  ["foundations-spacing", "00-foundations-design-tokens--spacing-and-layout", ".token-foundations .token-card"],
  ["foundations-shape", "00-foundations-design-tokens--shape-and-elevation", ".token-foundations .token-card"],
  ["foundations-motion", "00-foundations-design-tokens--motion-and-layers", ".token-foundations .token-card"],
  ["patterns-layout", "00-foundations-css-patterns--layout-primitives", ".pattern-catalog__item"],
  ["atom-divider", "01-atoms-production-primitives--divider", ".divider"],
  ["atom-media", "01-atoms-production-primitives--media-image", "img[src]"],
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
      // Assert the live CSSOM catalogue, not just that a page exists.
      const expectedTokenCounts = {
        "foundations-palette": 14,
        "foundations-typography": 32,
        "foundations-spacing": 17,
        "foundations-shape": 15,
        "foundations-motion": 4,
      };
      if (Object.hasOwn(expectedTokenCounts, name)) {
        assert.equal(await page.locator(".token-card").count(), expectedTokenCounts[name],
          `${viewportName}/${name}: production token coverage drift`);
      }
      if (/^(foundations|patterns|atom)-/.test(name)) {
        const overflow = await page.evaluate(() =>
          document.documentElement.scrollWidth - document.documentElement.clientWidth);
        assert.ok(overflow <= 1, `${viewportName}/${name}: horizontal overflow ${overflow}px`);
      }
      // A compact accessibility stress check: 200% CSS zoom at mobile width.
      if (viewportName === "mobile" && name === "foundations-palette") {
        const zoomOverflow = await page.evaluate(() => {
          document.documentElement.style.zoom = "200%";
          return document.documentElement.scrollWidth - document.documentElement.clientWidth;
        });
        assert.ok(zoomOverflow <= 1, `200% zoom: horizontal overflow ${zoomOverflow}px`);
        await page.evaluate(() => { document.documentElement.style.zoom = ""; });
      }
      if (viewportName === "mobile" && name === "foundations-motion") {
        await page.emulateMedia({ reducedMotion: "reduce" });
        const animation = await page.evaluate(() => {
          const dot = document.createElement("span");
          dot.className = "token-motion-dot";
          document.querySelector("#storybook-root").append(dot);
          const name = getComputedStyle(dot).animationName;
          dot.remove();
          return name;
        });
        assert.equal(animation, "none", "reduced motion disables decorative token animation");
        await page.emulateMedia({ reducedMotion: "no-preference" });
      }
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
          targets: violation.nodes.slice(0, 6).map((node) => node.target),
        }));
      });
      assert.deepEqual(a11y, [], `${viewportName}/${name}: axe violations ${JSON.stringify(a11y)}`);
      results.push({ viewport: viewportName, story: name, status: "passed" });
    }
    await context.close();
  }
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
console.log(`[lab-storybook-smoke] ${results.length}/${viewports.length * cases.length} passed with axe`);
for (const result of results) console.log(`[lab-storybook-smoke] ${result.viewport} ${result.story} passed`);
