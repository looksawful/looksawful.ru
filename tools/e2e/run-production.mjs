import { runQuickSmoke, runMediaSanity } from "./run-smoke.mjs";
import { createInternalAnalyticsBrowser, isDirectExecution, withE2ERuntime } from "./runtime.mjs";

async function inspectImage(locator, label) {
  await locator.waitFor({ state: "attached", timeout: 10_000 });
  await locator.scrollIntoViewIfNeeded();
  const result = await locator.evaluate((element) => {
    if (!(element instanceof HTMLImageElement)) {
      return { ok: false, reason: "not-an-image" };
    }

    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    let visibleLeft = Math.max(0, rect.left);
    let visibleTop = Math.max(0, rect.top);
    let visibleRight = Math.min(innerWidth, rect.right);
    let visibleBottom = Math.min(innerHeight, rect.bottom);
    let ancestor = element.parentElement;

    while (ancestor) {
      const ancestorStyle = getComputedStyle(ancestor);
      if (ancestorStyle.display === "none" || ancestorStyle.visibility === "hidden") {
        visibleRight = visibleLeft;
        visibleBottom = visibleTop;
        break;
      }

      const clipsX = ["hidden", "clip", "scroll", "auto"].includes(ancestorStyle.overflowX);
      const clipsY = ["hidden", "clip", "scroll", "auto"].includes(ancestorStyle.overflowY);
      if (clipsX || clipsY) {
        const ancestorRect = ancestor.getBoundingClientRect();
        if (clipsX) {
          visibleLeft = Math.max(visibleLeft, ancestorRect.left);
          visibleRight = Math.min(visibleRight, ancestorRect.right);
        }
        if (clipsY) {
          visibleTop = Math.max(visibleTop, ancestorRect.top);
          visibleBottom = Math.min(visibleBottom, ancestorRect.bottom);
        }
      }

      ancestor = ancestor.parentElement;
    }

    const visibleWidth = Math.max(0, visibleRight - visibleLeft);
    const visibleHeight = Math.max(0, visibleBottom - visibleTop);
    return {
      ok: element.complete
        && element.naturalWidth > 0
        && element.naturalHeight > 0
        && rect.width > 0
        && rect.height > 0
        && visibleWidth > 0
        && visibleHeight > 0
        && style.display !== "none"
        && style.visibility !== "hidden"
        && Number.parseFloat(style.opacity || "1") > 0,
      complete: element.complete,
      naturalWidth: element.naturalWidth,
      naturalHeight: element.naturalHeight,
      width: rect.width,
      height: rect.height,
      left: rect.left,
      right: rect.right,
      top: rect.top,
      bottom: rect.bottom,
      visibleWidth,
      visibleHeight,
      display: style.display,
      visibility: style.visibility,
      opacity: style.opacity,
      srcPrefix: element.currentSrc.slice(0, 64),
    };
  });

  console.log(`[jestei-filter-art] ${label}: ${JSON.stringify(result)}`);
  if (!result.ok) {
    throw new Error(`[jestei-filter-art] ${label} is not visibly rendered`);
  }
}

async function visibleLocators(locator) {
  const visible = [];
  for (let index = 0; index < await locator.count(); index += 1) {
    const item = locator.nth(index);
    if (await item.isVisible()) visible.push(item);
  }
  return visible;
}

async function settle(page) {
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
  );
}

async function setJesteiFilterState(filter, page, { open, advanced }) {
  const form = filter.locator(".filter");

  if (typeof open === "boolean") {
    const currentOpen = (await form.getAttribute("data-filter-open")) !== "false";
    if (currentOpen !== open) {
      await filter.locator(".filter-button[data-action=\"toggle-open\"]").click();
      await form.waitFor({ state: "visible" });
      await page.waitForFunction(
        ({ expected }) => {
          const host = document.querySelector("playlist-filter-workflow");
          const innerForm = host?.shadowRoot?.querySelector(".filter");
          return innerForm?.getAttribute("data-filter-open") === String(expected);
        },
        { expected: open },
      );
    }
  }

  if (typeof advanced === "boolean" && open !== false) {
    const currentAdvanced = (await form.getAttribute("data-filter-advanced")) === "true";
    if (currentAdvanced !== advanced) {
      await filter.locator(".advanced-button[data-action=\"toggle-advanced\"]").click();
      await page.waitForFunction(
        ({ expected }) => {
          const host = document.querySelector("playlist-filter-workflow");
          const innerForm = host?.shadowRoot?.querySelector(".filter");
          return innerForm?.getAttribute("data-filter-advanced") === String(expected);
        },
        { expected: advanced },
      );
    }
  }

  await settle(page);
}

