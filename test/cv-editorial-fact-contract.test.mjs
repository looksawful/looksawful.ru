import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const cvUrl = new URL("../src/content/editorial/cv.json", import.meta.url);
const indexUrl = new URL("../index.html", import.meta.url);

test("Jestei CV copy preserves canonical attribution and international framing", async () => {
  const cv = JSON.parse(await readFile(cvUrl, "utf8"));
  const jestei = cv.experience.jestei;
  assert.doesNotMatch(jestei.description, /результат общей production-системы/);
  assert.match(jestei.description, /Отдельный подтверждённый production-результат: 2\.5× content production efficiency\./);
  for (const expected of [
    "Проектирование Event-направления для event-диджеев",
    "Продуктовая и дизайн-основа для международной версии",
    "Найм специалистов и развитие редакционной функции",
    "Редполитика и редакционная система",
  ]) assert.ok(jestei.cases.includes(expected), expected);
  for (const stale of [
    "Проектирование и разработка раздела для ивент-диджеев",
    "Подготовка к запуску иностранной версии сайта",
    "Собеседования и найм дизайнеров, моушен-дизайнеров, копирайтеров и редакторов",
    "Разработка редполитики",
  ]) assert.ok(!jestei.cases.includes(stale), stale);
});

test("legacy RIA block uses the canonical 2012–2013 period", async () => {
  const html = await readFile(indexUrl, "utf8");
  const block = html.match(/РИА Новости \/ «Московские новости»[\s\S]{0,400}?<\/li>/)?.[0] ?? "";
  assert.match(block, /2012–2013/);
});