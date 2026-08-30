import { isDirectExecution, withE2ERuntime } from "./e2e/runtime.mjs";

function assert(condition, message) { if (!condition) throw new Error(message); }

async function verifyVideoRuntime(page) {
  await page.route("https://www.youtube-nocookie.com/**", (route) => route.fulfill({
    status: 200,
    contentType: "text/html; charset=utf-8",
    body: "<!doctype html><title>blog video smoke fixture</title>",
  }));

  await page.evaluate(() => {
    const fixture = document.createElement("figure");
    fixture.setAttribute("data-blog-video", "");
    fixture.setAttribute("data-blog-video-id", "dQw4w9WgXcQ");
    fixture.setAttribute("data-blog-video-title", "Blog video smoke fixture");
    fixture.innerHTML = `
      <div data-blog-video-media></div>
      <button type="button" data-blog-video-trigger>Play smoke video</button>
      <a href="https://www.youtube.com/watch?v=dQw4w9WgXcQ">Open on YouTube</a>
    `;
    document.body.append(fixture);
  });

  const fixture = page.locator("[data-blog-video]").last();
  assert(await fixture.locator("iframe").count() === 0, "blog video iframe must not exist before activation");
  await fixture.locator("[data-blog-video-trigger]").click();

  const videoState = await fixture.evaluate((node) => {
    const iframe = node.querySelector("iframe");
    return {
      loaded: node.getAttribute("data-blog-video-loaded"),
      iframeCount: node.querySelectorAll("iframe").length,
      src: iframe?.getAttribute("src") ?? "",
      title: iframe?.getAttribute("title") ?? "",
      allow: iframe?.getAttribute("allow") ?? "",
      allowFullscreen: iframe instanceof HTMLIFrameElement ? iframe.allowFullscreen : false,
      referrerPolicy: iframe instanceof HTMLIFrameElement ? iframe.referrerPolicy : "",
      fallbackHref: node.querySelector("a[href]")?.getAttribute("href") ?? "",
    };
  });

  assert(videoState.loaded === "true", "blog video did not enter loaded state");
  assert(videoState.iframeCount === 1, `blog video expected one iframe, got ${videoState.iframeCount}`);
  assert(videoState.src === "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1", `wrong blog video src ${videoState.src}`);
  assert(videoState.title === "Blog video smoke fixture", `wrong blog video title ${videoState.title}`);
  assert(videoState.allow.includes("autoplay"), "blog video iframe does not allow autoplay after explicit activation");
  assert(videoState.allowFullscreen, "blog video iframe does not allow fullscreen");
  assert(videoState.referrerPolicy === "strict-origin-when-cross-origin", `wrong video referrer policy ${videoState.referrerPolicy}`);
  assert(videoState.fallbackHref === "https://www.youtube.com/watch?v=dQw4w9WgXcQ", "blog video fallback link disappeared after activation");
}

async function auditIndex(browser, baseUrl, width, height) {
  const context = await browser.newContext({ viewport: { width, height } });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  page.on("console", (message) => { if (message.type() === "error") errors.push(`console: ${message.text()}`); });
  try {
    const response = await page.goto(`${baseUrl}/blog/`, { waitUntil: "networkidle", timeout: 30_000 });
    assert(response?.ok(), `/blog/ returned ${response?.status()}`);
    await page.evaluate(() => document.fonts?.ready);
    const state = await page.evaluate(() => ({
      pageType: document.body.dataset.pageType,
      pageId: document.body.dataset.pageId,
      h1Count: document.querySelectorAll("h1").length,
      heading: document.querySelector("h1")?.textContent?.trim(),
      canonical: document.querySelector('link[rel="canonical"]')?.getAttribute("href"),
      hasIndex: Boolean(document.querySelector("[data-blog-index]")),
      hasSearch: Boolean(document.querySelector("[data-blog-search-input]")),
      hasFilters: document.querySelectorAll("[data-blog-filter-kind]").length,
      blogCurrent: Boolean(document.querySelector('.site-nav__menu-link[href="/blog/"][aria-current="page"]')),
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    }));
    assert(state.pageType === "blog-index", `wrong page type ${state.pageType}`);
    assert(state.pageId === "blog", `wrong page id ${state.pageId}`);
    assert(state.h1Count === 1 && state.heading === "блог", "blog index must have one named h1");
    assert(state.canonical === "https://www.looksawful.ru/blog/", `wrong canonical ${state.canonical}`);
    assert(state.hasIndex && state.hasSearch && state.hasFilters === 5, "blog progressive-enhancement controls missing");
    assert(state.blogCurrent, "blog menu item is not current");
    assert(state.overflow <= 1, `horizontal overflow ${state.overflow}px`);

    await page.locator('[data-blog-filter-kind="tool"]').click();
    assert(new URL(page.url()).searchParams.get("type") === "tool", "filter did not sync URL state");
    await page.locator("[data-blog-search-input]").fill("css");
    assert(new URL(page.url()).searchParams.get("q") === "css", "search did not sync URL state");

    await verifyVideoRuntime(page);
    assert(errors.length === 0, errors.join("\n"));
    console.log(`[smoke-blog] /blog/ ${width}x${height}: OK`);
  } finally { await context.close(); }
}

export async function runSmokeBlog({ browser, baseUrl }) {
  await auditIndex(browser, baseUrl, 390, 844);
  await auditIndex(browser, baseUrl, 1440, 900);
  const context = await browser.newContext();
  try {
    const response = await context.request.get(`${baseUrl}/blog/definitely-not-authored/`);
    assert(response.status() === 404, `draft/unknown blog route must be absent, got ${response.status()}`);
  } finally { await context.close(); }
}

if (isDirectExecution(import.meta.url)) await withE2ERuntime(({ browser, baseUrl }) => runSmokeBlog({ browser, baseUrl }));
