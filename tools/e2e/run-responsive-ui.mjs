import assert from "node:assert/strict";

import { isDirectExecution, withE2ERuntime } from "./runtime.mjs";

const MOBILE_VIEWPORTS = [
  { width: 390, height: 844 },
  { width: 393, height: 852 },
];

const WIDE_VIEWPORT = { width: 1728, height: 1000 };
const ALIGNMENT_TOLERANCE = 2;

async function settle(page) {
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
  );
}

async function openHomepage(browser, baseUrl, viewport, { mobile = false } = {}) {
  const context = await browser.newContext({
    viewport,
    isMobile: mobile,
    hasTouch: mobile,
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  const response = await page.goto(`${baseUrl}/`, { waitUntil: "domcontentloaded" });

  assert.ok(response?.ok(), `homepage request failed: ${response?.status() ?? "no response"}`);
  await page.waitForSelector("[data-projects-navigation]");

  return { context, page };
}

async function scrollInsideProjects(page) {
  await page.evaluate(() => {
    const projects = document.querySelector(".projects");
    if (!(projects instanceof HTMLElement)) throw new Error("missing .projects");

    const absoluteTop = projects.getBoundingClientRect().top + window.scrollY;
    const depth = Math.min(700, Math.max(160, projects.offsetHeight * 0.12));
    window.scrollTo(0, absoluteTop + depth);
  });
  await settle(page);
}

async function readGeometry(page) {
  return page.evaluate(() => {
    const nav = document.querySelector("[data-projects-navigation]");
    if (!(nav instanceof HTMLElement)) throw new Error("missing project navigation");

    const rect = nav.getBoundingClientRect();
    const styles = getComputedStyle(nav);

    return {
      navBottom: rect.bottom,
      navHeight: rect.height,
      viewportHeight: window.innerHeight,
      position: styles.position,
      horizontalOverflow:
        document.documentElement.scrollWidth - document.documentElement.clientWidth,
      hasViewportAnchor: nav.hasAttribute("data-viewport-anchor"),
      inlineViewportOffset: nav.style.getPropertyValue("--project-nav-viewport-offset"),
    };
  });
}

async function readProjectHeaders(page) {
  return page.evaluate(() => {
    const headers = [...document.querySelectorAll(".project:not([hidden]) .project__head")];

    return headers.flatMap((header) => {
      if (!(header instanceof HTMLElement)) return [];

      const name = header.querySelector(".project__name");
      const directLogo = [...header.children].find((child) => child instanceof HTMLImageElement);
      const identity = name instanceof HTMLElement
        ? name
        : directLogo instanceof HTMLElement
          ? directLogo
          : null;

      if (!(identity instanceof HTMLElement)) return [];

      const role = header.querySelector(".project__role");
      const period = header.querySelector(".project__period");

      return [{
        identityDisplay: getComputedStyle(identity).display,
        roleDisplay: role instanceof HTMLElement ? getComputedStyle(role).display : null,
        periodDisplay: period instanceof HTMLElement ? getComputedStyle(period).display : null,
      }];
    });
  });
}

function assertMobileGeometry(geometry, label) {
  assert.equal(geometry.position, "sticky", `${label}: navigation must remain sticky`);
  assert.ok(
    Math.abs(geometry.navBottom - geometry.viewportHeight) <= ALIGNMENT_TOLERANCE,
    `${label}: nav bottom ${geometry.navBottom}px is not flush with viewport ${geometry.viewportHeight}px`,
  );
  assert.ok(
    geometry.horizontalOverflow <= 1,
    `${label}: horizontal overflow is ${geometry.horizontalOverflow}px`,
  );
  assert.equal(geometry.hasViewportAnchor, false, `${label}: JS viewport anchor must stay absent`);
  assert.equal(
    geometry.inlineViewportOffset,
    "",
    `${label}: JS viewport offset must stay absent`,
  );
}

function assertMobileProjectHeaders(headers, label) {
  assert.ok(headers.length > 0, `${label}: expected at least one visible project header identity`);

  for (const header of headers) {
    assert.equal(header.identityDisplay, "none", `${label}: repeated project identity must be hidden`);

    if (header.roleDisplay !== null) {
      assert.notEqual(header.roleDisplay, "none", `${label}: project role must remain visible`);
    }

    if (header.periodDisplay !== null) {
      assert.notEqual(header.periodDisplay, "none", `${label}: project period must remain visible`);
    }
  }
}

function assertWideProjectHeaders(headers) {
  assert.ok(headers.length > 0, "wide viewport: expected at least one visible project header identity");

  for (const header of headers) {
    assert.notEqual(header.identityDisplay, "none", "wide viewport: project identity must remain visible");
  }
}

async function checkMobileViewport(browser, baseUrl, viewport) {
  const { context, page } = await openHomepage(browser, baseUrl, viewport, { mobile: true });

  try {
    await scrollInsideProjects(page);
    assertMobileGeometry(await readGeometry(page), `${viewport.width}x${viewport.height}`);
    assertMobileProjectHeaders(
      await readProjectHeaders(page),
      `${viewport.width}x${viewport.height}`,
    );

    const reducedHeight = Math.max(640, viewport.height - 160);
    await page.setViewportSize({ width: viewport.width, height: reducedHeight });
    await settle(page);
    assertMobileGeometry(
      await readGeometry(page),
      `${viewport.width}x${reducedHeight} after viewport shrink`,
    );

    await page.setViewportSize(viewport);
    await settle(page);
    assertMobileGeometry(
      await readGeometry(page),
      `${viewport.width}x${viewport.height} after viewport restore`,
    );
  } finally {
    await context.close();
  }
}

async function checkWideViewport(browser, baseUrl) {
  const { context, page } = await openHomepage(browser, baseUrl, WIDE_VIEWPORT);

  try {
    await scrollInsideProjects(page);
    const geometry = await readGeometry(page);

    assert.equal(geometry.position, "sticky", "wide navigation must remain sticky");
    assert.ok(
      geometry.navHeight <= 2,
      `wide project navigation rail anchor must stay collapsed; got ${geometry.navHeight}px`,
    );
    assert.ok(
      geometry.horizontalOverflow <= 1,
      `wide viewport horizontal overflow is ${geometry.horizontalOverflow}px`,
    );
    assert.equal(geometry.hasViewportAnchor, false, "wide navigation must not gain JS viewport anchor");
    assert.equal(geometry.inlineViewportOffset, "", "wide navigation must not gain JS viewport offset");
    assertWideProjectHeaders(await readProjectHeaders(page));
  } finally {
    await context.close();
  }
}

export async function runResponsiveUI({ browser, baseUrl }) {
  for (const viewport of MOBILE_VIEWPORTS) {
    await checkMobileViewport(browser, baseUrl, viewport);
  }

  await checkWideViewport(browser, baseUrl);
  console.log("Responsive UI checks passed");
}

if (isDirectExecution(import.meta.url)) {
  await withE2ERuntime(runResponsiveUI);
}
