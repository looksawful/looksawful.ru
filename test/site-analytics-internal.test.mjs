import assert from "node:assert/strict";
import test from "node:test";

const componentUrl = new URL("../src/components/site-analytics.ts", import.meta.url);

async function loadAnalytics() {
  return import(componentUrl.href);
}

function internalTarget({ consent = "granted", internal = "1" } = {}) {
  const calls = [];
  const target = {
    location: {
      hostname: "www.looksawful.ru",
      href: "https://www.looksawful.ru/work/jestei-pool/",
      origin: "https://www.looksawful.ru",
      pathname: "/work/jestei-pool/",
    },
    navigator: {
      globalPrivacyControl: false,
      doNotTrack: "0",
    },
    localStorage: {
      getItem(key) {
        if (key === "looksawful:analytics-internal") return internal;
        if (key === "looksawful:analytics-consent") return consent;
        return null;
      },
    },
    sessionStorage: {
      getItem() {
        return null;
      },
    },
    ym(...args) {
      calls.push(args);
    },
  };
  return { target, calls };
}

test("internal analytics marker is independent from consent", async () => {
  const { hasSiteAnalyticsConsent, isSiteAnalyticsInternalTraffic } = await loadAnalytics();
  const { target } = internalTarget({ consent: "granted", internal: "1" });

  assert.equal(hasSiteAnalyticsConsent(target), true, "internal traffic must not rewrite consent semantics");
  assert.equal(isSiteAnalyticsInternalTraffic(target), true);
});

test("internal traffic disables every configured analytics provider", async () => {
  const { selectSiteAnalyticsProviders } = await loadAnalytics();
  const providers = selectSiteAnalyticsProviders(
    { cloudflareToken: "cf-token", yandexCounterId: "112065623" },
    { globalPrivacyControl: false, doNotTrack: "0" },
    true,
    true,
  );

  assert.deepEqual(providers, []);
});

test("internal traffic never emits a Yandex goal", async () => {
  const { reachSiteAnalyticsGoal } = await loadAnalytics();
  const { target, calls } = internalTarget();

  const emitted = reachSiteAnalyticsGoal(
    target,
    { yandexCounterId: "112065623" },
    { goal: "project_open", params: { page: "/", target: "/work/jestei-pool/" } },
  );

  assert.equal(emitted, false);
  assert.deepEqual(calls, []);
});

test("internal marker storage failures fail open without breaking the site", async () => {
  const { isSiteAnalyticsInternalTraffic } = await loadAnalytics();
  const target = {
    localStorage: {
      getItem() {
        throw new Error("storage unavailable");
      },
    },
  };

  assert.equal(isSiteAnalyticsInternalTraffic(target), false);
});

test("traffic-mode URL marks the browser internal and removes only its control parameter", async () => {
  const { applySiteAnalyticsTrafficModeFromUrl, isSiteAnalyticsInternalTraffic } = await loadAnalytics();
  const store = new Map();
  const replacements = [];
  const target = {
    location: { href: "https://www.looksawful.ru/work/styx/?foo=1&analytics-traffic=internal#gallery" },
    history: { replaceState(_state, _title, url) { replacements.push(String(url)); } },
    localStorage: {
      getItem(key) { return store.get(key) ?? null; },
      setItem(key, value) { store.set(key, String(value)); },
      removeItem(key) { store.delete(key); },
    },
  };

  assert.equal(applySiteAnalyticsTrafficModeFromUrl(target), "internal");
  assert.equal(isSiteAnalyticsInternalTraffic(target), true);
  assert.deepEqual(replacements, ["https://www.looksawful.ru/work/styx/?foo=1#gallery"]);
});

test("traffic-mode URL can restore external analytics without touching consent", async () => {
  const { applySiteAnalyticsTrafficModeFromUrl, isSiteAnalyticsInternalTraffic } = await loadAnalytics();
  const store = new Map([
    ["looksawful:analytics-internal", "1"],
    ["looksawful:analytics-consent", "granted"],
  ]);
  const replacements = [];
  const target = {
    location: { href: "https://www.looksawful.ru/?analytics-traffic=external" },
    history: { replaceState(_state, _title, url) { replacements.push(String(url)); } },
    localStorage: {
      getItem(key) { return store.get(key) ?? null; },
      setItem(key, value) { store.set(key, String(value)); },
      removeItem(key) { store.delete(key); },
    },
  };

  assert.equal(applySiteAnalyticsTrafficModeFromUrl(target), "external");
  assert.equal(isSiteAnalyticsInternalTraffic(target), false);
  assert.equal(store.get("looksawful:analytics-consent"), "granted");
  assert.deepEqual(replacements, ["https://www.looksawful.ru/"]);
});
