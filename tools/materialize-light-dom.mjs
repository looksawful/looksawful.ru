import { readFile, writeFile, rename, rm, readdir, stat, mkdir } from "node:fs/promises";
import { join, extname } from "node:path";
import { parseHTML } from "linkedom";
import postcss from "postcss";
import { createSensetiqueIndexPlugin } from "./sensetique-index-plugin.mjs";

const ROOT = process.cwd();
const INDEX_PATH = join(ROOT, "index.html");
const OLD_CV_CSS = join(ROOT, "src/components/cv-accordion/cv-accordion.css");
const SHEETS_DIR = join(ROOT, "src/components/cv-sheets");
const SHEETS_CSS = join(SHEETS_DIR, "cv-sheets.css");
const SENSETIQUE_CSS = join(ROOT, "src/components/sensetique-case/sensetique-case.css");
const OLD_PRESENTATION_CSS = join(ROOT, "src/content/accordion-presentation.css");
const PRESENTATION_CSS = join(ROOT, "src/content/cv-presentation.css");

const identifierReplacements = [
  ["accordionRuntime", "sceneRuntime"],
  ["AccordionRuntime", "SceneRuntime"],
  ["setAwfulToolsAccordionRuntime", "setAwfulToolsSceneRuntime"],
  ["getAccordionHeader", "getSceneHeader"],
  ["isAccordionActive", "isSceneActive"],
  ["accordionHeader", "sceneHeader"],
];

const classReplacements = [
  ["cv-scroll-scene", "cv-sheets-scene"],
  ["cv-accordion__list", "cv-sheets__list"],
  ["cv-accordion", "cv-sheets"],
  ["data-cv-accordion-scene", "data-cv-sheets-scene"],
  ["data-cv-accordion-list", "data-cv-sheets-list"],
  ["data-cv-accordion", "data-cv-sheets"],
];

function replaceAllPairs(source, pairs) {
  return pairs.reduce((value, [from, to]) => value.split(from).join(to), source);
}

async function walkFiles(root, extensions = new Set([".js", ".css", ".html"])) {
  const result = [];
  for (const name of await readdir(root)) {
    const path = join(root, name);
    const info = await stat(path);
    if (info.isDirectory()) result.push(...await walkFiles(path, extensions));
    else if (extensions.has(extname(path))) result.push(path);
  }
  return result;
}

function installDomGlobals(window, document) {
  Object.assign(globalThis, {
    window,
    document,
    Element: window.Element,
    HTMLElement: window.HTMLElement,
    HTMLButtonElement: window.HTMLButtonElement,
    HTMLDialogElement: window.HTMLDialogElement ?? window.HTMLElement,
    HTMLImageElement: window.HTMLImageElement,
    HTMLVideoElement: window.HTMLVideoElement,
    HTMLInputElement: window.HTMLInputElement,
    HTMLTemplateElement: window.HTMLTemplateElement,
    Document: window.Document,
    MutationObserver: undefined,
    getComputedStyle(element) {
      const ratio = element?.style?.aspectRatio || element?.style?.getPropertyValue?.("aspect-ratio") || "auto";
      return { aspectRatio: ratio || "auto", columnGap: "0px", gap: "0px" };
    },
  });
}

function replaceElementTag(document, element, tagName) {
  const replacement = document.createElement(tagName);
  for (const { name, value } of [...element.attributes]) {
    if (["type", "aria-expanded", "aria-controls", "disabled", "inert"].includes(name)) continue;
    replacement.setAttribute(name, value);
  }
  while (element.firstChild) replacement.append(element.firstChild);
  element.replaceWith(replacement);
  return replacement;
}

