import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { cvContent } from "../src/data/cv.ts";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("CV smoke exposes authored and production contracts with authored as the standalone default", async () => {
  const smokeCv = await import("../tools/e2e/smoke-cv.mjs");
  assert.equal(smokeCv.DEFAULT_CV_SMOKE_MODE, "authored");
  assert.equal(typeof smokeCv.getExpectedCvHiddenCards, "function");
  const authoredHidden = cvContent.experience.filter(({ visible }) => !visible).length;
  assert.equal(smokeCv.getExpectedCvHiddenCards("authored"), authoredHidden);
  assert.equal(smokeCv.getExpectedCvHiddenCards("production"), 0);
  assert.throws(() => smokeCv.getExpectedCvHiddenCards("invalid"), /invalid CV smoke mode/i);
});

test("caption QA is import-safe and exposes an explicit runner", async () => {
  const captionQa = await import("../tools/capture-caption-qa.mjs");
  assert.equal(typeof captionQa.captureCaptionQa, "function");
});

test("production E2E wraps the supplied browser once and runs only production gates", async () => {
  const { runProductionE2E } = await import("../tools/e2e/run-production.mjs");
  const browser = { kind: "raw" };
  const analyticsSafeBrowser = { kind: "analytics-safe" };
  const baseUrl = "https://preview.example/";
  const calls = [];

  await runProductionE2E(
    { browser, baseUrl },
    {
      createAnalyticsBrowser(value) {
        calls.push(["wrap", value]);
        return analyticsSafeBrowser;
      },
      async quickSmoke(options) {
        calls.push(["quick", options]);
      },
      async mediaSanity(options) {
        calls.push(["media", options]);
      },
      async filterArtworkSanity(options) {
        calls.push(["filter-art", options]);
      },
    },
  );

  assert.deepEqual(calls, [
    ["wrap", browser],
    ["quick", { browser: analyticsSafeBrowser, baseUrl, cvMode: "production" }],
    ["media", { browser: analyticsSafeBrowser, baseUrl }],
    ["filter-art", { browser: analyticsSafeBrowser, baseUrl }],
  ]);
});

test("direct full E2E options force production CV output", async () => {
  const { DIRECT_E2E_CV_MODE, getDirectSmokeSuiteOptions } = await import("../tools/e2e/run-all.mjs");
  const browser = { kind: "browser" };
  const baseUrl = "https://preview.example/";
  assert.equal(DIRECT_E2E_CV_MODE, "production");
  assert.deepEqual(getDirectSmokeSuiteOptions({ browser, baseUrl }), {
    browser,
    baseUrl,
    cvMode: "production",
  });
});

test("production CV analytics bootstrap expectation follows configured providers", async () => {
  const smoke = await import("../tools/e2e/run-smoke.mjs");
  assert.equal(typeof smoke.getExpectedStaticAnalyticsBootstrapCount, "function");
  assert.equal(smoke.getExpectedStaticAnalyticsBootstrapCount({}), 0);
  assert.equal(
    smoke.getExpectedStaticAnalyticsBootstrapCount({
      VITE_CLOUDFLARE_WEB_ANALYTICS_TOKEN: " ",
      VITE_YANDEX_METRIKA_COUNTER_ID: "not-a-counter",
    }),
    0,
  );
  assert.equal(
    smoke.getExpectedStaticAnalyticsBootstrapCount({
      VITE_CLOUDFLARE_WEB_ANALYTICS_TOKEN: "cf-token",
    }),
    1,
  );
  assert.equal(
    smoke.getExpectedStaticAnalyticsBootstrapCount({
      VITE_YANDEX_METRIKA_COUNTER_ID: "112065623",
    }),
    1,
  );
});

test("production image decode diagnostics identify route and concrete image source", async () => {
  const smoke = await import("../tools/e2e/run-smoke.mjs");
  assert.equal(typeof smoke.formatImageDecodeFailure, "function");
  assert.equal(
    smoke.formatImageDecodeFailure({
      route: "/work/styx/",
      src: "https://www.looksawful.ru/media/example.webp",
      detail: "The source image cannot be decoded.",
    }),
    "/work/styx/: image decode failed: https://www.looksawful.ru/media/example.webp (The source image cannot be decoded.)",
  );
});

test("package scripts expose production E2E without changing standalone smoke commands", async () => {
  const pkg = JSON.parse(await read("package.json"));
  assert.equal(pkg.scripts["test:e2e:production"], "node tools/e2e/run-production.mjs");
  assert.equal(pkg.scripts["test:e2e"], "node tools/e2e/smoke-site.mjs");
  assert.equal(pkg.scripts["test:e2e:cv"], "node tools/e2e/smoke-cv.mjs");
});
