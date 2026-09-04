import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import test from "node:test";

const componentUrl = new URL("../src/components/site-analytics.ts", import.meta.url);
const consentUrl = new URL("../src/components/site-analytics-consent.ts", import.meta.url);
const consentStylesUrl = new URL("../src/styles/site-analytics-consent.css", import.meta.url);
const mainUrl = new URL("../src/main.js", import.meta.url);

async function loadAnalytics() {
  return import(componentUrl.href);
}

test("site analytics is isolated in dedicated components and mounted from main", async () => {
  const main = await readFile(mainUrl, "utf8");
  assert.equal(existsSync(componentUrl), true, "site-analytics.ts should exist");
  assert.equal(existsSync(consentUrl), true, "site-analytics-consent.ts should exist");
  assert.equal(existsSync(consentStylesUrl), true, "site analytics consent styles should exist");
  assert.match(main, /mountSiteAnalytics/);
  assert.match(main, /mountSiteAnalyticsGoalTracking/);
  assert.match(main, /mountSiteAnalyticsConsent/);
  assert.match(main, /VITE_YANDEX_METRIKA_COUNTER_ID/);
});

test("analytics stays disabled when no provider is configured", async () => {
  const { selectSiteAnalyticsProviders } = await loadAnalytics();
  assert.deepEqual(selectSiteAnalyticsProviders({}, { globalPrivacyControl: false, doNotTrack: "0" }, false), []);
});

test("global privacy control and do-not-track disable every provider", async () => {
  const { selectSiteAnalyticsProviders } = await loadAnalytics();
  const config = { cloudflareToken: "cf-token", yandexCounterId: "112065623" };
  assert.deepEqual(selectSiteAnalyticsProviders(config, { globalPrivacyControl: true, doNotTrack: "0" }, true), []);
  assert.deepEqual(selectSiteAnalyticsProviders(config, { globalPrivacyControl: false, doNotTrack: "1" }, true), []);
});

test("Cloudflare can run without analytics consent while Yandex Metrica requires explicit consent", async () => {
  const { selectSiteAnalyticsProviders } = await loadAnalytics();
  const config = { cloudflareToken: "  cf-token  ", yandexCounterId: "  112065623  " };
  const privacy = { globalPrivacyControl: false, doNotTrack: "0" };
  assert.deepEqual(selectSiteAnalyticsProviders(config, privacy, false), ["cloudflare"]);
  assert.deepEqual(selectSiteAnalyticsProviders(config, privacy, true), ["cloudflare", "yandex"]);
});

test("analytics script descriptors match the official provider endpoints", async () => {
  const { buildSiteAnalyticsScripts } = await loadAnalytics();
  const scripts = buildSiteAnalyticsScripts(
    { cloudflareToken: "cf-token", yandexCounterId: 112065623 },
    { globalPrivacyControl: false, doNotTrack: "0" },
    true,
  );
  assert.deepEqual(scripts, [
    {
      provider: "cloudflare",
      src: "https://static.cloudflareinsights.com/beacon.min.js",
      type: "module",
      async: false,
      attributes: { "data-cf-beacon": "{\"token\":\"cf-token\"}" },
    },
    {
      provider: "yandex",
      src: "https://mc.yandex.ru/metrika/tag.js",
      type: "text/javascript",
      async: true,
      attributes: {},
    },
  ]);
});

test("Yandex counter IDs are validated before analytics is mounted", async () => {
  const { parseYandexCounterId } = await loadAnalytics();
  assert.equal(parseYandexCounterId("112065623"), 112065623);
  assert.equal(parseYandexCounterId(112065623), 112065623);
  assert.equal(parseYandexCounterId(" 112065623 "), 112065623);
  assert.equal(parseYandexCounterId(""), null);
  assert.equal(parseYandexCounterId("0"), null);
  assert.equal(parseYandexCounterId("abc"), null);
});

test("stored analytics consent distinguishes unknown, granted and denied states", async () => {
  const { readStoredAnalyticsConsent } = await loadAnalytics();
  const target = (value) => ({ localStorage: { getItem: () => value } });
  assert.equal(readStoredAnalyticsConsent(target(null)), null);
  assert.equal(readStoredAnalyticsConsent(target("granted")), "granted");
  assert.equal(readStoredAnalyticsConsent(target("denied")), "denied");
  assert.equal(readStoredAnalyticsConsent(target("other")), null);
});

test("the Yandex event taxonomy stays small and conversion-oriented", async () => {
  const source = await readFile(componentUrl, "utf8");
  for (const goal of ["project_open", "cv_open", "contact_email", "contact_phone", "contact_telegram", "download"]) {
    assert.match(source, new RegExp(`\\"${goal}\\"`));
  }
  assert.doesNotMatch(source, /clarity/i);
});

test("analytics is disabled on local preview hosts used by smoke tests", async () => {
  const { isLocalAnalyticsHostname } = await loadAnalytics();
  assert.equal(isLocalAnalyticsHostname("localhost"), true);
  assert.equal(isLocalAnalyticsHostname("127.0.0.1"), true);
  assert.equal(isLocalAnalyticsHostname("::1"), true);
  assert.equal(isLocalAnalyticsHostname("preview.localhost"), true);
  assert.equal(isLocalAnalyticsHostname("looksawful.ru"), false);
  assert.equal(isLocalAnalyticsHostname("www.looksawful.ru"), false);
});