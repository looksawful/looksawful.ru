import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { CV_EXPERIENCE_IDS, parseCvContent } from "../src/data/cv.ts";
import { transformCvContent } from "../tools/lib/cv-content.mjs";

const expectedCounts = {
  jestei: { cases: 18, facts: 0, links: 2 },
  styx: { cases: 8, facts: 1, links: 2 },
  illumihand: { cases: 3, facts: 2, links: 0 },
  madcow: { cases: 2, facts: 0, links: 2 },
  sensetique: { cases: 0, facts: 0, links: 1 },
  line: { cases: 3, facts: 0, links: 1 },
  berry: { cases: 3, facts: 2, links: 0 },
  ss: { cases: 5, facts: 1, links: 1 },
  olovo: { cases: 6, facts: 2, links: 2 },
  theatre: { cases: 3, facts: 2, links: 1 },
  soroka: { cases: 3, facts: 2, links: 0 },
  kursovoy: { cases: 0, facts: 2, links: 0 },
  ran: { cases: 4, facts: 2, links: 0 },
  progress: { cases: 2, facts: 0, links: 1 },
  ria: { cases: 0, facts: 0, links: 0 },
};

const entryKeys = ["cases", "company", "context", "description", "facts", "id", "links", "period", "role", "visible"];
const clone = (value) => structuredClone(value);

async function readSource() {
  return JSON.parse(await readFile(new URL("../src/content/cv.json", import.meta.url), "utf8"));
}

function experienceSheet(html) {
  const match = html.match(/<section\b[^>]*class="experience-sheet"[\s\S]*?<\/section>/i);
  assert.ok(match, "CV experience sheet must exist");
  return match[0];
}

function hrefs(html) {
  return [...experienceSheet(html).matchAll(/\shref="([^"]+)"/g)].map((match) => match[1]);
}

function articleFor(html, id) {
  const pattern = new RegExp(
    `<article\\b(?=[^>]*\\bclass=["'][^"']*\\bexperience-card--${id}\\b[^"']*["'])[^>]*>[\\s\\S]*?<\\/article>`,
    "i",
  );
  const matches = [...html.matchAll(new RegExp(pattern.source, "gi"))];
  assert.equal(matches.length, 1, `expected exactly one CV experience article for ${id}`);
  return matches[0][0];
}

test("CV experience CMS source owns copy but keeps fixed identity and presentation counts", async () => {
  const source = await readSource();

  assert.deepEqual(source.experience.map(({ id }) => id), CV_EXPERIENCE_IDS);
  for (const entry of source.experience) {
    assert.deepEqual(Object.keys(entry).sort(), entryKeys);
    assert.equal(typeof entry.visible, "boolean");
    for (const field of ["company", "context", "period", "role"]) {
      assert.equal(typeof entry[field], "string", `${entry.id}.${field} must be a string`);
      assert.ok(entry[field].trim(), `${entry.id}.${field} must be non-empty`);
    }
    assert.equal(typeof entry.description, "string");
    assert.equal(entry.description.trim(), entry.description, `${entry.id}.description must be trimmed`);

    const counts = expectedCounts[entry.id];
    assert.ok(counts, `unexpected CV experience id: ${entry.id}`);
    assert.equal(entry.cases.length, counts.cases, `${entry.id} case count is presentation-owned`);
    assert.equal(entry.facts.length, counts.facts, `${entry.id} fact count is presentation-owned`);
    assert.equal(entry.links.length, counts.links, `${entry.id} link-label count is presentation-owned`);

    for (const [index, value] of entry.cases.entries()) {
      assert.equal(typeof value, "string");
      assert.ok(value.trim(), `${entry.id}.cases[${index}] must be non-empty`);
    }
    for (const [index, fact] of entry.facts.entries()) {
      assert.deepEqual(Object.keys(fact).sort(), ["label", "text"]);
      assert.equal(typeof fact.label, "string");
      assert.equal(fact.label.trim(), fact.label);
      assert.equal(typeof fact.text, "string");
      assert.ok(fact.text.trim(), `${entry.id}.facts[${index}].text must be non-empty`);
    }
    for (const [index, value] of entry.links.entries()) {
      assert.equal(typeof value, "string");
      assert.ok(value.trim(), `${entry.id}.links[${index}] must be non-empty`);
    }
  }
});

