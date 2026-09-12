import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { cvContent } from "../src/data/cv.ts";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("CV smoke exposes authored and production hidden-card contracts", async () => {
  const smokeCv = await import("../tools/e2e/smoke-cv.mjs");
  assert.equal(typeof smokeCv.getExpectedCvHiddenCards, "function");
  const authoredHidden = cvContent.experience.filter(({ visible }) => !visible).length;
  assert.equal(smokeCv.getExpectedCvHiddenCards("authored"), authoredHidden);
  assert.equal(smokeCv.getExpectedCvHiddenCards("production"), 0);
  assert.throws(() => smokeCv.getExpectedCvHiddenCards("invalid"), /invalid CV smoke mode/i);
});

test("CV runner accepts an explicit mode and direct execution stays authored", async () => {
  const source = await read("tools/e2e/smoke-cv.mjs");
  assert.match(source, /runSmokeCv\(\{\s*browser,\s*baseUrl,\s*mode\s*=\s*["']authored["']/s);
  assert.match(source, /getExpectedCvHiddenCards\(mode\)/);
  assert.match(source, /runSmokeCv\(\{\s*browser,\s*baseUrl,\s*mode:\s*["']authored["']/s);
});

test("CV script contract distinguishes authored output from isolated production analytics", async () => {
  const smokeCv = await import("../tools/e2e/smoke-cv.mjs");
  assert.equal(typeof smokeCv.getCvScriptContractViolations, "function");

  assert.deepEqual(smokeCv.getCvScriptContractViolations("authored", {
    scriptCount: 0,
    siteApplicationRuntimeCount: 0,
    staticAnalyticsBootstrapCount: 0,
    cloudflareAnalyticsCount: 0,
    yandexRuntimeCount: 0,
    unexpectedScriptCount: 0,
  }), []);
  assert.deepEqual(smokeCv.getCvScriptContractViolations("authored", {
    scriptCount: 1,
    siteApplicationRuntimeCount: 0,
    staticAnalyticsBootstrapCount: 1,
    cloudflareAnalyticsCount: 0,
    yandexRuntimeCount: 0,
    unexpectedScriptCount: 0,
  }), ["authored CV must remain script-free"]);

  assert.deepEqual(smokeCv.getCvScriptContractViolations("production", {
    scriptCount: 2,
    siteApplicationRuntimeCount: 0,
    staticAnalyticsBootstrapCount: 1,
    cloudflareAnalyticsCount: 1,
    yandexRuntimeCount: 0,
    unexpectedScriptCount: 0,
  }), []);
  assert.deepEqual(smokeCv.getCvScriptContractViolations("production", {
    scriptCount: 3,
    siteApplicationRuntimeCount: 1,
    staticAnalyticsBootstrapCount: 1,
    cloudflareAnalyticsCount: 1,
    yandexRuntimeCount: 0,
    unexpectedScriptCount: 0,
  }), ["production CV must not load the site application runtime"]);
  assert.deepEqual(smokeCv.getCvScriptContractViolations("production", {
    scriptCount: 3,
    siteApplicationRuntimeCount: 0,
    staticAnalyticsBootstrapCount: 1,
    cloudflareAnalyticsCount: 1,
    yandexRuntimeCount: 1,
    unexpectedScriptCount: 0,
  }), ["Yandex Metrica must remain unloaded before analytics consent"]);
  assert.deepEqual(smokeCv.getCvScriptContractViolations("production", {
    scriptCount: 3,
    siteApplicationRuntimeCount: 0,
    staticAnalyticsBootstrapCount: 1,
    cloudflareAnalyticsCount: 1,
    yandexRuntimeCount: 0,
    unexpectedScriptCount: 1,
  }), ["production CV contains an unexpected script"]);
  assert.throws(
    () => smokeCv.getCvScriptContractViolations("invalid", {
      scriptCount: 0,
      siteApplicationRuntimeCount: 0,
      staticAnalyticsBootstrapCount: 0,
      cloudflareAnalyticsCount: 0,
      yandexRuntimeCount: 0,
      unexpectedScriptCount: 0,
    }),
    /invalid CV smoke mode/i,
  );
});

test("caption QA stays optional and import-safe", async () => {
  const source = await read("tools/capture-caption-qa.mjs");
  assert.match(source, /export async function captureCaptionQa\(\{\s*browser,\s*baseUrl,/s);
  assert.match(source, /if \(isDirectExecution\(import\.meta\.url\)\)/);
  assert.match(source, /withE2ERuntime/);
  assert.doesNotMatch(source, /chromium\.launch/);
});

test("production E2E runner reuses one runtime for compact production smoke and media sanity only", async () => {
  const source = await read("tools/e2e/run-production.mjs");
  assert.match(source, /runQuickSmoke\(\{\s*browser,\s*baseUrl,\s*cvMode:\s*["']production["']/s);
  assert.match(source, /runMediaSanity\(\{\s*browser,\s*baseUrl\s*\}\)/s);
  assert.match(source, /withE2ERuntime/);
  assert.doesNotMatch(source, /captureCaptionQa|runAllSmokeSuites|runSmokeNavigation|runSmokeMpa/);
});

test("full combined E2E validates production CV output on direct execution", async () => {
  const source = await read("tools/e2e/run-all.mjs");
  assert.match(source, /runAllSmokeSuites\(\{\s*browser,\s*baseUrl,\s*cvMode\s*=\s*["']authored["']/s);
  assert.match(
    source,
    /isDirectExecution\(import\.meta\.url\)[\s\S]*?runAllSmokeSuites\(\{\s*browser,\s*baseUrl,\s*cvMode:\s*["']production["']/s,
  );
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