function materializeSheets(document) {
  const scene = document.querySelector("#cv");
  if (!(scene instanceof HTMLElement)) throw new Error("CV scene #cv is missing");

  scene.classList.remove("cv-scroll-scene");
  scene.classList.add("cv-sheets-scene");
  for (const name of ["data-cv-accordion-scene", "data-initial", "data-mode", "data-reduced-mode", "data-resolved-mode", "data-mounted"]) {
    scene.removeAttribute(name);
  }
  scene.setAttribute("data-cv-sheets-scene", "");

  const component = scene.querySelector(":scope > .cv-accordion");
  if (component instanceof HTMLElement) {
    component.classList.replace("cv-accordion", "cv-sheets");
    component.removeAttribute("data-cv-accordion");
    component.setAttribute("data-cv-sheets", "");
  }

  const list = component?.querySelector(":scope > .cv-accordion__list");
  if (list instanceof HTMLElement) {
    list.classList.replace("cv-accordion__list", "cv-sheets__list");
    list.removeAttribute("data-cv-accordion-list");
    list.setAttribute("data-cv-sheets-list", "");
  }

  scene.querySelectorAll(".cv-item__header").forEach((header) => {
    if (header.tagName.toLowerCase() === "button") replaceElementTag(document, header, "header");
    else {
      header.removeAttribute("aria-expanded");
      header.removeAttribute("aria-controls");
      header.removeAttribute("disabled");
      header.removeAttribute("inert");
    }
  });

  scene.querySelectorAll(".cv-item__body").forEach((panel) => {
    panel.removeAttribute("hidden");
    panel.removeAttribute("inert");
    panel.removeAttribute("role");
    panel.removeAttribute("aria-labelledby");
  });

  scene.querySelectorAll(".cv-accordion__progress, .cv-sheets__progress").forEach((node) => node.remove());
  scene.querySelectorAll("[data-cv-scroll-owner]").forEach((node) => node.removeAttribute("data-cv-scroll-owner"));
  scene.querySelectorAll("[data-cv-scroll-track]").forEach((node) => node.removeAttribute("data-cv-scroll-track"));
  scene.querySelectorAll("[data-cv-scroll-screens]").forEach((node) => node.removeAttribute("data-cv-scroll-screens"));

  document.querySelectorAll("[data-accordion-primary-copy], [data-accordion-persistent-copy], [data-jestei-filter-intro]").forEach((node) => {
    node.removeAttribute("data-accordion-primary-copy");
    node.removeAttribute("data-accordion-persistent-copy");
    node.removeAttribute("data-jestei-filter-intro");
  });
}

async function materializeHtmlAndSensetiqueCss() {
  const source = await readFile(INDEX_PATH, "utf8");
  const plugin = createSensetiqueIndexPlugin({ root: ROOT });
  const generated = await plugin.transformIndexHtml(source);
  const { document, window } = parseHTML(generated);
  installDomGlobals(window, document);

  const { applyAccordionContent } = await import("../src/content/accordion-content.js");
  const { applyAccordionPresentation } = await import("../src/content/accordion-presentation.js");
  applyAccordionContent(document);
  const destroyPresentation = applyAccordionPresentation(document);
  destroyPresentation?.();

  const sensetiqueStyle = document.querySelector("style[data-sensetique-case-styles]");
  if (!(sensetiqueStyle instanceof HTMLElement)) throw new Error("Generated Sensetique CSS is missing");
  await writeFile(SENSETIQUE_CSS, `${sensetiqueStyle.textContent.trim()}\n`, "utf8");
  sensetiqueStyle.remove();

  materializeSheets(document);

  const projects = [...document.querySelectorAll("#cv .cv-item__project")].map((node) => node.textContent.replace(/\s+/g, " ").trim());
  const styxIndex = projects.indexOf("Styx Jewels");
  const sensetiqueIndex = projects.indexOf("Sensetique");
  if (styxIndex < 0 || sensetiqueIndex !== styxIndex + 1) throw new Error("Sensetique is not directly after Styx");
  if (projects.filter((name) => name === "Sensetique").length !== 1) throw new Error("Sensetique must exist exactly once");
  if (document.querySelector("#cv .cv-item__body[hidden]")) throw new Error("All CV sheets must be expanded in source HTML");

  const result = `<!doctype html>\n${document.documentElement.outerHTML}\n`;
  await writeFile(INDEX_PATH, result, "utf8");
}

