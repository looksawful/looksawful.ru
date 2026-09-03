import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { chromium } from "playwright";

const HOST = "127.0.0.1";
const PORT = Number(process.env.MEDIA_DESK_BROWSER_QA_PORT ?? 4176);
const BASE_URL = `http://${HOST}:${PORT}`;
const DESK_URL = `${BASE_URL}/tools/media-desk/`;

async function waitForServer(server, output) {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    if (server.exitCode !== null) throw new Error(`Vite dev exited with code ${server.exitCode}.\n${output()}`);
    try {
      const response = await fetch(DESK_URL);
      if (response.ok) return;
    } catch {}
    await delay(250);
  }
  throw new Error(`Media Desk dev server did not become ready.\n${output()}`);
}

async function stopServer(server) {
  if (server.exitCode !== null) return;
  const exited = new Promise((resolve) => server.once("exit", resolve));
  server.kill("SIGTERM");
  if (await Promise.race([exited.then(() => true), delay(2_000).then(() => false)])) return;
  server.kill("SIGKILL");
  await exited;
}

function attachRuntimeGuards(page, errors) {
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });
  page.on("response", (response) => {
    if (new URL(response.url()).origin === BASE_URL && response.status() >= 400) {
      errors.push(`${response.status()} ${response.url()}`);
    }
  });
}

async function openDesk(page) {
  const response = await page.goto(DESK_URL, { waitUntil: "domcontentloaded" });
  assert.ok(response?.ok(), `Media Desk HTTP ${response?.status()}`);
  await page.locator(".media-desk").waitFor();
  await page.locator(".media-card").first().waitFor();
  await page.evaluate(() => document.fonts.ready);
}

async function waitForCardCountAbove(page, previousCount) {
  await page.waitForFunction(
    (count) => document.querySelectorAll(".media-card:not(.media-card--skeleton)").length > count,
    previousCount,
  );
}

async function representativeCardWidth(page) {
  return page.locator(".media-card:not(.media-card--skeleton)").first().evaluate((node) => node.getBoundingClientRect().width);
}

async function setView(page, label, expectedView) {
  await page.getByRole("button", { name: label, exact: true }).click();
  await page.waitForFunction((view) => document.querySelector(".media-desk")?.getAttribute("data-view") === view, expectedView);
  assert.ok(await page.locator(".media-card:not(.media-card--skeleton)").count() > 0, `${label} view must retain cards`);
}

async function resetSearch(page) {
  const search = page.getByLabel("Поиск по медиакаталогу");
  await search.fill("");
  await page.waitForFunction(() => document.querySelectorAll(".media-card:not(.media-card--skeleton)").length > 1);
}

async function auditDesktop(browser) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const errors = [];
  attachRuntimeGuards(page, errors);

  try {
    await openDesk(page);

    assert.equal(await page.locator(".media-desk").getAttribute("data-view"), "masonry", "Masonry must be default");
    assert.equal(await page.locator(".media-desk__pagination").count(), 0, "Legacy pagination container must be removed");
    assert.equal(await page.getByRole("button", { name: "Назад", exact: true }).count(), 0, "Legacy Previous button must be removed");
    assert.equal(await page.getByRole("button", { name: "Дальше", exact: true }).count(), 0, "Legacy Next button must be removed");

    const aspectRatios = await page.locator(".media-card:not(.media-card--skeleton) .media-card__preview").evaluateAll((nodes) =>
      nodes.slice(0, 12).map((node) => {
        const rect = node.getBoundingClientRect();
        return rect.height > 0 ? Number((rect.width / rect.height).toFixed(2)) : 0;
      }).filter(Boolean),
    );
    assert.ok(new Set(aspectRatios).size >= 2, `Masonry previews must preserve varying natural ratios: ${aspectRatios.join(", ")}`);

    const initialCount = await page.locator(".media-card:not(.media-card--skeleton)").count();
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await waitForCardCountAbove(page, initialCount);

    await setView(page, "Rows", "justified");
    await setView(page, "Grid", "grid");
    await setView(page, "Masonry", "masonry");

    await page.getByRole("button", { name: "S", exact: true }).click();
    await page.waitForFunction(() => document.querySelector(".media-desk")?.getAttribute("data-density") === "s");
    const smallWidth = await representativeCardWidth(page);
    await page.getByRole("button", { name: "XL", exact: true }).click();
    await page.waitForFunction(() => document.querySelector(".media-desk")?.getAttribute("data-density") === "xl");
    const xlWidth = await representativeCardWidth(page);
    assert.ok(Math.abs(xlWidth - smallWidth) >= 20, `Density must change card geometry (${smallWidth} -> ${xlWidth})`);

    const firstTitle = (await page.locator(".media-card:not(.media-card--skeleton) .media-card__title").first().textContent())?.trim();
    assert.ok(firstTitle, "A searchable card title is required");
    const beforeSearchCount = await page.locator(".media-card:not(.media-card--skeleton)").count();
    await page.getByLabel("Поиск по медиакаталогу").fill(firstTitle);
    await page.waitForFunction((title) => {
      const cards = [...document.querySelectorAll(".media-card:not(.media-card--skeleton) .media-card__title")];
      return cards.length > 0 && cards.every((node) => node.textContent?.toLocaleLowerCase().includes(String(title).toLocaleLowerCase()));
    }, firstTitle);
    const afterSearchCount = await page.locator(".media-card:not(.media-card--skeleton)").count();
    assert.ok(afterSearchCount <= beforeSearchCount, "Search must not increase result count");
    await resetSearch(page);

    const typeSelect = page.getByLabel("Тип медиа");
    const beforeFilterCount = await page.locator(".media-card:not(.media-card--skeleton)").count();
    await typeSelect.selectOption("image");
    await page.waitForFunction(() => [...document.querySelectorAll(".media-card__hover-meta")].every((node) => node.textContent?.includes("image")));
    const afterFilterCount = await page.locator(".media-card:not(.media-card--skeleton)").count();
    assert.ok(afterFilterCount > 0 && afterFilterCount <= beforeFilterCount, "Image filter must constrain visible results");

    const cards = page.locator(".media-card:not(.media-card--skeleton)");
    await cards.nth(0).click();
    assert.ok(await cards.nth(0).evaluate((node) => node.classList.contains("is-active")), "Click must activate asset");
    await cards.nth(0).click({ modifiers: ["Control"] });
    await cards.nth(1).click({ modifiers: ["Control"] });
    assert.ok(await cards.nth(0).evaluate((node) => node.classList.contains("is-selected")), "Ctrl click must select first asset");
    assert.ok(await cards.nth(1).evaluate((node) => node.classList.contains("is-selected")), "Ctrl click must select second asset");
    assert.match((await page.locator(".media-desk__status").textContent()) ?? "", /2 selected/, "Selection summary must update");

    assert.equal(await page.locator("#media-desk-inspector").count(), 1, "Inspector host must exist");

    await cards.nth(0).dblclick();
    await page.locator(".pswp").waitFor();
    assert.ok(await page.locator(".pswp").evaluate((node) => node.classList.contains("pswp--open")), "PhotoSwipe must open");
    if (await page.locator(".pswp__button--arrow--next").count()) {
      await page.locator(".pswp__button--arrow--next").click();
      await page.locator(".pswp").waitFor();
    }
    await page.keyboard.press("Escape");
    await page.waitForFunction(() => !document.querySelector(".pswp.pswp--open"));

    const focusable = await cards.nth(0).evaluate((node) => node.tabIndex >= 0);
    assert.equal(focusable, true, "Media cards must be keyboard focusable");
    await cards.nth(0).focus();
    await page.keyboard.press("Space");
    await page.locator(".pswp.pswp--open").waitFor();
    await page.keyboard.press("Escape");
    await page.waitForFunction(() => !document.querySelector(".pswp.pswp--open"));

    assert.deepEqual(errors, [], `Desktop Media Desk runtime errors:\n${errors.join("\n")}`);
  } finally {
    await context.close();
  }
}

