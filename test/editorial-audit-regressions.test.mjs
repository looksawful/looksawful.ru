import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

function read(path) {
  return fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("Jestei CV does not turn the banner cost result into production time", () => {
  const cv = JSON.parse(read("src/content/editorial/cv.json"));
  const text = cv.experience.jestei.description;

  assert.doesNotMatch(text, /сократили время производства контента/i);
  assert.match(text, /стоимост[ьи] производства баннеров/i);
  assert.match(text, /2,5 раза/);
});

test("Sensetique copy keeps corrected dates, spelling and credits", () => {
  const media = read("src/data/media/entries/sensetique.ts");
  const copy = JSON.parse(read("src/content/cases/sensetique.json"));
  const production = copy.sections.find((section) => section.id === "production");

  assert.doesNotMatch(media, /Young-pioneer[^\n]*2027/);
  assert.doesNotMatch(media, /АНдрей/);
  assert.doesNotMatch(media, /фотсъемка|фотосхемка/i);
  assert.doesNotMatch(media, /Рапуто,стилист|Жукова,продюсер/i);
  assert.ok(production);
  assert.doesNotMatch(production.paragraphs.join(" "), /стилизацией занимались/);
});

test("career engagement dates match the editorial canon", () => {
  const engagements = read("src/data/catalog/engagements.ts");
  const berry = JSON.parse(read("src/content/standalone-projects/berry-social-content-2020.json"));
  const madCow = read("src/data/content/mad-cow-films.ts");
  const line = read("src/data/content/li-ne-agency.ts");

  assert.match(engagements, /id: "berry-agency-2020",\s*date: "2016–2017"/);
  assert.match(engagements, /id: "mad-cow-films-2019",\s*date: "2018"/);
  assert.match(engagements, /id: "li-ne-agency-2017",\s*date: "2016–2017"/);
  assert.equal(berry.period, "2016–2017");
  assert.match(madCow, /period: "2018"/);
  assert.match(line, /period: "2016–2017"/);
});

test("English Styx credits are actually English", () => {
  const styx = JSON.parse(read("src/content/i18n/en/cases/styx.json"));
  const titles = Object.fromEntries(styx.credits.map(({ id, title }) => [id, title]));

  assert.equal(titles["brand-lookbook-2023"], "Styx Jewel Lookbook, 2023.");
  assert.equal(titles["scanography-2021"], "Scanography, 2021.");
  assert.equal(titles["lookbook-2025"], "Styx Jewel Lookbook, 2025.");
});
