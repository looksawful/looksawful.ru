import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { chromium } from "playwright";

const HOST = "127.0.0.1";
const PORT = 4174;
const BASE_URL = `http://${HOST}:${PORT}`;
const PAGE_FLIP_SRC = "https://unpkg.com/page-flip@2.0.7/dist/js/page-flip.browser.js";
const PAGE_FLIP_LIBRARY_FIXTURE = `
window.St = window.St || {};
window.St.PageFlip = class SmokePageFlip {
  constructor(book) { this.book = book; this.events = new Map(); this.index = 0; this.pages = []; }
  on(name, callback) { const callbacks = this.events.get(name) || []; callbacks.push(callback); this.events.set(name, callbacks); }
  emit(name, event) { (this.events.get(name) || []).forEach((callback) => callback(event)); }
  loadFromHTML(pages) { this.pages = [...pages]; this.emit("init", { data: this.book?.getBoundingClientRect?.().width <= 800 ? "portrait" : "landscape" }); }
  getCurrentPageIndex() { return this.index; }
  getPageCount() { return this.pages.length; }
  flipPrev() { this.index = Math.max(0, this.index - 1); this.emit("flip", { data: this.index }); }
  flipNext() { this.index = Math.min(Math.max(0, this.pages.length - 1), this.index + 1); this.emit("flip", { data: this.index }); }
  destroy() {}
};
`;

const ROUTES = [
  {
    path: "/work/jestei-pool/",
    pageType: "case",
    pageId: "case:jestei-pool",
    entityId: "jestei-pool",
    articleId: "project-jestei",
    forbiddenArticleIds: ["project-styx", "project-sensetique", "project-shootings"],
    viewports: [[390, 844], [1024, 768], [1440, 900], [1920, 1080]],
  },
  {
    path: "/work/styx/",
    pageType: "case",
    pageId: "case:styx",
    entityId: "styx",
    articleId: "project-styx",
    forbiddenArticleIds: ["project-jestei", "project-sensetique", "project-shootings"],
    viewports: [[390, 844], [1024, 768], [1440, 900]],
  },
  {
    path: "/work/sensetique/",
    pageType: "case",
    pageId: "case:sensetique",
    entityId: "sensetique",
    articleId: "project-sensetique",
    forbiddenArticleIds: ["project-jestei", "project-styx", "project-shootings"],
    viewports: [[390, 844], [1024, 768], [1440, 900]],
  },
  {
    path: "/shootings/",
    pageType: "collection",
    pageId: "collection:music-photography",
    entityId: "music-photography",
    articleId: "project-shootings",
    forbiddenArticleIds: ["project-jestei", "project-styx", "project-sensetique"],
    viewports: [[390, 844], [1440, 900]],
  },
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function isSameOrigin(url) {
  try {
    return new URL(url).origin === BASE_URL;
  } catch {
    return false;
  }
}

const server = spawn(
  process.execPath,
  ["node_modules/vite/bin/vite.js", "preview", "--host", HOST, "--port", String(PORT), "--strictPort"],
  { stdio: ["ignore", "pipe", "pipe"] },
);
let serverOutput = "";
server.stdout.on("data", (chunk) => { serverOutput += chunk.toString(); });
server.stderr.on("data", (chunk) => { serverOutput += chunk.toString(); });

async function waitForServer() {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const response = await fetch(BASE_URL, { redirect: "follow" });
      if (response.ok) return;
    } catch {}
    await delay(250);
  }
  throw new Error(`Vite preview did not start.\n${serverOutput}`);
}

async function scrollThroughPage(page) {
  await page.evaluate(() => window.scrollTo(0, 0));
  for (let step = 0; step < 90; step += 1) {
    const done = await page.evaluate(() => {
      const maxY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      window.scrollTo(0, Math.min(window.scrollY + Math.max(window.innerHeight * 0.8, 320), maxY));
      return window.scrollY >= maxY - 2;
    });
    await page.waitForTimeout(60);
    if (done) break;
  }
  await page.waitForLoadState("networkidle", { timeout: 8_000 }).catch(() => {});
  await page.evaluate(() => window.scrollTo(0, 0));
}

