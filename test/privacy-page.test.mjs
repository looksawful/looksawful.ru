import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const privacyUrl = new URL("../public/privacy/index.html", import.meta.url);

test("privacy page documents actual analytics providers and consent reset", async () => {
  const html = await readFile(privacyUrl, "utf8");
  assert.match(html, /Cloudflare Web Analytics/);
  assert.match(html, /Яндекс Метрик/);
  assert.match(html, /112065623/);
  assert.match(html, /looksawful:analytics-consent/);
  assert.match(html, /looksawful:analytics-region/);
  assert.match(html, /sessionStorage/);
  assert.match(html, /Global Privacy Control/);
  assert.match(html, /Do Not Track/);
  assert.doesNotMatch(html, /загружается только после явного согласия посетителя/);
  assert.match(html, /data-consent-reset/);
  for (const goal of ["project_open", "cv_open", "contact_email", "contact_phone", "contact_telegram", "download"]) {
    assert.match(html, new RegExp(goal));
  }
});


test("privacy page exposes the shared light-dark surface control", async () => {
  const html = await readFile(privacyUrl, "utf8");
  assert.match(html, /<html\b[^>]*data-page-id="privacy"[^>]*data-surface-default="light"[^>]*data-surface="light"/);
  assert.match(html, /<meta name="theme-color" content="#f3f3ef">/);
  assert.match(html, /<script src="\/site-surface\.js"><\/script>/);
  assert.match(html, /data-surface-toggle/);
});