async function auditMobile(browser) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  const errors = [];
  attachRuntimeGuards(page, errors);

  try {
    await openDesk(page);

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    assert.ok(overflow <= 2, `Mobile Media Desk horizontal overflow: ${overflow}px`);

    const cardRects = await page.locator(".media-card:not(.media-card--skeleton)").evaluateAll((nodes) => nodes.slice(0, 6).map((node) => node.getBoundingClientRect().width));
    assert.ok(cardRects.length > 0, "Mobile gallery must render media");
    assert.ok(Math.max(...cardRects) < 360, `Mobile cards must remain reasonably dense: ${cardRects.join(", ")}`);

    assert.equal(await page.getByLabel("Поиск по медиакаталогу").count(), 1, "Mobile search must remain available");
    assert.equal(await page.getByLabel("Тип медиа").count(), 1, "Mobile type control must remain available");
    const toolbarHeight = await page.locator(".media-desk__toolbar").evaluate((node) => node.getBoundingClientRect().height);
    assert.ok(toolbarHeight < 300, `Mobile toolbar must not consume most of viewport: ${toolbarHeight}px`);

    await setView(page, "Grid", "grid");
    await setView(page, "Masonry", "masonry");

    const firstCard = page.locator(".media-card:not(.media-card--skeleton)").first();
    await firstCard.dblclick();
    await page.locator(".pswp.pswp--open").waitFor();
    await page.keyboard.press("Escape");
    await page.waitForFunction(() => !document.querySelector(".pswp.pswp--open"));

    await firstCard.click();
    assert.equal(await page.locator("#media-desk-inspector").count(), 1, "Mobile Inspector host must remain mounted");
    const afterSelectOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    assert.ok(afterSelectOverflow <= 2, `Mobile selection/Inspector contract overflow: ${afterSelectOverflow}px`);

    assert.deepEqual(errors, [], `Mobile Media Desk runtime errors:\n${errors.join("\n")}`);
  } finally {
    await context.close();
  }
}

const server = spawn(process.execPath, [
  "node_modules/vite/bin/vite.js",
  "--host", HOST,
  "--port", String(PORT),
  "--strictPort",
], {
  stdio: ["ignore", "pipe", "pipe"],
  env: {
    ...process.env,
    CONTENT_DESK_WRITE: "1",
    VITE_CONTENT_DESK_WRITE: "1",
  },
});

let serverOutput = "";
server.stdout.on("data", (chunk) => { serverOutput += chunk.toString(); });
server.stderr.on("data", (chunk) => { serverOutput += chunk.toString(); });

let browser;
try {
  await waitForServer(server, () => serverOutput);
  browser = await chromium.launch({ headless: true });
  await auditDesktop(browser);
  await auditMobile(browser);
  console.log("[media-desk-browser-qa] desktop + mobile: OK");
} finally {
  await browser?.close();
  await stopServer(server);
}
