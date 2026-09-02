import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const cvDataModuleUrl = new URL("../src/data/cv.ts", import.meta.url);
const cvContentUrl = new URL("../src/content/cv.json", import.meta.url);
const cvSourceUrl = new URL("../public/cv/index.html", import.meta.url);
const cvContentLibUrl = new URL("../tools/lib/cv-content.mjs", import.meta.url);
const cmsConfigUrl = new URL("../.pages.yml", import.meta.url);

const expectedProfile = {
  name: "ИВАН КРУШИНСКИЙ",
  role: "АРТ-ДИРЕКТОР ЦИФРОВЫХ ПРОДУКТОВ | ДИЗАЙНЕР",
  aboutPrimary: "Я проектирую цифровые продукты, создаю дизайн и руковожу креативными командами.",
  aboutSecondary: "",
  principles: [
    {
      id: "visual",
      title: "Делаю продукт красивым:",
      text: "провожу ребрендинг, разрабатываю айдентику, развиваю дизайн-системы, занимаюсь арт- и креативным дирекшеном.",
    },
    {
      id: "communication",
      title: "Делаю коммуникацию чище:",
      text: "определяю, что и как говорит продукт, формулирую ключевые сообщения, строю коммуникационную платформу и объясняю сложное простыми словами.",
    },
    {
      id: "product",
      title: "Делаю продукты удобнее:",
      text: "изучаю пользовательские сценарии и оптимизирую их пути, провожу ревью существующих дизайн-решений, тестирую, анализирую и исправляю ошибки.",
    },
    {
      id: "new-products",
      title: "Придумываю и развиваю новые продукты:",
      text: "исследую аудиторию и конкурентов, нахожу возможности, проверяю гипотезы, формирую UX/UI-стратегию и проектирую интерфейсы.",
    },
    {
      id: "leadership",
      title: "Организую процессы:",
      text: "провожу аудит дизайн-ресурсов, ставлю задачи, принимаю решения и выстраиваю процессы. Координирую работу дизайнеров с разработчиками от идеи до релиза.",
    },
  ],
  languages: [
    { id: "english", name: "Английский", level: "B2" },
    { id: "czech", name: "Чешский", level: "A2" },
  ],
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

test("CV profile migration fixture reproduces the authored page while live copy remains editable", async () => {
  const [{ cvContent }, sourceHtml, contentLib] = await Promise.all([
    import(cvDataModuleUrl.href),
    readFile(cvSourceUrl, "utf8"),
    import(cvContentLibUrl.href),
  ]);

  assert.equal(typeof contentLib.transformCvProfile, "function");
  assert.equal(
    contentLib.transformCvProfile(sourceHtml, { ...cvContent, profile: expectedProfile }),
    sourceHtml,
  );
  assert.deepEqual(
    cvContent.profile.principles.map(({ id }) => id),
    expectedProfile.principles.map(({ id }) => id),
  );
  assert.deepEqual(
    cvContent.profile.languages.map(({ id }) => id),
    expectedProfile.languages.map(({ id }) => id),
  );
  assert.doesNotThrow(() => contentLib.transformCvProfile(sourceHtml, cvContent));
});

test("CV profile transform escapes CMS text and preserves code-owned layout hooks", async () => {
  const [{ cvContent }, sourceHtml, contentLib] = await Promise.all([
    import(cvDataModuleUrl.href),
    readFile(cvSourceUrl, "utf8"),
    import(cvContentLibUrl.href),
  ]);

  const profile = clone(expectedProfile);
  profile.name = "Иван <CMS> & команда";
  profile.role = "Арт-директор & <дизайнер>";
  profile.aboutPrimary = "Первый <абзац> & проверка";
  profile.aboutSecondary = "Второй <абзац> & проверка";
  profile.principles[0].title = "Визуал & система:";
  profile.principles[0].text = "безопасный <текст>";
  profile.languages[0].name = "English & русский";
  profile.languages[0].level = "B2 <script>";

  const transformed = contentLib.transformCvProfile(sourceHtml, {
    ...cvContent,
    profile,
  });

  assert.match(transformed, /Иван &lt;CMS&gt; &amp; команда/);
  assert.match(transformed, /Арт-директор &amp; &lt;дизайнер&gt;/);
  assert.match(transformed, /Первый &lt;абзац&gt; &amp; проверка/);
  assert.match(transformed, /Второй &lt;абзац&gt; &amp; проверка/);
  assert.match(transformed, /<b>Визуал &amp; система:<\/b> безопасный &lt;текст&gt;/);
  assert.match(transformed, /<b>English &amp; русский<\/b> — B2 &lt;script&gt;/);
  assert.doesNotMatch(transformed, /<script\b/i);

  assert.match(transformed, /class="resume-nav"/);
  assert.match(transformed, /class="portrait"/);
  assert.match(transformed, /experience-card--jestei/);
  assert.equal(
    (transformed.match(/experience-card--[a-z0-9-]+/g) ?? []).length,
    (sourceHtml.match(/experience-card--[a-z0-9-]+/g) ?? []).length,
  );
});

test("CV content adapter protects profile identity while allowing empty copy", async () => {
  const { parseCvContent, cvContent } = await import(cvDataModuleUrl.href);
  const current = clone(cvContent);

  const validProfile = { ...clone(expectedProfile), contacts: current.profile.contacts };

  assert.throws(
    () => parseCvContent({ ...current, profile: undefined }),
    /profile/i,
  );

  const duplicatePrinciples = clone(validProfile);
  duplicatePrinciples.principles[1].id = duplicatePrinciples.principles[0].id;
  assert.throws(
    () => parseCvContent({ ...current, profile: duplicatePrinciples }),
    /duplicate.*principle|principle.*duplicate/i,
  );

  const unknownLanguage = clone(validProfile);
  unknownLanguage.languages[0].id = "unknown";
  assert.throws(
    () => parseCvContent({ ...current, profile: unknownLanguage }),
    /unexpected.*language|language.*unexpected/i,
  );

  const emptyRole = clone(validProfile);
  emptyRole.role = "   ";
  delete emptyRole.name;
  const parsedEmpty = parseCvContent({ ...current, profile: emptyRole });
  assert.equal(parsedEmpty.profile.role, "");
  assert.equal(parsedEmpty.profile.name, "");

  const emptySecondary = clone(validProfile);
  emptySecondary.aboutSecondary = "";
  assert.doesNotThrow(() => parseCvContent({ ...current, profile: emptySecondary }));

  const invalidCopy = clone(validProfile);
  invalidCopy.role = 42;
  assert.throws(
    () => parseCvContent({ ...current, profile: invalidCopy }),
    /profile\.role.*string/i,
  );
});

test("Pages CMS exposes keyed profile copy while stable identity stays outside editorial JSON", async () => {
  const cmsConfig = await readFile(cmsConfigUrl, "utf8");
  const cvConfig = cmsConfig.match(/\n  - name: cv\b[\s\S]*$/)?.[0] ?? "";
  const profileConfig = cvConfig.match(/\n      - name: profile\b[\s\S]*?(?=\n      - name: skills\b)/)?.[0] ?? "";

  for (const field of ["name", "role", "aboutPrimary", "aboutSecondary", "location"]) {
    assert.match(profileConfig, new RegExp(`name: ${field}\\b`));
  }
  assert.match(profileConfig, /name: principles\b[\s\S]*?type: object/);
  assert.match(profileConfig, /name: visual\b[\s\S]*?type: object/);
  assert.match(profileConfig, /name: languages\b[\s\S]*?type: object/);
  assert.match(profileConfig, /name: english\b[\s\S]*?type: object/);
  assert.doesNotMatch(profileConfig, /- name: id\b|\blist:/);
  assert.doesNotMatch(profileConfig, /name: (visible|titleVisible|route|canonical|portraitSrc|stylesheet|pageType)\b/);
});
