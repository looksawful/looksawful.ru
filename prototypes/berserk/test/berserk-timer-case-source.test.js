import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

function count(source, needle) {
  return source.split(needle).length - 1;
}

test("Berserk Timer uses the shared accordion runtime and no redundant visibility observers", async () => {
  const source = await read(
    "src/components/berserk-timer-case/berserk-timer-case.js",
  );

  assert.match(source, /accordionRuntime\?\.subscribeScene/);
  assert.equal(source.includes("new MutationObserver"), false);
  assert.equal(source.includes("IntersectionObserver"), false);
  assert.equal(source.includes('project === "berserk-timer"'), false);
  assert.equal(source.includes("awful-tool-preview"), false);
  assert.equal(source.includes("innerHTML"), false);
  assert.equal(/querySelector(?:All)?\(\s*["']\./.test(source), false);

  assert.equal(count(source, "new ResizeObserver"), 1);
  assert.match(source, /resizeObserver\.observe\(viewport\)/);
});

test("Berserk Timer behavior is selected through local data contracts", async () => {
  const source = await read(
    "src/components/berserk-timer-case/berserk-timer-case.js",
  );

  for (const selector of [
    "data-berserk-timer-case",
    "data-berserk-gallery",
    "data-berserk-slide",
    "data-berserk-player",
    "data-berserk-copy-target",
    "data-berserk-copy-source",
  ]) {
    assert.match(source, new RegExp(selector));
  }

  assert.equal(source.includes("data-berserk-caption"), false);
  assert.equal(source.includes("cdn.jsdelivr.net/gh/looksawful/berserk-timer"), false);
  assert.equal(source.includes("raw.githubusercontent.com/looksawful/berserk-timer"), false);
});

test("Berserk Timer CSS stays local and does not redefine the accordion theme or site font", async () => {
  const css = await read(
    "src/components/berserk-timer-case/berserk-timer-case.css",
  );

  assert.match(css, /\.berserk-case\s*\{/);
  assert.equal(css.includes(".berserk-timer-case {"), false);
  assert.equal(/--item-(?:bg|ink|text)\s*:/.test(css), false);
  assert.equal(/\.cv-item\s*\{/.test(css), false);
  assert.equal(/font-family\s*:\s*["']?Rubik/i.test(css), false);

  for (const legacySelector of [".gallery {", ".screen {", ".music-player {", ".term {"]) {
    assert.equal(css.includes(legacySelector), false, legacySelector);
  }
});

test("captions use native disclosure: hover/focus on fine pointers and click on touch", async () => {
  const [html, css, source] = await Promise.all([
    read("index.html"),
    read("src/components/berserk-timer-case/berserk-timer-case.css"),
    read("src/components/berserk-timer-case/berserk-timer-case.js"),
  ]);

  assert.equal(count(html, "data-berserk-caption=\"\""), 10);
  assert.equal(count(html, "<summary class=\"media-caption__line berserk-caption__summary\">"), 10);
  assert.match(css, /@media \(hover: hover\) and \(pointer: fine\)/);
  assert.match(css, /\.berserk-caption:hover/);
  assert.match(css, /\.berserk-caption:focus-within/);
  assert.equal(source.includes("berserk-caption"), false);
});

test("Berserk Timer is a standalone final accordion scene, not an Awful Tools preview", async () => {
  const [html, main, content, awfulTools] = await Promise.all([
    read("index.html"),
    read("src/main.js"),
    read("src/content/accordion-content.js"),
    read("src/components/awful-tools-preview/awful-tools-preview.js"),
  ]);

  assert.equal((html.match(/data-berserk-timer-case/g) ?? []).length, 1);
  assert.match(html, /<span class="cv-item__project">Berserk Timer<\/span>/);
  assert.equal(
    /<awful-tool-preview[^>]+(?:project|data-awful-tool)="berserk-timer"/.test(html),
    false,
  );

  const listStart = html.indexOf("data-cv-accordion-list");
  const berserkStart = html.indexOf('<span class="cv-item__project">Berserk Timer</span>');
  assert.ok(listStart >= 0 && berserkStart > listStart);

  assert.match(main, /createBerserkTimerCases/);
  assert.match(content, /"Berserk Timer"\s*:\s*\{/);
  assert.equal(awfulTools.includes("enhanceBerserk"), false);
  assert.equal(awfulTools.includes('project === "berserk-timer"'), false);
});