test("CV experience source contains the approved Jestei, LI-NE, Progress and RIA copy", async () => {
  const source = await readSource();
  const byId = new Map(source.experience.map((entry) => [entry.id, entry]));

  assert.equal(
    byId.get("jestei")?.description,
    "Сформировал новый визуальный язык музыкального сервиса — главного российского диджейского пула. Разработал UX/UI-стратегию для core-продуктов и руководил всей командой дизайнеров. Реорганизовал дизайн-систему и ускорил процесс разработки макетов и прототипов, создал документацию и CJM для ключевых пользовательских сценариев для 4 сегментов аудитории, сократил количество шагов для получения доступа к контенту с 6 до 2, спроектировал прогрессивную систему фильтрации треков, разработал триггеры апгрейда и дизайн рассылки для реанимации клиентов, переработал промо-материалы, спроектировал архитектуру новой системы лендинговых страниц для двух аудиторий, создал дизайн для таргетированной рекламы, спроектировал дизайн раздела для новой премиальной аудитории и проработал инструменты для неё. Всё это позволило поднять стоимость подписки без деградации клиентской базы, расширить аудиторию, сократить время производства контента и подготовиться к выходу продукта на американский рынок.",
  );
  assert.equal(
    byId.get("line")?.description,
    "Работал младшим продюсером в продакшен-агентстве в сфере моды и рекламы. Изучал и занимался организацией fashion- и рекламных фото- и видеосъёмок, а также мероприятий: препродакшн, кастинги, локации, логистика, координация команды. Работал над крупными съёмками для «Детского мира», Puma, H&M и в других небольших проектах.",
  );
  assert.equal(
    byId.get("progress")?.description,
    "Работал книжным дизайнером в издательстве гуманитарной и образовательной литературы: разрабатывал макеты, верстал и вёл полный цикл дизайн-процессов при разработке научных и гуманитарных изданий, включая книги Елены Ровенко и Бориса Ерёмина, а также руководил разработкой и администрированием сайта издательства.",
  );
  assert.equal(byId.get("ria")?.role, "Дизайнер");
  assert.equal(
    byId.get("ria")?.description,
    "Работал верстальщиком в ежедневной городской общественно-политической газете о Москве",
  );
  assert.deepEqual(byId.get("line")?.facts, []);
  assert.deepEqual(byId.get("progress")?.facts, []);
});

test("CV parser accepts legitimate experience copy edits and rejects architecture or count drift", async () => {
  const source = await readSource();
  assert.deepEqual(parseCvContent(clone(source)), source);

  const edited = clone(source);
  edited.experience[0].company = "JESTEI & POOL";
  edited.experience[0].role = "Новая роль";
  edited.experience[0].description = "Новый <текст>";
  edited.experience[0].cases[0] = "Новый кейс";
  edited.experience[0].links[0] = "Новая подпись";
  const parsed = parseCvContent(edited);
  assert.equal(parsed.experience[0].company, edited.experience[0].company);
  assert.equal(parsed.experience[0].description, edited.experience[0].description);

  const routeLeak = clone(source);
  routeLeak.experience[0].route = "/changed-by-cms/";
  assert.throws(() => parseCvContent(routeLeak), /unexpected|field|key/i);

  const whitespace = clone(source);
  whitespace.experience[0].company = "   ";
  assert.throws(() => parseCvContent(whitespace), /non-empty|string|trim/i);

  const caseCountDrift = clone(source);
  caseCountDrift.experience[0].cases.pop();
  assert.throws(() => parseCvContent(caseCountDrift), /count|length|cases/i);
});

test("CV experience transform changes editorial copy while preserving code-owned hrefs and card classes", async () => {
  const source = await readSource();
  const originalHtml = await readFile(new URL("../public/cv/index.html", import.meta.url), "utf8");
  const originalHrefs = hrefs(originalHtml);

  const edited = clone(source);
  const jestei = edited.experience.find(({ id }) => id === "jestei");
  const styx = edited.experience.find(({ id }) => id === "styx");
  assert.ok(jestei);
  assert.ok(styx);

  jestei.company = "JESTEI & POOL";
  jestei.context = "Музыкальный <сервис>";
  jestei.period = "2024–2027";
  jestei.role = "Арт-директор & дизайн-лид";
  jestei.description = "Описание <без HTML> & безопасно";
  jestei.cases[0] = "Кейс & исследование";
  jestei.links[0] = "Сайт & продукт";
  styx.facts[0].text = "Факт <сохранён> & обновлён";

  const transformed = transformCvContent(originalHtml, parseCvContent(edited)).html;
  const transformedJestei = articleFor(transformed, "jestei");
  const transformedStyx = articleFor(transformed, "styx");

  assert.deepEqual(hrefs(transformed), originalHrefs, "CMS copy edits must not own experience hrefs");
  assert.match(transformedJestei, /<h3 class="experience-role">Арт-директор &amp; дизайн-лид<\/h3>/);
  assert.match(transformedJestei, /<div class="experience-cases">/);
  assert.match(transformedJestei, /<a class="experience-value" href="\/#jestei-brand"[^>]*>Кейс &amp; исследование<\/a>/);
  assert.match(transformedJestei, /<div class="experience-links">/);
  assert.match(transformedStyx, /<div class="experience-facts">/);
  assert.match(transformedStyx, /<span class="experience-value">Факт &lt;сохранён&gt; &amp; обновлён<\/span>/);
  assert.doesNotMatch(transformed, /Описание <без HTML>/);
});

test("Pages CMS exposes CV experience copy without href, class or route controls", async () => {
  const cms = await readFile(new URL("../.pages.yml", import.meta.url), "utf8");
  const start = cms.indexOf("      - name: experience\n");
  assert.notEqual(start, -1, "CV experience CMS block must exist");
  const rest = cms.slice(start);
  const nextTopLevel = rest.indexOf("\n  - name: ", 8);
  const config = nextTopLevel === -1 ? rest : rest.slice(0, nextTopLevel);

  for (const field of ["id", "visible", "company", "context", "period", "role", "description", "cases", "facts", "label", "text", "links"]) {
    assert.match(config, new RegExp(`name: ${field}\\b`));
  }
  for (const forbidden of ["href", "route", "className", "target", "rel", "layout", "indexable", "listed"]) {
    assert.doesNotMatch(config, new RegExp(`name: ${forbidden}\\b`));
  }
});
