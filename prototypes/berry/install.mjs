import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const bundleRoot = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const checkOnly = args.includes("--check");
const repoArg = args.find((arg) => !arg.startsWith("--"));
const repoRoot = path.resolve(repoArg ?? process.cwd());

function fail(message) {
  throw new Error(`[berry-install] ${message}`);
}

function repoPath(relative) {
  return path.join(repoRoot, relative);
}

function bundlePath(relative) {
  return path.join(bundleRoot, relative);
}

function readRepo(relative) {
  const target = repoPath(relative);
  if (!fs.existsSync(target)) fail(`missing repository file: ${relative}`);
  return fs.readFileSync(target, "utf8");
}

function readBundle(relative) {
  const target = bundlePath(relative);
  if (!fs.existsSync(target)) fail(`missing bundle file: ${relative}`);
  return fs.readFileSync(target, "utf8");
}

function locateArticleByTrigger(index, triggerId) {
  const trigger = index.indexOf(`id="${triggerId}"`);
  if (trigger < 0) fail(`accordion trigger not found: ${triggerId}`);

  const start = index.lastIndexOf('<article class="cv-item"', trigger);
  const end = index.indexOf("</article>", trigger);

  if (start < 0 || end < 0) {
    fail(`accordion article boundary not found for ${triggerId}`);
  }

  return { start, end: end + "</article>".length };
}

function replaceBerryArticle(index, berrySnippet) {
  const berry = locateArticleByTrigger(index, "cv-trigger-05");
  const next = locateArticleByTrigger(index, "cv-trigger-06");

  if (next.start <= berry.start) fail("S&S must remain after Berry Agency");

  const currentBerry = index.slice(berry.start, berry.end);
  const currentNext = index.slice(next.start, next.end);

  if (!currentBerry.includes(">Berry Agency<")) {
    fail("cv-trigger-05 is not the Berry Agency article");
  }

  if (!currentNext.includes(">S&amp;S<") && !currentNext.includes(">S&S<")) {
    fail("cv-trigger-06 is not the S&S article");
  }

  return `${index.slice(0, berry.start)}${berrySnippet.trim()}\n${index.slice(berry.end)}`;
}

function insertAfterOnce(source, anchor, insertion, label) {
  if (source.includes(insertion)) return source;

  const index = source.indexOf(anchor);
  if (index < 0) fail(`main.js anchor missing for ${label}`);

  const at = index + anchor.length;
  return `${source.slice(0, at)}\n${insertion}${source.slice(at)}`;
}

function validateBundle(snippet, berryCss, phoneCss, berryJs) {
  const mediaIds = [...snippet.matchAll(/data-media-id="([^"]+)"/g)].map(
    (match) => match[1],
  );

  if (mediaIds.length !== 14 || new Set(mediaIds).size !== 14) {
    fail("bundle snippet must contain exactly 14 unique visible media nodes");
  }

  for (const deadToken of [
    " hidden",
    "data-media-hidden",
    "data-media-slider",
    "data-page-flip-book",
    "berry-case__browser",
    "berry-case__commercial",
  ]) {
    if (snippet.includes(deadToken)) {
      fail(`bundle snippet contains removed content: ${deadToken}`);
    }
  }

  for (const forbiddenLocalTheme of [
    "--item-bg:",
    "--item-ink:",
    "--font-primary:",
    "@font-face",
  ]) {
    if (
      berryCss.includes(forbiddenLocalTheme) ||
      phoneCss.includes(forbiddenLocalTheme)
    ) {
      fail(`component CSS must not redefine site theme/font: ${forbiddenLocalTheme}`);
    }
  }

  for (const forbiddenRuntime of [
    "MutationObserver",
    "ResizeObserver",
    "IntersectionObserver",
    "requestAnimationFrame",
    "setInterval",
    "setTimeout",
  ]) {
    if (berryJs.includes(forbiddenRuntime)) {
      fail(`Berry tap runtime must stay event-only: ${forbiddenRuntime}`);
    }
  }

  if (!berryJs.includes('event.pointerType === "touch"')) {
    fail("Berry tap runtime must explicitly handle touch pointers");
  }

  if (!berryJs.includes("TAP_MAX_DISTANCE")) {
    fail("Berry tap runtime must distinguish tap from swipe");
  }
}

