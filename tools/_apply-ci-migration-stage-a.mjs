import { readFile, writeFile, unlink } from "node:fs/promises";

const read = (path) => readFile(path, "utf8");
const write = (path, value) => writeFile(path, value, "utf8");

function replaceRequired(source, before, after, label) {
  if (!source.includes(before)) throw new Error(`Missing migration target: ${label}`);
  return source.replace(before, after);
}

function replaceTestBlock(source, title, replacement) {
  const marker = `test("${title}"`;
  const start = source.indexOf(marker);
  if (start === -1) throw new Error(`Missing test block: ${title}`);
  const next = source.indexOf("\ntest(\"", start + marker.length);
  const end = next === -1 ? source.length : next + 1;
  return `${source.slice(0, start)}${replacement.trimEnd()}\n${source.slice(end)}`;
}

function replaceCollection(source, name, replacement) {
  const contentStart = source.indexOf("\ncontent:\n");
  if (contentStart === -1) throw new Error("Missing Pages CMS content section");
  const marker = `  - name: ${name}\n`;
  const start = source.indexOf(marker, contentStart);
  if (start === -1) throw new Error(`Missing Pages CMS collection: ${name}`);
  const next = source.indexOf("\n  - name: ", start + marker.length);
  const end = next === -1 ? source.length : next + 1;
  return `${source.slice(0, start)}${replacement.trimEnd()}\n${source.slice(end)}`;
}

const yamlScalar = (name, label, type = "string", indent = 6) => {
  const pad = " ".repeat(indent);
  return [
    `${pad}- name: ${name}`,
    `${pad}  label: ${label}`,
    `${pad}  type: ${type}`,
  ].join("\n");
};

const yamlStringList = (name, label, indent = 10) => {
  const pad = " ".repeat(indent);
  return [
    `${pad}- name: ${name}`,
    `${pad}  label: ${label}`,
    `${pad}  type: string`,
    `${pad}  list: true`,
  ].join("\n");
};

function yamlPairObject(name, label, fields, indent) {
  const pad = " ".repeat(indent);
  const child = fields.map(([field, fieldLabel, type = "string"]) => yamlScalar(field, fieldLabel, type, indent + 4)).join("\n");
  return [
    `${pad}- name: ${name}`,
    `${pad}  label: ${label}`,
    `${pad}  type: object`,
    `${pad}  required: true`,
    `${pad}  fields:`,
    child,
  ].join("\n");
}

function yamlFixedMap(name, label, entries, renderEntry, indent) {
  const pad = " ".repeat(indent);
  return [
    `${pad}- name: ${name}`,
    `${pad}  label: ${label}`,
    `${pad}  type: object`,
    `${pad}  required: true`,
    `${pad}  fields:`,
    ...Object.entries(entries).map(([key, value]) => renderEntry(key, value, indent + 4)),
  ].join("\n");
}

