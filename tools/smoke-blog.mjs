import { isDirectExecution, withE2ERuntime } from "./e2e/runtime.mjs";

function assert(condition, message) { if (!condition) throw new Error(message); }

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
