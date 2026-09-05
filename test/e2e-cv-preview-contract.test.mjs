import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const runAllUrl = new URL("../tools/e2e/run-all.mjs", import.meta.url);
const runSmokeUrl = new URL("../tools/e2e/run-smoke.mjs", import.meta.url);
const smokeCvUrl = new URL("../tools/smoke-cv.mjs", import.meta.url);

test("shared Vite preview smoke defaults CV checks to production output", async () => {
  const [runAll, runSmoke, smokeCv] = await Promise.all([
    readFile(runAllUrl, "utf8"),
    readFile(runSmokeUrl, "utf8"),
    readFile(smokeCvUrl, "utf8"),
  ]);

  assert.match(runAll, /cvMode\s*=\s*["']production["']/);
  assert.match(runSmoke, /cvMode\s*=\s*["']production["']/);
  assert.match(smokeCv, /mode\s*=\s*["']production["']/);
  assert.match(smokeCv, /mode\s*===\s*["']authored["']/);
  assert.match(smokeCv, /mode\s*===\s*["']production["']/);
});

test("production CV analytics bootstrap expectation follows configured providers", async () => {
  const module = await import(`${runSmokeUrl.href}?cv-preview-contract=${Date.now()}`);
  const hasConfiguredCvAnalytics = module.hasConfiguredCvAnalytics;

  assert.equal(typeof hasConfiguredCvAnalytics, "function");
  assert.equal(hasConfiguredCvAnalytics({}), false);
  assert.equal(hasConfiguredCvAnalytics({ VITE_CLOUDFLARE_WEB_ANALYTICS_TOKEN: "   " }), false);
  assert.equal(hasConfiguredCvAnalytics({ VITE_CLOUDFLARE_WEB_ANALYTICS_TOKEN: "token" }), true);
  assert.equal(hasConfiguredCvAnalytics({ VITE_YANDEX_METRIKA_COUNTER_ID: "112065623" }), true);
  assert.equal(hasConfiguredCvAnalytics({ VITE_YANDEX_METRIKA_COUNTER_ID: "0" }), false);
  assert.equal(hasConfiguredCvAnalytics({ VITE_YANDEX_METRIKA_COUNTER_ID: "not-a-counter" }), false);
});