async function verifyDocument(page, route, label) {
  const state = await page.evaluate(({ expected }) => {
    const root = document.documentElement;
    const h1 = [...document.querySelectorAll("h1")];
    const article = document.getElementById(expected.articleId);
    const canonical = document.querySelector('link[rel="canonical"]')?.getAttribute("href") || "";
    return {
      bodyHeight: document.body.getBoundingClientRect().height,
      textLength: document.body.innerText.replace(/\s+/g, " ").trim().length,
      h1Count: h1.length,
      h1Text: h1[0]?.textContent?.replace(/\s+/g, " ").trim() || "",
      articleExists: article instanceof HTMLElement,
      pageType: document.body.dataset.pageType,
      pageId: document.body.dataset.pageId,
      entityId: document.body.dataset.entityId,
      canonical,
      overflow: root.scrollWidth - root.clientWidth,
      forbidden: expected.forbiddenArticleIds.filter((id) => document.getElementById(id)),
    };
  }, { expected: route });

  assert(state.bodyHeight > 100, `${label}: document is effectively blank`);
  assert(state.textLength > 20, `${label}: document has no meaningful text`);
  assert(state.h1Count === 1, `${label}: expected exactly one light-DOM h1, got ${state.h1Count}`);
  assert(state.h1Text.length > 0, `${label}: h1 is empty`);
  assert(state.articleExists, `${label}: missing ${route.articleId}`);
  assert(state.pageType === route.pageType, `${label}: wrong data-page-type ${state.pageType}`);
  assert(state.pageId === route.pageId, `${label}: wrong data-page-id ${state.pageId}`);
  assert(state.entityId === route.entityId, `${label}: wrong data-entity-id ${state.entityId}`);
  assert(state.canonical === `https://www.looksawful.ru${route.path}`, `${label}: wrong canonical ${state.canonical}`);
  assert(state.overflow <= 1, `${label}: horizontal document overflow ${state.overflow}px`);
  assert(state.forbidden.length === 0, `${label}: unrelated project DOM present: ${state.forbidden.join(", ")}`);
}

async function verifyImages(page, label) {
  const failures = await page.evaluate(async () => {
    const visible = (node) => {
      const rect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      return !node.closest("[hidden]") && style.display !== "none" && style.visibility !== "hidden" && rect.width > 1 && rect.height > 1;
    };
    const images = [...document.images].filter(visible);
    await Promise.all(images.map(async (image) => {
      if (!image.complete) {
        await new Promise((resolve) => {
          const done = () => resolve(null);
          image.addEventListener("load", done, { once: true });
          image.addEventListener("error", done, { once: true });
          setTimeout(done, 8_000);
        });
      }
    }));
    const failures = [];
    for (const image of images) {
      if (!image.complete || image.naturalWidth < 1 || image.naturalHeight < 1) {
        failures.push(`${image.currentSrc || image.src} (${image.naturalWidth}x${image.naturalHeight})`);
        continue;
      }
      try { await image.decode(); } catch { failures.push(`${image.currentSrc || image.src} (decode failed)`); }
    }
    return failures;
  });
  assert(failures.length === 0, `${label}: image failures\n${failures.slice(0, 20).join("\n")}`);
}

