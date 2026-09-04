import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { chromium } from "playwright";

const HOST = "127.0.0.1";
const PORT = Number(process.env.MEDIA_DESK_E2E_PORT ?? 4174);
const BASE_URL = `http://${HOST}:${PORT}`;

async function waitForServer(server, output) {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    if (server.exitCode !== null) {
      throw new Error(`Vite dev exited with code ${server.exitCode}.\n${output()}`);
    }

    try {
      const response = await fetch(`${BASE_URL}/tools/media-desk/`);
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

  if (await Promise.race([
    exited.then(() => true),
    delay(2_000).then(() => false),
  ])) {
    return;
  }

  server.kill("SIGKILL");
  await exited;
}

function attachRuntimeGuards(page, errors) {
  page.on("pageerror", (error) => {
    errors.push(`pageerror: ${error.message}`);
  });

  page.on("console", (message) => {
    if (message.type() === "error") {
      errors.push(`console: ${message.text()}`);
    }
  });

  page.on("response", (response) => {
    if (
      new URL(response.url()).origin === BASE_URL &&
      response.status() >= 400
    ) {
      errors.push(`${response.status()} ${response.url()}`);
    }
  });
}

async function openDesk(page) {
  const response = await page.goto(
    `${BASE_URL}/tools/media-desk/`,
    { waitUntil: "domcontentloaded" },
  );

  assert.ok(response?.ok(), `Media Desk HTTP ${response?.status()}`);

  await page.locator("#media-desk .md-shell").waitFor();
  await page.locator("#media-desk .md-card:not(.md-card--skeleton)").first().waitFor();
  await page.evaluate(() => document.fonts.ready);
}

async function auditDesktop(browser) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();
  const errors = [];
  attachRuntimeGuards(page, errors);

  try {
    await openDesk(page);

    assert.equal(await page.locator("#media-desk .md-preview").count(), 1);
    assert.equal(await page.locator("#media-desk .md-center").count(), 1);
    assert.equal(await page.locator("#media-desk .md-properties").count(), 1);
    assert.equal(await page.locator("#media-desk-scroll").count(), 1);

    const layout = await page.evaluate(() => {
      const body = document.body;
      const scroll = document.querySelector("#media-desk-scroll");
      const preview = document.querySelector("#media-desk .md-preview");
      const properties = document.querySelector("#media-desk .md-properties");

      return {
        bodyOverflow: getComputedStyle(body).overflow,
        galleryOverflowY:
          scroll instanceof HTMLElement
            ? getComputedStyle(scroll).overflowY
            : "",
        previewTop:
          preview instanceof HTMLElement
            ? preview.getBoundingClientRect().top
            : null,
        propertiesTop:
          properties instanceof HTMLElement
            ? properties.getBoundingClientRect().top
            : null,
      };
    });

    assert.match(layout.bodyOverflow, /hidden/);
    assert.match(layout.galleryOverflowY, /auto|scroll/);

    const before = await page.evaluate(() => {
      const preview = document.querySelector("#media-desk .md-preview");
      const properties = document.querySelector("#media-desk .md-properties");
      const scroll = document.querySelector("#media-desk-scroll");

      return {
        previewTop: preview?.getBoundingClientRect().top ?? null,
        propertiesTop: properties?.getBoundingClientRect().top ?? null,
        scrollTop: scroll instanceof HTMLElement ? scroll.scrollTop : 0,
      };
    });

    await page.evaluate(() => {
      const scroll = document.querySelector("#media-desk-scroll");
      if (scroll instanceof HTMLElement) {
        scroll.scrollTop = Math.min(1000, scroll.scrollHeight);
      }
    });

    await page.waitForFunction(() => {
      const scroll = document.querySelector("#media-desk-scroll");
      return scroll instanceof HTMLElement && scroll.scrollTop > 0;
    });

    const after = await page.evaluate(() => {
      const preview = document.querySelector("#media-desk .md-preview");
      const properties = document.querySelector("#media-desk .md-properties");
      const scroll = document.querySelector("#media-desk-scroll");

      return {
        previewTop: preview?.getBoundingClientRect().top ?? null,
        propertiesTop: properties?.getBoundingClientRect().top ?? null,
        scrollTop: scroll instanceof HTMLElement ? scroll.scrollTop : 0,
      };
    });

    assert.ok(after.scrollTop > before.scrollTop, "gallery must own scrolling");
    assert.equal(after.previewTop, before.previewTop, "preview must stay stationary");
    assert.equal(
      after.propertiesTop,
      before.propertiesTop,
      "properties must stay stationary",
    );

    const firstCard = page.locator(
      "#media-desk .md-card:not(.md-card--skeleton)",
    ).first();

    await firstCard.click();

    const properties = page.locator(
      '#media-desk .md-properties[data-open="true"]',
    );
    await properties.waitFor();

    const editor = page.locator("#media-desk-inspector .md-editor");
    await editor.waitFor();

    assert.equal(
      await editor.getByRole("button", { name: "Сохранить", exact: true }).count(),
      1,
    );

    assert.equal(
      await editor.getByText("Подпись / описание", { exact: true }).count(),
      1,
    );
    assert.equal(
      await editor.getByText("Credits", { exact: true }).count(),
      1,
    );

    assert.deepEqual(
      errors,
      [],
      `Desktop Media Desk runtime errors:\n${errors.join("\n")}`,
    );
  } finally {
    await context.close();
  }
}

async function auditMobile(browser) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  const errors = [];
  attachRuntimeGuards(page, errors);

  try {
    await openDesk(page);

    assert.equal(
      await page.locator("#media-desk .md-preview:visible").count(),
      0,
      "mobile preview sidebar should be hidden",
    );

    const firstCard = page.locator(
      "#media-desk .md-card:not(.md-card--skeleton)",
    ).first();

    await firstCard.click();

    const properties = page.locator(
      '#media-desk .md-properties[data-open="true"]',
    );
    await properties.waitFor();

    const box = await properties.boundingBox();
    assert.ok(box, "mobile properties panel must have a box");
    assert.ok(box.width >= 380, "mobile properties panel must fill viewport width");
    assert.ok(box.height >= 830, "mobile properties panel must fill viewport height");

    await page.getByRole("button", { name: "← Галерея", exact: true }).click();
    await page.waitForFunction(
      () =>
        document.querySelector("#media-desk .md-properties")
          ?.getAttribute("data-open") === "false",
    );

    assert.deepEqual(
      errors,
      [],
      `Mobile Media Desk runtime errors:\n${errors.join("\n")}`,
    );
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
server.stdout.on("data", (chunk) => {
  serverOutput += chunk.toString();
});
server.stderr.on("data", (chunk) => {
  serverOutput += chunk.toString();
});

let browser;

try {
  await waitForServer(server, () => serverOutput);
  browser = await chromium.launch({ headless: true });
  await auditDesktop(browser);
  await auditMobile(browser);
  console.log("[media-desk-smoke] desktop + mobile: OK");
} finally {
  await browser?.close();
  await stopServer(server);
}
