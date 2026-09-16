import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

import { injectStaticSiteAnalytics } from "../tools/lib/static-site-analytics.mjs";

const source = "<!doctype html><html><head><title>CV</title></head><body><main>CV</main></body></html>";
const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("static analytics injection is a no-op without configured providers", () => {
  assert.equal(injectStaticSiteAnalytics(source, {}), source);
});

test("static analytics injects Cloudflare, consent-gated Yandex and conversion goals", () => {
  const html = injectStaticSiteAnalytics(source, {
    cloudflareToken: "cf-token",
    yandexCounterId: "112065623",
  });

  assert.match(html, /data-static-site-analytics/);
  assert.match(html, /static\.cloudflareinsights\.com\/beacon\.min\.js/);
  assert.match(html, /mc\.yandex\.ru\/metrika\/tag\.js/);
  assert.match(html, /looksawful:analytics-consent/);
  assert.match(html, /looksawful:analytics-internal/);
  assert.match(html, /if\(optedOut\|\|internalTraffic\)return/);
  assert.match(html, /href=\"\/privacy\/\"/);
  assert.match(html, /project_open/);
  assert.match(html, /cv_open/);
  assert.match(html, /contact_email/);
  assert.match(html, /contact_phone/);
  assert.match(html, /contact_telegram/);
  assert.match(html, /download/);
  assert.doesNotMatch(html, /clarity/i);
  assert.doesNotMatch(html, /<noscript/i, "consent-gated analytics must not be bypassed by a noscript pixel");
});

test("static CV analytics adds semantic engagement, project-open and completion goals", () => {
  const html = injectStaticSiteAnalytics(source, { yandexCounterId: 112065623 });
  assert.match(html, /cv_engaged/);
  assert.match(html, /cv_project_open/);
  assert.match(html, /cv_end/);
  assert.match(html, /setTimeout\([^)]*30000/);
  assert.doesNotMatch(html, /scroll_25|scroll_50|scroll_75/);
});

test("static analytics auto-starts Yandex only for RU sessions and keeps an external geo fallback", () => {
  const html = injectStaticSiteAnalytics(source, { yandexCounterId: 112065623 });
  assert.match(html, /looksawful:analytics-region/);
  assert.match(html, /\/cdn-cgi\/trace/);
  assert.match(html, /https:\/\/api\.country\.is\//);
  assert.match(html, /country===\"RU\"/);
});

test("static analytics injection is idempotent", () => {
  const once = injectStaticSiteAnalytics(source, { yandexCounterId: 112065623 });
  const twice = injectStaticSiteAnalytics(once, { yandexCounterId: 112065623 });
  assert.equal(twice, once);
  assert.equal((twice.match(/data-static-site-analytics/g) ?? []).length, 2);
});

test("production public-static CV is finalized by the registered Vite build plugin instead of postbuild patching", async () => {
  const pluginUrl = new URL("../src/site/build/public-static-build-plugin.ts", import.meta.url);
  assert.equal(existsSync(pluginUrl), true, "public-static build plugin must own production CV finalization");

  const { createPublicStaticBuildPlugin } = await import(pluginUrl.href);
  const vite = (await import(`../vite.config.ts?test=${Date.now()}`)).default;
  const plugin = createPublicStaticBuildPlugin();
  const registeredPlugins = vite.plugins ?? [];
  const pkg = JSON.parse(read("package.json"));

  assert.equal(plugin.name, "looksawful-public-static-build");
  assert.equal(plugin.apply, "build");
  assert.equal(plugin.enforce, "post");
  assert.equal(typeof plugin.closeBundle, "function");
  assert.equal(registeredPlugins.some((candidate) => candidate?.name === plugin.name), true);
  assert.equal(pkg.scripts?.["cv:content:apply"], undefined);
  assert.equal(pkg.scripts?.["cv:prod:prepare"], undefined);
  assert.equal(pkg.scripts?.["cv:prod:verify"], "node tools/verify-cv-production.mjs");
  assert.doesNotMatch(pkg.scripts?.["site:postbuild"] ?? "", /cv:content:apply/);
  assert.equal(existsSync(new URL("../tools/apply-cv-content.mjs", import.meta.url)), false);
  assert.equal(existsSync(new URL("../tools/prepare-cv-production.mjs", import.meta.url)), false);
});