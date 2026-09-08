import assert from "node:assert/strict";

import { isDirectExecution, withE2ERuntime } from "./runtime.mjs";

const MOBILE_VIEWPORTS = [
  { width: 390, height: 844 },
  { width: 393, height: 852 },
  { width: 412, height: 915 },
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
  await page.waitForSelector("[data-projects-navigation][data-project-nav-enhanced]");
  await settle(page);

  return { context, page };
}

async function projectsAbsoluteTop(page) {
  return page.evaluate(() => {
    const projects = document.querySelector(".projects");
    if (!(projects instanceof HTMLElement)) throw new Error("missing .projects");
    return projects.getBoundingClientRect().top + window.scrollY;
  });
}

async function scrollBeforeProjects(page, viewportHeight) {
  const top = await projectsAbsoluteTop(page);
  await page.evaluate(
    (targetY) => window.scrollTo(0, targetY),
    Math.max(0, top - viewportHeight - 120),
  );
  await settle(page);
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

    const inner = nav.querySelector(".project-nav__inner");
    if (!(inner instanceof HTMLElement)) throw new Error("missing project navigation inner");

    const firstProject = document.querySelector(".projects > .project:not([hidden])");
    if (!(firstProject instanceof HTMLElement)) throw new Error("missing first visible project");

    const navRect = nav.getBoundingClientRect();
    const innerRect = inner.getBoundingClientRect();
    const firstProjectRect = firstProject.getBoundingClientRect();
    const styles = getComputedStyle(nav);
    const innerStyles = getComputedStyle(inner);

    return {
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      navTop: navRect.top,
      navBottom: navRect.bottom,
      navHeight: navRect.height,
      navPosition: styles.position,
      navPaddingBlockStart: Number.parseFloat(styles.paddingBlockStart) || 0,
      navPaddingBlockEnd: Number.parseFloat(styles.paddingBlockEnd) || 0,
      navPaddingInlineStart: Number.parseFloat(styles.paddingInlineStart) || 0,
      navPaddingInlineEnd: Number.parseFloat(styles.paddingInlineEnd) || 0,
      innerTop: innerRect.top,
      innerBottom: innerRect.bottom,
      innerLeft: innerRect.left,
      innerRight: innerRect.right,
      innerHeight: innerRect.height,
      innerPosition: innerStyles.position,
      innerVisibility: innerStyles.visibility,
      innerPointerEvents: innerStyles.pointerEvents,
      firstProjectTop: firstProjectRect.top,
      backgroundColor: styles.backgroundColor,
      borderBlockStartWidth: styles.borderBlockStartWidth,
      horizontalOverflow:
        document.documentElement.scrollWidth - document.documentElement.clientWidth,
      enhanced: nav.hasAttribute("data-project-nav-enhanced"),
      docked: nav.hasAttribute("data-project-nav-docked"),
      innerInert: inner.inert,
      innerAriaHidden: inner.getAttribute("aria-hidden"),
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

function assertNoNavigationBackdrop(geometry, label) {
  assert.equal(
    geometry.backgroundColor,
    "rgba(0, 0, 0, 0)",
    `${label}: project navigation must not paint a backdrop`,
  );
  assert.equal(
    geometry.borderBlockStartWidth,
    "0px",
    `${label}: project navigation must not paint a panel border`,
  );
}

function assertNoViewportAnchor(geometry, label) {
  assert.equal(geometry.hasViewportAnchor, false, `${label}: JS viewport anchor must stay absent`);
  assert.equal(
    geometry.inlineViewportOffset,
    "",
    `${label}: JS viewport offset must stay absent`,
  );
}

function assertMobileFlowSlot(geometry, label) {
  const expectedHeight =
    geometry.innerHeight
    + geometry.navPaddingBlockStart
    + geometry.navPaddingBlockEnd;

  assert.ok(
    Math.abs(geometry.navHeight - expectedHeight) <= ALIGNMENT_TOLERANCE,
    `${label}: flow slot ${geometry.navHeight}px does not preserve inner row + padding ${expectedHeight}px`,
  );
  assert.ok(
    Math.abs((geometry.firstProjectTop - geometry.navTop) - geometry.navHeight) <= ALIGNMENT_TOLERANCE,
    `${label}: first project no longer follows the reserved navigation slot`,
  );
}

function assertMobileHidden(geometry, label) {
  assert.equal(geometry.enhanced, true, `${label}: dock enhancement must initialize`);
  assert.equal(geometry.docked, false, `${label}: dock must be inactive outside Projects`);
  assert.equal(geometry.navPosition, "relative", `${label}: outer navigation must stay in normal flow`);
  assert.equal(geometry.innerPosition, "fixed", `${label}: enhanced compact inner must use fixed positioning`);
  assert.equal(geometry.innerVisibility, "hidden", `${label}: inactive dock must be visually hidden`);
  assert.equal(geometry.innerPointerEvents, "none", `${label}: inactive dock must ignore pointer input`);
  assert.equal(geometry.innerInert, true, `${label}: inactive dock must be inert`);
  assert.equal(geometry.innerAriaHidden, "true", `${label}: inactive dock must be aria-hidden`);
  assert.ok(
    geometry.horizontalOverflow <= 1,
    `${label}: horizontal overflow is ${geometry.horizontalOverflow}px`,
  );
  assertMobileFlowSlot(geometry, label);
  assertNoViewportAnchor(geometry, label);
  assertNoNavigationBackdrop(geometry, label);
}

function assertMobileDocked(geometry, label) {
  assert.equal(geometry.enhanced, true, `${label}: dock enhancement must stay initialized`);
  assert.equal(geometry.docked, true, `${label}: dock must be active inside Projects`);
  assert.equal(geometry.navPosition, "relative", `${label}: outer navigation must stay in normal flow`);
  assert.equal(geometry.innerPosition, "fixed", `${label}: docked inner must use viewport-native fixed positioning`);
  assert.equal(geometry.innerVisibility, "visible", `${label}: docked inner must be visible`);
  assert.notEqual(geometry.innerPointerEvents, "none", `${label}: docked inner must accept pointer input`);
  assert.equal(geometry.innerInert, false, `${label}: docked inner must not be inert`);
  assert.equal(geometry.innerAriaHidden, null, `${label}: docked inner must not be aria-hidden`);

  const actualBottomOffset = geometry.viewportHeight - geometry.innerBottom;
  assert.ok(
    Math.abs(actualBottomOffset - geometry.navPaddingBlockEnd) <= ALIGNMENT_TOLERANCE,
    `${label}: inner bottom offset ${actualBottomOffset}px does not match preserved bottom padding ${geometry.navPaddingBlockEnd}px`,
  );
  assert.ok(
    Math.abs(geometry.innerLeft - geometry.navPaddingInlineStart) <= ALIGNMENT_TOLERANCE,
    `${label}: inner left inset ${geometry.innerLeft}px does not match page padding ${geometry.navPaddingInlineStart}px`,
  );
  assert.ok(
    Math.abs((geometry.viewportWidth - geometry.innerRight) - geometry.navPaddingInlineEnd) <= ALIGNMENT_TOLERANCE,
    `${label}: inner right inset does not match page padding`,
  );
  assert.ok(
    geometry.horizontalOverflow <= 1,
    `${label}: horizontal overflow is ${geometry.horizontalOverflow}px`,
  );
  assertMobileFlowSlot(geometry, label);
  assertNoViewportAnchor(geometry, label);
  assertNoNavigationBackdrop(geometry, label);
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
    await scrollBeforeProjects(page, viewport.height);
    assertMobileHidden(
      await readGeometry(page),
      `${viewport.width}x${viewport.height} before Projects`,
    );

    await scrollInsideProjects(page);
    assertMobileDocked(await readGeometry(page), `${viewport.width}x${viewport.height}`);
    assertMobileProjectHeaders(
      await readProjectHeaders(page),
      `${viewport.width}x${viewport.height}`,
    );

    const reducedHeight = Math.max(640, viewport.height - 160);
    await page.setViewportSize({ width: viewport.width, height: reducedHeight });
    await settle(page);
    assertMobileDocked(
      await readGeometry(page),
      `${viewport.width}x${reducedHeight} after viewport shrink`,
    );

    await page.setViewportSize(viewport);
    await settle(page);
    assertMobileDocked(
      await readGeometry(page),
      `${viewport.width}x${viewport.height} after viewport restore`,
    );

    await scrollBeforeProjects(page, viewport.height);
    assertMobileHidden(
      await readGeometry(page),
      `${viewport.width}x${viewport.height} after scrolling above Projects`,
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

    assert.equal(geometry.navPosition, "sticky", "wide navigation must remain sticky");
    assert.equal(geometry.innerPosition, "absolute", "wide navigation inner must remain the rail owner");
    assert.ok(
      geometry.navHeight <= 2,
      `wide project navigation rail anchor must stay collapsed; got ${geometry.navHeight}px`,
    );
    assert.ok(
      geometry.horizontalOverflow <= 1,
      `wide viewport horizontal overflow is ${geometry.horizontalOverflow}px`,
    );
    assertNoViewportAnchor(geometry, "wide viewport");
    assertNoNavigationBackdrop(geometry, "wide viewport");
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
