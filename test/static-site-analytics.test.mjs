import assert from "node:assert/strict";
import test from "node:test";

import { injectStaticSiteAnalytics } from "../tools/lib/static-site-analytics.mjs";

const source = "<!doctype html><html><head><title>CV</title></head><body><main>CV</main></body></html>";

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
