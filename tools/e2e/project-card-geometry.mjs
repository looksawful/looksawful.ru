import assert from "node:assert/strict";

const PROJECT_CARD_VIEWPORTS = [
  { width: 390, height: 844 },
  { width: 720, height: 900 },
  { width: 768, height: 900 },
  { width: 1440, height: 900 },
];

const GEOMETRY_TOLERANCE = 1;
const RADIUS_TOLERANCE = 0.25;

function closeEnough(actual, expected, tolerance = GEOMETRY_TOLERANCE) {
  return Math.abs(actual - expected) <= tolerance;
}

async function settle(page) {
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
  );
}

async function readProjectCardGeometry(page) {
  return page.evaluate(() => {
    const cards = [...document.querySelectorAll(".projects-grid__list .project-card")];
    const firstCard = cards[0];
    const secondCard = cards[1];
    const list = document.querySelector(".projects-grid__list");
    const media = firstCard?.querySelector(".project-card__media");

    if (!(firstCard instanceof HTMLElement)) throw new Error("missing first project card");
    if (!(list instanceof HTMLElement)) throw new Error("missing projects grid list");
    if (!(media instanceof HTMLElement)) throw new Error("missing first project card media");

    const resolveRootLength = (name) => {
      const probe = document.createElement("div");
      probe.style.position = "fixed";
      probe.style.visibility = "hidden";
      probe.style.pointerEvents = "none";
      probe.style.inlineSize = `var(${name})`;
      probe.style.blockSize = "0";
      document.body.append(probe);
      const value = probe.getBoundingClientRect().width;
      probe.remove();
      return value;
    };

    const listStyles = getComputedStyle(list);
    const mediaStyles = getComputedStyle(media);
    const cardRect = firstCard.getBoundingClientRect();
    const listRect = list.getBoundingClientRect();
    const secondRect = secondCard instanceof HTMLElement ? secondCard.getBoundingClientRect() : null;
    const sameRow = secondRect !== null && Math.abs(secondRect.top - cardRect.top) <= 1;
    const columns = sameRow ? 2 : 1;
    const columnGap = Number.parseFloat(listStyles.columnGap) || 0;
    const edgeOffset = resolveRootLength("--radius-edge-offset");
    const posterRadius = resolveRootLength("--radius-poster");
    const actualRadius = Number.parseFloat(mediaStyles.borderTopLeftRadius) || 0;
    const expectedTrackWidth = columns === 2
      ? (listRect.width - columnGap) / 2
      : listRect.width;
    const freeSpace = window.innerWidth - cardRect.width;
    const edgeThreshold = edgeOffset * 2;

    return {
      viewportWidth: window.innerWidth,
      cardWidth: cardRect.width,
      cardLeft: cardRect.left,
      cardRightGap: window.innerWidth - cardRect.right,
      listWidth: listRect.width,
      columns,
      columnGap,
      expectedTrackWidth,
      freeSpace,
      edgeOffset,
      edgeThreshold,
      posterRadius,
      actualRadius,
    };
  });
}

function assertProjectCardGeometry(geometry, label) {
  assert.ok(
    closeEnough(geometry.cardWidth, geometry.expectedTrackWidth),
    `${label}: card width ${geometry.cardWidth}px must match its ${geometry.columns}-column grid track ${geometry.expectedTrackWidth}px`,
  );

  const edgeLike = geometry.freeSpace <= geometry.edgeThreshold + GEOMETRY_TOLERANCE;
  const expectedRadius = edgeLike ? 0 : geometry.posterRadius;

  assert.ok(
    closeEnough(geometry.actualRadius, expectedRadius, RADIUS_TOLERANCE),
    `${label}: free horizontal viewport space is ${geometry.freeSpace}px with edge threshold ${geometry.edgeThreshold}px; expected media radius ${expectedRadius}px, got ${geometry.actualRadius}px`,
  );
}

export async function runProjectCardGeometryContract({ browser, baseUrl }) {
  for (const viewport of PROJECT_CARD_VIEWPORTS) {
    const context = await browser.newContext({
      viewport,
      deviceScaleFactor: 1,
      isMobile: viewport.width < 500,
      hasTouch: viewport.width < 500,
    });
    const page = await context.newPage();

    try {
      const response = await page.goto(new URL("/", baseUrl).href, {
        waitUntil: "domcontentloaded",
        timeout: 30_000,
      });
      assert.ok(response?.ok(), `${viewport.width}px: homepage request failed`);
      await page.waitForSelector(".projects-grid__list .project-card__media", {
        state: "visible",
        timeout: 30_000,
      });
      await settle(page);

      const geometry = await readProjectCardGeometry(page);
      console.log(`[project-card-geometry] ${viewport.width}px: ${JSON.stringify(geometry)}`);
      assertProjectCardGeometry(geometry, `${viewport.width}px viewport`);
    } finally {
      await context.close();
    }
  }
}
