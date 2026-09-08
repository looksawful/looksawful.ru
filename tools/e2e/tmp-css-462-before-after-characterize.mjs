import { waitForDocumentReady, waitForAnimationFrames } from "./readiness.mjs";
import { isDirectExecution, withE2ERuntime } from "./runtime.mjs";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function openCase(context, baseUrl) {
  const page = await context.newPage();
  await page.goto(`${baseUrl}/work/jestei-pool/`, { waitUntil: "domcontentloaded", timeout: 30_000 });
  await page.evaluate(() => document.fonts?.ready);
  await waitForDocumentReady(page);
  const root = page.locator("#jestei-subscription [data-before-after]").first();
  assert(await root.count(), "missing Jestei subscription before-after root");
  await root.scrollIntoViewIfNeeded();
  await waitForAnimationFrames(page);
  return { page, root };
}

async function auditCompactCoarseReduced(browser, baseUrl) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 1,
    reducedMotion: "reduce",
  });
  try {
    const { page, root } = await openCase(context, baseUrl);
    await page.waitForTimeout(1400);
    const state = await root.evaluate((node) => {
      const range = node.querySelector(".before-after__range");
      const viewport = node.querySelector(".before-after__viewport");
      const caption = node.querySelector(":scope > .media__caption");
      const captionText = caption?.querySelector(".media__text");
      if (!(range instanceof HTMLInputElement) || !(viewport instanceof HTMLElement)) return null;
      const before = { value: range.value, split: node.style.getPropertyValue("--before-after-split").trim() };
      range.value = "37";
      range.dispatchEvent(new Event("input", { bubbles: true }));
      const after = { value: range.value, split: node.style.getPropertyValue("--before-after-split").trim() };
      return {
        before,
        after,
        coarse: matchMedia("(pointer: coarse)").matches,
        hover: matchMedia("(hover: hover)").matches,
        reduced: matchMedia("(prefers-reduced-motion: reduce)").matches,
        touchAction: getComputedStyle(viewport).touchAction,
        captionDisplay: caption ? getComputedStyle(caption).display : null,
        captionTextDisplay: captionText ? getComputedStyle(captionText).display : null,
      };
    });
    assert(state, "compact: before-after DOM contract missing");
    assert(state.coarse === true, `compact: expected coarse pointer, got ${JSON.stringify(state)}`);
    assert(state.reduced === true, `compact: expected reduced motion, got ${JSON.stringify(state)}`);
    assert(state.touchAction === "pan-y", `compact: touch-action drifted to ${state.touchAction}`);
    assert(state.before.value === "50" && state.before.split === "50%", `compact: reduced-motion auto reveal changed authored value ${JSON.stringify(state.before)}`);
    assert(state.after.split === "37%", `compact: input did not update split ${JSON.stringify(state.after)}`);
    assert(state.captionDisplay !== "none", "compact: summary caption hidden");
    assert(state.captionTextDisplay === "none", `compact: summary detail should stay hidden, got ${state.captionTextDisplay}`);
    console.log("[css-462] compact/coarse/reduced-motion before-after characterization: OK");
  } finally {
    await context.close();
  }
}

async function auditWideFineKeyboard(browser, baseUrl) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    isMobile: false,
    hasTouch: false,
    deviceScaleFactor: 1,
    reducedMotion: "no-preference",
  });
  try {
    const { page, root } = await openCase(context, baseUrl);
    await page.waitForTimeout(1400);
    const range = root.locator(".before-after__range");
    await range.focus();
    await page.keyboard.press("Home");
    await waitForAnimationFrames(page);
    const state = await root.evaluate((node) => {
      const range = node.querySelector(".before-after__range");
      const viewport = node.querySelector(".before-after__viewport");
      const caption = node.querySelector(":scope > .media__caption");
      const captionText = caption?.querySelector(".media__text");
      if (!(range instanceof HTMLInputElement) || !(viewport instanceof HTMLElement)) return null;
      const outline = getComputedStyle(viewport);
      return {
        value: range.value,
        split: node.style.getPropertyValue("--before-after-split").trim(),
        fine: matchMedia("(pointer: fine)").matches,
        hover: matchMedia("(hover: hover)").matches,
        reduced: matchMedia("(prefers-reduced-motion: reduce)").matches,
        focusVisible: range.matches(":focus-visible"),
        outlineStyle: outline.outlineStyle,
        outlineWidth: outline.outlineWidth,
        captionDisplay: caption ? getComputedStyle(caption).display : null,
        captionTextDisplay: captionText ? getComputedStyle(captionText).display : null,
      };
    });
    assert(state, "wide: before-after DOM contract missing");
    assert(state.fine === true && state.hover === true, `wide: expected fine hover pointer, got ${JSON.stringify(state)}`);
    assert(state.reduced === false, `wide: no-preference context misreported ${JSON.stringify(state)}`);
    assert(state.value === "0" && state.split === "0%", `wide: keyboard Home did not drive runtime ${JSON.stringify(state)}`);
    assert(state.focusVisible === true, `wide: range did not retain :focus-visible ${JSON.stringify(state)}`);
    assert(state.outlineStyle === "solid" && state.outlineWidth === "2px", `wide: focus outline contract drifted ${JSON.stringify(state)}`);
    assert(state.captionDisplay !== "none", "wide: summary caption hidden");
    assert(state.captionTextDisplay === "none", `wide: summary detail should stay hidden, got ${state.captionTextDisplay}`);
    console.log("[css-462] wide/fine/keyboard-focus before-after characterization: OK");
  } finally {
    await context.close();
  }
}

export async function runBeforeAfterCharacterization({ browser, baseUrl }) {
  await auditCompactCoarseReduced(browser, baseUrl);
  await auditWideFineKeyboard(browser, baseUrl);
}

if (isDirectExecution(import.meta.url)) {
  await withE2ERuntime(({ browser, baseUrl }) => runBeforeAfterCharacterization({ browser, baseUrl }));
}
