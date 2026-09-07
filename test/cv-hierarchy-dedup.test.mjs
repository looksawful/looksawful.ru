import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const cvDataModuleUrl = new URL("../src/data/cv.ts", import.meta.url);
const cvHtmlUrl = new URL("../public/cv/index.html", import.meta.url);
const cvStructureUrl = new URL("../src/content/cv.json", import.meta.url);
const cvEditorialUrl = new URL("../src/content/editorial/cv.json", import.meta.url);
const cmsConfigUrl = new URL("../.pages.yml", import.meta.url);

test("CV has one canonical tools inventory and puts experience before competencies/toolbox", async () => {
  const [{ cvContent }, sourceHtml, structureRaw, editorialRaw, cmsConfig] = await Promise.all([
    import(cvDataModuleUrl.href),
    readFile(cvHtmlUrl, "utf8"),
    readFile(cvStructureUrl, "utf8"),
    readFile(cvEditorialUrl, "utf8"),
    readFile(cmsConfigUrl, "utf8"),
  ]);

  assert.deepEqual(Object.keys(cvContent.skills), ["hard", "tech", "soft"]);

  const structure = JSON.parse(structureRaw);
  const editorial = JSON.parse(editorialRaw);
  assert.equal(Object.hasOwn(structure.skills, "tools"), false);
  assert.equal(Object.hasOwn(editorial.skills, "tools"), false);

  assert.doesNotMatch(sourceHtml, /<section\b[^>]*class="[^"]*\btools\b[^"]*"/);

  const topIndex = sourceHtml.indexOf('class="top"');
  const experienceIndex = sourceHtml.indexOf('class="experience-sheet"');
  const hardIndex = sourceHtml.indexOf('class="block hard copy"');
  const techIndex = sourceHtml.indexOf('class="block tech"');
  assert.ok(topIndex >= 0 && experienceIndex > topIndex, "experience must follow role/responsibility profile");
  assert.ok(hardIndex > experienceIndex, "competencies must follow experience");
  assert.ok(techIndex > hardIndex, "technologies/tools must follow competencies");

  const cvConfig = cmsConfig.match(/\n  - name: cv\b[\s\S]*$/)?.[0] ?? "";
  const skillsConfig = cvConfig.match(/\n      - name: skills\b[\s\S]*?(?=\n      - name: education\b)/)?.[0] ?? "";
  assert.match(skillsConfig, /name: tech\b[\s\S]*?type: object/);
  assert.doesNotMatch(skillsConfig, /name: tools\b/);
});