function buildCvCollection(editorial) {
  const principles = yamlFixedMap(
    "principles",
    "Ключевые тезисы",
    editorial.profile.principles,
    (key, _value, indent) => yamlPairObject(key, key, [["title", "Заголовок"], ["text", "Текст", "text"]], indent),
    10,
  );
  const languages = yamlFixedMap(
    "languages",
    "Языки",
    editorial.profile.languages,
    (key, _value, indent) => yamlPairObject(key, key, [["name", "Язык"], ["level", "Уровень"]], indent),
    10,
  );

  const profile = [
    "      - name: profile",
    "        label: Профиль",
    "        type: object",
    "        required: true",
    "        fields:",
    yamlScalar("name", "Имя", "string", 10),
    yamlScalar("role", "Роль / заголовок", "string", 10),
    yamlScalar("aboutPrimary", "О себе — абзац 1", "text", 10),
    yamlScalar("aboutSecondary", "О себе — абзац 2", "text", 10),
    yamlScalar("location", "Местоположение", "string", 10),
    principles,
    languages,
  ].join("\n");

  const skillSections = Object.entries(editorial.skills).map(([sectionId, section]) => {
    const rows = yamlFixedMap(
      "rows",
      "Строки",
      section.rows,
      (rowId, _row, indent) => yamlPairObject(rowId, rowId, [["label", "Подзаголовок"], ["text", "Текст", "text"]], indent),
      14,
    );
    return [
      `          - name: ${sectionId}`,
      `            label: ${sectionId}`,
      "            type: object",
      "            required: true",
      "            fields:",
      yamlScalar("title", "Заголовок блока", "string", 14),
      rows,
    ].join("\n");
  }).join("\n");

  const skills = [
    "      - name: skills",
    "        label: Навыки и инструменты",
    "        type: object",
    "        required: true",
    "        fields:",
    skillSections,
  ].join("\n");

  const higher = [
    "          - name: higher",
    "            label: Высшее образование",
    "            type: object",
    "            required: true",
    "            fields:",
    yamlScalar("name", "Учебное заведение", "string", 14),
    yamlStringList("lines", "Строки", 14),
  ].join("\n");

  const additional = yamlFixedMap(
    "additional",
    "Дополнительное образование",
    editorial.education.additional,
    (key, _value, indent) => [
      `${" ".repeat(indent)}- name: ${key}`,
      `${" ".repeat(indent)}  label: ${key}`,
      `${" ".repeat(indent)}  type: object`,
      `${" ".repeat(indent)}  required: true`,
      `${" ".repeat(indent)}  fields:`,
      yamlScalar("name", "Название", "string", indent + 4),
      yamlStringList("lines", "Курсы / строки", indent + 4),
    ].join("\n"),
    10,
  );

  const education = [
    "      - name: education",
    "        label: Образование",
    "        type: object",
    "        required: true",
    "        fields:",
    yamlScalar("higherTitle", "Заголовок высшего образования", "string", 10),
    higher,
    yamlScalar("additionalTitle", "Заголовок дополнительного образования", "string", 10),
    additional,
  ].join("\n");

  const experience = yamlFixedMap(
    "experience",
    "Опыт",
    editorial.experience,
    (key, value, indent) => {
      const pad = " ".repeat(indent);
      return [
        `${pad}- name: ${key}`,
        `${pad}  label: ${value.company || key}`,
        `${pad}  type: object`,
        `${pad}  required: true`,
        `${pad}  fields:`,
        yamlScalar("company", "Компания / проект", "string", indent + 4),
        yamlScalar("context", "Контекст", "string", indent + 4),
        yamlScalar("period", "Период", "string", indent + 4),
        yamlScalar("role", "Роль", "string", indent + 4),
        yamlScalar("description", "Описание", "text", indent + 4),
        yamlStringList("cases", "Кейсы", indent + 4),
        `${" ".repeat(indent + 4)}- name: facts`,
        `${" ".repeat(indent + 4)}  label: Факты`,
        `${" ".repeat(indent + 4)}  type: object`,
        `${" ".repeat(indent + 4)}  list: true`,
        `${" ".repeat(indent + 4)}  fields:`,
        yamlScalar("label", "Подпись", "string", indent + 8),
        yamlScalar("text", "Текст", "text", indent + 8),
      ].join("\n");
    },
    6,
  );

  return [
    "  - name: cv",
    "    label: Резюме — тексты",
    "    type: file",
    "    path: src/content/editorial/cv.json",
    "    format: json",
    "    operations:",
    "      create: false",
    "      rename: false",
    "      delete: false",
    "    commit:",
    "      templates:",
    "        update: \"content(cms): update CV copy\"",
    "    actions:",
    "      - name: verify-cv",
    "        label: Проверить сайт",
    "        workflow: ci-fast.yml",
    "        ref: current",
    "        confirm:",
    "          title: Запустить быструю проверку сайта?",
    "          message: Будут проверены TypeScript, быстрые тесты и production build. Эта кнопка ничего не публикует.",
    "          button: Проверить",
    "    fields:",
    profile,
    skills,
    education,
    experience,
  ].join("\n");
}

