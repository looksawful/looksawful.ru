import { validateDynamicReviewState } from "./runtime-matrix.mjs";

export const DEFAULT_REVIEW_SEED = 1087;
export const DEFAULT_REVIEW_TIME = "2026-01-01T12:00:00.000Z";
export const REVIEW_CAPTURE_TIMEOUT_MS = 10_000;
export const REVIEW_STATE_REQUEST_EVENT = "looksawful:review-state-request";

const MAX_TIMEOUT_MS = 30_000;
const ALLOWED_LOCAL_PROTOCOLS = new Set(["data:", "blob:", "about:"]);

function positiveInteger(value, label, max = Number.MAX_SAFE_INTEGER) {
  if (!Number.isInteger(value) || value < 1 || value > max) {
    throw new TypeError(`${label} must be an integer between 1 and ${max}`);
  }
  return value;
}

export function normalizeDeterministicOptions({
  seed = DEFAULT_REVIEW_SEED,
  fixedTime = DEFAULT_REVIEW_TIME,
  timeoutMs = REVIEW_CAPTURE_TIMEOUT_MS,
} = {}) {
  if (!Number.isInteger(seed) || seed < 0 || seed > 0xffff_ffff) {
    throw new TypeError("Review seed must be an unsigned 32-bit integer");
  }

  const fixedEpochMs = Date.parse(fixedTime);
  if (!Number.isFinite(fixedEpochMs)) {
    throw new TypeError("Review fixed time must be an ISO-compatible date");
  }

  return Object.freeze({
    seed,
    fixedTime: new Date(fixedEpochMs).toISOString(),
    fixedEpochMs,
    timeoutMs: positiveInteger(timeoutMs, "Review readiness timeout", MAX_TIMEOUT_MS),
  });
}

export function classifyReviewRequest(requestUrl, baseUrl) {
  let request;
  let base;
  try {
    request = new URL(requestUrl);
    base = new URL(baseUrl);
  } catch {
    return "abort";
  }

  if (ALLOWED_LOCAL_PROTOCOLS.has(request.protocol)) return "allow";
  if (!["http:", "https:"].includes(request.protocol)) return "abort";
  return request.origin === base.origin ? "allow" : "abort";
}

export function createDeterministicCaptureStyle() {
  return `
    html {
      scroll-behavior: auto !important;
    }

    *, *::before, *::after {
      animation-duration: 0s !important;
      animation-delay: 0s !important;
      animation-iteration-count: 1 !important;
      animation-play-state: paused !important;
      transition-duration: 0s !important;
      transition-delay: 0s !important;
      scroll-behavior: auto !important;
      caret-color: transparent !important;
    }
  `;
}

function deterministicBootstrap({ seed, fixedEpochMs }) {
  let randomState = seed >>> 0;
  const nextRandom = () => {
    randomState = (randomState + 0x6d2b79f5) >>> 0;
    let value = randomState;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };

  Math.random = nextRandom;

  try {
    const cryptoPrototype = Object.getPrototypeOf(window.crypto);
    const deterministicGetRandomValues = function getRandomValues(view) {
      if (!ArrayBuffer.isView(view) || view instanceof DataView) {
        throw new TypeError("Expected an integer TypedArray");
      }

      const bytes = new Uint8Array(view.buffer, view.byteOffset, view.byteLength);
      for (let index = 0; index < bytes.length; index += 1) {
        bytes[index] = Math.floor(nextRandom() * 256);
      }
      return view;
    };

    Object.defineProperty(cryptoPrototype, "getRandomValues", {
      configurable: true,
      value: deterministicGetRandomValues,
    });

    if ("randomUUID" in cryptoPrototype) {
      Object.defineProperty(cryptoPrototype, "randomUUID", {
        configurable: true,
        value() {
          const bytes = deterministicGetRandomValues(new Uint8Array(16));
          bytes[6] = (bytes[6] & 0x0f) | 0x40;
          bytes[8] = (bytes[8] & 0x3f) | 0x80;
          const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, "0"));
          return [
            hex.slice(0, 4).join(""),
            hex.slice(4, 6).join(""),
            hex.slice(6, 8).join(""),
            hex.slice(8, 10).join(""),
            hex.slice(10).join(""),
          ].join("-");
        },
      });
    }
  } catch {}

  const NativeDate = Date;
  function FixedDate(...args) {
    if (!new.target) return new NativeDate(fixedEpochMs).toString();
    return Reflect.construct(
      NativeDate,
      args.length > 0 ? args : [fixedEpochMs],
      new.target,
    );
  }
  Object.setPrototypeOf(FixedDate, NativeDate);
  FixedDate.prototype = NativeDate.prototype;
  FixedDate.now = () => fixedEpochMs;
  Object.defineProperty(window, "Date", {
    configurable: true,
    writable: true,
    value: FixedDate,
  });

  const fixedAnimationTime = 1_000;
  try {
    Object.defineProperty(window.performance, "now", {
      configurable: true,
      value: () => fixedAnimationTime,
    });
  } catch {}

  const nativeRequestAnimationFrame = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = (callback) =>
    nativeRequestAnimationFrame(() => callback(fixedAnimationTime));

  try {
    const nativePause = HTMLMediaElement.prototype.pause;
    Object.defineProperty(HTMLMediaElement.prototype, "play", {
      configurable: true,
      value() {
        nativePause.call(this);
        return Promise.resolve();
      },
    });
  } catch {}

  const markCaptureMode = () => {
    document.documentElement?.setAttribute("data-review-capture", "deterministic");
  };
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", markCaptureMode, { once: true });
  } else {
    markCaptureMode();
  }
}

