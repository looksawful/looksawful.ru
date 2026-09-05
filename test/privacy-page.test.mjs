import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const privacyUrl = new URL("../public/privacy/index.html", import.meta.url);

test("privacy page documents actual analytics providers and regional consent policy", async () => {
  const html = await readFile(privacyUrl, "utf8");
  assert.match(html, /Cloudflare Web Analytics/);
  assert.match(html, /Яндекс Метрик/);
  assert.match(html, /112065623/);
  assert.match(html, /looksawful:analytics-consent/);
  assert.match(html, /looksawful:analytics-region/);
  assert.match(html, /Россия|России|RU/);
  assert.match(html, /автоматически/);
  assert.match(html, /остальн|других регион|регион определить не удалось/);
  assert.match(html, /явн(?:ый|ого) (?:отказ|соглас)/);
  assert.match(html, /Global Privacy Control/);
  assert.match(html, /Do Not Track/);
  assert.match(html, /сеанс|sessionStorage/);
  assert.match(html, /data-consent-reset/);
  assert.doesNotMatch(html, /Яндекс Метрика загружается только после явного согласия посетителя/);
  assert.doesNotMatch(html, /включается только после выбора «Разрешить»/);
  assert.doesNotMatch(html, /сайт снова спросит разрешение при следующем посещении/);
  for (const goal of ["project_open", "cv_open", "contact_email", "contact_phone", "contact_telegram", "download"]) {
    assert.match(html, new RegExp(goal));
  }
});