function buildProjectCollections(copy) {
  const editorialFields = Object.keys(copy).map((id) => [
    `      - name: ${id}`,
    `        label: ${id}`,
    "        type: object",
    "        required: true",
    "        fields:",
    yamlScalar("title", "Название", "string", 10),
    yamlScalar("focus", "Описание", "text", 10),
    yamlScalar("role", "Роль", "string", 10),
    yamlScalar("period", "Период", "string", 10),
    yamlScalar("ariaLabel", "ARIA label", "string", 10),
    yamlScalar("coverAlt", "Alt обложки", "text", 10),
  ].join("\n")).join("\n");

  const copyCollection = [
    "  - name: project-cards",
    "    label: Карточки проектов — тексты",
    "    type: file",
    "    path: src/content/editorial/home-project-cards.json",
    "    format: json",
    "    operations:",
    "      create: false",
    "      rename: false",
    "      delete: false",
    "    commit:",
    "      templates:",
    "        update: \"content(cms): update homepage project card copy\"",
    "    actions:",
    "      - name: verify-project-card-copy",
    "        label: Проверить сайт",
    "        workflow: ci-fast.yml",
    "        ref: current",
    "        confirm:",
    "          title: Запустить быструю проверку сайта?",
    "          message: Будут проверены TypeScript, быстрые тесты и production build. Эта кнопка ничего не публикует.",
    "          button: Проверить",
    "    fields:",
    editorialFields,
  ].join("\n");

  const mediaCollection = [
    "  - name: project-card-media",
    "    label: Карточки проектов — видимость и обложки",
    "    type: file",
    "    path: src/content/projects.json",
    "    format: json",
    "    list: true",
    "    operations:",
    "      create: false",
    "      rename: false",
    "      delete: false",
    "    commit:",
    "      templates:",
    "        update: \"content(cms): update homepage project card media\"",
    "    actions:",
    "      - name: verify-project-card-media",
    "        label: Проверить сайт",
    "        workflow: ci-fast.yml",
    "        ref: current",
    "        confirm:",
    "          title: Запустить быструю проверку сайта?",
    "          message: Будут проверены TypeScript, быстрые тесты и production build. Эта кнопка ничего не публикует.",
    "          button: Проверить",
    "    fields:",
    "      - name: id",
    "        label: ID",
    "        type: string",
    "        required: true",
    "        readonly: true",
    "      - name: visible",
    "        label: Показывать на главной",
    "        type: boolean",
    "        required: true",
    "      - name: cover",
    "        label: Обложка",
    "        type: object",
    "        required: true",
    "        fields:",
    "          - name: src",
    "            label: Обложка проекта",
    "            type: image",
    "            required: true",
    "            options:",
    "              media: project-covers",
    "              extensions: [webp]",
    "              categories: [image]",
    "              rename: safe",
    "          - name: width",
    "            label: Ширина",
    "            type: number",
    "            required: true",
    "            options:",
    "              min: 1",
    "          - name: height",
    "            label: Высота",
    "            type: number",
    "            required: true",
    "            options:",
    "              min: 1",
  ].join("\n");

  return `${copyCollection}\n${mediaCollection}`;
}

// CV composer: canonical structure plus optional authored-copy override.
{
  const path = "src/data/cv-source.ts";
  let source = await read(path);
  source = replaceRequired(
    source,
    'const structure = cvStructureJson as unknown as CvStructureSource;\nconst editorial = cvEditorialJson as unknown as CvEditorialSource;\n\nexport const cvSourceJson = Object.freeze({',
    'const structure = cvStructureJson as unknown as CvStructureSource;\n\nexport function composeCvSourceJson(\n  editorialSource: CvEditorialSource = cvEditorialJson as unknown as CvEditorialSource,\n) {\n  const editorial = editorialSource;\n  return Object.freeze({',
    "cv-source composer opening",
  );
  const close = source.lastIndexOf("\n});");
  if (close === -1) throw new Error("Missing cv-source composer closing");
  source = `${source.slice(0, close)}\n  });\n}\n\nexport const cvSourceJson = composeCvSourceJson();${source.slice(close + 4)}`;
  await write(path, source);
}