export async function installDeterministicReviewEnvironment(
  context,
  { baseUrl, ...options },
) {
  const normalized = normalizeDeterministicOptions(options);
  if (typeof baseUrl !== "string" || baseUrl.trim() === "") {
    throw new TypeError("Review baseUrl is required");
  }

  await context.addInitScript(deterministicBootstrap, {
    seed: normalized.seed,
    fixedEpochMs: normalized.fixedEpochMs,
  });

  await context.route("**/*", async (route) => {
    const decision = classifyReviewRequest(route.request().url(), baseUrl);
    if (decision === "allow") {
      await route.continue();
      return;
    }
    await route.abort("blockedbyclient");
  });

  return normalized;
}

async function primeLazyMedia(page) {
  await page.evaluate(() => {
    document.querySelectorAll("img").forEach((image) => {
      image.loading = "eager";
    });

    document.querySelectorAll("video").forEach((video) => {
      video.preload = "auto";
      let sourceChanged = false;

      if (!video.getAttribute("src") && video.dataset.src) {
        video.setAttribute("src", video.dataset.src);
        sourceChanged = true;
      }

      video.querySelectorAll("source[data-src]").forEach((source) => {
        if (source.getAttribute("src")) return;
        const deferredSource = source.getAttribute("data-src");
        if (!deferredSource) return;
        source.setAttribute("src", deferredSource);
        sourceChanged = true;
      });

      if (sourceChanged || video.readyState === HTMLMediaElement.HAVE_NOTHING) {
        video.load();
      }
    });
  });
}

async function waitForFonts(page, timeoutMs) {
  await page.waitForFunction(
    async () => {
      if (!document.fonts?.ready) return true;
      try {
        await document.fonts.ready;
        return document.fonts.status === "loaded";
      } catch {
        return false;
      }
    },
    undefined,
    { timeout: timeoutMs },
  );
}

async function waitForImages(page, timeoutMs) {
  await page.waitForFunction(
    async () => {
      const images = [...document.images].filter(
        (image) => Boolean(image.currentSrc || image.getAttribute("src")),
      );
      if (!images.every((image) => image.complete && image.naturalWidth > 0)) {
        return false;
      }

      const decoded = await Promise.all(
        images.map(async (image) => {
          if (typeof image.decode !== "function") return true;
          try {
            await image.decode();
            return image.naturalWidth > 0;
          } catch {
            return false;
          }
        }),
      );
      return decoded.every(Boolean);
    },
    undefined,
    { timeout: timeoutMs },
  );
}

