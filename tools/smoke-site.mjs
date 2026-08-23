import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { chromium } from "playwright";

const HOST = "127.0.0.1";
const PORT = 4173;
const BASE_URL = `http://${HOST}:${PORT}`;
const VIEWPORTS = [
  { label: "phone-portrait", width: 390, height: 844, mobile: true },
  { label: "phone-landscape", width: 844, height: 390, mobile: true },
  { label: "grid-670", width: 670, height: 900, mobile: false },
  { label: "grid-705", width: 705, height: 900, mobile: false },
  { label: "grid-770", width: 770, height: 900, mobile: false },
  { label: "grid-805", width: 805, height: 900, mobile: false },
  { label: "grid-835", width: 835, height: 900, mobile: false },
  { label: "tablet", width: 1024, height: 768, mobile: false },
  { label: "desktop", width: 1280, height: 800, mobile: false },
  { label: "wide", width: 1440, height: 900, mobile: false },
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
server.stdout.on("data", (chunk) => {
  serverOutput += chunk.toString();
});
server.stderr.on("data", (chunk) => {
  serverOutput += chunk.toString();
});

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

async function revealProjectMedia(page) {
  return page.evaluate(() => {
    let count = 0;
    document.querySelectorAll(".project[hidden]").forEach((project) => {
      project.hidden = false;
      project.setAttribute("data-smoke-revealed", "");
      count += 1;
    });
    return count;
  });
}

async function scrollThroughPage(page) {
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(150);

  for (let step = 0; step < 90; step += 1) {
    const state = await page.evaluate(() => {
      const nextY = Math.min(
        window.scrollY + Math.max(window.innerHeight * 0.75, 280),
        document.documentElement.scrollHeight - window.innerHeight,
      );
      window.scrollTo(0, nextY);
      return {
        y: window.scrollY,
        maxY: document.documentElement.scrollHeight - window.innerHeight,
      };
    });
    await page.waitForTimeout(80);
    if (state.y >= state.maxY - 2) break;
  }

  await page.waitForLoadState("networkidle", { timeout: 8_000 }).catch(() => {});
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(150);
}

async function verifyPageShell(page, label) {
  const state = await page.evaluate(() => {
    const body = document.body;
    const bodyRect = body?.getBoundingClientRect();
    const visibleMedia = [...document.querySelectorAll("img, video, canvas")].filter((node) => {
      const rect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      return style.display !== "none" && style.visibility !== "hidden" && rect.width > 1 && rect.height > 1;
    }).length;

    return {
      title: document.title,
      textLength: body?.innerText?.replace(/\s+/g, " ").trim().length ?? 0,
      bodyHeight: bodyRect?.height ?? 0,
      visibleMedia,
    };
  });

  assert(state.bodyHeight > 100, `${label}: page body is effectively blank`);
  assert(
    state.textLength > 20 || state.visibleMedia > 0,
    `${label}: page has no meaningful visible text or media`,
  );
}

async function verifyNoDocumentOverflow(page, label) {
  const overflow = await page.evaluate(() => {
    const root = document.documentElement;
    const allowed = 1;
    const viewportWidth = root.clientWidth;
    const documentOverflow = root.scrollWidth - viewportWidth;

    const offenders = [...document.body.querySelectorAll("*")]
      .map((node) => {
        const rect = node.getBoundingClientRect();
        const style = getComputedStyle(node);
        if (style.display === "none" || style.visibility === "hidden") return null;
        if (rect.width <= 1 || rect.height <= 1) return null;
        if (style.position === "fixed") return null;
        if (rect.right <= viewportWidth + allowed && rect.left >= -allowed) return null;
        return {
          tag: node.tagName.toLowerCase(),
          className: typeof node.className === "string" ? node.className : "",
          width: Math.round(rect.width),
          left: Math.round(rect.left),
          right: Math.round(rect.right),
        };
      })
      .filter(Boolean)
      .slice(0, 12);

    return {
      viewportWidth,
      scrollWidth: root.scrollWidth,
      documentOverflow,
      offenders,
    };
  });

  assert(
    overflow.documentOverflow <= 1,
    `${label}: horizontal document overflow ${overflow.documentOverflow}px\n${JSON.stringify(overflow, null, 2)}`,
  );
}

async function verifyImages(page, label) {
  const failures = await page.evaluate(async () => {
    const visible = (node) => {
      const rect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      return style.display !== "none" && style.visibility !== "hidden" && rect.width > 1 && rect.height > 1;
    };

    const images = [...document.images].filter((image) => image.currentSrc || image.src).filter(visible);

    await Promise.all(
      images.map((image) => {
        if (image.complete) return null;
        image.loading = "eager";
        return new Promise((resolve) => {
          const done = () => {
            image.removeEventListener("load", done);
            image.removeEventListener("error", done);
            clearTimeout(timer);
            resolve(null);
          };
          const timer = setTimeout(done, 8_000);
          image.addEventListener("load", done, { once: true });
          image.addEventListener("error", done, { once: true });
        });
      }),
    );

    const results = [];
    for (const image of images) {
      if (!image.complete || image.naturalWidth < 1 || image.naturalHeight < 1) {
        results.push(`${image.currentSrc || image.src} (${image.naturalWidth}x${image.naturalHeight})`);
        continue;
      }

      try {
        await image.decode();
      } catch {
        results.push(`${image.currentSrc || image.src} (decode failed)`);
      }
    }

    return results;
  });

  assert(!failures.length, `${label}: image decode failures:\n${failures.slice(0, 20).join("\n")}`);
}

async function verifyVideos(page, label) {
  const failures = await page.evaluate(async () => {
    const videos = [...document.querySelectorAll("video")].filter((video) => video.currentSrc || video.src);

    const results = await Promise.all(
      videos.map(
        (video) =>
          new Promise((resolve) => {
            const src = video.currentSrc || video.src;
            if (video.error) return resolve(`${video.error.code} ${src}`);
            if (video.readyState >= HTMLMediaElement.HAVE_METADATA && video.videoWidth > 0 && video.videoHeight > 0) {
              return resolve(null);
            }

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
          }),
      ),
    );

    return results.filter(Boolean);
  });

  assert(!failures.length, `${label}: video metadata failures:\n${failures.join("\n")}`);
}

async function verifyCanvasHosts(page, label) {
  const failures = await page.evaluate(() => {
    return [...document.querySelectorAll("[data-animated-canvas-gallery]")]
      .map((node, index) => {
        const canvas = node.querySelector("canvas");
        const rect = canvas?.getBoundingClientRect();
        const state = node.getAttribute("data-gallery-state");
        if (state === "error") return `canvas ${index}: gallery state is error`;
        if (!canvas || !rect || rect.width <= 2 || rect.height <= 2) return `canvas ${index}: missing or zero CSS size`;
        if (canvas.width <= 2 || canvas.height <= 2) return `canvas ${index}: zero bitmap size`;
        return null;
      })
      .filter(Boolean);
  });

  assert(!failures.length, `${label}: canvas failures:\n${failures.join("\n")}`);
}

async function verifyLightbox(page, label) {
  const source = page.locator("[data-lightbox-source]:visible").first();
  if (!(await source.count())) return;

  await source.scrollIntoViewIfNeeded();
  await source.click({ force: true });
  await page.waitForTimeout(120);

  const open = await page.evaluate(() => document.querySelector("[data-media-lightbox]")?.open === true);
  assert(open, `${label}: lightbox did not open from first source`);

  const close = page.locator("[data-lightbox-close]").first();
  if (await close.count()) {
    await close.click({ force: true });
    await page.waitForTimeout(80);
  }
}

async function collectDuplicateMediaLoads(page) {
  return page.evaluate(() => {
    const counts = new Map();
    performance
      .getEntriesByType("resource")
      .filter((entry) => /\/media\//.test(entry.name))
      .forEach((entry) => {
        counts.set(entry.name, (counts.get(entry.name) ?? 0) + 1);
      });

    return [...counts.entries()]
      .filter(([, count]) => count > 4)
      .map(([url, count]) => ({ url, count }))
      .slice(0, 10);
  });
}

async function auditViewport(browser, viewport) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    isMobile: viewport.mobile,
    hasTouch: viewport.mobile,
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  const errors = [];
  const warnings = [];
  const label = `${viewport.label} ${viewport.width}x${viewport.height}`;

  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  page.on("requestfailed", (request) => {
    const errorText = request.failure()?.errorText || "request failed";
    if (errorText === "net::ERR_ABORTED") return;
    if (!isSameOrigin(request.url())) {
      warnings.push(`external requestfailed: ${errorText} ${request.url()}`);
      return;
    }
    errors.push(`requestfailed: ${errorText} ${request.url()}`);
  });
  page.on("response", (response) => {
    const status = response.status();
    const request = response.request();
    const resourceType = request.resourceType();
    if (status < 400) return;
    if (!["document", "stylesheet", "script", "image", "media", "font"].includes(resourceType)) return;
    if (!isSameOrigin(response.url())) {
      warnings.push(`external response ${status}: ${resourceType} ${response.url()}`);
      return;
    }
    errors.push(`response ${status}: ${resourceType} ${response.url()}`);
  });
  page.on("console", (message) => {
    if (message.text().startsWith("Failed to load resource:")) return;
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });

  try {
    await page.goto(BASE_URL, { waitUntil: "domcontentloaded", timeout: 30_000 });
    await page.evaluate(() => document.fonts?.ready);
    await page.waitForLoadState("networkidle", { timeout: 8_000 }).catch(() => {});
    const revealed = await revealProjectMedia(page);
    await scrollThroughPage(page);

    await verifyPageShell(page, label);
    await verifyNoDocumentOverflow(page, label);
    await verifyImages(page, label);
    await verifyVideos(page, label);
    await verifyCanvasHosts(page, label);
    await verifyLightbox(page, label);

    const duplicateLoads = await collectDuplicateMediaLoads(page);
    if (duplicateLoads.length) {
      warnings.push(`${label}: duplicate media resource entries ${JSON.stringify(duplicateLoads)}`);
    }

    assert(!errors.length, `${label}: browser errors:\n${errors.join("\n")}`);
    console.log(`[smoke] ${label}: OK (${revealed} hidden projects revealed)`);
    return warnings;
  } finally {
    await context.close();
  }
}

let browser;
const allWarnings = [];

try {
  await waitForServer();
  browser = await chromium.launch({ headless: true });

  for (const viewport of VIEWPORTS) {
    allWarnings.push(...(await auditViewport(browser, viewport)));
  }

  allWarnings.forEach((warning) => console.warn(`[smoke] warning: ${warning}`));
  console.log(`Browser smoke OK: ${VIEWPORTS.length} viewports, media decode, video metadata, canvas health, lightbox, overflow`);
} finally {
  await browser?.close();
  server.kill("SIGTERM");
}
