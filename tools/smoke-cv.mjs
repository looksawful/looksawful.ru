import { waitForDocumentReady, waitForAnimationFrames, waitForLightboxClosed } from "./e2e/readiness.mjs";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

import { cvContent } from "../src/data/cv.ts";
import { isDirectExecution, withE2ERuntime } from "./e2e/runtime.mjs";

let BASE_URL = "";
const CAPTURE_DIR = process.env.CV_SMOKE_CAPTURE_DIR
  ? resolve(process.env.CV_SMOKE_CAPTURE_DIR)
  : null;
const hasExperienceCopy = (entry) => Boolean(
  entry.company
  || entry.context
  || entry.period
  || entry.role
  || entry.description
  || entry.cases.some(Boolean)
  || entry.facts.some(({ label, text }) => label || text)
  || entry.links.some(Boolean)
);
const visibleExperience = cvContent.experience.filter((entry) => entry.visible && hasExperienceCopy(entry));
const AUTHORED_HIDDEN_CARDS = cvContent.experience.length - visibleExperience.length;
const AUTHORED_CARD_COUNT = cvContent.experience.length;
const VIEWPORTS = [
  { label: "phone", width: 390, height: 844 },
  { label: "tablet", width: 1024, height: 768 },
  { label: "desktop", width: 1440, height: 900 },
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

export function getExpectedCvHiddenCards(mode) {
  if (mode === "authored") return AUTHORED_HIDDEN_CARDS;
  if (mode === "production") return 0;
  throw new Error(`invalid CV smoke mode: ${String(mode)}`);
}

export function getExpectedCvCardCount(mode) {
  if (mode === "authored") return AUTHORED_CARD_COUNT;
  if (mode === "production") return visibleExperience.length;
  throw new Error(`invalid CV smoke mode: ${String(mode)}`);
}

async function auditViewport(browser, viewport, mode, expectedHiddenCards) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  const errors = [];
  const label = `${viewport.label} ${viewport.width}x${viewport.height}`;

  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`));
  });
  page.on("response", (response) => {
    if (response.status() < 400) return;
    const url = new URL(response.url());
    if (url.origin !== BASE_URL) return;
    errors.push(`response ${response.status()}: ${response.url()}`);
  });

  try {
    const response = await page.goto(`${BASE_URL}/cv/`, {
      waitUntil: "domcontentloaded",
      timeout: 30_000,
    });
    assert(response?.ok(), `${label}: /cv/ returned ${response?.status()}`);

    await page.evaluate(() => document.fonts?.ready);
    await waitForDocumentReady(page, "main.resume");

    const state = await page.evaluate(async () => {
      const root = document.documentElement;
      const resume = document.querySelector(".resume");
      const nav = document.querySelector(".resume-nav");
      const back = document.querySelector(".resume-nav__back");
      const portrait = document.querySelector(".portrait");
      const profileName = document.querySelector(".name");

      if (portrait instanceof HTMLImageElement) {
        if (!portrait.complete) {
          await new Promise((resolvePromise) => {
            portrait.addEventListener("load", resolvePromise, { once: true });
            portrait.addEventListener("error", resolvePromise, { once: true });
            setTimeout(resolvePromise, 5_000);
          });
        }
        try { await portrait.decode(); } catch {}
      }

      return {
        title: document.title,
        profileName: profileName?.textContent?.trim() ?? "",
        bodyBackground: getComputedStyle(document.body).backgroundColor,
        resumeFont: resume instanceof HTMLElement ? getComputedStyle(resume).fontFamily : "",
        navVisible: nav instanceof HTMLElement && getComputedStyle(nav).display !== "none",
        backHref: back instanceof HTMLAnchorElement ? back.getAttribute("href") : null,
        portraitWidth: portrait instanceof HTMLImageElement ? portrait.naturalWidth : 0,
        portraitHeight: portrait instanceof HTMLImageElement ? portrait.naturalHeight : 0,
        overflow: root.scrollWidth - root.clientWidth,
        resumePresent: resume instanceof HTMLElement,
        experienceCards: document.querySelectorAll(".experience-card").length,
        hiddenCards: document.querySelectorAll(".experience-card[hidden]").length,
        scriptCount: document.scripts.length,
      };
    });

    assert(state.title.length > 0, `${label}: page title is missing`);
    assert(state.profileName === cvContent.profile.name, `${label}: CV profile name does not match structured content`);
    assert(state.resumePresent, `${label}: CV main structure is missing`);
    assert(state.experienceCards === getExpectedCvCardCount(mode), `${label}: CV experience structure is incomplete`);
    assert(state.bodyBackground === "rgb(255, 255, 255)", `${label}: page is not pure white`);
    assert(/Arial/i.test(state.resumeFont), `${label}: CV typography changed: ${state.resumeFont}`);
    assert(state.navVisible, `${label}: back navigation is hidden`);
    assert(state.backHref === "/", `${label}: back navigation does not point to /`);
    assert(state.portraitWidth > 0 && state.portraitHeight > 0, `${label}: portrait failed to decode`);
    assert(state.overflow <= 1, `${label}: horizontal document overflow ${state.overflow}px`);
    if (mode === "production") {
      assert(state.hiddenCards === 0, `${label}: production CV must contain zero hidden experience cards, got ${state.hiddenCards}`);
    } else {
      assert(state.hiddenCards === expectedHiddenCards, `${label}: expected ${expectedHiddenCards} hidden experience cards, got ${state.hiddenCards}`);
    }
    assert(state.scriptCount === 0, `${label}: standalone CV unexpectedly loads JavaScript`);
    assert(!errors.length, `${label}: browser errors:\n${errors.join("\n")}`);

    if (CAPTURE_DIR) {
      await mkdir(CAPTURE_DIR, { recursive: true });
      await page.screenshot({
        path: `${CAPTURE_DIR}/${viewport.label}-${viewport.width}x${viewport.height}.png`,
        fullPage: true,
      });
    }

    console.log(`[cv-smoke] ${label} ${mode}: OK`);
  } finally {
    await context.close();
  }
}

export async function runSmokeCv({ browser, baseUrl, mode = "production" }) {
  BASE_URL = baseUrl;
  const expectedHiddenCards = getExpectedCvHiddenCards(mode);
  for (const viewport of VIEWPORTS) {
    await auditViewport(browser, viewport, mode, expectedHiddenCards);
  }
  console.log(`CV browser smoke OK: ${VIEWPORTS.length} viewports (${mode})`);
}

if (isDirectExecution(import.meta.url)) {
  await withE2ERuntime(({ browser, baseUrl }) => runSmokeCv({ browser, baseUrl, mode: "production" }));
}
