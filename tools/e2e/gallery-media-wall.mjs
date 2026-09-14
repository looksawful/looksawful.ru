async function assertNoHorizontalOverflow(page, label) {
  const geometry = await page.evaluate(() => ({
    viewport: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  if (geometry.scrollWidth > geometry.viewport + 1) {
    throw new Error(`[gallery-media-wall] ${label} horizontal overflow: ${JSON.stringify(geometry)}`);
  }
}

async function waitForGalleryViewer(page, open) {
  await page.waitForFunction((shouldBeOpen) => {
    const viewer = document.querySelector(".pswp");
    return shouldBeOpen ? Boolean(viewer) : !viewer;
  }, open, { timeout: 5_000 });
}

async function waitForItemUrl(page, expectedId) {
  await page.waitForFunction((itemId) => {
    const current = new URL(window.location.href).searchParams.get("item");
    return current === itemId;
  }, expectedId, { timeout: 5_000 });
}

async function assertMasonryGeometry(page, label) {
  const result = await page.locator("[data-gallery-grid]").evaluate((grid) => {
    const style = getComputedStyle(grid);
    const columnGap = Number.parseFloat(style.columnGap);
    const rowGap = Number.parseFloat(style.rowGap);
    const cards = [...grid.querySelectorAll("[data-gallery-card]")]
      .slice(0, 100)
      .map((card) => {
        const rect = card.getBoundingClientRect();
        return {
          left: rect.left,
          top: rect.top,
          right: rect.right,
          bottom: rect.bottom,
          width: rect.width,
          height: rect.height,
        };
      })
      .filter((rect) => rect.width > 0 && rect.height > 0);

    const columns = [];
    for (const rect of cards) {
      let column = columns.find((candidate) => Math.abs(candidate.left - rect.left) <= 2);
      if (!column) {
        column = { left: rect.left, cards: [] };
        columns.push(column);
      }
      column.cards.push(rect);
    }
    columns.sort((a, b) => a.left - b.left);

    const verticalGaps = [];
    for (const column of columns) {
      column.cards.sort((a, b) => a.top - b.top);
      for (let index = 1; index < column.cards.length; index += 1) {
        verticalGaps.push(column.cards[index].top - column.cards[index - 1].bottom);
      }
    }

    const horizontalGaps = [];
    for (let index = 1; index < columns.length; index += 1) {
      const previous = columns[index - 1].cards[0];
      const next = columns[index].cards[0];
      horizontalGaps.push(next.left - previous.right);
    }

    const distinctTopCount = new Set(cards.map((rect) => Math.round(rect.top))).size;
    return {
      cardCount: cards.length,
      columnCount: columns.length,
      columnGap,
      rowGap,
      verticalGaps,
      horizontalGaps,
      distinctTopCount,
    };
  });

  if (result.cardCount < 4 || result.columnCount < 2) {
    throw new Error(`[gallery-media-wall] ${label} masonry did not create multiple columns: ${JSON.stringify(result)}`);
  }
  if (!Number.isFinite(result.columnGap) || !Number.isFinite(result.rowGap)) {
    throw new Error(`[gallery-media-wall] ${label} masonry gaps are not measurable: ${JSON.stringify(result)}`);
  }
  const tolerance = 2;
  if (result.horizontalGaps.some((gap) => Math.abs(gap - result.columnGap) > tolerance)) {
    throw new Error(`[gallery-media-wall] ${label} masonry horizontal gaps diverge: ${JSON.stringify(result)}`);
  }
  if (result.verticalGaps.some((gap) => Math.abs(gap - result.rowGap) > tolerance)) {
    throw new Error(`[gallery-media-wall] ${label} masonry vertical gaps diverge: ${JSON.stringify(result)}`);
  }
  if (result.distinctTopCount <= result.columnCount) {
    throw new Error(`[gallery-media-wall] ${label} still looks row-based instead of masonry: ${JSON.stringify(result)}`);
  }
}

async function openCardByKeyboard(page, card) {
  const id = await card.getAttribute("data-gallery-item-id");
  if (!id) throw new Error("[gallery-media-wall] card has no stable item id");
  await card.scrollIntoViewIfNeeded();
  await card.focus();
  await page.keyboard.press("Enter");
  await waitForGalleryViewer(page, true);
  await waitForItemUrl(page, id);
  return id;
}

export async function runGalleryMediaWallSanity({ browser, baseUrl }) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const browserMessages = [];
  page.on("console", (message) => {
    if (message.type() === "error") browserMessages.push(`error: ${message.text()}`);
  });
  page.on("pageerror", (error) => browserMessages.push(`pageerror: ${error.message}`));

  try {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(new URL("/gallery/", baseUrl).href, {
      waitUntil: "domcontentloaded",
      timeout: 30_000,
    });
    await page.locator("[data-gallery-grid]").waitFor({ state: "visible", timeout: 15_000 });

    const imageCards = page.locator('[data-gallery-card][data-gallery-kind="image"]');
    const videoCards = page.locator('[data-gallery-card][data-gallery-kind="video"]');
    const cards = page.locator("[data-gallery-card]");
    const imageCount = await imageCards.count();
    const videoCount = await videoCards.count();
    const cardCount = await cards.count();
    if (imageCount < 1 || videoCount < 1) {
      throw new Error(`[gallery-media-wall] expected image and video cards, found images=${imageCount} videos=${videoCount}`);
    }

    await cards.last().scrollIntoViewIfNeeded();
    await cards.first().scrollIntoViewIfNeeded();
    await assertNoHorizontalOverflow(page, "desktop");
    await assertMasonryGeometry(page, "desktop");

    const reducedMotionPlaying = await page.locator("video[data-gallery-video]").evaluateAll((videos) =>
      videos.some((video) => !video.paused),
    );
    if (reducedMotionPlaying) {
      throw new Error("[gallery-media-wall] reducedMotion allowed a wall video to autoplay");
    }

    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.reload({ waitUntil: "domcontentloaded", timeout: 30_000 });
    await page.locator("[data-gallery-grid]").waitFor({ state: "visible", timeout: 15_000 });

    const firstWallVideo = page.locator("video[data-gallery-video]").first();
    await firstWallVideo.scrollIntoViewIfNeeded();
    await page.waitForFunction(() => {
      const video = document.querySelector("video[data-gallery-video]");
      return video instanceof HTMLVideoElement && !video.paused;
    }, { timeout: 8_000 });

    const imageWithCreditsIndex = await page
      .locator('[data-gallery-card][data-gallery-kind="image"]')
      .evaluateAll((nodes) => nodes.findIndex((node) => {
        try {
          return JSON.parse(node.getAttribute("data-gallery-credits") || "[]").length > 0;
        } catch {
          return false;
        }
      }));
    if (imageWithCreditsIndex < 0) {
      throw new Error("[gallery-media-wall] no image card exposes data-gallery-credits");
    }

    const imageWithCredits = page
      .locator('[data-gallery-card][data-gallery-kind="image"]')
      .nth(imageWithCreditsIndex);
    await openCardByKeyboard(page, imageWithCredits);
    const caption = page.locator(".media-lightbox__caption");
    await caption.waitFor({ state: "visible", timeout: 5_000 });
    if (!(await caption.textContent())?.trim()) {
      throw new Error("[gallery-media-wall] lightbox credits caption is empty");
    }
    await page.keyboard.press("Escape");
    await waitForGalleryViewer(page, false);

    const videoCard = page.locator('[data-gallery-card][data-gallery-kind="video"]').first();
    await openCardByKeyboard(page, videoCard);
    const viewerVideo = page.locator(".gallery-lightbox__video[controls]");
    await viewerVideo.waitFor({ state: "visible", timeout: 5_000 });
    const viewerVideoPaused = await viewerVideo.evaluate((video) => video.paused);
    if (!viewerVideoPaused) {
      throw new Error("[gallery-media-wall] fullscreen video autoplayed unexpectedly");
    }
    await page.keyboard.press("Escape");
    await waitForGalleryViewer(page, false);

    const kinds = await page.locator("[data-gallery-card]").evaluateAll((nodes) =>
      nodes.map((node) => node.getAttribute("data-gallery-kind")),
    );
    const boundaryIndex = kinds.findIndex((kind, index) => index < kinds.length - 1 && kind !== kinds[index + 1]);
    if (boundaryIndex < 0) {
      throw new Error("[gallery-media-wall] no image/video boundary found for mixed ArrowRight navigation");
    }
    const boundaryCards = page.locator("[data-gallery-card]");
    await openCardByKeyboard(page, boundaryCards.nth(boundaryIndex));
    const nextId = await boundaryCards.nth(boundaryIndex + 1).getAttribute("data-gallery-item-id");
    if (!nextId) throw new Error("[gallery-media-wall] mixed boundary target has no item id");
    await page.keyboard.press("ArrowRight");
    await waitForItemUrl(page, nextId);
    await page.keyboard.press("Escape");
    await waitForGalleryViewer(page, false);

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(new URL("/gallery/", baseUrl).href, {
      waitUntil: "domcontentloaded",
      timeout: 30_000,
    });
    await page.locator("[data-gallery-grid]").waitFor({ state: "visible", timeout: 15_000 });
    const mobileCards = page.locator("[data-gallery-card]");
    await mobileCards.last().scrollIntoViewIfNeeded();
    await assertNoHorizontalOverflow(page, "mobile");
    await assertMasonryGeometry(page, "mobile");

    console.log(
      `[gallery-media-wall] cards=${cardCount} images=${imageCount} videos=${videoCount}; masonry, motion, mixed viewer and credits: OK`,
    );
  } catch (error) {
    if (browserMessages.length) {
      console.error(`[gallery-media-wall] browser messages:\n${browserMessages.join("\n")}`);
    }
    throw error;
  } finally {
    await page.close();
  }
}
