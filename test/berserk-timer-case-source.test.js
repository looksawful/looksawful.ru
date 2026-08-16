import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL("../" + path, import.meta.url), "utf8");
const count = (source, needle) => source.split(needle).length - 1;

test("Berserk Timer uses the shared scene lifecycle without redundant visibility observers", async () => {
  const source = await read("src/components/berserk-timer-case/berserk-timer-case.js");
  assert.match(source, /sceneRuntime\?\.subscribeScene/);
  assert.equal(source.includes("new MutationObserver"), false);
  assert.equal(source.includes("IntersectionObserver"), false);
  assert.equal(source.includes('project === "berserk-timer"'), false);
  assert.equal(source.includes("awful-tool-preview"), false);
  assert.equal(source.includes("innerHTML"), false);
  assert.equal(count(source, "new ResizeObserver"), 1);
});

test("Berserk Timer behavior is selected through local data contracts", async () => {
  const source = await read("src/components/berserk-timer-case/berserk-timer-case.js");
  for (const selector of ["data-berserk-timer-case", "data-berserk-gallery", "data-berserk-slide", "data-berserk-player", "data-berserk-copy-target", "data-berserk-copy-source"]) {
    assert.match(source, new RegExp(selector));
  }
  assert.equal(source.includes("data-berserk-caption"), false);
});

test("Berserk Timer CSS stays local and does not redefine the sheet theme or site font", async () => {
  const css = await read("src/components/berserk-timer-case/berserk-timer-case.css");
  assert.match(css, /\.berserk-case\s*\{/);
  assert.equal(/--item-(?:bg|ink|text)\s*:/.test(css), false);
  assert.equal(/\.cv-item\s*\{/.test(css), false);
  assert.equal(/font-family\s*:\s*["']?Rubik/i.test(css), false);
});

test("captions use native disclosure: hover/focus on fine pointers and click on touch", async () => {
  const [html, css, source] = await Promise.all([read("index.html"), read("src/components/berserk-timer-case/berserk-timer-case.css"), read("src/components/berserk-timer-case/berserk-timer-case.js")]);
  assert.equal(count(html, 'data-berserk-caption=""'), 10);
  assert.equal(count(html, '<summary class="media-caption__line berserk-caption__summary">'), 10);
  assert.match(css, /@media \(hover: hover\) and \(pointer: fine\)/);
  assert.match(css, /\.berserk-caption:hover/);
  assert.match(css, /\.berserk-caption:focus-within/);
  assert.equal(source.includes("berserk-caption"), false);
});

test("Berserk Timer is a standalone final sheet, not an Awful Tools preview", async () => {
  const [html, main, awfulTools] = await Promise.all([read("index.html"), read("src/main.js"), read("src/components/awful-tools-preview/awful-tools-preview.js")]);
  assert.equal((html.match(/data-berserk-timer-case/g) ?? []).length, 1);
  assert.match(html, /<span[^>]*class="[^"]*cv-item__project[^"]*"[^>]*>\s*Berserk Timer\s*<\/span>/);
  assert.equal(/<awful-tool-preview[^>]+(?:project|data-awful-tool)="berserk-timer"/.test(html), false);

  const projects = [...html.matchAll(/<span[^>]*class="[^"]*cv-item__project[^"]*"[^>]*>([\s\S]*?)<\/span>/g)]
    .map(([, name]) => name.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim());
  assert.equal(projects.at(-1), "Berserk Timer");

  assert.match(main, /createBerserkTimerCases/);
  assert.equal(awfulTools.includes("enhanceBerserk"), false);
  assert.equal(awfulTools.includes('project === "berserk-timer"'), false);
});
