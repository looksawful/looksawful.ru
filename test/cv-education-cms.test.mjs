import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const cvDataModuleUrl = new URL("../src/data/cv.ts", import.meta.url);
const cvContentUrl = new URL("../src/content/cv.json", import.meta.url);
const cvSourceUrl = new URL("../public/cv/index.html", import.meta.url);
const cvContentLibUrl = new URL("../tools/lib/cv-content.mjs", import.meta.url);
const cmsConfigUrl = new URL("../.pages.yml", import.meta.url);

const expectedEducation = {
  higherTitle: "ВЫСШЕЕ ОБРАЗОВАНИЕ",
  higher: {
    id: "mpgu",
    name: "МПГУ им. Ленина",
    lines: [
      "Славянская и западноевропейская филология",
      "Компаративистика",
    ],
  },
  additionalTitle: "ДОПОЛНИТЕЛЬНОЕ ОБРАЗОВАНИЕ",
  additional: [
    {
      id: "hexlet",
      name: "HEXLET",
      lines: [
        "JS: Архитектура фронтенда",
        "JS: Абстракция с помощью данных",
        "JS: Составные данные",
        "JS: Объектно-ориентированный дизайн",
        "JS: Прототипы",
        "TypeScript",
        "Асинхронное программирование на JavaScript",
        "JS: Автоматическое тестирование",
        "JS: Продвинутое тестирование",
        "React",
        "React Hooks",
        "Redux Toolkit",
        "HTTP API",
        "REST API в Node.js",
        "Git",
        "CI",
      ],
    },
    {
      id: "stepik",
      name: "STEPIK",
      lines: [
        "Введение в программирование (C++)",
        "JavaScript для начинающих",
        "Python: основы и применение",
        "Веб-технологии: практический курс",
        "CSS",
      ],
    },
    {
      id: "codecademy",
      name: "CODECADEMY",
      lines: ["Learn CSS", "Learn JavaScript", "Learn Python 3", "Learn TypeScript", "Learn React"],
    },
    {
      id: "kevin-powell",
      name: "KEVIN POWELL",
      lines: ["Conquering Responsive Layouts", "Build a Space Travel Website", "HTML & CSS Crash Course"],
    },
    {
      id: "book-of-shaders",
      name: "PATRICIO GONZALEZ VIVO & JEN LOWE",
      lines: ["The Book of Shaders"],
    },
    {
      id: "blender-studio",
      name: "BLENDER STUDIO / SYBREN STÜVEL",
      lines: ["Scripting for Artists"],
    },
    {
      id: "blender-guru",
      name: "BLENDER GURU / ANDREW PRICE",
      lines: ["Blender Beginner Donut Tutorial"],
    },
    {
      id: "cg-boost",
      name: "CG BOOST / ZACH REINHARDT",
      lines: ["Blender Launch Pad"],
    },
    {
      id: "creative-shrimp",
      name: "CREATIVE SHRIMP / GLEB ALEXANDROV & AIDY BURROWS",
      lines: ["Hard Surface Modeling in Blender", "Cinematic Lighting in Blender", "HDR Image-Based Lighting in Blender"],
    },
    {
      id: "cg-cookie",
      name: "CG COOKIE",
      lines: ["Blender Python Scripting Superpowers for Non-Programmers"],
    },
    {
      id: "phlearn",
      name: "PHLEARN / AARON NACE",
      lines: [
        "Photoshop 101–301",
        "The Ultimate Guide to Retouching",
        "How to Master Dodging & Burning in Photoshop",
        "Advanced Compositing with Stock Images in Photoshop",
      ],
    },
    {
      id: "ridd",
      name: "MICHAEL “RIDD” RIDDERING",
      lines: ["Figma Academy"],
    },
    {
      id: "mizko",
      name: "MIZKO",
      lines: ["Figma & UI Design Masterclass"],
    },
    {
      id: "photoplay-producer",
      name: "PHOTOPLAY / НИНА ЛОБЫКИНА",
      lines: ["Продюсирование съёмок"],
    },
    {
      id: "photoplay-model",
      name: "PHOTOPLAY / IRA ROKKA",
      lines: ["Работа с моделью"],
    },
    {
      id: "ilyahov",
      name: "МАКСИМ ИЛЬЯХОВ",
      lines: ["Основы визуального повествования"],
    },
  ],
};

