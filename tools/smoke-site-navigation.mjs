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
      const face = document.querySelector("[data-awfulface]");
      const preview = document.querySelector("[data-menu-preview]");
      const root = document.documentElement;
      return {
        toggleVisible: toggle instanceof HTMLElement && toggle.getBoundingClientRect().width >= 44,
        expanded: toggle?.getAttribute("aria-expanded") || "",
        menuHidden: menu instanceof HTMLElement ? menu.hidden : null,
        facePresent: face instanceof SVGElement,
        previewPresent: preview instanceof HTMLElement,
        oldBrandPresent: Boolean(document.querySelector(".site-nav__brand, .site-nav__toggle-icon")),
        overflow: root.scrollWidth - root.clientWidth,
      };
    });

    assert(initial.toggleVisible, `${label}: menu control is missing or below 44px hit target`);
    assert(initial.expanded === "false", `${label}: menu must start collapsed`);
    assert(initial.menuHidden === true, `${label}: menu must start hidden`);
    assert(initial.facePresent, `${label}: Awfulface control is missing`);
    assert(initial.previewPresent, `${label}: shared menu preview is missing`);
    assert(!initial.oldBrandPresent, `${label}: old brand/hamburger markup is still rendered`);
    assert(initial.overflow <= 1, `${label}: initial horizontal overflow ${initial.overflow}px`);

    if (path !== "/") {
      const breadcrumb = await page.locator('[aria-label="Хлебные крошки"]').innerText();
      assert(breadcrumb.includes(currentLabel), `${label}: breadcrumb is missing current label: ${breadcrumb}`);
      if (!mobile) {
        assert(breadcrumb.includes(requireLabel("home")), `${label}: desktop breadcrumb is missing home label: ${breadcrumb}`);
      }
    }

    if (mobile) {
      const neutralEyes = await page.evaluate(() => {
        const left = document.querySelector("[data-awfulface-eye-left]");
        const right = document.querySelector("[data-awfulface-eye-right]");
        return {
          left: left instanceof SVGElement ? getComputedStyle(left).transform : "",
          right: right instanceof SVGElement ? getComputedStyle(right).transform : "",
        };
      });
      await page.mouse.move(Math.max(1, width - 24), Math.max(1, height - 24));
      await page.waitForTimeout(100);
      const afterPointerMove = await page.evaluate(() => {
        const left = document.querySelector("[data-awfulface-eye-left]");
        const right = document.querySelector("[data-awfulface-eye-right]");
        return {
          left: left instanceof SVGElement ? getComputedStyle(left).transform : "",
          right: right instanceof SVGElement ? getComputedStyle(right).transform : "",
        };
      });
      assert(
        afterPointerMove.left === neutralEyes.left && afterPointerMove.right === neutralEyes.right,
        `${label}: coarse/mobile Awfulface eyes moved even though eye tracking must stay disabled`,
      );
    }

    const toggle = page.locator("[data-site-menu-toggle]");
    await toggle.click();

    const opened = await page.evaluate(({ primaryLinks, current, mobileViewport }) => {
      const siteNav = document.querySelector(".site-nav");
      const toggle = document.querySelector("[data-site-menu-toggle]");
      const menu = document.querySelector("[data-site-menu]");
      const bar = document.querySelector(".site-nav__bar");
      const navContext = document.querySelector(".site-nav__context, .site-nav__breadcrumbs");
      const main = document.querySelector("main");
      const preview = document.querySelector("[data-menu-preview]");
      const faceBackground = document.querySelector(".awfulface__background");
      const firstMenuLink = document.querySelector(".site-nav__menu-link");
      const links = [...document.querySelectorAll(".site-nav__menu-link")].map((link) => [
        link.textContent?.trim() || "",
        link.getAttribute("href") || "",
      ]);
      const currentLink = document.querySelector('.site-nav__menu-link[aria-current="page"]');
      const menuRect = menu instanceof HTMLElement ? menu.getBoundingClientRect() : null;
      const barRect = bar instanceof HTMLElement ? bar.getBoundingClientRect() : null;
      const navRect = siteNav instanceof HTMLElement ? siteNav.getBoundingClientRect() : null;
      const toggleRect = toggle instanceof HTMLElement ? toggle.getBoundingClientRect() : null;
      const menuLinkStyle = firstMenuLink instanceof HTMLElement ? getComputedStyle(firstMenuLink) : null;
      const barStyle = bar instanceof HTMLElement ? getComputedStyle(bar) : null;
      const contextStyle = navContext instanceof HTMLElement ? getComputedStyle(navContext) : null;
      const toggleStyle = toggle instanceof HTMLElement ? getComputedStyle(toggle) : null;
      const faceBackgroundStyle = faceBackground instanceof SVGElement ? getComputedStyle(faceBackground) : null;
      return {
        expanded: toggle?.getAttribute("aria-expanded") || "",
        menuHidden: menu instanceof HTMLElement ? menu.hidden : null,
        bodyOverflow: document.body.style.overflow,
        mainInert: main instanceof HTMLElement ? main.inert : null,
        links,
        currentLabel: currentLink?.textContent?.trim() || "",
        menuCoversViewport: Boolean(
          menuRect
          && menuRect.top <= 1
          && menuRect.width >= innerWidth - 1
          && menuRect.bottom >= innerHeight - 1
        ),
        barBackground: barStyle?.backgroundColor || "",
        barHeight: barRect?.height ?? null,
        navHeight: navRect?.height ?? null,
        contextDisplay: contextStyle?.display || "",
        togglePosition: toggleStyle?.position || "",
        toggleFloatsInViewport: Boolean(
          toggleRect
          && toggleRect.width >= 44
          && toggleRect.height >= 44
          && toggleRect.top >= -1
          && toggleRect.right <= innerWidth + 1
        ),
        faceBackgroundFill: faceBackgroundStyle?.fill || "",
        menuTextAlign: menuLinkStyle?.textAlign || "",
        menuJustifyContent: menuLinkStyle?.justifyContent || "",
        mobilePreviewHidden: mobileViewport && preview instanceof HTMLElement ? preview.hidden : null,
        expected: primaryLinks,
        current,
      };
    }, { primaryLinks: PRIMARY_LINKS, current: currentLabel, mobileViewport: mobile });

    assert(opened.expanded === "true", `${label}: menu control did not expand`);
    assert(opened.menuHidden === false, `${label}: menu stayed hidden after click`);
    assert(opened.bodyOverflow === "hidden", `${label}: page scroll was not locked`);
    assert(opened.mainInert === true, `${label}: main content was not made inert`);
    assert(opened.menuCoversViewport, `${label}: menu does not form one continuous fullscreen surface`);
    assert(
      opened.barBackground === "rgba(0, 0, 0, 0)" || opened.barBackground === "transparent",
      `${label}: open menu header still paints a detached strip (${opened.barBackground})`,
    );
    assert(typeof opened.barHeight === "number" && opened.barHeight <= 1, `${label}: open header band still occupies ${opened.barHeight}px`);
    assert(typeof opened.navHeight === "number" && opened.navHeight <= 1, `${label}: open site-nav still reserves ${opened.navHeight}px`);
    assert(opened.contextDisplay === "none", `${label}: breadcrumb/context remains in the open header band (${opened.contextDisplay})`);
    assert(opened.togglePosition === "fixed", `${label}: Awfulface is still positioned as part of the header row (${opened.togglePosition})`);
    assert(opened.toggleFloatsInViewport, `${label}: floating Awfulface control left the usable viewport`);
    assert(opened.faceBackgroundFill === "none", `${label}: Awfulface backing disc is still visible (${opened.faceBackgroundFill})`);
    assert(JSON.stringify(opened.links) === JSON.stringify(PRIMARY_LINKS), `${label}: primary menu destinations differ`);
    assert(opened.currentLabel === currentLabel, `${label}: wrong active menu item ${opened.currentLabel}`);
    if (mobile) {
      assert(opened.mobilePreviewHidden === true, `${label}: coarse/mobile preview should stay hidden`);
      assert(opened.menuTextAlign === "center", `${label}: mobile menu labels must stay centered`);
      assert(opened.menuJustifyContent === "center", `${label}: mobile menu label flex alignment must stay centered`);
    } else {
      assert(
        opened.menuTextAlign === "start" || opened.menuTextAlign === "left",
        `${label}: desktop menu labels must align from the start edge (${opened.menuTextAlign})`,
      );
      assert(opened.menuJustifyContent === "flex-start", `${label}: desktop menu labels are still centered`);
    }

    if (!mobile) {
      await page.keyboard.press("Tab");
      const previewOnFocus = await page.evaluate(() => {
        const preview = document.querySelector("[data-menu-preview]");
        return preview instanceof HTMLElement
          && preview.dataset.visible === "true"
          && !preview.hidden;
      });
      assert(!previewOnFocus, `${label}: keyboard focus must not show a hover-only preview`);
      await page.keyboard.press("Shift+Tab");

      const previewLink = page.locator('.site-nav__menu-link:not([aria-current="page"])').first();
      await previewLink.hover();
      await page.waitForFunction(() => {
        const preview = document.querySelector("[data-menu-preview]");
        const image = document.querySelector("[data-menu-preview-image]");
        return preview instanceof HTMLElement
          && preview.dataset.visible === "true"
          && !preview.hidden
          && image instanceof HTMLImageElement
          && Boolean(image.getAttribute("src"));
      });

      const desktopPreview = await page.evaluate(() => {
        const preview = document.querySelector("[data-menu-preview]");
        const image = document.querySelector("[data-menu-preview-image]");
        return {
          visible: preview instanceof HTMLElement && preview.dataset.visible === "true" && !preview.hidden,
          src: image instanceof HTMLImageElement ? image.getAttribute("src") || "" : "",
        };
      });
      assert(desktopPreview.visible, `${label}: fine-pointer hover preview did not become visible`);
      assert(desktopPreview.src.startsWith("/media/"), `${label}: preview source is not site media: ${desktopPreview.src}`);
      await page.mouse.move(width - 4, height - 4);
    }

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

    await page.keyboard.press("Escape");

    const closed = await page.evaluate(() => {
      const toggle = document.querySelector("[data-site-menu-toggle]");
      const menu = document.querySelector("[data-site-menu]");
      const bar = document.querySelector(".site-nav__bar");
      const navContext = document.querySelector(".site-nav__context, .site-nav__breadcrumbs");
      const main = document.querySelector("main");
      const barRect = bar instanceof HTMLElement ? bar.getBoundingClientRect() : null;
      const contextStyle = navContext instanceof HTMLElement ? getComputedStyle(navContext) : null;
      const toggleStyle = toggle instanceof HTMLElement ? getComputedStyle(toggle) : null;
      return {
        expanded: toggle?.getAttribute("aria-expanded") || "",
        menuHidden: menu instanceof HTMLElement ? menu.hidden : null,
        bodyOverflow: document.body.style.overflow,
        mainInert: main instanceof HTMLElement ? main.inert : null,
        focusReturned: document.activeElement === toggle,
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        barHeight: barRect?.height ?? null,
        contextDisplay: contextStyle?.display || "",
        togglePosition: toggleStyle?.position || "",
      };
    });

    assert(closed.expanded === "false", `${label}: Escape did not collapse menu`);
    assert(closed.menuHidden === true, `${label}: Escape did not hide menu`);
    assert(closed.bodyOverflow !== "hidden", `${label}: scroll lock was not restored`);
    assert(closed.mainInert === false, `${label}: main inert state was not restored`);
    assert(closed.focusReturned, `${label}: focus did not return to menu control`);
    assert(closed.overflow <= 1, `${label}: horizontal overflow after close ${closed.overflow}px`);
    assert(typeof closed.barHeight === "number" && closed.barHeight >= 44, `${label}: closed header did not restore its normal height`);
    assert(closed.contextDisplay !== "none", `${label}: closed breadcrumb/context did not return`);
    assert(closed.togglePosition !== "fixed", `${label}: closed Awfulface stayed detached from the normal header`);

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
