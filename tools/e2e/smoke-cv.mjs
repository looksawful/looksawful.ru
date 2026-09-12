import { waitForDocumentReady, waitForAnimationFrames, waitForLightboxClosed } from "./readiness.mjs";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

import { cvContent } from "../../src/data/cv.ts";
import { isDirectExecution, withE2ERuntime } from "./runtime.mjs";

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

export function getCvScriptContractViolations(mode, state) {
  if (mode === "authored") {
    return state.scriptCount === 0 ? [] : ["authored CV must remain script-free"];
  }
  if (mode !== "production") throw new Error(`invalid CV smoke mode: ${String(mode)}`);

  const violations = [];
  if (state.siteApplicationRuntimeCount !== 0) {
    violations.push("production CV must not load the site application runtime");
  }
  if (state.yandexRuntimeCount !== 0) {
    violations.push("Yandex Metrica must remain unloaded before analytics consent");
  }
  if (state.unexpectedScriptCount !== 0) {
    violations.push("production CV contains an unexpected script");
  }
  if (state.staticAnalyticsBootstrapCount > 1) {
    violations.push("production CV contains duplicate static analytics bootstraps");
  }
  if (state.cloudflareAnalyticsCount > 1) {
    violations.push("production CV contains duplicate Cloudflare analytics scripts");
  }
  return violations;
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
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
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

      const scripts = [...document.scripts];
      const isSiteApplicationRuntime = (script) => {
        const src = script.getAttribute("src") || "";
        return src === "/src/main.js" || /^\/assets\/main-[^/]+\.js(?:\?.*)?$/.test(src);
      };
      const isStaticAnalyticsBootstrap = (script) => script.hasAttribute("data-static-site-analytics");
      const isCloudflareAnalytics = (script) => script.getAttribute("data-site-analytics") === "cloudflare";
      const isYandexRuntime = (script) => script.getAttribute("data-site-analytics") === "yandex";

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
        scriptCount: scripts.length,
        siteApplicationRuntimeCount: scripts.filter(isSiteApplicationRuntime).length,
        staticAnalyticsBootstrapCount: scripts.filter(isStaticAnalyticsBootstrap).length,
        cloudflareAnalyticsCount: scripts.filter(isCloudflareAnalytics).length,
        yandexRuntimeCount: scripts.filter(isYandexRuntime).length,
        unexpectedScriptCount: scripts.filter((script) => !(
          isSiteApplicationRuntime(script)
          || isStaticAnalyticsBootstrap(script)
          || isCloudflareAnalytics(script)
          || isYandexRuntime(script)
        )).length,
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
    const scriptViolations = getCvScriptContractViolations(mode, state);
    assert(scriptViolations.length === 0, `${label}: ${scriptViolations.join("; ")}`);
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

export async function runSmokeCv({ browser, baseUrl, mode = "authored" }) {
  BASE_URL = baseUrl;
  const expectedHiddenCards = getExpectedCvHiddenCards(mode);
  for (const viewport of VIEWPORTS) {
    await auditViewport(browser, viewport, mode, expectedHiddenCards);
  }
  console.log(`CV browser smoke OK: ${VIEWPORTS.length} viewports (${mode})`);
}

if (isDirectExecution(import.meta.url)) {
  await withE2ERuntime(({ browser, baseUrl }) => runSmokeCv({ browser, baseUrl, mode: "authored" }));
}