function addThemeRules(css) {
  return `${css.trim()}\n\n@layer components {\n  .cv-item[data-cv-theme="item-01"] { --item-bg: var(--cv-item-01-background); --item-ink: var(--cv-item-01-foreground); }\n  .cv-item[data-cv-theme="item-02"] { --item-bg: var(--cv-item-02-background); --item-ink: var(--cv-item-02-foreground); }\n  .cv-item[data-cv-theme="item-03"] { --item-bg: var(--cv-item-03-background); --item-ink: var(--cv-item-03-foreground); }\n  .cv-item[data-cv-theme="item-04"] { --item-bg: var(--cv-item-04-background); --item-ink: var(--cv-item-04-foreground); }\n  .cv-item[data-cv-theme="item-05"] { --item-bg: var(--cv-item-05-background); --item-ink: var(--cv-item-05-foreground); }\n  .cv-item[data-cv-theme="item-06"] { --item-bg: var(--cv-item-06-background); --item-ink: var(--cv-item-06-foreground); }\n  .cv-item[data-cv-theme="item-07"] { --item-bg: var(--cv-item-07-background); --item-ink: var(--cv-item-07-foreground); }\n  .cv-item[data-cv-theme="item-08"] { --item-bg: var(--cv-item-08-background); --item-ink: var(--cv-item-08-foreground); }\n}\n`;
}

async function createSheetsCss() {
  let css = await readFile(OLD_CV_CSS, "utf8");
  css = replaceAllPairs(css, classReplacements);
  const root = postcss.parse(css);

  root.walkRules((rule) => {
    const selectors = rule.selectors ?? [rule.selector];
    const kept = selectors.filter((selector) =>
      !selector.includes("[data-resolved-mode=\"scroll\"]") &&
      !selector.includes("[data-mounted=\"true\"]") &&
      !selector.includes(":nth-child(") &&
      !selector.includes(".cv-sheets__progress") &&
      !selector.includes(".cv-item__header::after") &&
      !selector.includes(".cv-item__header[aria-expanded") &&
      !selector.includes(".cv-item__header:focus-visible")
    );
    if (kept.length === 0) rule.remove();
    else if (kept.length !== selectors.length) rule.selectors = kept;
  });

  root.walkDecls((decl) => {
    if ([
      "--cv-scroll-distance",
      "--cv-compact-header-size",
      "--cv-min-panel-size",
      "--cv-header-height",
      "--cv-panel-height",
      "--cv-panel-viewport-height",
      "--cv-open-progress",
      "--cv-content-offset",
    ].includes(decl.prop)) decl.remove();
    if (decl.prop === "cursor" && decl.parent?.selector?.includes(".cv-item__header")) decl.remove();
  });

  root.walk((node) => {
    if ((node.type === "rule" || node.type === "atrule") && node.nodes?.length === 0) node.remove();
  });

  await mkdir(SHEETS_DIR, { recursive: true });
  await writeFile(SHEETS_CSS, addThemeRules(root.toString()), "utf8");
}

