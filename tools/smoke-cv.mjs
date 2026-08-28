import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { chromium } from "playwright";

const HOST = "127.0.0.1";
const PORT = 4174;
const BASE_URL = `http://${HOST}:${PORT}`;
const VIEWPORTS = [
  { label: "phone", width: 390, height: 844 },
  { label: "tablet", width: 1024, height: 768 },
  { label: "desktop", width: 1440, height: 900 },
];

const server = spawn(
  process.execPath,
  [
    "node_modules/vite/bin/vite.js",
    "preview",
    "--host",
    HOST,
    "--port",
    String(PORT),
    "--strictPort",
  ],
  { stdio: ["ignore", "pipe", "pipe"] },
);

let serverOutput = "";
server.stdout.on("data", (chunk) => { serverOutput += chunk.toString(); });
server.stderr.on("data", (chunk) => { serverOutput += chunk.toString(); });

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function waitForServer() {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const response = await fetch(`${BASE_URL}/cv/`, { redirect: "follow" });
      if (response.ok) return;
    } catch {}
    await delay(250);
  }
  throw new Error(`Vite preview did not start.\n${serverOutput}`);
}

async function auditViewport(browser, viewport) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  const errors = [];
  const label = `${viewport.label} ${viewport.width}x${viewport.height}`;

  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });
  page.on("response", (response) => {
    if (response.status() < 400) return;
    const url = new URL(response.url());
    if (url.origin !== BASE_URL) return;
    errors.push(`response ${response.status()}: ${response.url()}`);
  });

  try {
    const response = await page.goto(`${BASE_URL}/cv/`, {
      waitUntil: "domcontentloaded",
      timeout: 30_000,
    });
    assert(response?.ok(), `${label}: /cv/ returned ${response?.status()}`);

    await page.evaluate(() => document.fonts?.ready);
    await page.waitForLoadState("networkidle", { timeout: 5_000 }).catch(() => {});

    const state = await page.evaluate(async () => {
      const root = document.documentElement;
      const resume = document.querySelector(".resume");
      const nav = document.querySelector(".resume-nav");
      const back = document.querySelector(".resume-nav__back");
      const portrait = document.querySelector(".portrait");

      if (portrait instanceof HTMLImageElement) {
        if (!portrait.complete) {
          await new Promise((resolve) => {
            portrait.addEventListener("load", resolve, { once: true });
            portrait.addEventListener("error", resolve, { once: true });
            setTimeout(resolve, 5_000);
          });
        }
        try { await portrait.decode(); } catch {}
      }

      return {
        title: document.title,
        bodyBackground: getComputedStyle(document.body).backgroundColor,
        resumeFont: resume instanceof HTMLElement ? getComputedStyle(resume).fontFamily : "",
        navVisible: nav instanceof HTMLElement && getComputedStyle(nav).display !== "none",
        backHref: back instanceof HTMLAnchorElement ? back.getAttribute("href") : null,
        portraitWidth: portrait instanceof HTMLImageElement ? portrait.naturalWidth : 0,
        portraitHeight: portrait instanceof HTMLImageElement ? portrait.naturalHeight : 0,
        overflow: root.scrollWidth - root.clientWidth,
        hiddenCards: document.querySelectorAll(".experience-card[hidden]").length,
        visibleTextLength: document.body.innerText.replace(/\s+/g, " ").trim().length,
        scriptCount: document.scripts.length,
      };
    });

    assert(state.title.includes("Иван Крушинский"), `${label}: unexpected page title`);
    assert(state.visibleTextLength > 1_000, `${label}: CV content is effectively missing`);
    assert(state.bodyBackground === "rgb(255, 255, 255)", `${label}: page is not pure white`);
    assert(/Arial/i.test(state.resumeFont), `${label}: CV typography changed: ${state.resumeFont}`);
    assert(state.navVisible, `${label}: back navigation is hidden`);
    assert(state.backHref === "/", `${label}: back navigation does not point to /`);
    assert(state.portraitWidth > 0 && state.portraitHeight > 0, `${label}: portrait failed to decode`);
    assert(state.overflow <= 1, `${label}: horizontal document overflow ${state.overflow}px`);
    assert(state.hiddenCards > 0, `${label}: authored hidden experience entries disappeared`);
    assert(state.scriptCount === 0, `${label}: standalone CV unexpectedly loads JavaScript`);
    assert(!errors.length, `${label}: browser errors:\n${errors.join("\n")}`);

    console.log(`[cv-smoke] ${label}: OK`);
  } finally {
    await context.close();
  }
}

let browser;
try {
  await waitForServer();
  browser = await chromium.launch({ headless: true });
  for (const viewport of VIEWPORTS) {
    await auditViewport(browser, viewport);
  }
  console.log(`CV browser smoke OK: ${VIEWPORTS.length} viewports`);
} finally {
  await browser?.close();
  server.kill("SIGTERM");
}
