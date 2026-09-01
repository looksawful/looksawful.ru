import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const cvDataModuleUrl = new URL("../src/data/cv.ts", import.meta.url);
const cvContentUrl = new URL("../src/content/cv.json", import.meta.url);
const cvSourceUrl = new URL("../public/cv/index.html", import.meta.url);
const cvContentLibUrl = new URL("../tools/lib/cv-content.mjs", import.meta.url);
const cmsConfigUrl = new URL("../.pages.yml", import.meta.url);

const expectedSkills = {
  hard: {
    visible: true,
    titleVisible: true,
    title: "КОМПЕТЕНЦИИ",
    rows: [
      { id: "identity", label: "Разработка айдентики:", text: "создание логотипа • подбор шрифтов • формирование цветовой палитры • дизайн печатных материалов • проектирование упаковки • разработка мерча • создание маскота • создание иконок и графики • формирование брендбука" },
      { id: "direction", label: "Арт- и дизайн-дирекшн:", text: "разработка визуальной концепции • руководство арт- и дизайн-направлениями • формирование брендбука • дизайн-ревью • аудит дизайн-ресурсов • контроль реализации" },
      { id: "product", label: "Продуктовый и UX/UI-дизайн:", text: "анализ продукта • исследование аудитории и конкурентов • глубинные интервью • коридорные тестирования • юзабилити-исследования • формирование и проверка гипотез • проектирование функций и пользовательских сценариев • информационная архитектура • CJM и user flow • прототипирование • проектирование адаптивных интерфейсов • дизайн-системы • MVP и приоритизация • анализ продуктовых метрик" },
      { id: "communications", label: "Коммуникации:", text: "разработка коммуникационной платформы • формирование ключевых сообщений • упаковка продуктов и функций • tone of voice и редакционная политика • продуктовая терминология и нейминг • UX-writing" },
      { id: "motion", label: "Motion:", text: "анимация интерфейсов и микровзаимодействий • анимация типографики и графики • motion-айдентика • промо-анимация • интерактивная графика" },
      { id: "graphic", label: "Графический дизайн:", text: "типографические системы • модульные сетки • многостраничная вёрстка • дизайн публикаций • инфографика и визуализация данных • фотомонтаж и коллаж • обработка изображений • препресс и подготовка к производству • книжный дизайн • газетный дизайн" },
      { id: "generative", label: "Генеративный дизайн и AI:", text: "генерация изображений, видео и звука • генеративная графика • prompt design • создание генеративных пайплайнов • автоматизация производства контента • интеграция AI в дизайн-процессы" },
      { id: "production", label: "Продюсирование съёмок:", text: "формирование команды • поиск и координация подрядчиков • бюджетирование • кастинг • скаутинг • локейшн • стилизация • аренда оборудования • закупки • организация съёмочного процесса • постановка света • постпродакшен • ретушь • цветокоррекция" },
    ],
  },
  tech: {
    visible: true,
    titleVisible: true,
    title: "ТЕХНОЛОГИИ И ИНСТРУМЕНТЫ",
    rows: [
      { id: "design", label: "Дизайн:", text: "Figma • Illustrator • InDesign • CorelDRAW • Krita • Font Forge" },
      { id: "development", label: "Разработка:", text: "CSS • JavaScript • TypeScript • Python • VS Code • WebStorm • Zed • GLSL • Canvas • SVG • GSAP" },
      { id: "graphics-3d", label: "3D и компьютерная графика:", text: "Blender • Maya • ZBrush • Material Designer • Three.js" },
      { id: "images", label: "Постпродакшен:", text: "Photoshop • Lightroom • Capture One • ImageMagick" },
      { id: "ai", label: "ИИ:", text: "Stable Diffusion • SDXL • FLUX.1 • FLUX.2 • Z-Image • Qwen-Image • HunyuanImage-3.0 • HiDream-I1 • ComfyUI • ControlNet • IP-Adapter • LoRA • Automatic1111 • SwarmUI • Codex • Claude • Ollama • OpenClaw" },
      { id: "motion", label: "Моушен-дизайн:", text: "After Effects • Premiere Pro • Final Cut Pro • FFmpeg • Ableton Live • Adobe Audition • WebGL" },
    ],
  },
  soft: {
    visible: false,
    titleVisible: false,
    title: "СОФТ СКИЛЛС",
    rows: [
      { id: "leader", label: "Руководитель:", text: "ставлю задачи, распределяю работу, провожу ревью и контролирую качество результата." },
      { id: "researcher", label: "Исследователь:", text: "разбираюсь в продукте, аудитории и проблеме до того, как предлагать решение." },
      { id: "teacher", label: "Преподаватель:", text: "объясняю решения и принципы, помогаю дизайнерам развивать самостоятельность." },
      { id: "negotiator", label: "Переговорщик:", text: "презентую и защищаю решения, договариваюсь с продуктом, разработкой, руководством и подрядчиками." },
      { id: "multitasking", label: "Мультизадачный:", text: "веду несколько направлений одновременно и удерживаю связи между дизайном, продуктом и производством." },
      { id: "responsible", label: "Ответственный:", text: "довожу задачи от постановки до реализации, контролирую сроки и качество." },
    ],
  },
  tools: {
    visible: false,
    titleVisible: false,
    title: "СОФТ",
    rows: [
      { id: "design", label: "Дизайн:", text: "Figma, Photoshop, Blender, ComfyUI, InDesign, CorelDRAW, Krita, Illustrator, Material Designer, Font Forge, Maya, ZBrush" },
      { id: "code", label: "Код:", text: "VS Code, WebStorm, Zed" },
      { id: "tests", label: "Тесты:", text: "DevTools, Playwright" },
      { id: "audio", label: "Звук:", text: "Ableton Live, Adobe Audition" },
      { id: "color", label: "Цвет:", text: "Lightroom, Capture One" },
      { id: "shootings", label: "Съёмки:", text: "Set a Light" },
      { id: "editing", label: "Монтаж:", text: "Premiere Pro, After Effects, Final Cut Pro" },
      { id: "ai", label: "ИИ:", text: "Codex, Claude, Ollama, Open Claw, ComfyUI, Automatic1111, SwarmUI" },
      { id: "utilities", label: "Утилиты:", text: "ImageMagick • FFmpeg" },
    ],
  },
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

test("CV skill migration fixture reproduces authored blocks while live copy remains editable", async () => {
  const [{ cvContent }, sourceHtml, contentLib] = await Promise.all([
    import(cvDataModuleUrl.href),
    readFile(cvSourceUrl, "utf8"),
    import(cvContentLibUrl.href),
  ]);

  assert.equal(
    contentLib.transformCvSkills(sourceHtml, { ...cvContent, skills: expectedSkills }),
    sourceHtml,
  );
  for (const sectionId of ["hard", "tech", "soft", "tools"]) {
    assert.deepEqual(
      cvContent.skills[sectionId].rows.map(({ id }) => id),
      expectedSkills[sectionId].rows.map(({ id }) => id),
      `${sectionId} stable row identity changed`,
    );
  }
  assert.doesNotThrow(() => contentLib.transformCvSkills(sourceHtml, cvContent));
});

test("CV skill transform escapes CMS copy while preserving section and paragraph markup", async () => {
  const [{ cvContent }, sourceHtml, contentLib] = await Promise.all([
    import(cvDataModuleUrl.href),
    readFile(cvSourceUrl, "utf8"),
    import(cvContentLibUrl.href),
  ]);

  const skills = clone(expectedSkills);
  skills.hard.title = "Hard <skills> & direction";
  skills.hard.rows[0].label = "Айдентика & бренд:";
  skills.hard.rows[0].text = "логотип <script>alert(1)</script> & система";

  const transformed = contentLib.transformCvSkills(sourceHtml, {
    ...cvContent,
    skills,
  });

  assert.match(transformed, /Hard &lt;skills&gt; &amp; direction/);
  assert.match(transformed, /<b>Айдентика &amp; бренд:<\/b> логотип &lt;script&gt;alert\(1\)&lt;\/script&gt; &amp; система/);
  assert.doesNotMatch(transformed, /<script\b/i);
  assert.match(transformed, /<section class="block hard copy">/);
  assert.match(transformed, /<section class="block tech">/);
  assert.match(transformed, /<section class="block soft copy" hidden>/);
  assert.match(transformed, /<section class="block tools" hidden>/);
  assert.match(transformed, /<section class="block soft copy" hidden><h2 class="section-title" hidden>/);
  assert.equal(
    (transformed.match(/<section class="block (?:hard copy|tech|soft copy|tools)"(?: hidden)?>/g) ?? []).length,
    4,
  );
});

test("CV skill adapter fails closed on missing blocks and malformed stable row identity", async () => {
  const [{ parseCvContent }, contentRaw] = await Promise.all([
    import(cvDataModuleUrl.href),
    readFile(cvContentUrl, "utf8"),
  ]);
  const current = JSON.parse(contentRaw);

  assert.throws(
    () => parseCvContent({ ...current, skills: undefined }),
    /skills/i,
  );

  const duplicate = clone(expectedSkills);
  duplicate.hard.rows[1].id = duplicate.hard.rows[0].id;
  assert.throws(
    () => parseCvContent({ ...current, skills: duplicate }),
    /duplicate.*hard|hard.*duplicate|duplicate.*row/i,
  );

  const unknown = clone(expectedSkills);
  unknown.tools.rows[0].id = "unknown";
  assert.throws(
    () => parseCvContent({ ...current, skills: unknown }),
    /unexpected.*tools|tools.*unexpected|unexpected.*row/i,
  );

  const missing = clone(expectedSkills);
  missing.soft.rows.pop();
  assert.throws(
    () => parseCvContent({ ...current, skills: missing }),
    /missing.*soft|soft.*missing|row count/i,
  );
});

test("CV skill transform fails closed when source paragraph structure drifts", async () => {
  const [{ cvContent }, sourceHtml, contentLib] = await Promise.all([
    import(cvDataModuleUrl.href),
    readFile(cvSourceUrl, "utf8"),
    import(cvContentLibUrl.href),
  ]);

  const drifted = sourceHtml.replace(
    /(<section class="block tech">[\s\S]*?)<p><b>Моушен-дизайн:<\/b>[\s\S]*?<\/p>(<\/section>)/,
    "$1$2",
  );

  assert.throws(
    () => contentLib.transformCvSkills(drifted, cvContent),
    /tech.*row|row.*tech|paragraph.*tech/i,
  );
});

test("Pages CMS exposes the four fixed CV skill blocks without layout or HTML controls", async () => {
  const cmsConfig = await readFile(cmsConfigUrl, "utf8");
  const cvConfig = cmsConfig.match(/\n  - name: cv\b[\s\S]*$/)?.[0] ?? "";

  assert.match(cvConfig, /name: skills\b[\s\S]*?type: object/);
  for (const id of ["hard", "tech", "soft", "tools"]) {
    assert.match(cvConfig, new RegExp(`name: ${id}\\b[\\s\\S]*?type: object`));
  }
  assert.match(cvConfig, /name: rows\b[\s\S]*?list:/);
  assert.match(cvConfig, /name: visible\b[\s\S]*?type: boolean/);
  assert.match(cvConfig, /name: titleVisible\b[\s\S]*?type: boolean/);
  assert.match(cvConfig, /name: id\b[\s\S]*?readonly: true/);
  assert.match(cvConfig, /name: label\b[\s\S]*?type: string/);
  assert.match(cvConfig, /name: text\b[\s\S]*?type: text/);
  assert.doesNotMatch(cvConfig, /name: (className|html|markup|layout|column|route|stylesheet)\b/);
});
