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

async function openJesteiCase(browser, baseUrl, viewport, { mobile = false } = {}) {
  const context = await browser.newContext({
    viewport,
    isMobile: mobile,
    hasTouch: mobile,
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  const response = await page.goto(`${baseUrl}/work/jestei-pool/`, { waitUntil: "domcontentloaded" });

  assert.ok(response?.ok(), `Jestei request failed: ${response?.status() ?? "no response"}`);
  await page.waitForSelector("#project-jestei");
  await settle(page);

  return { context, page };
}

async function readJesteiGeometry(page) {
  return page.evaluate(() => {
    const root = document.querySelector("#project-jestei");
    if (!(root instanceof HTMLElement)) throw new Error("missing #project-jestei");

    const copyPairs = [...root.querySelectorAll(".section-copy")].flatMap((pair) => {
      if (!(pair instanceof HTMLElement)) return [];
      const title = pair.querySelector(".section-copy__title");
      const text = pair.querySelector(".section-copy__text");
      if (!(title instanceof HTMLElement) || !(text instanceof HTMLElement)) return [];

      const pairRect = pair.getBoundingClientRect();
      const titleRect = title.getBoundingClientRect();
      const textRect = text.getBoundingClientRect();

      return [{
        pairWidth: pairRect.width,
        titleTop: titleRect.top,
        titleBottom: titleRect.bottom,
        titleLeft: titleRect.left,
        titleRight: titleRect.right,
        titleWidth: titleRect.width,
        textTop: textRect.top,
        textLeft: textRect.left,
        textWidth: textRect.width,
      }];
    });

    const rails = [
      ...root.querySelectorAll(
        '.media-group[data-compact-layout="reel"] > .media-group__items.reel, ' +
        '.media-group[data-layout="sequence"] > .media-group__items.reel',
      ),
    ].flatMap((rail) => {
      if (!(rail instanceof HTMLElement)) return [];
      const styles = getComputedStyle(rail);
      return [{
        display: styles.display,
        flexWrap: styles.flexWrap,
        overflowX: styles.overflowX,
        clientWidth: rail.clientWidth,
        scrollWidth: rail.scrollWidth,
        childCount: rail.children.length,
      }];
    });

    return {
      titles: [...root.querySelectorAll(".section-copy__title")]
        .map((node) => node.textContent?.trim() ?? "")
        .filter(Boolean),
      copyPairs,
      rails,
      promoSequence: (() => {
        const sequence = root.querySelector('.media-group[data-layout="sequence"]');
        if (!(sequence instanceof HTMLElement)) return null;

        const items = sequence.querySelector(":scope > .media-group__items");
        if (!(items instanceof HTMLElement)) return null;

        const leading = items.querySelector(':scope > .media[data-role="wide"]');
        const middle = items.querySelector(":scope > .media-group__middle");
        if (!(leading instanceof HTMLElement) || !(middle instanceof HTMLElement)) return null;

        const leadingRect = leading.getBoundingClientRect();
        const middleRect = middle.getBoundingClientRect();

        const cells = [...middle.querySelectorAll(":scope > .media")].flatMap((cell) => {
          if (!(cell instanceof HTMLElement)) return [];
          const rect = cell.getBoundingClientRect();
          return [{
            left: rect.left,
            right: rect.right,
            top: rect.top,
            bottom: rect.bottom,
            width: rect.width,
            height: rect.height,
          }];
        });

        return {
          leadingTop: leadingRect.top,
          leadingBottom: leadingRect.bottom,
          leadingHeight: leadingRect.height,
          middleTop: middleRect.top,
          middleBottom: middleRect.bottom,
          middleHeight: middleRect.height,
          cells,
        };
      })(),
      horizontalOverflow:
        document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  });
}

async function checkJesteiMobile(browser, baseUrl) {
  const viewport = MOBILE_VIEWPORTS[0];
  const { context, page } = await openJesteiCase(browser, baseUrl, viewport, { mobile: true });

  try {
    const geometry = await readJesteiGeometry(page);

    assert.ok(
      geometry.titles.includes("Промо в соцсетях"),
      "Jestei mobile: social promo heading must use the approved title",
    );
    assert.ok(
      geometry.titles.includes("Промо и коммуникации"),
      "Jestei mobile: promo section heading must use the approved title",
    );
    assert.ok(geometry.copyPairs.length > 0, "Jestei mobile: expected section-copy pairs");

    for (const pair of geometry.copyPairs) {
      assert.ok(
        pair.textTop >= pair.titleBottom - ALIGNMENT_TOLERANCE,
        "Jestei mobile: section title and copy must stack top-to-bottom",
      );
      assert.ok(
        pair.titleWidth >= pair.pairWidth * 0.9,
        "Jestei mobile: section title must occupy the mobile row",
      );
      assert.ok(
        pair.textWidth >= pair.pairWidth * 0.9,
        "Jestei mobile: section copy must occupy the mobile row",
      );
    }

    console.log("[DEBUG-jestei-promo-geometry]", JSON.stringify(geometry.promoSequence));
        assert.ok(geometry.promoSequence, "Jestei mobile: expected promo sequence geometry");
    assert.ok(
      Math.abs(geometry.promoSequence.leadingTop - geometry.promoSequence.middleTop) <= ALIGNMENT_TOLERANCE,
      `Jestei mobile: promo leading and middle tops differ by ${Math.abs(geometry.promoSequence.leadingTop - geometry.promoSequence.middleTop)}px`,
    );
    assert.ok(
      Math.abs(geometry.promoSequence.leadingBottom - geometry.promoSequence.middleBottom) <= ALIGNMENT_TOLERANCE,
      `Jestei mobile: promo leading and middle bottoms differ by ${Math.abs(geometry.promoSequence.leadingBottom - geometry.promoSequence.middleBottom)}px`,
    );

        assert.ok(geometry.rails.length >= 4, "Jestei mobile: expected authored horizontal rails");
    for (const rail of geometry.rails) {
      assert.equal(rail.display, "flex", "Jestei mobile: rail must render as flex");
      assert.equal(rail.flexWrap, "nowrap", "Jestei mobile: rail must not wrap");
      assert.ok(
        rail.overflowX === "auto" || rail.overflowX === "scroll",
        `Jestei mobile: rail overflow-x must scroll, got ${rail.overflowX}`,
      );
      assert.ok(rail.childCount > 1, "Jestei mobile: rail must contain multiple items");
      assert.ok(
        rail.scrollWidth > rail.clientWidth + ALIGNMENT_TOLERANCE,
        "Jestei mobile: rail must have real horizontal overflow to swipe",
      );
    }

    assert.ok(
      geometry.horizontalOverflow <= 1,
      `Jestei mobile: page itself must not horizontally overflow; got ${geometry.horizontalOverflow}px`,
    );
  } finally {
    await context.close();
  }
}

async function checkJesteiWide(browser, baseUrl) {
  const { context, page } = await openJesteiCase(browser, baseUrl, WIDE_VIEWPORT);

  try {
    const geometry = await readJesteiGeometry(page);
    assert.ok(geometry.copyPairs.length > 0, "Jestei wide: expected section-copy pairs");

    for (const pair of geometry.copyPairs) {
      assert.ok(
        pair.textLeft >= pair.titleRight - ALIGNMENT_TOLERANCE,
        "Jestei wide: section title and copy must retain the desktop side-by-side composition",
      );
    }

    assert.ok(
      geometry.horizontalOverflow <= 1,
      `Jestei wide: page horizontal overflow is ${geometry.horizontalOverflow}px`,
    );
  } finally {
    await context.close();
  }
}

export async function runResponsiveUI({ browser, baseUrl }) {
  for (const viewport of MOBILE_VIEWPORTS) {
    await checkMobileViewport(browser, baseUrl, viewport);
  }

  await checkWideViewport(browser, baseUrl);
  await checkJesteiMobile(browser, baseUrl);
  await checkJesteiWide(browser, baseUrl);
  console.log("Responsive UI checks passed");
}

if (isDirectExecution(import.meta.url)) {
  await withE2ERuntime(runResponsiveUI);
}