// Explicit CV content files may be either a full composed fixture or authored editorial override.
{
  const path = "tools/lib/cv-content.mjs";
  let source = await read(path);
  source = replaceRequired(
    source,
    '} from "../../src/data/cv.ts";\n',
    '} from "../../src/data/cv.ts";\nimport { composeCvSourceJson } from "../../src/data/cv-source.ts";\n',
    "cv-content composer import",
  );
  source = replaceRequired(
    source,
    '  return parseCvContent(parsed);\n}\n\nexport function transformCvProfile',
    '  if (Array.isArray(parsed?.experience)) return parseCvContent(parsed);\n  if (parsed && typeof parsed === "object" && parsed.profile && parsed.education && !Array.isArray(parsed.experience)) {\n    return parseCvContent(composeCvSourceJson(parsed));\n  }\n  throw new Error("CV content override must be a composed CV document or authored editorial CV document");\n}\n\nexport function transformCvProfile',
    "readCvContent split boundary",
  );
  await write(path, source);
}

// Pages CMS schema must match the split sources, not the former composed representation.
{
  const path = ".pages.yml";
  let source = await read(path);
  const [cvEditorial, projectCopy] = await Promise.all([
    read("src/content/editorial/cv.json").then(JSON.parse),
    read("src/content/editorial/home-project-cards.json").then(JSON.parse),
  ]);
  source = replaceCollection(source, "project-cards", buildProjectCollections(projectCopy));
  source = replaceCollection(source, "cv", buildCvCollection(cvEditorial));
  source = source.replaceAll("workflow: verify-pr.yml", "workflow: ci-fast.yml");
  source = source.replaceAll("Запустить полную проверку сайта?", "Запустить быструю проверку сайта?");
  source = source.replaceAll("browser smoke tests", "быстрые тесты и production build");
  source = source.replaceAll("browser smoke test", "быстрые тесты и production build");
  if (source.includes("workflow: verify-pr.yml")) throw new Error("Dead verify-pr.yml CMS action remains");
  await write(path, source);
}

// Stale full-CV parser fixtures now start from the composed runtime document.
for (const path of [
  "test/cv-contacts-cms.test.mjs",
  "test/cv-education-cms.test.mjs",
  "test/cv-profile-cms.test.mjs",
  "test/cv-skills-cms.test.mjs",
]) {
  let source = await read(path);
  source = source.replace(
    'const [{ parseCvContent }, contentRaw] = await Promise.all([\n    import(cvDataModuleUrl.href),\n    readFile(cvContentUrl, "utf8"),\n  ]);\n  const current = JSON.parse(contentRaw);',
    'const { parseCvContent, cvContent } = await import(cvDataModuleUrl.href);\n  const current = clone(cvContent);',
  );
  await write(path, source);
}

// CMS contact schema now owns only authored location; handles/URLs remain structural.
{
  const path = "test/cv-contacts-cms.test.mjs";
  let source = await read(path);
  source = replaceTestBlock(source, "Pages CMS exposes only CV contact values, not link mechanics", `test("Pages CMS exposes only authored CV location while structural contacts stay outside the editor", async () => {
  const cmsConfig = await readFile(cmsConfigUrl, "utf8");
  const cvConfig = cmsConfig.match(/\\n  - name: cv\\b[\\s\\S]*$/)?.[0] ?? "";
  const profileConfig = cvConfig.match(/\\n      - name: profile\\b[\\s\\S]*?(?=\\n      - name: skills\\b)/)?.[0] ?? "";

  assert.match(profileConfig, /name: location\\b[\\s\\S]*?type: string/);
  assert.doesNotMatch(profileConfig, /name: contacts\\b/);
  for (const field of ["phone", "telegram", "instagram", "email", "website"]) {
    assert.doesNotMatch(cvConfig, new RegExp(\`- name: \${field}\\\\b\`));
  }
  assert.doesNotMatch(cvConfig, /name: (href|target|rel|route|canonical)\\b/);
});`);
  await write(path, source);
}

