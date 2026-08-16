import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

function awfulCasesScene(html) {
  const start = html.indexOf('<article class="cv-item" data-awful-cases-showcase-scene=""');
  assert.notEqual(start, -1, "Awful Cases scene marker is present");

  const nextMatch = html
    .slice(start + 1)
    .match(/<article\s+class="[^"]*\bcv-item\b/);
  const next = nextMatch ? start + 1 + nextMatch.index : -1;
  assert.notEqual(next, -1, "next CV scene follows Awful Cases");

  return html.slice(start, next);
}

test("Awful Cases scene uses the normal accordion palette contract", async () => {
  const html = await read("index.html");
  const scene = awfulCasesScene(html);

  assert.match(scene, /data-cv-scene/);
  assert.doesNotMatch(scene, /data-cv-theme=/);
  assert.match(scene, /<span class="cv-item__project">Awful Cases<\/span>/);
  assert.doesNotMatch(scene, />Awful Tools</);
  assert.doesNotMatch(scene, /project="berserk-timer"/);
  assert.doesNotMatch(scene, /<main class="awful-cases-showcase/);
});

test("Awful Cases media follows the accordion media contract", async () => {
  const scene = awfulCasesScene(await read("index.html"));

  assert.match(scene, /data-media-id="awful-cases-assets-12"/);
  assert.match(scene, /recording-2026-08-15-121210-poster\.webp/);
  assert.match(scene, /data-awful-cases-preview-video/);
  assert.doesNotMatch(scene, /<video[^>]*\sautoplay(?:\s|=|>)/);
  assert.match(scene, /data-media-id="awful-cases-assets-11"/);
  assert.match(scene, /data-media-caption-surface/);
  assert.match(scene, /<span class="media-caption__index">01<\/span>/);
  assert.match(scene, /<span class="media-caption__index">02<\/span>/);
  assert.match(scene, /<span class="media-caption__index">03<\/span>/);
});

test("terminal content is directly copyable", async () => {
  const scene = awfulCasesScene(await read("index.html"));
  const visibleText = scene
    .replace(/<[^>]+>/g, "")
    .replace(/&gt;/g, ">")
    .replace(/&lt;/g, "<")
    .replace(/&amp;/g, "&");

  assert.match(visibleText, /git clone https:\/\/github\.com\/looksawful\/awful-cases\.git/);
  assert.match(visibleText, /cd awful-cases\\app/);
  assert.match(visibleText, /\.\\awful-cases\.ahk/);
  assert.doesNotMatch(visibleText, /C:\\\\>/);
  assert.doesNotMatch(visibleText, /REM /);
  assert.doesNotMatch(visibleText, /\.\\awful-cases\.exe/);

  assert.match(
    scene,
    /<pre id="awful-cases-install"><code>[\s\S]*git[\s\S]*clone[\s\S]*https:\/\/github\.com\/looksawful\/awful-cases\.git[\s\S]*\n<span class="awful-cases-showcase__console-line">[\s\S]*cd[\s\S]*awful-cases\\app[\s\S]*<\/code><\/pre>/,
  );
});

test("showcase CSS consumes site palette instead of assigning it", async () => {
  const css = await read("src/components/awful-cases-showcase/awful-cases-showcase.css");

  assert.match(css, /var\(--item-text\)/);
  assert.doesNotMatch(css, /--item-bg\s*:/);
  assert.doesNotMatch(css, /--item-ink\s*:/);
  assert.doesNotMatch(css, /--item-text\s*:/);
  assert.match(css, /\.awful-cases-showcase__code-pair\s*\{[^}]*display:\s*flex/s);
  assert.match(css, /@media \(width <= 50rem\)[\s\S]*\.awful-cases-showcase__copy-button[^{]*\{[^}]*display:\s*none/s);
});

test("preview host uses the shared accordion runtime only", async () => {
  const js = await read("src/components/awful-tools-preview/awful-tools-preview.js");

  assert.match(js, /AWFUL_CASES_MODULE_URL\s*=\s*"\/pets\/awful-cases\/awful-cases\.js"/);
  assert.match(js, /runtime\.subscribeScene/);
  assert.doesNotMatch(js, /MutationObserver/);
  assert.doesNotMatch(js, /berserk/i);
  assert.doesNotMatch(js, /C:\\\\\\\\>/);
  assert.match(js, /target\.textContent\.trim\(\)/);
});

test("main bundle loads the Awful Cases showcase component CSS", async () => {
  const main = await read("src/main.js");
  const hostCss = await read("src/components/awful-tools-preview/awful-tools-preview.css");

  assert.match(
    main,
    /import "\.\/components\/awful-cases-showcase\/awful-cases-showcase\.css";/,
  );
  assert.doesNotMatch(hostCss, /\.awful-tools-stack/);
});