async function verifyVideos(page, label) {
  const failures = await page.evaluate(async () => {
    const videos = [...document.querySelectorAll("video")];
    return (await Promise.all(videos.map((video) => new Promise((resolve) => {
      const src = video.currentSrc || video.src || video.querySelector("source[src]")?.getAttribute("src") || "";
      if (!src) return resolve(null);
      if (video.error) return resolve(`${video.error.code} ${src}`);
      if (video.readyState >= HTMLMediaElement.HAVE_METADATA && video.videoWidth > 0 && video.videoHeight > 0) return resolve(null);
      const done = (value) => {
        video.removeEventListener("loadedmetadata", ok);
        video.removeEventListener("error", fail);
        clearTimeout(timer);
        resolve(value);
      };
      const ok = () => done(video.videoWidth > 0 && video.videoHeight > 0 ? null : `zero metadata ${src}`);
      const fail = () => done(`${video.error?.code ?? "error"} ${src}`);
      const timer = setTimeout(() => done(`timeout ${src}`), 12_000);
      video.addEventListener("loadedmetadata", ok, { once: true });
      video.addEventListener("error", fail, { once: true });
      video.preload = "metadata";
      video.load();
    })))).filter(Boolean);
  });
  assert(failures.length === 0, `${label}: video failures\n${failures.join("\n")}`);
}

async function verifyLightbox(page, label) {
  const source = page.locator("[data-lightbox-source]:visible").first();
  if (!(await source.count())) return;

  await source.scrollIntoViewIfNeeded();
  await source.click({ force: true });
  await page.waitForFunction(() => {
    const dialog = document.querySelector("[data-media-lightbox]");
    return Boolean(document.querySelector(".pswp")) || (dialog instanceof HTMLDialogElement && dialog.open);
  }, null, { timeout: 3_000 }).catch(() => {});

  const opened = await page.evaluate(() => {
    const dialog = document.querySelector("[data-media-lightbox]");
    return Boolean(document.querySelector(".pswp")) || (dialog instanceof HTMLDialogElement && dialog.open);
  });
  assert(opened, `${label}: standalone lightbox did not open`);

  await page.keyboard.press("Escape");
  await page.waitForTimeout(150);
  const closed = await page.evaluate(() => {
    const dialog = document.querySelector("[data-media-lightbox]");
    return !document.querySelector(".pswp") && !(dialog instanceof HTMLDialogElement && dialog.open);
  });
  assert(closed, `${label}: standalone lightbox did not close with Escape`);
}

async function verifyBeforeAfter(page, label) {
  const root = page.locator("[data-before-after]").first();
  if (!(await root.count())) return;
  await root.scrollIntoViewIfNeeded();

  const result = await root.evaluate((node) => {
    const range = node.querySelector(".before-after__range");
    if (!(range instanceof HTMLInputElement)) return { supported: false };
    const previous = range.value;
    range.value = "37";
    range.dispatchEvent(new Event("input", { bubbles: true }));
    const applied = node.style.getPropertyValue("--before-after-split").trim();
    range.value = previous;
    range.dispatchEvent(new Event("input", { bubbles: true }));
    return { supported: true, applied };
  });

  assert(result.supported, `${label}: before/after range is missing`);
  assert(result.applied === "37%", `${label}: before/after input did not update split (${result.applied})`);
}

async function verifyPageFlip(page, label) {
  const root = page.locator("[data-page-flip]").first();
  if (!(await root.count())) return;
  await root.scrollIntoViewIfNeeded();
  await page.waitForTimeout(350);

  const before = await root.evaluate((node) => ({
    state: node.getAttribute("data-page-flip-state") || "",
    count: node.querySelector("[data-page-flip-count]")?.textContent?.trim() || "",
    nextDisabled: node.querySelector("[data-page-flip-next]") instanceof HTMLButtonElement
      ? node.querySelector("[data-page-flip-next]").disabled
      : null,
  }));
  assert(before.state !== "error", `${label}: page flip entered error state`);
  assert(before.count.length > 0, `${label}: page flip count was not initialized`);

  const next = root.locator("[data-page-flip-next]");
  assert(await next.count(), `${label}: page flip next button is missing`);
  if (!before.nextDisabled) {
    await next.click({ force: true });
    await page.waitForTimeout(100);
    const afterCount = await root.locator("[data-page-flip-count]").textContent();
    assert(afterCount?.trim() && afterCount.trim() !== before.count, `${label}: page flip next did not advance`);
  }
}