// New keyed editorial shape owns copy; stable IDs/order remain in cv-contract.ts.
{
  const path = "test/cv-profile-cms.test.mjs";
  let source = await read(path);
  source = replaceTestBlock(source, "Pages CMS exposes CV profile copy but keeps structural controls out of the editor", `test("Pages CMS exposes keyed profile copy while stable identity stays outside editorial JSON", async () => {
  const cmsConfig = await readFile(cmsConfigUrl, "utf8");
  const cvConfig = cmsConfig.match(/\\n  - name: cv\\b[\\s\\S]*$/)?.[0] ?? "";
  const profileConfig = cvConfig.match(/\\n      - name: profile\\b[\\s\\S]*?(?=\\n      - name: skills\\b)/)?.[0] ?? "";

  for (const field of ["name", "role", "aboutPrimary", "aboutSecondary", "location"]) {
    assert.match(profileConfig, new RegExp(\`name: \${field}\\\\b\`));
  }
  assert.match(profileConfig, /name: principles\\b[\\s\\S]*?type: object/);
  assert.match(profileConfig, /name: visual\\b[\\s\\S]*?type: object/);
  assert.match(profileConfig, /name: languages\\b[\\s\\S]*?type: object/);
  assert.match(profileConfig, /name: english\\b[\\s\\S]*?type: object/);
  assert.doesNotMatch(profileConfig, /- name: id\\b|\\blist:/);
  assert.doesNotMatch(profileConfig, /name: (visible|titleVisible|route|canonical|portraitSrc|stylesheet|pageType)\\b/);
});`);
  await write(path, source);
}

{
  const path = "test/cv-skills-cms.test.mjs";
  let source = await read(path);
  source = replaceTestBlock(source, "Pages CMS exposes the four fixed CV skill blocks without layout or HTML controls", `test("Pages CMS exposes keyed authored skill copy without structural visibility or row identity", async () => {
  const cmsConfig = await readFile(cmsConfigUrl, "utf8");
  const cvConfig = cmsConfig.match(/\\n  - name: cv\\b[\\s\\S]*$/)?.[0] ?? "";
  const skillsConfig = cvConfig.match(/\\n      - name: skills\\b[\\s\\S]*?(?=\\n      - name: education\\b)/)?.[0] ?? "";

  for (const id of ["hard", "tech", "soft", "tools"]) {
    assert.match(skillsConfig, new RegExp(\`name: \${id}\\\\b[\\\\s\\\\S]*?type: object\`));
  }
  assert.match(skillsConfig, /name: rows\\b[\\s\\S]*?type: object/);
  assert.match(skillsConfig, /name: identity\\b[\\s\\S]*?type: object/);
  assert.match(skillsConfig, /name: label\\b[\\s\\S]*?type: string/);
  assert.match(skillsConfig, /name: text\\b[\\s\\S]*?type: text/);
  assert.doesNotMatch(skillsConfig, /name: (id|visible|titleVisible|className|html|markup|layout|column|route|stylesheet)\\b/);
});`);
  await write(path, source);
}

{
  const path = "test/cv-education-cms.test.mjs";
  let source = await read(path);
  source = replaceTestBlock(source, "Pages CMS exposes education copy but keeps href and layout code-owned", `test("Pages CMS exposes keyed education copy while stable course identity and hrefs stay code-owned", async () => {
  const cmsConfig = await readFile(cmsConfigUrl, "utf8");
  const cvConfig = cmsConfig.match(/\\n  - name: cv\\b[\\s\\S]*$/)?.[0] ?? "";
  const educationConfig = cvConfig.match(/\\n      - name: education\\b[\\s\\S]*?(?=\\n      - name: experience\\b)/)?.[0] ?? "";

  assert.match(educationConfig, /name: higherTitle\\b[\\s\\S]*?type: string/);
  assert.match(educationConfig, /name: higher\\b[\\s\\S]*?type: object/);
  assert.match(educationConfig, /name: additionalTitle\\b[\\s\\S]*?type: string/);
  assert.match(educationConfig, /name: additional\\b[\\s\\S]*?type: object/);
  assert.match(educationConfig, /name: hexlet\\b[\\s\\S]*?type: object/);
  assert.match(educationConfig, /name: lines\\b[\\s\\S]*?list: true/);
  assert.doesNotMatch(educationConfig, /- name: id\\b|name: (href|url|target|rel|className|layout|column|html|markup)\\b/);
});`);
  await write(path, source);
}