async function inspectJesteiLayoutEscapes(filter, viewportLabel, stateLabel) {
  const report = await filter.evaluate((host) => {
    const root = host.shadowRoot;
    if (!root) throw new Error("missing playlist-filter-workflow shadow root");

    const shell = root.querySelector(".filter-shell");
    const form = root.querySelector(".filter");
    if (!(shell instanceof HTMLElement)) throw new Error("missing .filter-shell");
    if (!(form instanceof HTMLElement)) throw new Error("missing .filter");

    const mockupViewport = host.closest(".mockup__viewport");
    const mockupFrame = host.closest(".mockup__frame");
    if (!(mockupViewport instanceof HTMLElement)) throw new Error("missing parent .mockup__viewport");
    if (!(mockupFrame instanceof HTMLElement)) throw new Error("missing parent .mockup__frame");

    const shellRect = shell.getBoundingClientRect();
    const hostRect = host.getBoundingClientRect();
    const viewportRect = mockupViewport.getBoundingClientRect();
    const frameRect = mockupFrame.getBoundingClientRect();
    const tolerance = 1;
    const clippingValues = new Set(["hidden", "clip", "scroll", "auto"]);
    const targetSelector = [
      "button",
      "input",
      "label",
      "fieldset",
      ".summary-pill",
      ".genre-chip",
      ".compact-genre-chip",
      ".tag-chip",
      ".checkbox",
      ".tempo-fields",
      ".compact-bpm-fields",
      ".rating-row",
      ".compact-rating-row",
      ".check-options",
      ".range-control",
      ".key-art",
      ".icon",
      ".toggle-art",
      ".rating-star",
      ".crown",
    ].join(",");
    const panelSelector = [
      ".bpm-group",
      ".compact-bpm-card",
      ".genre-group",
      ".tags-shell",
      ".compact-tags-shell",
      ".track-state",
      ".check-section",
      ".harmony-shell",
      ".filter-bottom",
      ".filter-controls",
      ".primary-controls",
    ].join(",");

    function visible(element) {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== "none"
        && style.visibility !== "hidden"
        && Number.parseFloat(style.opacity || "1") > 0
        && rect.width > 0
        && rect.height > 0;
    }

    function describe(element) {
      const className = typeof element.className === "string" ? element.className.trim().replace(/\s+/g, ".") : "";
      const text = (element.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 80);
      return `${element.tagName.toLowerCase()}${className ? `.${className}` : ""}${text ? ` [${text}]` : ""}`;
    }

    function box(rect) {
      return {
        left: Number(rect.left.toFixed(2)),
        right: Number(rect.right.toFixed(2)),
        top: Number(rect.top.toFixed(2)),
        bottom: Number(rect.bottom.toFixed(2)),
        width: Number(rect.width.toFixed(2)),
        height: Number(rect.height.toFixed(2)),
      };
    }

    function hasClipBetween(element, boundary, axis) {
      let ancestor = element.parentElement;
      while (ancestor && ancestor !== boundary) {
        const style = getComputedStyle(ancestor);
        const overflow = axis === "x" ? style.overflowX : style.overflowY;
        if (clippingValues.has(overflow)) return true;
        ancestor = ancestor.parentElement;
      }
      return false;
    }

    const offenders = [];

    const hostEscapesViewportX = hostRect.left < viewportRect.left - tolerance
      || hostRect.right > viewportRect.right + tolerance;
    const hostEscapesViewportY = hostRect.top < viewportRect.top - tolerance
      || hostRect.bottom > viewportRect.bottom + tolerance;
    if (hostEscapesViewportX || hostEscapesViewportY) {
      offenders.push({
        kind: "host-vs-mockup-viewport",
        axes: `${hostEscapesViewportX ? "x" : ""}${hostEscapesViewportY ? "y" : ""}`,
        rect: box(hostRect),
        boundary: box(viewportRect),
      });
    }

    for (const element of root.querySelectorAll(targetSelector)) {
      if (!(element instanceof HTMLElement) || !visible(element)) continue;
      const rect = element.getBoundingClientRect();

      const escapesShellX = rect.left < shellRect.left - tolerance || rect.right > shellRect.right + tolerance;
      const escapesShellY = rect.top < shellRect.top - tolerance || rect.bottom > shellRect.bottom + tolerance;
      if (escapesShellX && !hasClipBetween(element, shell, "x")) {
        offenders.push({
          kind: "shell-x",
          element: describe(element),
          rect: box(rect),
          boundary: box(shellRect),
        });
      }
      if (escapesShellY && !hasClipBetween(element, shell, "y")) {
        offenders.push({
          kind: "shell-y",
          element: describe(element),
          rect: box(rect),
          boundary: box(shellRect),
        });
      }

      const panel = element.closest(panelSelector);
      if (!(panel instanceof HTMLElement) || panel === element || !visible(panel)) continue;
      const panelRect = panel.getBoundingClientRect();
      const escapesPanelX = rect.left < panelRect.left - tolerance || rect.right > panelRect.right + tolerance;
      const escapesPanelY = rect.top < panelRect.top - tolerance || rect.bottom > panelRect.bottom + tolerance;
      const visibleEscapeX = escapesPanelX && !hasClipBetween(element, panel, "x");
      const visibleEscapeY = escapesPanelY && !hasClipBetween(element, panel, "y");
      if (visibleEscapeX || visibleEscapeY) {
        offenders.push({
          kind: "panel",
          axes: `${visibleEscapeX ? "x" : ""}${visibleEscapeY ? "y" : ""}`,
          element: describe(element),
          panel: describe(panel),
          rect: box(rect),
          boundary: box(panelRect),
        });
      }
    }

    return {
      state: {
        open: form.getAttribute("data-filter-open"),
        advanced: form.getAttribute("data-filter-advanced"),
      },
      shell: box(shellRect),
      host: box(hostRect),
      viewport: box(viewportRect),
      frame: box(frameRect),
      transform: {
        scale: getComputedStyle(host).scale,
        translate: getComputedStyle(host).translate,
      },
      offenders,
    };
  });

  console.log(`[jestei-layout] ${viewportLabel} ${stateLabel}: ${JSON.stringify(report)}`);
  if (report.offenders.length) {
    throw new Error(`[jestei-layout] ${viewportLabel} ${stateLabel}: ${report.offenders.length} visible controls escape their layout owner`);
  }
}

