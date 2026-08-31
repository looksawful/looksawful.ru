import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const cvDataModuleUrl = new URL("../src/data/cv.ts", import.meta.url);
const cvContentUrl = new URL("../src/content/cv.json", import.meta.url);
const cvSourceUrl = new URL("../public/cv/index.html", import.meta.url);
const cvContentLibUrl = new URL("../tools/lib/cv-content.mjs", import.meta.url);
const cmsConfigUrl = new URL("../.pages.yml", import.meta.url);

const expectedEducation = {
  higherTitle: "ОБРАЗОВАНИЕ",
  higher: {
    id: "mpgu",
    name: "Московский педагогический государственный университет (МПГУ)",
    lines: [
      "2012–2016",
      "Филология — «Славянская и западноевропейская филология»",
    ],
  },
  additionalTitle: "ДОПОЛНИТЕЛЬНОЕ ОБРАЗОВАНИЕ",
  additional: [
    {
      id: "hexlet",
      name: "HEXLET",
      lines: [
        "JS: Архитектура фронтенда",
        "TypeScript",
        "Асинхронное программирование на JS",
        "JS: Автоматическое тестирование",
        "JS: Продвинутое тестирование",
        "React",
      ],
    },
    {
      id: "stepik",
      name: "STEPIK",
      lines: [
        "Введение в программирование (C++)",
        "Python: основы и применение",
        "JavaScript для начинающих",
        "Веб-технологии: практический курс CSS",
      ],
    },
    { id: "kevin-powell", name: "KEVIN POWELL", lines: ["Conquering Responsive Layouts", "Build a Space Travel Website"] },
    { id: "book-of-shaders", name: "PATRICIO GONZALEZ VIVO & JEN LOWE", lines: ["The Book of Shaders"] },
    { id: "lewy-blue", name: "LEWY BLUE", lines: ["Discover three.js"] },
    { id: "threejs", name: "THREE.JS", lines: ["Three.js Fundamentals"] },
    { id: "figma", name: "FIGMA", lines: ["Learn Design", "Introduction to Design Systems"] },
    { id: "ridd", name: "MICHAEL “RIDD” RIDDERING", lines: ["Figma Academy"] },
    { id: "mizko", name: "MIZKO", lines: ["Figma & UI Design Masterclass"] },
    { id: "alexey-bychkov", name: "ALEXEY BYCHKOV", lines: ["Фигма с нуля"] },
    { id: "blender-studio", name: "BLENDER STUDIO / SYBREN STÜVEL", lines: ["Scripting for Artists"] },
    { id: "gamedev-tv", name: "GAMEDEV.TV / GRANT ABBITT", lines: ["Blender Environment Artist: Create Your Own 3D Game Worlds"] },
    { id: "andrey-sokolov", name: "ANDREY SOKOLOV", lines: ["Blender"] },
    { id: "blender-bros", name: "BLENDER BROS / JOSH GAMBRELL & RYUU", lines: ["The BlenderBros Hard Surface Game Asset Course"] },
    { id: "covingsworth", name: "COVINGSWORTH", lines: ["Ultimate Photorealistic Environment Animation Course"] },
    { id: "creative-shrimp-hard-surface", name: "CREATIVE SHRIMP / GLEB ALEXANDROV & AIDY BURROWS", lines: ["Hard Surface Modeling in Blender"] },
    { id: "creative-shrimp-lighting", name: "CREATIVE SHRIMP / GLEB ALEXANDROV", lines: ["Cinematic Lighting in Blender", "HDR Image-Based Lighting in Blender"] },
    { id: "phlearn", name: "PHLEARN / AARON NACE", lines: ["The Ultimate Guide to Retouching", "Advanced Compositing with Stock Images in Photoshop"] },
    { id: "photoplay-producer", name: "PHOTOPLAY / НИНА ЛОБЫКИНА", lines: ["Продюсирование съёмок"] },
    { id: "photoplay-model", name: "PHOTOPLAY / IRA ROKKA", lines: ["Работа с моделью"] },
  ],
};

