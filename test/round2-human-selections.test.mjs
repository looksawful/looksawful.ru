import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const read = (p) => fs.readFileSync(new URL("../" + p, import.meta.url), "utf8");
const json = (p) => JSON.parse(read(p));
test("Round 2 human selections are applied to canonical sources", () => {
  assert.ok(read("index.html").includes("арт-директор цифровых продуктов"));
  assert.ok(read("src/data/catalog/cases.ts").includes('periodLabel: "2016–2018"'));
  assert.ok(read("src/content/cases/styx.json").includes("Разработал логотип и визуальную систему бренда"));
  assert.ok(read("src/content/cases/sensetique.json").includes("организовал строительство и оснащение коммерческой фотостудии"));
  assert.ok(read("src/content/cases/jestei-pool.json").includes("Переработал структуру плейлистов"));
  assert.ok(json("src/content/editorial/cv.json").skills.hard.rows.communications.text.includes("UX-тексты"));
  assert.ok(read("src/data/media/gallery.ts").includes("3D-символ Jestei Pool"));
});
test("Round 2 rejected wording is absent from the edited fields", () => {
  assert.ok(!read("src/content/cases/jestei-pool.json").includes("переработал логотип"));
  assert.ok(!read("src/content/cases/sensetique.json").includes("я закончил строительство студии"));
  assert.ok(!json("src/content/editorial/cv.json").skills.hard.rows.communications.text.includes("UX-writing"));
});