const SCENE_LIFECYCLE_SOURCE = `const noop = () => {};\n\nexport function createSceneLifecycle({ root = document, rootMargin = "75% 0px" } = {}) {\n  const scenes = [...root.querySelectorAll(".cv-item[data-cv-scene]")].filter((scene) => scene instanceof HTMLElement);\n  const indexes = new WeakMap();\n  const records = new Map();\n  const invalidationSubscribers = new Set();\n  let destroyed = false;\n  let documentVisible = document.visibilityState !== "hidden";\n\n  scenes.forEach((scene, index) => {\n    indexes.set(scene, index);\n    records.set(scene, { scene, index, active: false, prepared: false, sceneSubscribers: new Set(), prepareSubscribers: new Set() });\n  });\n\n  const sceneFor = (value) => {\n    if (value instanceof Element) return value.closest(".cv-item[data-cv-scene]");\n    return Number.isInteger(value) ? scenes[value] ?? null : null;\n  };\n  const recordFor = (value) => records.get(sceneFor(value)) ?? null;\n  const snapshot = (record) => Object.freeze({ index: record.index, active: record.active, prepared: record.prepared, mode: "sheets", documentVisible });\n  const notifyScene = (record) => record.sceneSubscribers.forEach((listener) => listener(snapshot(record)));\n  const prepare = (record) => {\n    if (!record || record.prepared || destroyed) return;\n    record.prepared = true;\n    record.prepareSubscribers.forEach((listener) => listener({ index: record.index, scene: record.scene }));\n  };\n\n  const observer = typeof IntersectionObserver === "function"\n    ? new IntersectionObserver((entries) => {\n        entries.forEach((entry) => {\n          const record = records.get(entry.target);\n          if (!record) return;\n          const active = entry.isIntersecting;\n          if (active) prepare(record);\n          if (active !== record.active) { record.active = active; notifyScene(record); }\n        });\n      }, { rootMargin, threshold: 0.01 })\n    : null;\n\n  if (observer) scenes.forEach((scene) => observer.observe(scene));\n  else records.forEach((record) => { record.active = true; prepare(record); });\n\n  const handleVisibilityChange = () => {\n    const next = document.visibilityState !== "hidden";\n    if (next === documentVisible) return;\n    documentVisible = next;\n    records.forEach(notifyScene);\n  };\n  document.addEventListener("visibilitychange", handleVisibilityChange);\n\n  const subscribeScene = (value, listener, { immediate = true } = {}) => {\n    const record = recordFor(value);\n    if (!record || destroyed || typeof listener !== "function") return noop;\n    record.sceneSubscribers.add(listener);\n    if (immediate) listener(snapshot(record));\n    return () => record.sceneSubscribers.delete(listener);\n  };\n  const subscribePrepare = (value, listener, { immediate = false } = {}) => {\n    const record = recordFor(value);\n    if (!record || destroyed || typeof listener !== "function") return noop;\n    record.prepareSubscribers.add(listener);\n    if (immediate && record.prepared) listener({ index: record.index, scene: record.scene });\n    return () => record.prepareSubscribers.delete(listener);\n  };\n  const requestPrepare = (value) => prepare(recordFor(value));\n  const invalidate = (value = -1) => {\n    const record = recordFor(value);\n    invalidationSubscribers.forEach((listener) => listener(record?.index ?? -1));\n  };\n  const subscribeInvalidation = (listener) => {\n    if (destroyed || typeof listener !== "function") return noop;\n    invalidationSubscribers.add(listener);\n    return () => invalidationSubscribers.delete(listener);\n  };\n  const indexForElement = (element) => recordFor(element)?.index ?? -1;\n  const destroy = () => {\n    if (destroyed) return;\n    destroyed = true;\n    observer?.disconnect();\n    document.removeEventListener("visibilitychange", handleVisibilityChange);\n    records.forEach((record) => { record.sceneSubscribers.clear(); record.prepareSubscribers.clear(); });\n    invalidationSubscribers.clear();\n  };\n\n  return Object.freeze({\n    get documentVisible() { return documentVisible; },\n    mode: "sheets",\n    indexForElement, subscribeScene, subscribePrepare, subscribeInvalidation, requestPrepare, invalidate, destroy,\n  });\n}\n`;