async function auditRoute(browser, route, width, height) {
  const mobile = width <= 844;
  const context = await browser.newContext({
    viewport: { width, height },
    isMobile: mobile,
    hasTouch: mobile,
    deviceScaleFactor: 1,
  });
  await context.route(PAGE_FLIP_SRC, (request) => request.fulfill({ status: 200, contentType: "text/javascript; charset=utf-8", body: PAGE_FLIP_LIBRARY_FIXTURE }));
  const page = await context.newPage();
  const errors = [];
  const label = `${route.path} ${width}x${height}`;

  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error" && !message.text().startsWith("Failed to load resource:")) errors.push(`console: ${message.text()}`);
  });
  page.on("requestfailed", (request) => {
    const errorText = request.failure()?.errorText || "request failed";
    if (errorText !== "net::ERR_ABORTED" && isSameOrigin(request.url())) errors.push(`requestfailed: ${errorText} ${request.url()}`);
  });
  page.on("response", (response) => {
    if (response.status() >= 400 && isSameOrigin(response.url())) {
      const type = response.request().resourceType();
      if (["document", "stylesheet", "script", "image", "media", "font"].includes(type)) {
        errors.push(`response ${response.status()}: ${type} ${response.url()}`);
      }
    }
  });

  try {
    await page.goto(`${BASE_URL}${route.path}`, { waitUntil: "domcontentloaded", timeout: 30_000 });
    await page.evaluate(() => document.fonts?.ready);
    await page.waitForLoadState("networkidle", { timeout: 8_000 }).catch(() => {});
    await verifyDocument(page, route, label);
    await scrollThroughPage(page);
    await verifyDocument(page, route, label);
    await verifyImages(page, label);
    await verifyVideos(page, label);

    if (width === 1440) {
      await verifyLightbox(page, label);
      await verifyBeforeAfter(page, label);
      await verifyPageFlip(page, label);
    }

    await page.reload({ waitUntil: "domcontentloaded", timeout: 30_000 });
    await page.evaluate(() => document.fonts?.ready);
    await verifyDocument(page, route, `${label} reload`);

    assert(errors.length === 0, `${label}: browser errors\n${errors.join("\n")}`);
    console.log(`[smoke-mpa] ${label}: OK`);
  } finally {
    await context.close();
  }
}

async function auditReducedMotion(browser) {
  const route = ROUTES[0];
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 1,
    reducedMotion: "reduce",
  });
  const page = await context.newPage();

  try {
    await page.goto(`${BASE_URL}${route.path}`, { waitUntil: "domcontentloaded", timeout: 30_000 });
    await page.evaluate(() => document.fonts?.ready);
    await page.waitForTimeout(150);
    const hidden = await page.evaluate(() => [...document.querySelectorAll("[data-reveal]")]
      .filter((node) => {
        if (!(node instanceof HTMLElement) || node.closest("[hidden]")) return false;
        const style = getComputedStyle(node);
        const rect = node.getBoundingClientRect();
        if (rect.width <= 1 || rect.height <= 1) return false;
        return style.visibility === "hidden" || Number(style.opacity) < 0.05;
      })
      .slice(0, 12)
      .map((node) => ({ className: node.className, reveal: node.getAttribute("data-reveal") })));
    assert(hidden.length === 0, `standalone reduced-motion left reveal targets hidden\n${JSON.stringify(hidden, null, 2)}`);
    console.log("[smoke-mpa] reduced-motion standalone route: OK");
  } finally {
    await context.close();
  }
}

let browser;
try {
  await waitForServer();
  browser = await chromium.launch({ headless: true });
  for (const route of ROUTES) {
    for (const [width, height] of route.viewports) {
      await auditRoute(browser, route, width, height);
    }
  }
  await auditReducedMotion(browser);
  console.log(`[smoke-mpa] OK: ${ROUTES.length} standalone routes with direct reload, isolation, metadata, overflow, media, lightbox, page-flip, before/after and reduced-motion checks`);
} finally {
  await browser?.close();
  server.kill("SIGTERM");
}
