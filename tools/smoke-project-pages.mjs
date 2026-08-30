import { isDirectExecution, withE2ERuntime } from "./e2e/runtime.mjs";

let BASE_URL = "";
const ROUTES = [
  {
    path: "/work/awful-cases/",
    pageId: "project:awful-cases",
    entityId: "awful-cases",
    articleId: "project-awful-cases",
    requiredSelector: ".awful-cases-game",
  },
  {
    path: "/work/moves-awful/",
    pageId: "project:moves-awful",
    entityId: "moves-awful",
    articleId: "project-moves-awful",
    requiredSelector: "[data-animated-canvas-gallery]",
  },
  {
    path: "/work/berry-social-content-2020/",
    pageId: "project:berry-social-content-2020",
    entityId: "berry-social-content-2020",
    articleId: "project-berry-social-content-2020",
    requiredSelector: ".mockup",
  },
];
const VIEWPORTS = [
  { width: 390, height: 844 },
  { width: 1440, height: 900 },
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

async function verifyProjectPage(page, route, label) {
  const state = await page.evaluate(({ expected }) => {
    const root = document.documentElement;
    const article = document.getElementById(expected.articleId);
    const h1s = [...document.querySelectorAll("h1")];
    const robots = document.querySelector('meta[name="robots"]')?.getAttribute("content") || "";
    return {
      articleExists: article instanceof HTMLElement,
      articleHidden: article instanceof HTMLElement ? article.hidden : null,
      pageType: document.body.dataset.pageType,
      pageId: document.body.dataset.pageId,
      entityId: document.body.dataset.entityId,
      h1Count: h1s.length,
      h1Text: h1s[0]?.textContent?.replace(/\s+/g, " ").trim() || "",
      robots,
      requiredExists: Boolean(document.querySelector(expected.requiredSelector)),
      overflow: root.scrollWidth - root.clientWidth,
      textLength: document.body.innerText.replace(/\s+/g, " ").trim().length,
    };
  }, { expected: route });

  assert(state.articleExists, `${label}: missing ${route.articleId}`);
  assert(state.articleHidden === false, `${label}: standalone Project article is still hidden`);
  assert(state.pageType === "project", `${label}: wrong data-page-type ${state.pageType}`);
  assert(state.pageId === route.pageId, `${label}: wrong data-page-id ${state.pageId}`);
  assert(state.entityId === route.entityId, `${label}: wrong data-entity-id ${state.entityId}`);
  assert(state.h1Count === 1, `${label}: expected one h1, got ${state.h1Count}`);
  assert(state.h1Text.length > 0, `${label}: empty h1`);
  assert(state.robots === "noindex,nofollow", `${label}: wrong robots ${state.robots}`);
  assert(state.requiredExists, `${label}: missing project-specific surface ${route.requiredSelector}`);
  assert(state.overflow <= 1, `${label}: horizontal document overflow ${state.overflow}px`);
  assert(state.textLength > 20, `${label}: page is effectively blank`);
}

async function verifyProjectRuntime(page, route, label) {
  if (route.entityId !== "moves-awful") return;

  const gallery = page.locator("[data-animated-canvas-gallery]").first();
  assert(await gallery.count(), `${label}: Moves canvas gallery is missing`);
  await gallery.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);

  const state = await gallery.evaluate((node) => {
    const canvas = node.querySelector("canvas");
    const rect = canvas?.getBoundingClientRect();
    return {
      galleryState: node.getAttribute("data-gallery-state") || "",
      cssWidth: rect?.width ?? 0,
      cssHeight: rect?.height ?? 0,
      bitmapWidth: canvas instanceof HTMLCanvasElement ? canvas.width : 0,
      bitmapHeight: canvas instanceof HTMLCanvasElement ? canvas.height : 0,
    };
  });

  assert(state.galleryState !== "error", `${label}: Moves canvas gallery entered error state`);
  assert(state.cssWidth > 2 && state.cssHeight > 2, `${label}: Moves canvas has zero CSS size\n${JSON.stringify(state)}`);
  assert(state.bitmapWidth > 2 && state.bitmapHeight > 2, `${label}: Moves canvas has zero bitmap size\n${JSON.stringify(state)}`);
}

async function audit(browser, route, viewport) {
  const context = await browser.newContext({
    viewport,
    isMobile: viewport.width <= 844,
    hasTouch: viewport.width <= 844,
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  const errors = [];
  const label = `${route.path} ${viewport.width}x${viewport.height}`;

  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error" && !message.text().startsWith("Failed to load resource:")) {
      errors.push(`console: ${message.text()}`);
    }
  });
  page.on("requestfailed", (request) => {
    const errorText = request.failure()?.errorText || "request failed";
    if (errorText !== "net::ERR_ABORTED" && isSameOrigin(request.url())) {
      errors.push(`requestfailed: ${errorText} ${request.url()}`);
    }
  });
  page.on("response", (response) => {
    if (response.status() < 400 || !isSameOrigin(response.url())) return;
    const type = response.request().resourceType();
    if (["document", "stylesheet", "script", "image", "media", "font"].includes(type)) {
      errors.push(`response ${response.status()}: ${type} ${response.url()}`);
    }
  });

  try {
    await page.goto(`${BASE_URL}${route.path}`, { waitUntil: "domcontentloaded", timeout: 30_000 });
    await page.evaluate(() => document.fonts?.ready);
    await page.waitForLoadState("networkidle", { timeout: 8_000 }).catch(() => {});
    await verifyProjectPage(page, route, label);
    await verifyProjectRuntime(page, route, label);

    await page.reload({ waitUntil: "domcontentloaded", timeout: 30_000 });
    await page.evaluate(() => document.fonts?.ready);
    await verifyProjectPage(page, route, `${label} reload`);

    assert(errors.length === 0, `${label}: browser errors\n${errors.join("\n")}`);
    console.log(`[smoke-project-pages] ${label}: OK`);
  } finally {
    await context.close();
  }
}

export async function runSmokeProjectPages({ browser, baseUrl }) {
  BASE_URL = baseUrl;
  for (const route of ROUTES) {
    for (const viewport of VIEWPORTS) {
      await audit(browser, route, viewport);
    }
  }
  console.log(`[smoke-project-pages] OK: ${ROUTES.length} unlisted Project routes with runtime health`);
}

if (isDirectExecution(import.meta.url)) {
  await withE2ERuntime(({ browser, baseUrl }) => runSmokeProjectPages({ browser, baseUrl }));
}