const MAIN_SOURCE = `import "@fontsource-variable/rubik/wght.css";\n\nimport "./styles/index.css";\n\nimport "./components/awfulface/awfulface.css";\nimport "./components/cursor-trail/cursor-trail.css";\nimport "./components/hero/hero.css";\nimport "./components/cv-sheets/cv-sheets.css";\nimport "./components/media-slider/media-slider.css";\nimport "./components/before-after/before-after.css";\nimport "./components/app-promo/app-promo.css";\nimport "./components/browser-promo/browser-promo.css";\nimport "./components/digital-scroll-gallery/digital-scroll-gallery.css";\nimport "./components/awful-tools-preview/awful-tools-preview.css";\nimport "./components/berserk-timer-case/berserk-timer-case.css";\nimport "./components/awful-cases-showcase/awful-cases-showcase.css";\nimport "./components/moves-awful/moves-awful.css";\nimport "./components/animated-canvas-gallery/animated-canvas-gallery.css";\nimport "./components/animated-canvas-gallery/animated-canvas-gallery-preview.css";\nimport "./components/repository-link/repository-link.css";\nimport "./components/media-marquee/media-marquee.css";\nimport "./components/mobile-mockup/mobile-mockup.css";\nimport "./components/brief/brief.css";\nimport "./components/jestei-theme-organism/jestei-theme-organism.css";\nimport "./components/jestei-theme-organism/jestei-theme-organism-embed.css";\nimport "./components/infinite-reel/infinite-reel.css";\nimport "./components/content-blocks/content-blocks.css";\nimport "./content/cv-presentation.css";\nimport "./components/sands-showcase/sands-showcase.css";\nimport "./components/sensetique-case/sensetique-case.css";\n\nimport "./components/playlist-filter-workflow/playlist-filter-workflow.js";\nimport { setAwfulToolsSceneRuntime } from "./components/awful-tools-preview/awful-tools-preview.js";\nimport { createBerserkTimerCases } from "./components/berserk-timer-case/berserk-timer-case.js";\nimport { createHero } from "./components/hero/hero.js";\nimport { createMediaSliders } from "./components/media-slider/media-slider.js";\nimport { createBeforeAfters } from "./components/before-after/before-after.js";\nimport { createMediaMarquees } from "./components/media-marquee/media-marquee.js";\nimport { createInfiniteReels } from "./components/infinite-reel/infinite-reel.js";\nimport { createMotionPreference } from "./motion-preference.js";\nimport { configureMovesAwful } from "./components/moves-awful/moves-awful.js";\nimport { createAnimatedCanvasGalleries } from "./components/animated-canvas-gallery/animated-canvas-gallery.js";\nimport { createAnimatedCanvasGalleryPreviews } from "./components/animated-canvas-gallery/animated-canvas-gallery-preview.js";\nimport { ANIMATED_CANVAS_GALLERY_SOURCES } from "./content/animated-canvas-gallery-sources.js";\nimport { createImageSkeletons } from "./content/image-skeletons.js";\nimport { createJesteiThemeOrganisms } from "./components/jestei-theme-organism/jestei-theme-organism.js";\nimport { createSensetiqueCase } from "./components/sensetique-case/sensetique-case.js";\nimport { createSceneLifecycle } from "./runtime/scene-lifecycle.js";\n\nlet motionPreference = null;\nlet sceneLifecycle = null;\nlet destroyHero = null;\nlet destroyMediaSliders = null;\nlet destroyBeforeAfters = null;\nlet destroyMediaMarquees = null;\nlet destroyInfiniteReels = null;\nlet destroyAnimatedCanvasGalleryPreviews = null;\nlet destroyAnimatedCanvasGalleries = null;\nlet destroyJesteiThemeOrganisms = null;\nlet destroyImageSkeletons = null;\nlet destroyMovesAwful = null;\nlet destroyBerserkTimerCases = null;\nlet destroySensetiqueCase = null;\nlet domReadyHandler = null;\n\nfunction unmount() {\n  setAwfulToolsSceneRuntime(null, document);\n  destroyImageSkeletons?.(); destroyImageSkeletons = null;\n  destroyMovesAwful?.(); destroyMovesAwful = null;\n  destroyBerserkTimerCases?.(); destroyBerserkTimerCases = null;\n  destroyAnimatedCanvasGalleries?.(); destroyAnimatedCanvasGalleries = null;\n  destroyAnimatedCanvasGalleryPreviews?.(); destroyAnimatedCanvasGalleryPreviews = null;\n  destroySensetiqueCase?.(); destroySensetiqueCase = null;\n  destroyJesteiThemeOrganisms?.destroy?.(); destroyJesteiThemeOrganisms = null;\n  sceneLifecycle?.destroy?.(); sceneLifecycle = null;\n  destroyMediaMarquees?.(); destroyMediaMarquees = null;\n  destroyInfiniteReels?.(); destroyInfiniteReels = null;\n  destroyBeforeAfters?.(); destroyBeforeAfters = null;\n  destroyMediaSliders?.(); destroyMediaSliders = null;\n  destroyHero?.(); destroyHero = null;\n  motionPreference?.destroy(); motionPreference = null;\n}\n\nfunction mount() {\n  unmount();\n  destroyImageSkeletons = createImageSkeletons({ root: document });\n  motionPreference = createMotionPreference();\n  sceneLifecycle = createSceneLifecycle({ root: document });\n  const sceneRuntime = sceneLifecycle;\n\n  destroyHero = createHero({ root: document, motion: motionPreference });\n  destroyMediaSliders = createMediaSliders({ root: document, motion: motionPreference });\n  destroyMediaMarquees = createMediaMarquees({ root: document, motion: motionPreference });\n  destroyInfiniteReels = createInfiniteReels({ root: document, motion: motionPreference });\n\n  destroySensetiqueCase = createSensetiqueCase({ root: document, motion: motionPreference, sceneRuntime });\n  destroyMovesAwful = configureMovesAwful(document, { sceneRuntime });\n  setAwfulToolsSceneRuntime(sceneRuntime, document);\n  destroyBerserkTimerCases = createBerserkTimerCases({ root: document, sceneRuntime });\n  destroyBeforeAfters = createBeforeAfters({ root: document, motion: motionPreference });\n  destroyJesteiThemeOrganisms = createJesteiThemeOrganisms({ root: document, motion: motionPreference, sceneRuntime });\n  destroyAnimatedCanvasGalleryPreviews = createAnimatedCanvasGalleryPreviews({ root: document });\n  destroyAnimatedCanvasGalleries = createAnimatedCanvasGalleries({ root: document, sources: ANIMATED_CANVAS_GALLERY_SOURCES });\n\n  const inlineJesteiRoot = document.querySelector('[data-jestei-theme-organism][data-jestei-theme-instance="inline"]');\n  const canWarmJesteiEarly = window.matchMedia?.("(hover: hover) and (pointer: fine)").matches;\n  if (canWarmJesteiEarly) {\n    requestAnimationFrame(() => requestAnimationFrame(() => {\n      void destroyJesteiThemeOrganisms?.preload?.().then(() => {\n        if (inlineJesteiRoot instanceof HTMLElement) sceneRuntime.requestPrepare(inlineJesteiRoot);\n      });\n    }));\n  }\n}\n\nfunction handlePageShow(event) { if (event.persisted) mount(); }\n\nif (document.readyState === "loading") {\n  domReadyHandler = () => { domReadyHandler = null; mount(); };\n  document.addEventListener("DOMContentLoaded", domReadyHandler, { once: true });\n} else {\n  mount();\n}\n\nwindow.addEventListener("pagehide", unmount);\nwindow.addEventListener("pageshow", handlePageShow);\n\nif (import.meta.hot) {\n  import.meta.hot.dispose(() => {\n    if (domReadyHandler) { document.removeEventListener("DOMContentLoaded", domReadyHandler); domReadyHandler = null; }\n    window.removeEventListener("pagehide", unmount);\n    window.removeEventListener("pageshow", handlePageShow);\n    unmount();\n  });\n}\n`;

