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
  assert.match(html, /Для сеанса, определённого как RU, Яндекс Метрика может запуститься автоматически без показа плашки согласия\./);
  assert.match(html, /Для других регионов и если регион определить не удалось, Яндекс Метрика запускается только после явного согласия\./);
  assert.match(html, /Явный сохранённый отказ имеет приоритет над региональным режимом\./);
  assert.match(html, /Регион хранится только в sessionStorage/);
  assert.match(html, /При Global Privacy Control или Do Not Track сайт не загружает Cloudflare Web Analytics и Яндекс Метрику\./);
  assert.match(html, /data-consent-reset/);
  assert.match(html, /Явный выбор не сохранён; режим зависит от региона сеанса и настроек приватности\./);
  assert.doesNotMatch(html, /Яндекс Метрика загружается только после явного согласия посетителя/);
  assert.doesNotMatch(html, /включается только после выбора «Разрешить»/);
  assert.doesNotMatch(html, /сайт снова спросит разрешение при следующем посещении/);
  for (const goal of ["project_open", "cv_open", "contact_email", "contact_phone", "contact_telegram", "download"]) {
    assert.match(html, new RegExp(goal));
  }
});