const expectedLinks = {
  mpgu: "https://mpgu.su/",
  hexlet: "https://ru.hexlet.io/",
  stepik: "https://stepik.org/",
  "kevin-powell": "https://www.kevinpowell.co/",
  "book-of-shaders": "https://thebookofshaders.com/",
  "lewy-blue": "https://discoverthreejs.com/",
  threejs: "https://threejs.org/manual/",
  figma: "https://www.figma.com/resource-library/design-basics/",
  ridd: "https://ridd.substack.com/",
  mizko: "https://www.mizko.net/",
  "alexey-bychkov": "https://www.youtube.com/channel/UCClA4EqjQMGyYR2-TIuHwQw",
  "blender-studio": "https://studio.blender.org/",
  "gamedev-tv": "https://gamedev.tv/courses/blender-environment-artist",
  "andrey-sokolov": "https://www.youtube.com/c/AndreySokolovRu",
  "blender-bros": "https://www.blenderbros.com/",
  covingsworth: "https://www.artstation.com/marketplace/p/PmwnV/ultimate-photorealistic-3d-environment-animation-course-blender-substance-painter-speedtree-davinci-resolve",
  "creative-shrimp-hard-surface": "https://www.creativeshrimp.com/",
  "creative-shrimp-lighting": "https://www.creativeshrimp.com/",
  phlearn: "https://phlearn.com/",
  "photoplay-producer": "https://photoplay.ru/",
  "photoplay-model": "https://photoplay.ru/",
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

test("CV education migration fixture reproduces authored markup while live copy remains editable", async () => {
  const [{ cvContent, CV_EDUCATION_LINKS }, sourceHtml, contentLib] = await Promise.all([
    import(cvDataModuleUrl.href),
    readFile(cvSourceUrl, "utf8"),
    import(cvContentLibUrl.href),
  ]);

  assert.deepEqual(CV_EDUCATION_LINKS, expectedLinks);
  assert.equal(
    contentLib.transformCvEducation(sourceHtml, { ...cvContent, education: expectedEducation }),
    sourceHtml,
  );
  assert.equal(cvContent.education.higher.id, expectedEducation.higher.id);
  assert.deepEqual(
    cvContent.education.additional.map(({ id }) => id),
    expectedEducation.additional.map(({ id }) => id),
  );
  assert.doesNotThrow(() => contentLib.transformCvEducation(sourceHtml, cvContent));
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
  assert.doesNotMatch(transformed, /<script\b/i);

  for (const href of Object.values(expectedLinks)) {
    assert.ok(transformed.includes(`href="${href}"`), `education href changed: ${href}`);
  }
  assert.match(transformed, /<section class="education">/);
  assert.match(transformed, /<div class="education-layout">/);
  assert.match(transformed, /<div class="courses-grid">/);
});

test("CV education adapter fixes identity and order while allowing empty copy", async () => {
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
  delete emptyLines.higher.name;
  const parsedEmpty = parseCvContent({ ...current, education: emptyLines });
  assert.equal(parsedEmpty.education.higher.name, "");
  assert.deepEqual(parsedEmpty.education.higher.lines, []);

  const invalidCopy = clone(expectedEducation);
  invalidCopy.higher.lines = [42];
  assert.throws(
    () => parseCvContent({ ...current, education: invalidCopy }),
    /higher.*lines|education.*lines|string/i,
  );
});

test("CV education transform restores code-owned course hrefs when source markup drifts", async () => {
  const [{ cvContent }, sourceHtml, contentLib] = await Promise.all([
    import(cvDataModuleUrl.href),
    readFile(cvSourceUrl, "utf8"),
    import(cvContentLibUrl.href),
  ]);

  const drifted = sourceHtml.replace(
    'href="https://ru.hexlet.io/"',
    'href="https://example.com/wrong-hexlet"',
  );

  const transformed = contentLib.transformCvEducation(drifted, cvContent);
  assert.doesNotMatch(transformed, /https:\/\/example\.com\/wrong-hexlet/);
  assert.match(transformed, /href="https:\/\/ru\.hexlet\.io\/"/);
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