async function inspectJesteiSummaryPartialClipping(filter, viewportLabel) {
  const report = await filter.evaluate((host) => {
    const root = host.shadowRoot;
    if (!root) throw new Error("missing playlist-filter-workflow shadow root");

    const shell = root.querySelector(".contains-shell");
    if (!(shell instanceof HTMLElement)) throw new Error("missing .contains-shell");

    const shellRect = shell.getBoundingClientRect();
    const tolerance = 1;
    const partial = [];

    for (const pill of root.querySelectorAll(".contains-shell .summary-pill")) {
      if (!(pill instanceof HTMLElement)) continue;
      const style = getComputedStyle(pill);
      if (style.display === "none" || style.visibility === "hidden") continue;

      const rect = pill.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) continue;

      const visibleLeft = Math.max(rect.left, shellRect.left);
      const visibleRight = Math.min(rect.right, shellRect.right);
      const visibleWidth = Math.max(0, visibleRight - visibleLeft);
      const isPartial = visibleWidth > tolerance && visibleWidth < rect.width - tolerance;
      if (!isPartial) continue;

      partial.push({
        text: (pill.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 80),
        left: Number(rect.left.toFixed(2)),
        right: Number(rect.right.toFixed(2)),
        width: Number(rect.width.toFixed(2)),
        visibleWidth: Number(visibleWidth.toFixed(2)),
      });
    }

    return {
      shell: {
        left: Number(shellRect.left.toFixed(2)),
        right: Number(shellRect.right.toFixed(2)),
        width: Number(shellRect.width.toFixed(2)),
        scrollLeft: Number(shell.scrollLeft.toFixed(2)),
        scrollWidth: shell.scrollWidth,
      },
      partial,
    };
  });

  console.log(`[jestei-summary-clip] ${viewportLabel}: ${JSON.stringify(report)}`);
  if (report.partial.length) {
    throw new Error(`[jestei-summary-clip] ${viewportLabel}: ${report.partial.length} summary pills are partially clipped`);
  }
}

