import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { chromium } from "playwright";

const HOST = "127.0.0.1";
const PORT = 4173;
const BASE_URL = `http://${HOST}:${PORT}`;
const server = spawn(process.execPath, ["node_modules/vite/bin/vite.js", "preview", "--host", HOST, "--port", String(PORT), "--strictPort"], { stdio: ["ignore", "pipe", "pipe"] });
let serverOutput = "";
server.stdout.on("data", (chunk) => { serverOutput += chunk.toString(); });
server.stderr.on("data", (chunk) => { serverOutput += chunk.toString(); });

async function waitForServer() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(BASE_URL, { redirect: "follow" });
      if (response.ok) return;
    } catch {}
    await delay(250);
  }
  throw new Error(`Vite preview did not start.\n${serverOutput}`);
}
function assert(condition, message) { if (!condition) throw new Error(message); }

async function verifyVideoUrls(context, page) {
  const urls = await page.evaluate(() => {
    const values = new Set();
    document.querySelectorAll("video").forEach((media) => {
      const src = media.currentSrc || media.getAttribute("src") || "";
      if (src) values.add(new URL(src, location.href).href);
      if (media.poster) values.add(new URL(media.poster, location.href).href);
    });
    return [...values];
  });
  const failures = [];
  for (const url of urls) {
    const response = await context.request.get(url, { headers: { Range: "bytes=0-0" }, timeout: 20_000, failOnStatusCode: false });
    if (![200, 206].includes(response.status())) failures.push(`${response.status()} ${url}`);
  }
  assert(!failures.length, `Broken video/poster URLs:\n${failures.join("\n")}`);
}

async function verifyCaptions(page, mobile) {
  const state = await page.evaluate(() => {
    const owners = [...document.querySelectorAll("figure.media, figure.before-after")].filter((owner) => owner.querySelector(":scope > .media__caption, :scope > figcaption.media__caption"));
    return {
      legacy: document.querySelectorAll("[data-caption], [data-caption-rest]").length,
      missingView: owners.filter((owner) => !owner.hasAttribute("data-caption-view")).length,
      focusableOverlayOwners: document.querySelectorAll('[data-caption-view="overlay"][tabindex]').length,
      overlays: document.querySelectorAll('[data-caption-view="overlay"]').length,
      lightboxSources: document.querySelectorAll("[data-lightbox-source]").length,
    };
  });
  assert(state.legacy === 0, `Legacy caption attributes remain: ${state.legacy}`);
  assert(state.missingView === 0, `Caption owners without data-caption-view: ${state.missingView}`);
  assert(state.focusableOverlayOwners === 0, `Overlay figures still create duplicate tab stops: ${state.focusableOverlayOwners}`);
  assert(state.overlays > 0, "No overlay captions were discovered");
  assert(state.lightboxSources > 0, "No lightbox sources were marked");

  const summary = page.locator('[data-caption-view="summary"]:has(.media__text, .media__meta)').first();
  if (await summary.count()) {
    const before = await summary.evaluate((node) => node.getBoundingClientRect().height);
    await summary.hover({ force: true });
    await page.waitForTimeout(200);
    const after = await summary.evaluate((node) => node.getBoundingClientRect().height);
    assert(Math.abs(before - after) < 0.5, `Summary caption changed layout: ${before} -> ${after}`);
  }

  if (!mobile) {
    const source = page.locator('figure.media:has(.media__title) [data-lightbox-source]').first();
    if (await source.count()) {
      await source.click({ force: true });
      await page.waitForTimeout(100);
      const structure = await page.evaluate(() => ({
        open: document.querySelector("[data-media-lightbox]")?.open === true,
        title: Boolean(document.querySelector("[data-lightbox-caption] .media__title")),
        flattened: document.querySelector("[data-lightbox-caption]")?.children.length === 0,
      }));
      assert(structure.open, "Lightbox did not open");
      assert(structure.title, "Lightbox caption lost structured title markup");
      assert(!structure.flattened, "Lightbox caption was flattened to textContent");
      await page.locator("[data-lightbox-close]").click();
    }
  }
}

async function verifyCanvasAndVideo(page) {
  await page.evaluate(() => document.querySelectorAll(".project[hidden]").forEach((project) => { project.hidden = false; }));
  await page.waitForTimeout(1200);
  const canvasHosts = page.locator("[data-animated-canvas-gallery]");
  const canvasCount = await canvasHosts.count();
  for (let index = 0; index < canvasCount; index += 1) {
    const host = canvasHosts.nth(index);
    await host.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);
    const result = await host.evaluate((node) => {
      const canvas = node.querySelector("canvas");
      const rect = canvas?.getBoundingClientRect();
      return { state: node.getAttribute("data-gallery-state"), width: canvas?.width ?? 0, height: canvas?.height ?? 0, cssWidth: rect?.width ?? 0, cssHeight: rect?.height ?? 0 };
    });
    assert(result.state !== "error", `Canvas gallery ${index} entered error state`);
    assert(result.cssWidth > 2 && result.cssHeight > 2, `Canvas gallery ${index} has zero CSS size`);
    assert(result.width > 2 && result.height > 2, `Canvas gallery ${index} has stale bitmap size`);
  }

  const videoFailures = await page.evaluate(async () => {
    const videos = [...document.querySelectorAll("video[src]")];
    const results = await Promise.all(videos.map((video) => new Promise((resolve) => {
      const src = video.currentSrc || video.src;
      if (video.error) return resolve(`${video.error.code} ${src}`);
      if (video.readyState >= HTMLMediaElement.HAVE_METADATA) return resolve(null);
      const done = (value) => { video.removeEventListener("loadedmetadata", ok); video.removeEventListener("error", fail); clearTimeout(timer); resolve(value); };
      const ok = () => done(null);
      const fail = () => done(`${video.error?.code ?? "error"} ${src}`);
      const timer = setTimeout(() => done(`timeout ${src}`), 12_000);
      video.addEventListener("loadedmetadata", ok, { once: true });
      video.addEventListener("error", fail, { once: true });
      video.preload = "metadata";
      video.load();
    })));
    return results.filter(Boolean);
  });
  assert(!videoFailures.length, `Videos failed metadata load:\n${videoFailures.join("\n")}`);
}

async function auditContext(browser, { mobile }) {
  const context = await browser.newContext({ viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 }, isMobile: mobile, hasTouch: mobile });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  page.on("requestfailed", (request) => errors.push(`requestfailed: ${request.failure()?.errorText || "request failed"} ${request.url()}`));
  page.on("console", (message) => { if (message.type() === "error") errors.push(`console: ${message.text()}`); });
  await page.goto(BASE_URL, { waitUntil: "domcontentloaded", timeout: 30_000 });
  await page.waitForTimeout(800);
  await verifyCaptions(page, mobile);
  if (!mobile) {
    await verifyCanvasAndVideo(page);
    await verifyVideoUrls(context, page);
  }
  assert(!errors.length, `Browser errors (${mobile ? "mobile" : "desktop"}):\n${errors.join("\n")}`);
  await context.close();
}

let browser;
try {
  await waitForServer();
  browser = await chromium.launch({ headless: true });
  await auditContext(browser, { mobile: false });
  await auditContext(browser, { mobile: true });
  console.log("Browser smoke OK: captions, lightbox, canvases, videos, media URLs");
} finally {
  await browser?.close();
  server.kill("SIGTERM");
}
