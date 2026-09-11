import assert from "node:assert/strict";
import test from "node:test";

const componentUrl = new URL("../src/components/site-analytics.ts", import.meta.url);
const runtimeUrl = new URL("../tools/e2e/runtime.mjs", import.meta.url);

async function loadAnalytics() {
  return import(componentUrl.href);
}

async function loadRuntime() {
  return import(runtimeUrl.href);
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

test("E2E browser contexts and pages receive the internal marker before navigation", async () => {
  const { ANALYTICS_INTERNAL_STORAGE_KEY, createInternalAnalyticsBrowser } = await loadRuntime();
  const calls = [];
  const context = {
    async addInitScript(_script, argument) {
      calls.push(["context-init", argument]);
    },
  };
  const page = {
    async addInitScript(_script, argument) {
      calls.push(["page-init", argument]);
    },
  };
  const browser = {
    async newContext() {
      calls.push(["new-context"]);
      return context;
    },
    async newPage() {
      calls.push(["new-page"]);
      return page;
    },
  };

  const wrapped = createInternalAnalyticsBrowser(browser);
  assert.equal(await wrapped.newContext(), context);
  assert.equal(await wrapped.newPage(), page);
  assert.deepEqual(calls, [
    ["new-context"],
    ["context-init", { key: ANALYTICS_INTERNAL_STORAGE_KEY }],
    ["new-page"],
    ["page-init", { key: ANALYTICS_INTERNAL_STORAGE_KEY }],
  ]);
});
