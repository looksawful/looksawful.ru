import assert from "node:assert/strict";
import test from "node:test";

const analyticsUrl = new URL("../src/components/site-analytics.ts", import.meta.url);

function createCaseFixture({ pageType = "case", entityId = "jestei-pool" } = {}) {
  const calls = [];
  const listeners = new Map();
  const root = {
    body: {
      dataset: { pageType, entityId },
      scrollHeight: 3000,
    },
    documentElement: {
      scrollHeight: 3000,
      scrollTop: 0,
    },
  };
  const target = {
    innerHeight: 900,
    scrollY: 0,
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
        if (key === "looksawful:analytics-consent") return "granted";
        return null;
      },
    },
    sessionStorage: {
      getItem() {
        return null;
      },
    },
    addEventListener(name, handler) {
      listeners.set(name, handler);
    },
    removeEventListener(name, handler) {
      if (listeners.get(name) === handler) listeners.delete(name);
    },
    ym(...args) {
      calls.push(args);
    },
  };

  return {
    root,
    target,
    calls,
    fire(name) {
      listeners.get(name)?.();
    },
    hasListener(name) {
      return listeners.has(name);
    },
  };
}

test("case_end tracks only a standalone Case and fires exactly once at document end", async () => {
  const { mountSiteAnalyticsCaseEndTracking } = await import(analyticsUrl.href);
  assert.equal(typeof mountSiteAnalyticsCaseEndTracking, "function");

  const fixture = createCaseFixture();
  const destroy = mountSiteAnalyticsCaseEndTracking({
    root: fixture.root,
    target: fixture.target,
    config: { yandexCounterId: "112065623" },
  });

  assert.equal(fixture.hasListener("scroll"), true);
  assert.equal(fixture.hasListener("resize"), true);
  assert.deepEqual(fixture.calls, []);

  fixture.target.scrollY = 2099;
  fixture.fire("scroll");
  assert.deepEqual(fixture.calls, []);

  fixture.target.scrollY = 2100;
  fixture.fire("scroll");
  fixture.fire("scroll");
  fixture.fire("resize");

  assert.deepEqual(fixture.calls, [[
    112065623,
    "reachGoal",
    "case_end",
    {
      action_info: {
        page: "/work/jestei-pool/",
        target: "jestei-pool",
      },
    },
  ]]);
  assert.equal(fixture.hasListener("scroll"), false);
  assert.equal(fixture.hasListener("resize"), false);

  destroy();
});

test("case_end does not attach to Project or Collection pages", async () => {
  const { mountSiteAnalyticsCaseEndTracking } = await import(analyticsUrl.href);

  for (const pageType of ["project", "collection"]) {
    const fixture = createCaseFixture({ pageType });
    const destroy = mountSiteAnalyticsCaseEndTracking({
      root: fixture.root,
      target: fixture.target,
      config: { yandexCounterId: "112065623" },
    });
    fixture.target.scrollY = 2100;
    fixture.fire("scroll");
    assert.deepEqual(fixture.calls, [], `${pageType} must not emit case_end`);
    assert.equal(fixture.hasListener("scroll"), false);
    destroy();
  }
});

test("case_end requires a bounded canonical entity id", async () => {
  const { mountSiteAnalyticsCaseEndTracking } = await import(analyticsUrl.href);
  const fixture = createCaseFixture({ entityId: "Hunter Name <email@example.com>" });

  const destroy = mountSiteAnalyticsCaseEndTracking({
    root: fixture.root,
    target: fixture.target,
    config: { yandexCounterId: "112065623" },
  });

  fixture.target.scrollY = 2100;
  fixture.fire("scroll");
  assert.deepEqual(fixture.calls, []);
  assert.equal(fixture.hasListener("scroll"), false);
  destroy();
});