const expectedLinks = {
  mpgu: "https://mpgu.su/",
  hexlet: "https://ru.hexlet.io/",
  stepik: "https://stepik.org/",
  codecademy: "https://www.codecademy.com/",
  "kevin-powell": "https://www.kevinpowell.co/",
  "book-of-shaders": "https://thebookofshaders.com/",
  "blender-studio": "https://studio.blender.org/",
  "blender-guru": "https://www.youtube.com/@blenderguru",
  "cg-boost": "https://www.cgboost.com/",
  "creative-shrimp": "https://www.creativeshrimp.com/",
  "cg-cookie": "https://cgcookie.com/",
  phlearn: "https://phlearn.com/",
  ridd: "https://ridd.substack.com/",
  mizko: "https://www.mizko.net/",
  "photoplay-producer": "https://photoplay.ru/",
  "photoplay-model": "https://photoplay.ru/",
  ilyahov: "https://bureau.ru/soviet/",
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

test("CV education CMS defaults reproduce the currently authored education block exactly", async () => {
  const [{ cvContent, CV_EDUCATION_LINKS }, sourceHtml, contentLib] = await Promise.all([
    import(cvDataModuleUrl.href),
    readFile(cvSourceUrl, "utf8"),
    import(cvContentLibUrl.href),
  ]);

  assert.deepEqual(cvContent.education, expectedEducation);
  assert.deepEqual(CV_EDUCATION_LINKS, expectedLinks);
  assert.equal(typeof contentLib.transformCvEducation, "function");
  assert.equal(contentLib.transformCvEducation(sourceHtml, cvContent), sourceHtml);
});

test("CV education transform edits copy safely while preserving code-owned links and markup", async () => {
  const [{ cvContent }, sourceHtml, contentLib] = await Promise.all([
    import(cvDataModuleUrl.href),
    readFile(cvSourceUrl, "utf8"),
    import(cvContentLibUrl.href),
  ]);

  const education = clone(expectedEducation);
  education.higher.name = "МПГУ <test> & университет";
  education.higher.lines[0] = "Филология <script>alert(1)</script> & культура";
  education.additional[0].name = "HEXLET & SCHOOL";
  education.additional[0].lines[0] = "JS <advanced> & architecture";

  const transformed = contentLib.transformCvEducation(sourceHtml, {
    ...cvContent,
    education,
  });

  assert.match(transformed, /МПГУ &lt;test&gt; &amp; университет/);
  assert.match(transformed, /Филология &lt;script&gt;alert\(1\)&lt;\/script&gt; &amp; культура/);
  assert.match(transformed, /HEXLET &amp; SCHOOL/);
  assert.match(transformed, /JS &lt;advanced&gt; &amp; architecture/);
  assert.doesNotMatch(transformed, /<script>alert\(1\)<\/script>/);

  for (const href of Object.values(expectedLinks)) {
    assert.ok(transformed.includes(`href="${href}"`), `education href changed: ${href}`);
  }
  assert.match(transformed, /<section class="education">/);
  assert.match(transformed, /<div class="education-layout">/);
  assert.match(transformed, /<div class="courses-grid">/);
});

test("CV education adapter fixes identity, order and required text structure", async () => {
  const [{ parseCvContent }, contentRaw] = await Promise.all([
    import(cvDataModuleUrl.href),
    readFile(cvContentUrl, "utf8"),
  ]);
  const current = JSON.parse(contentRaw);

  assert.throws(
    () => parseCvContent({ ...current, education: undefined }),
    /education/i,
  );

  const duplicate = clone(expectedEducation);
  duplicate.additional[1].id = duplicate.additional[0].id;
  assert.throws(
    () => parseCvContent({ ...current, education: duplicate }),
    /duplicate.*education|education.*duplicate|duplicate.*course/i,
  );

  const unknown = clone(expectedEducation);
  unknown.additional[0].id = "unknown";
  assert.throws(
    () => parseCvContent({ ...current, education: unknown }),
    /unexpected.*education|education.*unexpected|unexpected.*course/i,
  );

  const missing = clone(expectedEducation);
  missing.additional.pop();
  assert.throws(
    () => parseCvContent({ ...current, education: missing }),
    /missing.*education|education.*missing|course count/i,
  );

  const emptyLines = clone(expectedEducation);
  emptyLines.higher.lines = [];
  assert.throws(
    () => parseCvContent({ ...current, education: emptyLines }),
    /higher.*lines|education.*lines|non-empty/i,
  );
});

test("CV education transform fails closed when a code-owned course href drifts", async () => {
  const [{ cvContent }, sourceHtml, contentLib] = await Promise.all([
    import(cvDataModuleUrl.href),
    readFile(cvSourceUrl, "utf8"),
    import(cvContentLibUrl.href),
  ]);

  const drifted = sourceHtml.replace(
    'href="https://ru.hexlet.io/"',
    'href="https://example.com/wrong-hexlet"',
  );

  assert.throws(
    () => contentLib.transformCvEducation(drifted, cvContent),
    /hexlet.*href|href.*hexlet|education.*link/i,
  );
});

test("Pages CMS exposes education copy but keeps href and layout code-owned", async () => {
  const cmsConfig = await readFile(cmsConfigUrl, "utf8");
  const cvConfig = cmsConfig.match(/\n  - name: cv\b[\s\S]*$/)?.[0] ?? "";
  const educationConfig = cvConfig.match(/\n      - name: education\b[\s\S]*?(?=\n      - name: experience\b)/)?.[0] ?? "";

  assert.match(educationConfig, /name: education\b[\s\S]*?type: object/);
  assert.match(educationConfig, /name: higherTitle\b[\s\S]*?type: string/);
  assert.match(educationConfig, /name: higher\b[\s\S]*?name: id\b[\s\S]*?readonly: true/);
  assert.match(educationConfig, /name: additionalTitle\b[\s\S]*?type: string/);
  assert.match(educationConfig, /name: additional\b[\s\S]*?list:/);
  assert.match(educationConfig, /name: name\b[\s\S]*?type: string/);
  assert.match(educationConfig, /name: lines\b[\s\S]*?list:/);
  assert.doesNotMatch(educationConfig, /name: (href|url|target|rel|className|layout|column|html|markup)\b/);
});