export async function waitForReviewResources(
  page,
  { timeoutMs = REVIEW_CAPTURE_TIMEOUT_MS, prime = true } = {},
) {
  const boundedTimeout = positiveInteger(
    timeoutMs,
    "Review readiness timeout",
    MAX_TIMEOUT_MS,
  );
  if (prime) await primeLazyMedia(page);
  await waitForFonts(page, boundedTimeout);
  await waitForImages(page, boundedTimeout);
}

async function waitForAttributeState(page, selector, state, timeoutMs) {
  await page.waitForFunction(
    ({ selector: targetSelector, attribute, value }) => {
      const element = document.querySelector(targetSelector);
      return element?.getAttribute(attribute) === value;
    },
    {
      selector,
      attribute: state.attribute,
      value: state.value,
    },
    { timeout: timeoutMs },
  );
}

async function prepareVideoState(page, state, timeoutMs) {
  const locator = page.locator(state.selector).first();
  await locator.waitFor({ state: "attached", timeout: timeoutMs });
  await locator.scrollIntoViewIfNeeded({ timeout: timeoutMs });

  await page.waitForFunction(
    ({ selector, time }) => {
      const video = document.querySelector(selector);
      if (!(video instanceof HTMLVideoElement)) return false;
      if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return false;
      if (time > 0 && (!Number.isFinite(video.duration) || video.duration < time)) {
        return false;
      }
      return true;
    },
    { selector: state.selector, time: state.time },
    { timeout: timeoutMs },
  );

  await locator.evaluate((video, time) => {
    if (!(video instanceof HTMLVideoElement)) {
      throw new TypeError("Declared review video selector did not resolve to a video");
    }

    video.autoplay = false;
    video.loop = false;
    video.muted = true;
    video.pause();
    if (Math.abs(video.currentTime - time) > 0.01) video.currentTime = time;
  }, state.time);

  await page.waitForFunction(
    ({ selector, time }) => {
      const video = document.querySelector(selector);
      return (
        video instanceof HTMLVideoElement &&
        video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
        video.paused &&
        Math.abs(video.currentTime - time) <= 0.05
      );
    },
    { selector: state.selector, time: state.time },
    { timeout: timeoutMs },
  );
}

async function prepareAttributeState(page, state, timeoutMs) {
  const locator = page.locator(state.selector).first();
  await locator.waitFor({ state: "attached", timeout: timeoutMs });
  await locator.scrollIntoViewIfNeeded({ timeout: timeoutMs });

  await locator.evaluate(
    (element, detail) => {
      element.dispatchEvent(
        new CustomEvent("looksawful:review-state-request", {
          bubbles: true,
          detail,
        }),
      );
    },
    {
      id: state.id,
      kind: state.kind,
      stable: state.stable,
    },
  );

  await waitForAttributeState(page, state.selector, state.ready, timeoutMs);
  await waitForAttributeState(page, state.selector, state.stable, timeoutMs);
}

export async function prepareDynamicReviewStates(
  page,
  states = [],
  { timeoutMs = REVIEW_CAPTURE_TIMEOUT_MS } = {},
) {
  if (!Array.isArray(states)) {
    throw new TypeError("Dynamic review states must be an array");
  }

  const boundedTimeout = positiveInteger(
    timeoutMs,
    "Review readiness timeout",
    MAX_TIMEOUT_MS,
  );
  const normalized = states.map(validateDynamicReviewState);

  for (const state of normalized) {
    if (state.kind === "video") {
      await prepareVideoState(page, state, boundedTimeout);
    } else {
      await prepareAttributeState(page, state, boundedTimeout);
    }
  }

  if (normalized.length > 0) {
    await page.evaluate(() => window.scrollTo({ top: 0, left: 0, behavior: "auto" }));
  }

  return normalized;
}

export async function settleDeterministicReviewPage(
  page,
  {
    dynamicStates = [],
    timeoutMs = REVIEW_CAPTURE_TIMEOUT_MS,
  } = {},
) {
  const boundedTimeout = positiveInteger(
    timeoutMs,
    "Review readiness timeout",
    MAX_TIMEOUT_MS,
  );

  await page.addStyleTag({ content: createDeterministicCaptureStyle() });
  await waitForReviewResources(page, {
    timeoutMs: boundedTimeout,
    prime: true,
  });
  await prepareDynamicReviewStates(page, dynamicStates, {
    timeoutMs: boundedTimeout,
  });
  await waitForReviewResources(page, {
    timeoutMs: boundedTimeout,
    prime: false,
  });
}

