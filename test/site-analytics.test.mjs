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

test("analytics script descriptors match provider endpoints", async () => {
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
  assert.match(source, /startsWith\(\"\/work\/\"\)/);
  assert.doesNotMatch(source, /clarity/i);
});

test("analytics goal classification rejects non-web URL schemes without breaking contact goals", async () => {
  const { classifySiteAnalyticsGoal } = await loadAnalytics();
  const target = {
    location: {
      href: "https://looksawful.ru/work/jestei-pool/",
      origin: "https://looksawful.ru",
      pathname: "/work/jestei-pool/",
    },
  };
  const anchor = (href, download = false) => ({
    getAttribute: (name) => (name === "href" ? href : null),
    hasAttribute: (name) => name === "download" && download,
  });

  for (const href of [
    "javascript:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "vbscript:msgbox(1)",
    "blob:https://looksawful.ru/01234567-89ab-cdef-0123-456789abcdef",
  ]) {
    assert.equal(classifySiteAnalyticsGoal(anchor(href, true), target), null, href);
  }

  assert.deepEqual(classifySiteAnalyticsGoal(anchor("mailto:i@lookawful.ru"), target), {
    goal: "contact_email",
    params: { page: "/work/jestei-pool/" },
  });
  assert.deepEqual(classifySiteAnalyticsGoal(anchor("tel:+70000000000"), target), {
    goal: "contact_phone",
    params: { page: "/work/jestei-pool/" },
  });
  assert.deepEqual(classifySiteAnalyticsGoal(anchor("/docs/jestei-editorial-guide.pdf", true), target), {
    goal: "download",
    params: { page: "/work/jestei-pool/", target: "/docs/jestei-editorial-guide.pdf" },
  });
});

test("consent control exposes the privacy notice", async () => {
  const source = await readFile(consentUrl, "utf8");
  assert.match(source, /privacy\.href = "\/privacy\/"/);
  assert.match(source, /Метрика загружается только с вашего согласия/);
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
