import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

test("production fragment keeps the existing accordion identity and approved content", () => {
  const html = read("fragments/index.moves-awful.article.html");

  assert.match(html, /id="cv-trigger-09"/);
  assert.match(html, /aria-controls="cv-panel-09"/);
  assert.match(html, /id="cv-panel-09"/);
  assert.match(html, /Moves Awful/);
  assert.match(html, /Библиотека анимированных галерей для лендингов\./);
  assert.doesNotMatch(html, /class="moves-awful-showcase wrapper"/);
  assert.match(html, /Разработчик/);

  assert.doesNotMatch(html, />Система</);
  assert.doesNotMatch(html, /Каждый движок по-своему/);
  assert.doesNotMatch(html, />в продукте</);
  assert.doesNotMatch(html, /Два применения Moves Awful/);
});

test("Moves uses six production canvas galleries without preview-editor or hidden control DOM", () => {
  const html = read("fragments/index.moves-awful.article.html");
  const panels = html.match(/data-moves-awful-panel(?:\s|=)/g) ?? [];
  const galleries = html.match(/data-animated-canvas-gallery=""/g) ?? [];

  assert.equal(panels.length, 6);
  assert.equal(galleries.length, 6);
  assert.doesNotMatch(html, /data-animated-canvas-gallery-preview/);
  assert.doesNotMatch(html, /data-animated-canvas-gallery-controls/);
  assert.doesNotMatch(html, /control-dock/);
  assert.doesNotMatch(html, /cv-item__meta/);
  assert.doesNotMatch(html, /data-moves-awful-title/);
  assert.doesNotMatch(html, /data-moves-canvas/);
  assert.equal((html.match(/data-moves-awful-stage-scale=""/g) ?? []).length, 6);
  assert.doesNotMatch(html, /class="moves-awful-commercial wrapper"/);

  for (const variant of [
    "arc",
    "spiral",
    "horizontal",
    "diagonal",
    "showcase-diagonal",
    "masonry",
  ]) {
    assert.match(html, new RegExp(`data-gallery-variant="${variant}"`));
  }

  for (const source of [
    "moves-arc",
    "moves-spiral",
    "moves-horizontal",
    "moves-diagonal",
    "moves-showcase-diagonal",
    "moves-masonry",
  ]) {
    assert.match(html, new RegExp(`data-gallery-source="${source}"`));
  }

  assert.equal((html.match(/data-gallery-preset="project-wide"/g) ?? []).length, 6);
  assert.equal((html.match(/data-animation-hover="false"/g) ?? []).length, 6);
  assert.equal((html.match(/data-animation-lightbox="false"/g) ?? []).length, 6);
});

test("commercial marquee has one shared caption, link and video lightbox sources", () => {
  const html = read("fragments/index.moves-awful.article.html");

  assert.match(html, /data-media-marquee=""/);
  assert.match(html, /data-media-marquee-speed="34"/);
  assert.doesNotMatch(
    html,
    /data-media-marquee-pause-on-hover/,
  );

  assert.equal(
    (html.match(/<video\b/g) ?? []).length,
    3,
  );

  assert.equal(
    (
      html.match(
        /использование библиотеки в лендинге/g,
      ) ?? []
    ).length,
    1,
  );

  assert.match(
    html,
    /href="https:\/\/www\.jesteipool\.ru\/"[^>]*>www\.jesteipool\.ru<\/a>/,
  );

  assert.equal(
    (
      html.match(
        /data-media-lightbox-source=""/g,
      ) ?? []
    ).length,
    3,
  );

  assert.doesNotMatch(html, /<figcaption\b/);
  assert.doesNotMatch(html, /data-media-caption-surface/);

  assert.match(
    html,
    /shared\/moves-awful\/01\/source\/01-2044x1112\.mp4/,
  );
  assert.match(
    html,
    /shared\/moves-awful\/01\/source\/02-2540x790\.mp4/,
  );
  assert.match(
    html,
    /shared\/moves-awful\/01\/source\/03-1914x1208\.mp4/,
  );
});