async function runJesteiFilterArtworkSanity({ browser, baseUrl }) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const browserMessages = [];
  page.on("console", (message) => {
    if (["error", "warning"].includes(message.type())) {
      browserMessages.push(`${message.type()}: ${message.text()}`);
    }
  });
  page.on("pageerror", (error) => browserMessages.push(`pageerror: ${error.message}`));

  try {
    await page.goto(new URL("/work/jestei-pool/", baseUrl).href, {
      waitUntil: "domcontentloaded",
      timeout: 30_000,
    });

    const filter = page.locator("playlist-filter-workflow");
    await filter.waitFor({ state: "visible", timeout: 10_000 });

    for (const viewport of [
      { width: 1440, height: 900 },
      { width: 1180, height: 900 },
      { width: 1024, height: 900 },
      { width: 900, height: 900 },
      { width: 770, height: 900 },
      { width: 650, height: 900 },
      { width: 390, height: 844 },
    ]) {
      await page.setViewportSize(viewport);
      await filter.scrollIntoViewIfNeeded();
      await settle(page);

      await setJesteiFilterState(filter, page, { open: true, advanced: true });
      await inspectJesteiLayoutEscapes(filter, `${viewport.width}x${viewport.height}`, "advanced");
      await inspectJesteiSummaryPartialClipping(filter, `${viewport.width}x${viewport.height}`);

      await setJesteiFilterState(filter, page, { open: true, advanced: false });
      await inspectJesteiLayoutEscapes(filter, `${viewport.width}x${viewport.height}`, "compact");

      await setJesteiFilterState(filter, page, { open: false });
      await inspectJesteiLayoutEscapes(filter, `${viewport.width}x${viewport.height}`, "collapsed");

      await setJesteiFilterState(filter, page, { open: true, advanced: true });
    }

    await page.setViewportSize({ width: 1440, height: 900 });
    await setJesteiFilterState(filter, page, { open: true, advanced: true });
    const allStars = filter.locator(".rating-star img");
    const visibleStars = await visibleLocators(allStars);
    console.log(`[jestei-filter-art] rating stars: total=${await allStars.count()} visible=${visibleStars.length}`);
    if (visibleStars.length !== 5) {
      throw new Error(`[jestei-filter-art] expected 5 visible rating stars, found ${visibleStars.length}`);
    }
    for (let index = 0; index < visibleStars.length; index += 1) {
      await inspectImage(visibleStars[index], `visible rating star ${index + 1}`);
    }

    const allKeyArt = filter.locator("[data-key-art-image]");
    const visibleKeyArt = await visibleLocators(allKeyArt);
    console.log(`[jestei-filter-art] Camelot art: total=${await allKeyArt.count()} visible=${visibleKeyArt.length}`);
    if (visibleKeyArt.length !== 1) {
      throw new Error(`[jestei-filter-art] expected 1 visible Camelot key wheel, found ${visibleKeyArt.length}`);
    }
    await inspectImage(visibleKeyArt[0], "visible Camelot key wheel");

    const allKeyButtons = filter.locator(".key-button[data-action=\"key\"]");
    const visibleKeyButtons = await visibleLocators(allKeyButtons);
    if (visibleKeyButtons.length !== 1) {
      throw new Error(`[jestei-filter-art] expected 1 visible Camelot modal trigger, found ${visibleKeyButtons.length}`);
    }
    await visibleKeyButtons[0].scrollIntoViewIfNeeded();
    await visibleKeyButtons[0].click();
    const dialog = filter.locator("#playlist-filter-key-dialog");
    await dialog.waitFor({ state: "visible", timeout: 5_000 });
    console.log("[jestei-filter-art] Camelot modal trigger: OK");
  } catch (error) {
    if (browserMessages.length) {
      console.error(`[jestei-filter-art] browser messages:\n${browserMessages.join("\n")}`);
    }
    throw error;
  } finally {
    await page.close();
  }
}

export async function runProductionE2E({ browser, baseUrl }) {
  const analyticsSafeBrowser = createInternalAnalyticsBrowser(browser);
  await runQuickSmoke({ browser: analyticsSafeBrowser, baseUrl, cvMode: "production" });
  await runMediaSanity({ browser: analyticsSafeBrowser, baseUrl });
  await runJesteiFilterArtworkSanity({ browser: analyticsSafeBrowser, baseUrl });
}

if (isDirectExecution(import.meta.url)) {
  await withE2ERuntime(({ browser, baseUrl }) => runProductionE2E({ browser, baseUrl }));
}