function attachRuntimeGuards(page, baseUrl) {
  const errors = [];

  page.on("pageerror", (error) => {
    errors.push(`pageerror: ${error.message}`);
  });

  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });

  page.on("requestfailed", (request) => {
    if (classifyReviewRequest(request.url(), baseUrl) !== "allow") return;
    const failure = request.failure();
    errors.push(`requestfailed: ${request.url()} ${failure?.errorText ?? ""}`.trim());
  });

  return errors;
}

function assertRuntimeRow(row) {
  if (!row || typeof row !== "object") {
    throw new TypeError("Review runtime row is required");
  }
  positiveInteger(row.width, "Review viewport width");
  positiveInteger(row.height, "Review viewport height");
  if (!["no-preference", "reduce"].includes(row.motion)) {
    throw new TypeError(`Unsupported review motion profile: ${row.motion}`);
  }
}

export async function openReviewPage({
  browser,
  baseUrl,
  route = "/",
  row,
  dynamicStates = [],
  deterministicOptions = {},
}) {
  if (!browser || typeof browser.newContext !== "function") {
    throw new TypeError("A Playwright browser is required");
  }
  assertRuntimeRow(row);

  const normalized = normalizeDeterministicOptions(deterministicOptions);
  const context = await browser.newContext({
    viewport: { width: row.width, height: row.height },
    deviceScaleFactor: 1,
    reducedMotion: row.motion,
    colorScheme: "light",
    locale: "en-US",
    timezoneId: "UTC",
    serviceWorkers: "block",
  });

  try {
    if (row.deterministic) {
      await installDeterministicReviewEnvironment(context, {
        baseUrl,
        ...normalized,
      });
    }

    const page = await context.newPage();
    page.setDefaultTimeout(normalized.timeoutMs);
    page.setDefaultNavigationTimeout(normalized.timeoutMs);
    const runtimeErrors = attachRuntimeGuards(page, baseUrl);

    const response = await page.goto(new URL(route, baseUrl).href, {
      waitUntil: "domcontentloaded",
      timeout: normalized.timeoutMs,
    });
    if (!response?.ok()) {
      throw new Error(
        `Review navigation failed: ${response?.status() ?? "no response"}`,
      );
    }

    if (row.deterministic) {
      await settleDeterministicReviewPage(page, {
        dynamicStates,
        timeoutMs: normalized.timeoutMs,
      });
    } else {
      await page.waitForLoadState("load", { timeout: normalized.timeoutMs });
      await waitForReviewResources(page, {
        timeoutMs: normalized.timeoutMs,
        prime: false,
      });
    }

    if (runtimeErrors.length > 0) {
      throw new Error(`Review runtime errors:\n${runtimeErrors.join("\n")}`);
    }

    return {
      context,
      page,
      runtimeErrors,
      deterministicOptions: normalized,
    };
  } catch (error) {
    await context.close();
    throw error;
  }
}

export async function captureReviewEvidence(
  page,
  row,
  { timeoutMs = REVIEW_CAPTURE_TIMEOUT_MS } = {},
) {
  if (!row?.deterministic || row.phase !== "capture") {
    throw new TypeError("Screenshot evidence requires a deterministic capture row");
  }

  const boundedTimeout = positiveInteger(
    timeoutMs,
    "Review screenshot timeout",
    MAX_TIMEOUT_MS,
  );
  await page.evaluate(() => window.scrollTo({ top: 0, left: 0, behavior: "auto" }));

  const evidence = [];
  for (const kind of row.captureKinds ?? []) {
    if (!["viewport", "full-page"].includes(kind)) {
      throw new TypeError(`Unsupported review capture kind: ${kind}`);
    }

    const bytes = await page.screenshot({
      type: "png",
      fullPage: kind === "full-page",
      animations: "disabled",
      caret: "hide",
      scale: "css",
      timeout: boundedTimeout,
    });
    evidence.push(Object.freeze({ kind, bytes }));
  }

  return evidence;
}
