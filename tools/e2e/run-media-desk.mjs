import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { chromium } from "playwright";

const HOST = "127.0.0.1";
const PORT = Number(process.env.MEDIA_DESK_E2E_PORT ?? 4174);
const BASE_URL = `http://${HOST}:${PORT}`;

async function waitForServer(server, output) {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    if (server.exitCode !== null) throw new Error(`Vite dev exited with code ${server.exitCode}.\n${output()}`);
    try {
      const response = await fetch(`${BASE_URL}/tools/media-desk/`);
      if (response.ok) return;
    } catch {}
    await delay(250);
  }
  throw new Error(`Content Desk dev server did not become ready.\n${output()}`);
}

async function stopServer(server) {
  if (server.exitCode !== null) return;
  const exited = new Promise((resolve) => server.once("exit", resolve));
  server.kill("SIGTERM");
  if (await Promise.race([exited.then(() => true), delay(2_000).then(() => false)])) return;
  server.kill("SIGKILL");
  await exited;
}

async function auditViewport(browser, viewport) {
  const context = await browser.newContext({ viewport, isMobile: viewport.width < 600, hasTouch: viewport.width < 600 });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("response", (response) => {
    if (new URL(response.url()).origin === BASE_URL && response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
  });
  try {
    const response = await page.goto(`${BASE_URL}/tools/media-desk/`, { waitUntil: "networkidle" });
    assert.ok(response?.ok(), `Content Desk HTTP ${response?.status()}`);
    assert.equal(await page.locator("h1").textContent(), "Content Desk");
    assert.equal(await page.locator(".content-desk__tab").count(), 2, "Content Desk must expose Media and Text tabs");
    assert.ok(await page.locator(".media-card").count() > 0, "Media view must render catalog cards");
    assert.ok(await page.locator(".media-desk__summary").textContent(), "Media summary must render");

    const search = page.getByLabel("Поиск по медиакаталогу");
    await search.fill("jestei-13-source-01-16x9");
    await page.getByLabel("Тип медиа").selectOption("video");
    await page.waitForFunction(() => document.querySelectorAll(".media-card").length === 1);
    assert.equal(await page.locator(".media-card").count(), 1);

    await page.locator(".media-card").click();
    const dialog = page.locator("dialog[open]");
    await dialog.waitFor();
    assert.equal(await dialog.locator("video").count(), 1, "video detail must use controlled playback");
    assert.match(await dialog.locator(".media-desk__details").textContent(), /jestei-13-source-01-16x9/);
    assert.equal(await dialog.locator(".content-desk__media-form").count(), 1, "Media detail must expose editorial editing");
    assert.equal(await dialog.getByRole("button", { name: "Сохранить metadata" }).count(), 1);
    await page.getByRole("button", { name: "Закрыть" }).click();

    await page.goto(`${BASE_URL}/tools/media-desk/?view=text`, { waitUntil: "networkidle" });
    assert.equal(await page.locator("h1").textContent(), "Content Desk");
    assert.ok(await page.locator(".content-desk__text-card").count() > 0, "Text view must render CMS-owned text fields");
    assert.equal(await page.getByLabel("Поиск по текстам сайта").count(), 1);
    await page.getByLabel("Поиск по текстам сайта").fill("jestei");
    assert.ok(await page.locator(".content-desk__text-card").count() > 0, "Text search must keep matching entries");

    assert.ok(
      await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth <= 1),
      `${viewport.width}px Content Desk document overflow`,
    );
    assert.deepEqual(errors, [], "Content Desk browser/resource errors");
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
  await auditViewport(browser, { width: 1440, height: 900 });
  await auditViewport(browser, { width: 390, height: 844 });
  console.log("[content-desk-smoke] desktop + mobile: OK");
} finally {
  await browser?.close();
  await stopServer(server);
}