const SENSETIQUE_TEST_SOURCE = `import assert from "node:assert/strict";\nimport { existsSync, readFileSync } from "node:fs";\nimport test from "node:test";\n\nconst read = (path) => readFileSync(path, "utf8");\n\ntest("Sensetique is materialized in source light DOM directly after Styx", () => {\n  const html = read("index.html");\n  const styx = html.indexOf(">Styx Jewels<");\n  const sensetique = html.indexOf(">Sensetique<");\n  assert.ok(styx >= 0 && sensetique > styx);\n  assert.equal((html.match(/>Sensetique</g) ?? []).length, 1);\n  assert.match(html.slice(sensetique - 4000, sensetique), /data-cv-theme="item-04"/);\n  assert.equal(existsSync("src/components/sensetique-case/sensetique-case.css"), true);\n  assert.equal(existsSync("tools/sensetique-index-plugin.mjs"), false);\n  assert.equal(existsSync("src/components/sensetique-case/data"), false);\n});\n\ntest("Sensetique media remains source HTML and temporary group labels stay absent", () => {\n  const html = read("index.html");\n  const css = read("src/components/sensetique-case/sensetique-case.css");\n  for (const id of ["sensetique-11-98", "sensetique-11-99", "sensetique-11-100"]) {\n    assert.equal(html.split(\`data-media-id="\${id}"\`).length - 1, 1);\n  }\n  assert.doesNotMatch(html, /sensetique-olovo-catalog-tiles/);\n  assert.doesNotMatch(html, /data-temp-media-group/);\n  assert.doesNotMatch(css, /data-temp-media-group|ГРУППА|attr\\(data-sensetique-group\\)/);\n});\n\ntest("CV source is a permanently expanded sheet stack", () => {\n  const html = read("index.html");\n  const css = read("src/components/cv-sheets/cv-sheets.css");\n  const main = read("src/main.js");\n  assert.match(html, /class="[^"]*cv-sheets-scene/);\n  assert.match(html, /class="[^"]*cv-sheets__list/);\n  assert.doesNotMatch(html, /data-mode="scroll"|data-reduced-mode=|data-cv-accordion/);\n  assert.doesNotMatch(main, /createCvAccordion|applyAccordionContent|applyAccordionPresentation|prepareSensetiqueCase/);\n  assert.doesNotMatch(css, /:nth-child\\([^}]*cv-item/);\n  assert.match(css, /data-cv-theme="item-04"/);\n});\n`;

