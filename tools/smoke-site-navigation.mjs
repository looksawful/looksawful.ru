import navigationJson from "../src/content/navigation.json" with { type: "json" };
import { isDirectExecution, withE2ERuntime } from "./e2e/runtime.mjs";

let BASE_URL = "";

const labelById = new Map(navigationJson.map(({ id, label }) => [id, label]));
const requireLabel = (id) => {
  const label = labelById.get(id);
  if (typeof label !== "string" || label.length === 0) {
    throw new Error(`missing navigation label ${id}`);
  }
  return label;
};

const PRIMARY_LINKS = [
  ["home", "/"],
  ["case:jestei-pool", "/work/jestei-pool/"],
  ["case:styx", "/work/styx/"],
  ["case:sensetique", "/work/sensetique/"],
  ["collection:music-photography", "/shootings/"],
  ["cv", "/cv/"],
].map(([id, href]) => [requireLabel(id), href]);

const LONG_UNBROKEN_LABEL = `CMS${"navigationlabel".repeat(32)}`;

const CASES = [
  ["/", requireLabel("home"), 390, 844],
  ["/work/jestei-pool/", requireLabel("case:jestei-pool"), 390, 844],
  ["/work/styx/", requireLabel("case:styx"), 390, 844],
  ["/work/sensetique/", requireLabel("case:sensetique"), 390, 844],
  ["/shootings/", requireLabel("collection:music-photography"), 390, 844],
  ["/work/jestei-pool/", requireLabel("case:jestei-pool"), 1440, 900],
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function auditNavigation(browser, path, currentLabel, width, height) {
  const mobile = width <= 844;
  const context = await browser.newContext({
    viewport: { width, height },
    isMobile: mobile,
    hasTouch: mobile,
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  const label = `${path} ${width}x${height}`;

  try {
    await page.goto(`${BASE_URL}${path}`, { waitUntil: "domcontentloaded", timeout: 30_000 });
    await page.evaluate(() => document.fonts?.ready);

    const initial = await page.evaluate(() => {
      const toggle = document.querySelector("[data-site-menu-toggle]");
      const menu = document.querySelector("[data-site-menu]");
      const root = document.documentElement;
      return {
        toggleVisible: toggle instanceof HTMLElement && toggle.getBoundingClientRect().width >= 44,
        expanded: toggle?.getAttribute("aria-expanded") || "",
        menuHidden: menu instanceof HTMLElement ? menu.hidden : null,
        overflow: root.scrollWidth - root.clientWidth,
      };
    });

    assert(initial.toggleVisible, `${label}: hamburger is missing or below 44px hit target`);
    assert(initial.expanded === "false", `${label}: menu must start collapsed`);
    assert(initial.menuHidden === true, `${label}: menu must start hidden`);
    assert(initial.overflow <= 1, `${label}: initial horizontal overflow ${initial.overflow}px`);

    const toggle = page.locator("[data-site-menu-toggle]");
    await toggle.click();

    const opened = await page.evaluate(({ primaryLinks, current }) => {
      const toggle = document.querySelector("[data-site-menu-toggle]");
      const menu = document.querySelector("[data-site-menu]");
      const links = [...document.querySelectorAll(".site-nav__menu-link")].map((link) => [
        link.textContent?.trim() || "",
        link.getAttribute("href") || "",
      ]);
      const currentLink = document.querySelector('.site-nav__menu-link[aria-current="page"]');
      const menuRect = menu instanceof HTMLElement ? menu.getBoundingClientRect() : null;
      return {
        expanded: toggle?.getAttribute("aria-expanded") || "",
        menuHidden: menu instanceof HTMLElement ? menu.hidden : null,
        bodyOverflow: document.body.style.overflow,
        links,
        currentLabel: currentLink?.textContent?.trim() || "",
        menuCoversViewport: Boolean(menuRect && menuRect.width >= innerWidth - 1 && menuRect.bottom >= innerHeight - 1),
        expected: primaryLinks,
        current,
      };
    }, { primaryLinks: PRIMARY_LINKS, current: currentLabel });

    assert(opened.expanded === "true", `${label}: hamburger did not expand`);
    assert(opened.menuHidden === false, `${label}: menu stayed hidden after click`);
    assert(opened.bodyOverflow === "hidden", `${label}: page scroll was not locked`);
    assert(opened.menuCoversViewport, `${label}: menu does not cover the available viewport`);
    assert(JSON.stringify(opened.links) === JSON.stringify(PRIMARY_LINKS), `${label}: primary menu destinations differ`);
    assert(opened.currentLabel === currentLabel, `${label}: wrong active menu item ${opened.currentLabel}`);

    const openMenuOverflowWithLongLabel = await page.evaluate((longLabel) => {
      const menu = document.querySelector("[data-site-menu]");
      const editableLink = document.querySelector('.site-nav__menu-link:not([aria-current="page"])');
      if (!(menu instanceof HTMLElement) || !(editableLink instanceof HTMLElement)) {
        return null;
      }
      editableLink.textContent = longLabel;
      return new Promise((resolve) => {
        requestAnimationFrame(() => {
          resolve(menu.scrollWidth - menu.clientWidth);
        });
      });
    }, LONG_UNBROKEN_LABEL);
    assert(
      typeof openMenuOverflowWithLongLabel === "number" && openMenuOverflowWithLongLabel <= 1,
      `${label}: open menu horizontal overflow with long CMS label ${openMenuOverflowWithLongLabel}px`,
    );

    if (path !== "/") {
      const breadcrumb = await page.locator('[aria-label="Хлебные крошки"]').innerText();
      assert(
        breadcrumb.includes(requireLabel("home")) && breadcrumb.includes(currentLabel),
        `${label}: breadcrumb is incomplete: ${breadcrumb}`,
      );
    }

    await page.keyboard.press("Escape");

    const closed = await page.evaluate(() => {
      const toggle = document.querySelector("[data-site-menu-toggle]");
      const menu = document.querySelector("[data-site-menu]");
      return {
        expanded: toggle?.getAttribute("aria-expanded") || "",
        menuHidden: menu instanceof HTMLElement ? menu.hidden : null,
        bodyOverflow: document.body.style.overflow,
        focusReturned: document.activeElement === toggle,
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      };
    });

    assert(closed.expanded === "false", `${label}: Escape did not collapse menu`);
    assert(closed.menuHidden === true, `${label}: Escape did not hide menu`);
    assert(closed.bodyOverflow !== "hidden", `${label}: scroll lock was not restored`);
    assert(closed.focusReturned, `${label}: focus did not return to hamburger`);
    assert(closed.overflow <= 1, `${label}: horizontal overflow after close ${closed.overflow}px`);

    console.log(`[smoke-navigation] ${label}: OK`);
  } finally {
    await context.close();
  }
}

export async function runSmokeNavigation({ browser, baseUrl }) {
  BASE_URL = baseUrl;
  for (const [path, currentLabel, width, height] of CASES) {
    await auditNavigation(browser, path, currentLabel, width, height);
  }
  console.log(`[smoke-navigation] OK: ${CASES.length} responsive navigation checks`);
}

if (isDirectExecution(import.meta.url)) {
  await withE2ERuntime(({ browser, baseUrl }) => runSmokeNavigation({ browser, baseUrl }));
}
