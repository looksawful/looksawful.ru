import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import test from "node:test";

const componentUrl = new URL("../src/components/site-analytics.ts", import.meta.url);
const mainUrl = new URL("../src/main.js", import.meta.url);

async function loadAnalytics() {
  return import(componentUrl.href);
}

test("site analytics is isolated in a dedicated component and mounted from main", async () => {
  const main = await readFile(mainUrl, "utf8");
  assert.equal(existsSync(componentUrl), true, "site-analytics.ts should exist");
  assert.match(main, /import \{ mountSiteAnalytics \} from "\.\/components\/site-analytics\.ts";/);
  assert.match(main, /mountSiteAnalytics\(/);
});

test("analytics stays disabled when no provider is configured", async () => {
  const { selectSiteAnalyticsProviders } = await loadAnalytics();
  assert.deepEqual(selectSiteAnalyticsProviders({}, { globalPrivacyControl: false, doNotTrack: "0" }, false), []);
});

test("global privacy control and do-not-track disable every provider", async () => {
  const { selectSiteAnalyticsProviders } = await loadAnalytics();
  const config = { cloudflareToken: "cf-token", clarityProjectId: "clarity-project" };
  assert.deepEqual(selectSiteAnalyticsProviders(config, { globalPrivacyControl: true, doNotTrack: "0" }, true), []);
  assert.deepEqual(selectSiteAnalyticsProviders(config, { globalPrivacyControl: false, doNotTrack: "1" }, true), []);
});

test("Cloudflare can run without Clarity consent while Clarity requires explicit consent", async () => {
  const { selectSiteAnalyticsProviders } = await loadAnalytics();
  const config = { cloudflareToken: "  cf-token  ", clarityProjectId: "  clarity-project  " };
  const privacy = { globalPrivacyControl: false, doNotTrack: "0" };
  assert.deepEqual(selectSiteAnalyticsProviders(config, privacy, false), ["cloudflare"]);
  assert.deepEqual(selectSiteAnalyticsProviders(config, privacy, true), ["cloudflare", "clarity"]);
});

test("analytics script descriptors match the official provider endpoints", async () => {
  const { buildSiteAnalyticsScripts } = await loadAnalytics();
  const scripts = buildSiteAnalyticsScripts(
    { cloudflareToken: "cf-token", clarityProjectId: "clarity project" },
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
      provider: "clarity",
      src: "https://www.clarity.ms/tag/clarity%20project",
      type: "text/javascript",
      async: true,
      attributes: {},
    },
  ]);
});