// Production workflow assertion follows the npm boundary and proves the script mapping separately.
{
  const path = "test/cv-entry.test.mjs";
  let source = await read(path);
  source = replaceRequired(
    source,
    'const pagesWorkflowUrl = new URL("../.github/workflows/pages.yml", import.meta.url);',
    'const pagesWorkflowUrl = new URL("../.github/workflows/pages.yml", import.meta.url);\nconst packageUrl = new URL("../package.json", import.meta.url);',
    "cv-entry package URL",
  );
  source = replaceTestBlock(source, "production deployment strips hidden CV experience cards before upload", `test("production deployment strips hidden CV experience cards before upload", async () => {
  const [workflow, packageRaw] = await Promise.all([
    readFile(pagesWorkflowUrl, "utf8"),
    readFile(packageUrl, "utf8"),
  ]);
  const { scripts } = JSON.parse(packageRaw);

  assert.match(workflow, /run: npm run cv:prod:prepare(?:\\n|$)/);
  assert.equal(scripts["cv:prod:prepare"], "node tools/prepare-cv-production.mjs");
  assert.doesNotMatch(workflow, /node tools\\/prepare-cv-production\\.mjs\\s+dist\\/cv\\/index\\.html/);
});`);
  await write(path, source);
}

// Explicit editorial override is composed with canonical structural visibility.
{
  const path = "test/cv-production.test.mjs";
  let source = await read(path);
  source = replaceRequired(
    source,
    'const contentUrl = new URL("../src/content/cv.json", import.meta.url);',
    'const editorialContentUrl = new URL("../src/content/editorial/cv.json", import.meta.url);\nconst cvDataModuleUrl = new URL("../src/data/cv.ts", import.meta.url);',
    "cv-production content URLs",
  );
  source = replaceTestBlock(source, "production CV physically removes exactly the experience hidden by structured CMS content", `test("production CV composes editorial override with canonical structural visibility", async () => {
  const dir = await mkdtemp(join(tmpdir(), "cv-production-"));
  const htmlPath = join(dir, "index.html");
  const editorialPath = join(dir, "editorial-cv.json");
  const [sourceHtml, editorialRaw, { cvContent }] = await Promise.all([
    readFile(sourceCvUrl, "utf8"),
    readFile(editorialContentUrl, "utf8"),
    import(cvDataModuleUrl.href),
  ]);
  const editorial = JSON.parse(editorialRaw);
  await writeFile(htmlPath, sourceHtml, "utf8");
  await writeFile(editorialPath, JSON.stringify(editorial), "utf8");

  const result = spawnSync(process.execPath, [scriptUrl.pathname, htmlPath, editorialPath], { encoding: "utf8" });
  assert.equal(result.status, 0, \`production CV preparation failed:\\n\${result.stderr || result.stdout}\`);

  const builtHtml = await readFile(htmlPath, "utf8");
  for (const { id, visible } of cvContent.experience) {
    assert.equal(articleExists(builtHtml, id), visible, \`production visibility mismatch for CV experience \${id}\`);
  }
  assert.doesNotMatch(builtHtml, /<article\\b(?=[^>]*\\bclass=["'][^"']*\\bexperience-card\\b[^"']*["'])(?=[^>]*\\bhidden(?:\\s*=\\s*(?:"[^"]*"|'[^']*'|[^\\s>]+))?)[^>]*>/i);
});`);
  await write(path, source);
}