async function rewriteSourceFiles() {
  await createSheetsCss();
  await rename(OLD_PRESENTATION_CSS, PRESENTATION_CSS);

  const sourceFiles = await walkFiles(join(ROOT, "src"));
  for (const path of sourceFiles) {
    if (path.startsWith(join(ROOT, "src/components/cv-accordion"))) continue;
    let source = await readFile(path, "utf8");
    source = replaceAllPairs(source, identifierReplacements);
    source = replaceAllPairs(source, classReplacements);
    source = source.split(':not([data-resolved-mode="scroll"])').join("");
    await writeFile(path, source, "utf8");
  }

  await mkdir(join(ROOT, "src/runtime"), { recursive: true });
  await writeFile(join(ROOT, "src/runtime/scene-lifecycle.js"), SCENE_LIFECYCLE_SOURCE, "utf8");
  await writeFile(join(ROOT, "src/main.js"), MAIN_SOURCE, "utf8");
  await writeFile(join(ROOT, "vite.config.js"), 'import { defineConfig } from "vite";\n\nexport default defineConfig({});\n', "utf8");

  await rm(join(ROOT, "src/components/cv-accordion"), { recursive: true, force: true });
  await rm(join(ROOT, "src/content/accordion-content.js"), { force: true });
  await rm(join(ROOT, "src/content/accordion-presentation.js"), { force: true });
  await rm(join(ROOT, "src/components/sensetique-case/data"), { recursive: true, force: true });
  await rm(join(ROOT, "src/components/sensetique-case/sensetique-case.html"), { force: true });
  await rm(join(ROOT, "src/components/sensetique-case/scene.js"), { force: true });
  await rm(join(ROOT, "tools/sensetique-index-plugin.mjs"), { force: true });

  for (const obsolete of [
    "test/cv-accordion-frame.test.js",
    "test/cv-accordion-runtime.test.js",
    "test/cv-runtime-source.test.js",
    "test/sensetique-index-plugin.test.js",
  ]) await rm(join(ROOT, obsolete), { force: true });

  await writeFile(join(ROOT, "test/sensetique-case-source.test.js"), SENSETIQUE_TEST_SOURCE, "utf8");

  const testFiles = await walkFiles(join(ROOT, "test"), new Set([".js", ".mjs"]));
  for (const path of testFiles) {
    if (path.endsWith("sensetique-case-source.test.js")) continue;
    let source = await readFile(path, "utf8");
    source = replaceAllPairs(source, identifierReplacements);
    source = replaceAllPairs(source, classReplacements);
    await writeFile(path, source, "utf8");
  }
}

await materializeHtmlAndSensetiqueCss();
await rewriteSourceFiles();

console.log("Materialized final light DOM, extracted Sensetique CSS, and replaced the CV accordion with sheets.");