test("Moves content sources are local and keep the existing public source keys", () => {
  const source = read("repo/src/content/animated-canvas-gallery-sources.js");

  assert.doesNotMatch(source, /unsplash/i);
  assert.match(source, /\/media\/projects\/shootings\//);

  for (const key of [
    "moves-arc",
    "moves-spiral",
    "moves-horizontal",
    "moves-diagonal",
    "moves-showcase-diagonal",
    "moves-masonry",
  ]) {
    assert.match(source, new RegExp(`"${key}"`));
  }
});

test("Moves component exposes deterministic cleanup and does not monkeypatch global resize", () => {
  const source = read("repo/src/components/moves-awful/moves-awful.js");

  assert.match(source, /export function configureMovesAwful/);
  assert.match(source, /return \(\) =>/);
  assert.match(source, /addEventListener\("click"/);
  assert.match(source, /removeEventListener\("click"/);
  assert.doesNotMatch(source, /dispatchEvent\s*\(\s*new Event\(["']resize["']/);
  assert.doesNotMatch(source, /data-animated-canvas-gallery-preview/);
  assert.doesNotMatch(source, /data-animated-canvas-gallery-controls/);
  assert.match(source, /MOBILE_STAGE_WIDTH = 1280/);
  assert.match(source, /createStageScaler/);
  assert.match(source, /ResizeObserver/);
  assert.match(source, /TAB_AUTOPLAY_MS = 5000/);
  assert.match(source, /scheduleAutoplay/);
  assert.match(source, /clearAutoplay/);
  assert.match(source, /accordionRuntime\?\.subscribeScene/);
  assert.doesNotMatch(
    source,
    /addEventListener\("visibilitychange"/,
  );
  assert.match(source, /createMediaLightbox/);
  assert.match(source, /destroyMediaLightbox/);
});

test("Moves CSS is scoped and preserves the approved V54 visual contract", () => {
  const css = read("repo/src/components/moves-awful/moves-awful.css");

  assert.match(css, /\.cv-item\.cv-item--moves-awful/);
  assert.match(css, /\.moves-awful-tabs__button/);
  assert.match(css, /flex-wrap:\s*nowrap/);
  assert.match(css, /text-transform:\s*uppercase/);
  assert.match(css, /text-shadow:/);
  assert.match(css, /--moves-awful-commercial-media-height:\s*clamp\(24rem,\s*46vw,\s*36rem\)/);
  assert.match(css, /--moves-awful-divider-color/);
  assert.match(css, /\.cv-item--moves-awful \.cv-item__title/);
  assert.match(css, /\.moves-awful-showcase::before/);
  assert.match(css, /\.moves-awful-commercial::before/);
  assert.doesNotMatch(css, /repository-link/);
  assert.doesNotMatch(css, /moves-wrap/);
  assert.doesNotMatch(css, /control-dock/);
  assert.match(css, /moves-awful-stage__scale/);
  assert.match(css, /inline-size:\s*1280px/);
  assert.match(css, /block-size:\s*720px/);
  assert.match(css, /@media \(width > 50rem\)/);
  assert.match(css, /mask-image:\s*none/);
  assert.match(css, /@media \(hover: hover\) and \(pointer: fine\)/);
  assert.match(css, /\.moves-awful-commercial__caption a:hover/);
  assert.match(css, /touch-action:\s*manipulation/);
  assert.doesNotMatch(
    css,
    /\[data-media-marquee-surface\]:hover\s*>/,
  );
});

test("safe patcher isolates the outer Moves article even when it contains nested articles", async () => {
  const modulePath = pathToFileURL(path.join(root, "tools/apply-moves-awful-patch.mjs")).href;
  const { replaceMovesArticle } = await import(modulePath);

  const before = "AAA\n";
  const after = "\nZZZ";
  const current = `${before}<article class="cv-item" data-cv-scene=""><button id="cv-trigger-09"></button><span>Moves Awful</span><div id="cv-panel-09"><article><article></article></article></div></article>${after}`;
  const replacement = '<article class="cv-item" data-cv-scene=""><button id="cv-trigger-09"></button><span>Moves Awful</span><div id="cv-panel-09"></div></article>';

  const result = replaceMovesArticle(current, replacement);

  assert.equal(result, `${before}${replacement}${after}`);
});

test("main lifecycle patch mounts Moves through the existing accordion runtime", async () => {
  const modulePath = pathToFileURL(
    path.join(root, "tools/apply-moves-awful-patch.mjs"),
  ).href;
  const { patchMainLifecycle } = await import(modulePath);

  const source = `
let destroyAccordionPresentation = null;
let domReadyHandler = null;

function unmount() {
  destroyAnimatedCanvasGalleries?.();
  destroyAnimatedCanvasGalleries = null;
}

function mount() {
  destroyAccordionPresentation = applyAccordionPresentation(document);
  configureMovesAwful(document);
  destroyImageSkeletons = createImageSkeletons({ root: document });

  cvAccordion = createCvAccordion({
    root: document,
    motion: motionPreference,
  });
  const accordionRuntime = cvAccordion?.runtime ?? null;

  setAwfulToolsAccordionRuntime(accordionRuntime, document);
}
`;

  const once = patchMainLifecycle(source);
  const twice = patchMainLifecycle(once);

  assert.equal(once, twice);
  assert.equal(
    (once.match(/let destroyMovesAwful = null;/g) ?? []).length,
    1,
  );
  assert.equal(
    (once.match(/destroyMovesAwful\?\.\(\);/g) ?? []).length,
    1,
  );
  assert.equal(
    (
      once.match(
        /destroyMovesAwful = configureMovesAwful\(document, \{ accordionRuntime \}\);/g,
      ) ?? []
    ).length,
    1,
  );
  assert.doesNotMatch(
    once,
    /^\s*configureMovesAwful\(document\);$/m,
  );
  assert.match(
    once,
    /const accordionRuntime = cvAccordion\?\.runtime \?\? null;\s*destroyMovesAwful = configureMovesAwful\(document, \{ accordionRuntime \}\);/,
  );
  assert.match(
    once,
    /destroyMovesAwful\?\.\(\);\s*destroyMovesAwful = null;\s*destroyAnimatedCanvasGalleries/,
  );
});

test("installer manifest touches only the approved surface area", () => {
  const manifest = JSON.parse(read("manifest.json"));

  assert.deepEqual(manifest.replace.sort(), [
    "src/components/moves-awful/moves-awful.css",
    "src/components/moves-awful/moves-awful.js",
    "src/content/animated-canvas-gallery-sources.js",
  ].sort());

  assert.deepEqual(manifest.patch.sort(), ["index.html", "src/main.js"].sort());
  assert.deepEqual(
    manifest.add.sort(),
    [
      "src/components/media-lightbox/media-lightbox.css",
      "src/components/media-lightbox/media-lightbox.js",
    ].sort(),
  );
});


test("media lightbox supports clone hit-testing, keyboard and Escape", () => {
  const source = read(
    "repo/src/components/media-lightbox/media-lightbox.js",
  );

  assert.match(
    source,
    /data-media-lightbox-source/,
  );
  assert.match(source, /sourceAtPoint/);
  assert.match(
    source,
    /event\.key === "Escape"/,
  );
  assert.match(
    source,
    /event\.key !== "Enter"/,
  );
  assert.match(source, /video\.play\(\)/);
  assert.match(source, /video\?\.pause\(\)/);
  assert.match(
    source,
    /lastFocused\?\.focus/,
  );
});


test("mobile scale uses one scoped browser-screen ResizeObserver", () => {
  const source = read("repo/src/components/moves-awful/moves-awful.js");

  assert.match(
    source,
    /SCREEN_SELECTOR = "\.moves-awful-browser \.browser-mockup__screen"/,
  );
  assert.equal(
    (source.match(/new ResizeObserver/g) ?? []).length,
    1,
  );
  assert.match(source, /observer\.observe\(screen\)/);
  assert.doesNotMatch(source, /MutationObserver/);
  assert.doesNotMatch(source, /IntersectionObserver/);
  assert.doesNotMatch(
    source,
    /dispatchEvent\(new Event\("resize"\)\)/,
  );
});


test("installer writes additions atomically and rolls back on failure", async () => {
  const os = await import("node:os");
  const modulePath = pathToFileURL(
    path.join(root, "tools/apply-moves-awful-patch.mjs"),
  ).href;
  const { applyWrites } = await import(modulePath);

  const temp = fs.mkdtempSync(
    path.join(os.tmpdir(), "moves-awful-write-test-"),
  );

  try {
    const existing = path.join(temp, "existing.txt");
    const added = path.join(temp, "new", "added.txt");

    fs.writeFileSync(existing, "before");

    applyWrites(
      new Map([
        [existing, Buffer.from("after")],
        [added, Buffer.from("new")],
      ]),
    );

    assert.equal(fs.readFileSync(existing, "utf8"), "after");
    assert.equal(fs.readFileSync(added, "utf8"), "new");

    fs.writeFileSync(existing, "before-again");
    fs.rmSync(path.join(temp, "new"), {
      recursive: true,
      force: true,
    });

    const blocker = path.join(temp, "blocker");
    fs.writeFileSync(blocker, "file-not-directory");

    const addedBeforeFailure = path.join(
      temp,
      "created-before-failure.txt",
    );
    const impossible = path.join(
      blocker,
      "child.txt",
    );

    assert.throws(() => {
      applyWrites(
        new Map([
          [existing, Buffer.from("broken-write")],
          [addedBeforeFailure, Buffer.from("temporary")],
          [impossible, Buffer.from("cannot-write")],
        ]),
      );
    });

    assert.equal(
      fs.readFileSync(existing, "utf8"),
      "before-again",
    );
    assert.equal(
      fs.existsSync(addedBeforeFailure),
      false,
    );
  } finally {
    fs.rmSync(temp, {
      recursive: true,
      force: true,
    });
  }
});


test("Moves autoplay is scene-owned rather than document-owned", () => {
  const source = read(
    "repo/src/components/moves-awful/moves-awful.js",
  );

  assert.match(
    source,
    /accordionRuntime\?\.subscribeScene/,
  );
  assert.match(source, /sceneActive/);
  assert.match(source, /sceneDocumentVisible/);
  assert.doesNotMatch(
    source,
    /document\.addEventListener\("visibilitychange"/,
  );
  assert.equal(
    (source.match(/window\.setTimeout/g) ?? []).length,
    1,
  );
});