// Split project-card tests now mutate authored copy independently from structure.
{
  const path = "test/editorial-copy-optional.test.mjs";
  let source = await read(path);
  source = replaceRequired(
    source,
    'import { parseCvContent } from "../src/data/cv.ts";',
    'import { cvContent, parseCvContent } from "../src/data/cv.ts";',
    "editorial optional cvContent import",
  );
  source = replaceTestBlock(source, "project-card copy derives omitted canonical values while explicit teaser overrides stay editable", `test("project-card copy derives omitted canonical values while explicit teaser overrides stay editable", async () => {
  const [structure, copy] = await Promise.all([
    readFile(new URL("../src/content/projects.json", import.meta.url), "utf8").then(JSON.parse),
    readFile(new URL("../src/content/editorial/home-project-cards.json", import.meta.url), "utf8").then(JSON.parse),
  ]);
  const editedCopy = clone(copy);
  delete editedCopy.jestei.title;
  editedCopy.jestei.focus = "   ";
  editedCopy.jestei.role = "";
  delete editedCopy.jestei.period;
  delete editedCopy.jestei.ariaLabel;
  delete editedCopy.jestei.coverAlt;

  const parsed = parseProjectCardPresentations(structure, editedCopy);
  assert.equal(parsed[0].title, "Jestei Pool");
  assert.equal(parsed[0].focus, "");
  assert.equal(parsed[0].role, "");
  assert.equal(parsed[0].period, "2024–2026");
  assert.equal(parsed[0].cover.alt, "");

  const html = renderProjectCard(parsed[0]);
  assert.match(html, /aria-label="Перейти к проекту Jestei Pool"/);
  assert.match(html, /project-card__name/);
  assert.doesNotMatch(html, /project-card__focus/);
  assert.doesNotMatch(html, /project-card__role/);

  const invalidCopy = clone(copy);
  invalidCopy.jestei.title = 42;
  assert.throws(() => parseProjectCardPresentations(structure, invalidCopy), /title.*string/i);

  const missingTechnicalSource = clone(structure);
  delete missingTechnicalSource[0].cover.src;
  assert.throws(() => parseProjectCardPresentations(missingTechnicalSource, copy), /cover.*src/i);
});`);
  source = replaceTestBlock(source, "empty CV copy is normalized and hidden without generating broken contact links", `test("empty composed CV copy is normalized and hidden without generating broken contact links", async () => {
  const sourceHtml = await readFile(new URL("../public/cv/index.html", import.meta.url), "utf8");
  const edited = clone(cvContent);

  for (const key of ["name", "role", "aboutPrimary", "aboutSecondary"]) delete edited.profile[key];
  edited.profile.contacts = {};
  edited.profile.principles = edited.profile.principles.map(({ id }) => ({ id }));
  edited.profile.languages = edited.profile.languages.map(({ id }) => ({ id }));

  for (const section of Object.values(edited.skills)) {
    delete section.title;
    section.rows = section.rows.map(({ id }) => ({ id }));
  }

  delete edited.education.higherTitle;
  edited.education.higher = { id: edited.education.higher.id };
  delete edited.education.additionalTitle;
  edited.education.additional = edited.education.additional.map(({ id }) => ({ id }));

  edited.experience = edited.experience.map(({ id, visible }) => ({ id, visible, cases: [], facts: [], links: [] }));

  const parsed = parseCvContent(edited);
  const html = transformCvContent(sourceHtml, parsed).html;
  assert.equal(parsed.profile.name, "");
  assert.match(html, /<h1\\b[^>]*class="name"[^>]* hidden>/);
  assert.match(html, /<div\\b[^>]*class="contacts"[^>]* hidden>/);
  assert.match(html, /<div\\b[^>]*class="url"[^>]* hidden>/);
  assert.doesNotMatch(html, /href="tel:"/);
  assert.doesNotMatch(html, /href="mailto:"/);
  assert.doesNotMatch(html, /href="https:\\/\\/t\\.me\\/"/);
  assert.match(html, /<section\\b[^>]*class="[^"]*\\bhard\\b[^"]*"[^>]* hidden>/);
  assert.match(html, /<section\\b[^>]*class="education"[^>]* hidden>/);
  assert.match(html, /<div class="course" hidden>/);
  assert.match(html, /<article\\b[^>]*experience-card--jestei[^>]* hidden>/);
  assert.match(html, /<h3\\b[^>]*class="experience-company"[^>]* hidden>/);
  assert.match(html, /<div\\b[^>]*class="experience-cases"[^>]* hidden>/);
});`);
  await write(path, source);
}

// Prevent regressions back to the retired CMS workflow action.
{
  const path = "test/ci-minimal-pipeline.test.mjs";
  let source = await read(path);
  const insertion = `\ntest("Pages CMS actions reference only live lightweight verification workflows", async () => {\n  const cms = await read(".pages.yml");\n  assert.doesNotMatch(cms, /workflow: verify-pr\\.yml/);\n  assert.match(cms, /workflow: ci-fast\\.yml/);\n});\n`;
  if (!source.includes("Pages CMS actions reference only live lightweight verification workflows")) source += insertion;
  await write(path, source);
}

await unlink("tools/_apply-ci-migration-stage-a.mjs");
await unlink(".github/workflows/_apply-ci-migration-stage-a.yml");
