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

async function verifyTextEndpoint() {
  const response = await fetch(`${BASE_URL}/__media-desk/texts`);
  const source = await response.text();
  assert.ok(response.ok, `Content Desk text endpoint HTTP ${response.status}: ${source.slice(0, 500)}`);
  const payload = JSON.parse(source);
  assert.equal(payload.ok, true, `Content Desk text endpoint returned error: ${source.slice(0, 500)}`);
  assert.ok(Array.isArray(payload.entries) && payload.entries.length > 0, "Content Desk text endpoint must return entries");
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

async function openContentDesk(page, path) {
  const response = await page.goto(`${BASE_URL}${path}`, { waitUntil: "domcontentloaded" });
  assert.ok(response?.ok(), `Content Desk HTTP ${response?.status()}`);
  await page.locator("h1").waitFor();
  await page.evaluate(() => document.fonts.ready);
}

async function waitForMediaWorkspace(page) {
  await page.waitForFunction(() => document.querySelectorAll(".content-desk__tab").length === 2);
  await page.locator(".media-card:not(.media-card--skeleton)").first().waitFor();
}

async function activateCardByKeyboard(page, card) {
  await card.focus();
  await page.keyboard.press("Enter");
}

async function auditDesktop(browser) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const errors = [];
  attachRuntimeGuards(page, errors);

  try {
    await openContentDesk(page, "/tools/media-desk/");
    await waitForMediaWorkspace(page);
    assert.equal(await page.locator("h1").textContent(), "Content Desk");
    assert.equal(await page.locator(".content-desk__tab").count(), 2, "Media and Text tabs must be available");
    assert.equal(await page.locator(".media-desk__pagination").count(), 0, "Legacy pagination must stay removed");

    const firstCard = page.locator(".media-card:not(.media-card--skeleton)").first();
    await activateCardByKeyboard(page, firstCard);
    const inspector = page.locator("#media-desk-inspector[data-open=\"true\"]");
    await inspector.waitFor();
    assert.equal(await inspector.locator(".content-desk__media-form").count(), 1, "Persistent Inspector must expose metadata form");
    assert.equal(await inspector.getByRole("button", { name: "Сохранить", exact: true }).count(), 1);

    await firstCard.focus();
    await page.keyboard.press("Space");
    await page.locator(".pswp.pswp--open").waitFor();
    await page.keyboard.press("Escape");
    await page.waitForFunction(() => !document.querySelector(".pswp.pswp--open"));

    await openContentDesk(page, "/tools/media-desk/?view=text");
    await page.locator(".text-desk").waitFor();
    await page.locator(".text-desk__result").first().waitFor();
    assert.equal(await page.locator("h1").textContent(), "Content Desk");
    assert.equal(await page.locator(".content-desk__media-form").count(), 0, "Text view must not bootstrap media editor");
    assert.equal(await page.locator(".content-desk__text-card").count(), 0, "Legacy text cards must stay removed");
    assert.equal(await page.locator(".text-desk__search").count(), 1);
    await page.locator(".text-desk__search").fill("jestei");
    await page.waitForFunction(() => document.querySelectorAll(".text-desk__result").length > 0);
    await page.locator(".text-desk__result").first().click();
    assert.equal(await page.locator(".text-desk__editor").count(), 1, "Text result must open editable detail");

    assert.ok(
      await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth <= 2),
      "Desktop Content Desk must not overflow horizontally",
    );
    assert.deepEqual(errors, [], `Desktop Content Desk runtime errors:\n${errors.join("\n")}`);
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
    await openContentDesk(page, "/tools/media-desk/");
    await waitForMediaWorkspace(page);
    const firstCard = page.locator(".media-card:not(.media-card--skeleton)").first();
    await activateCardByKeyboard(page, firstCard);
    const inspector = page.locator("#media-desk-inspector[data-open=\"true\"]");
    await inspector.waitFor();
    assert.equal(await inspector.locator(".content-desk__media-form").count(), 1, "Mobile Inspector must open full-screen");
    await inspector.getByRole("button", { name: "Закрыть", exact: true }).click();
    await page.waitForFunction(() => !document.querySelector("#media-desk-inspector[data-open=\"true\"]"));

    await openContentDesk(page, "/tools/media-desk/?view=text");
    const result = page.locator(".text-desk__result").first();
    await result.waitFor();
    await result.click();
    await page.locator(".text-desk.text-desk--detail-open").waitFor();
    await page.getByRole("button", { name: "Назад", exact: true }).click();
    await page.waitForFunction(() => !document.querySelector(".text-desk.text-desk--detail-open"));
    assert.equal(await page.locator(".text-desk__editor").count(), 0, "Mobile Back must remove detail editor from DOM");

    assert.ok(
      await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth <= 2),
      "Mobile Content Desk must not overflow horizontally",
    );
    assert.deepEqual(errors, [], `Mobile Content Desk runtime errors:\n${errors.join("\n")}`);
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
  await verifyTextEndpoint();
  browser = await chromium.launch({ headless: true });
  await auditDesktop(browser);
  await auditMobile(browser);
  console.log("[content-desk-smoke] assembled desktop + mobile: OK");
} finally {
  await browser?.close();
  await stopServer(server);
}
