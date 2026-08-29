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
  aboutPrimary: "Проектирую цифровые продукты: исследую аудиторию, разбираю пользовательские сценарии, определяю UX/UI-направление, проектирую интерфейсы и собираю дизайн-системы. Работаю с продуктом от исследования и концепции до разработки и релиза — помогаю сокращать лишние шаги, делать интерфейсы понятнее, ускорять производство дизайна и сохранять целостность продукта по мере его развития.",
  aboutSecondary: "Руковожу дизайнерами и креативными командами: ставлю задачи, провожу ревью, выстраиваю процессы и координирую работу дизайна, продукта, разработки и контента. На последнем месте работы сократил пользовательский путь в ключевом сценарии с 6 шагов до 2, ускорил производство дизайна в 2,5 раза и помог повысить стоимость продукта на 15% без деградации клиентской базы. Разделил аудиторию на четыре сегмента, перестроил под них продуктовые сценарии и коммуникацию и участвовал в подготовке продукта к выходу на рынок США.",
  principles: [
    {
      id: "visual",
      title: "Делаю проекты красивыми:",
      text: "задаю визуальный язык, собираю айдентику и слежу, чтобы все части проекта выглядели цельно.",
    },
    {
      id: "communication",
      title: "Делаю коммуникацию чище:",
      text: "определяю, что и как говорит продукт, редактирую тексты и упрощаю подачу сложной информации.",
    },
    {
      id: "product",
      title: "Делаю продукты удобнее:",
      text: "изучаю пользовательские сценарии, нахожу лишние шаги и несогласованности и перестраиваю интерфейс там, где он мешает пользователю.",
    },
    {
      id: "new-products",
      title: "Придумываю и развиваю новые продукты:",
      text: "изучаю аудиторию и конкурентов, нахожу возможности, проверяю гипотезы и довожу решения до запуска.",
    },
    {
      id: "leadership",
      title: "Руковожу дизайнерами:",
      text: "ставлю задачи, провожу ревью, помогаю принимать решения, развиваю дизайнеров и ввожу новых людей в работу.",
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

test("CV profile CMS defaults reproduce the currently authored top-level copy exactly", async () => {
  const [{ cvContent }, sourceHtml, contentLib] = await Promise.all([
    import(cvDataModuleUrl.href),
    readFile(cvSourceUrl, "utf8"),
    import(cvContentLibUrl.href),
  ]);

  assert.deepEqual(cvContent.profile, expectedProfile);
  assert.equal(typeof contentLib.transformCvProfile, "function");
  assert.equal(contentLib.transformCvProfile(sourceHtml, cvContent), sourceHtml);
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
  assert.match(transformed, /<b>Визуал &amp; система:<\/b> безопасный &lt;текст&gt;/);
  assert.match(transformed, /<b>English &amp; русский<\/b> — B2 &lt;script&gt;/);
  assert.doesNotMatch(transformed, /<script>/);

  assert.match(transformed, /class="resume-nav"/);
  assert.match(transformed, /class="portrait"/);
  assert.match(transformed, /experience-card--jestei/);
  assert.equal(
    (transformed.match(/experience-card--[a-z0-9-]+/g) ?? []).length,
    (sourceHtml.match(/experience-card--[a-z0-9-]+/g) ?? []).length,
  );
});

test("CV content adapter fails closed on malformed profile identity and required copy", async () => {
  const [{ parseCvContent }, contentRaw] = await Promise.all([
    import(cvDataModuleUrl.href),
    readFile(cvContentUrl, "utf8"),
  ]);
  const current = JSON.parse(contentRaw);

  assert.throws(
    () => parseCvContent({ ...current, profile: undefined }),
    /profile/i,
  );

  const duplicatePrinciples = clone(expectedProfile);
  duplicatePrinciples.principles[1].id = duplicatePrinciples.principles[0].id;
  assert.throws(
    () => parseCvContent({ ...current, profile: duplicatePrinciples }),
    /duplicate.*principle|principle.*duplicate/i,
  );

  const unknownLanguage = clone(expectedProfile);
  unknownLanguage.languages[0].id = "unknown";
  assert.throws(
    () => parseCvContent({ ...current, profile: unknownLanguage }),
    /unexpected.*language|language.*unexpected/i,
  );

  const emptyRole = clone(expectedProfile);
  emptyRole.role = "";
  assert.throws(
    () => parseCvContent({ ...current, profile: emptyRole }),
    /profile\.role.*non-empty/i,
  );
});

test("Pages CMS exposes CV profile copy but keeps structural controls out of the editor", async () => {
  const cmsConfig = await readFile(cmsConfigUrl, "utf8");
  const cvConfig = cmsConfig.match(/\n  - name: cv\b[\s\S]*$/)?.[0] ?? "";

  assert.match(cvConfig, /name: profile\b[\s\S]*?type: object/);
  assert.match(cvConfig, /name: name\b[\s\S]*?type: string/);
  assert.match(cvConfig, /name: role\b[\s\S]*?type: string/);
  assert.match(cvConfig, /name: aboutPrimary\b[\s\S]*?type: text/);
  assert.match(cvConfig, /name: aboutSecondary\b[\s\S]*?type: text/);
  assert.match(cvConfig, /name: principles\b[\s\S]*?list:/);
  assert.match(cvConfig, /name: languages\b[\s\S]*?list:/);
  assert.match(cvConfig, /name: id\b[\s\S]*?readonly: true/);
  assert.doesNotMatch(cvConfig, /name: (className|layout|route|canonical|portraitSrc|stylesheet|pageType)\b/);
});