const snippet = readBundle("snippet/berry-agency-section.html");
const berryCss = readBundle("files/src/components/berry-case/berry-case.css");
const phoneCss = readBundle("files/src/components/phone-mockup/phone-mockup.css");
const berryJs = readBundle("files/src/components/berry-case/berry-case.js");

validateBundle(snippet, berryCss, phoneCss, berryJs);

// Read all global contracts we rely on before preparing writes.
const index = readRepo("index.html");
let main = readRepo("src/main.js");
const patterns = readRepo("src/styles/patterns.css");
const presentation = readRepo("src/content/accordion-presentation.css");
readRepo("src/components/cv-accordion/cv-accordion.css");

if (
  !patterns.includes(".stack") ||
  !patterns.includes(".reel") ||
  !patterns.includes(".grid-flow")
) {
  fail("current site layout patterns .stack/.reel/.grid-flow are required");
}

if (
  !presentation.includes("--item-text") ||
  !presentation.includes("--item-body-bg")
) {
  fail("current accordion presentation theme variables are required");
}

const nextIndex = replaceBerryArticle(index, snippet);

// CSS imports remain after accordion-presentation.css so Berry only overrides
// its own local caption/overflow presentation.
const presentationCssImport = 'import "./content/accordion-presentation.css";';
const phoneCssImport = 'import "./components/phone-mockup/phone-mockup.css";';
const berryCssImport = 'import "./components/berry-case/berry-case.css";';

main = insertAfterOnce(
  main,
  presentationCssImport,
  phoneCssImport,
  "phone-mockup CSS import",
);
main = insertAfterOnce(
  main,
  phoneCssImport,
  berryCssImport,
  "Berry CSS import",
);

// JS joins the site's existing mount/unmount lifecycle. No auto-init, observer
// or separate lifecycle channel is created.
const presentationJsImport =
  'import { applyAccordionPresentation } from "./content/accordion-presentation.js";';
const berryJsImport =
  'import { createBerryCase } from "./components/berry-case/berry-case.js";';

main = insertAfterOnce(
  main,
  presentationJsImport,
  berryJsImport,
  "Berry JS import",
);

main = insertAfterOnce(
  main,
  "let destroyAccordionPresentation = null;",
  "let destroyBerryCase = null;",
  "Berry destroy handle",
);

if (!main.includes("destroyBerryCase?.();")) {
  main = insertAfterOnce(
    main,
    "  destroyImageSkeletons = null;",
    "\n  destroyBerryCase?.();\n  destroyBerryCase = null;",
    "Berry unmount cleanup",
  );
}

if (!main.includes("destroyBerryCase = createBerryCase({ root: document });")) {
  main = insertAfterOnce(
    main,
    "  destroyAccordionPresentation = applyAccordionPresentation(document);",
    "  destroyBerryCase = createBerryCase({ root: document });",
    "Berry mount",
  );
}

const writes = new Map([
  ["index.html", nextIndex],
  ["src/main.js", main],
  ["src/components/phone-mockup/phone-mockup.css", phoneCss],
  ["src/components/berry-case/berry-case.css", berryCss],
  ["src/components/berry-case/berry-case.js", berryJs],
]);

console.log("[berry-install] preflight OK");
console.log("[berry-install] changes:");
console.log("  index.html — replace Berry Agency article only");
console.log("  src/main.js — two CSS imports + one lifecycle component import/mount/cleanup");
console.log("  src/components/phone-mockup/phone-mockup.css — create/update");
console.log("  src/components/berry-case/berry-case.css — create/update");
console.log("  src/components/berry-case/berry-case.js — create/update");
console.log("  no package changes; no observers; no animation loop; no theme/font changes");

if (checkOnly) {
  console.log("[berry-install] --check: no files written");
  process.exit(0);
}

for (const [relative, content] of writes) {
  const target = repoPath(relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content, "utf8");
}

console.log("[berry-install] installed");
