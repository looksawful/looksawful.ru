import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const stamp = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
const backupRoot = path.join(root, 'tools', 'heading-animation-scope-backups', stamp);

const files = {
  heading: 'src/components/heading-animations.js',
  hero: 'src/components/hero-title/hero-title.js',
  index: 'src/components/index.js',
};

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

function write(rel, value) {
  fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
  fs.writeFileSync(path.join(root, rel), value, 'utf8');
}

function backup(rel) {
  const from = path.join(root, rel);
  if (!fs.existsSync(from)) throw new Error(`file not found: ${rel}`);
  const to = path.join(backupRoot, rel);
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
}

function assertIncludes(value, needle, file) {
  if (!value.includes(needle)) {
    throw new Error(`expected pattern not found in ${file}: ${needle}`);
  }
}

for (const rel of Object.values(files)) backup(rel);

const chapterHeadingSelector = '#showcase :is(.jestei-chapter-section, .case-section-clean, [data-jestei-chapter-title], [data-case-chapter-title]) > .jestei-chapter-hero > .jestei-chapter-hero__title';

const headingAnimations = `import { createLetterIdleMotion, splitTextIntoGraphemes } from "./letter-motion.js";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

const HEADING_SELECTOR = ${JSON.stringify(chapterHeadingSelector)};

const EXCLUDED_SELECTOR = [
  ".site-header",
  ".portfolio-toc",
  ".contact-links",
  ".chips",
  ".project__header",
  ".project__head",
  ".project__logo",
  ".jestei-responsibilities-header",
  ".project-responsibilities",
  ".responsibility-card",
  ".text-sections",
  ".text-section",
  ".token-list",
  ".media-group",
  ".media",
  ".media-item",
  ".playlist-filter-embed",
  ".jestei-policy-marquee",
  ".policy-book",
  ".artifact-reader",
  ".lightbox",
  "[data-visual-demo]",
  "[data-animation]",
  "canvas",
  "video",
  "svg",
  "ul",
  "ol",
  "li",
].join(", ");

const BOUND_ATTR = "data-reveal-bound";
const READY_ATTR = "data-letter-ready";
const CHAR_ATTR = "data-reveal-char";

function canAnimate() {
  return (
    typeof window !== "undefined" &&
    typeof window.gsap !== "undefined" &&
    "IntersectionObserver" in window &&
    !window.matchMedia(REDUCED_MOTION_QUERY).matches
  );
}

function isSafeHeading(el) {
  return (
    el &&
    el.matches(HEADING_SELECTOR) &&
    !el.hasAttribute(BOUND_ATTR) &&
    !el.closest("[hidden]") &&
    !el.closest('[data-reveal-bound="skip"]') &&
    !el.closest(EXCLUDED_SELECTOR) &&
    Boolean(el.textContent && el.textContent.trim())
  );
}

function isTextNode(node) {
  return node && node.nodeType === Node.TEXT_NODE;
}

function isElementNode(node) {
  return node && node.nodeType === Node.ELEMENT_NODE;
}

function canSplitInside(element) {
  if (!element || !element.tagName) return false;

  return ![
    "SCRIPT",
    "STYLE",
    "SVG",
    "IMG",
    "VIDEO",
    "CANVAS",
    "PICTURE",
    "SOURCE",
    "BR",
    "INPUT",
    "TEXTAREA",
    "SELECT",
    "BUTTON",
  ].includes(element.tagName);
}

function createChar(char) {
  const span = document.createElement("span");

  span.textContent = char;
  span.setAttribute("aria-hidden", "true");
  span.setAttribute(CHAR_ATTR, "true");
  span.style.display = "inline-block";
  span.style.transformOrigin = "50% 60%";
  span.style.willChange = "transform";
  span.style.backfaceVisibility = "visible";

  return span;
}

function splitTextNode(node) {
  const fragment = document.createDocumentFragment();
  const parts = splitTextIntoGraphemes(node.nodeValue || "");

  parts.forEach((char) => {
    if (/\s/.test(char)) {
      fragment.appendChild(document.createTextNode(char));
      return;
    }

    fragment.appendChild(createChar(char));
  });

  node.replaceWith(fragment);
}

function splitElementTree(element) {
  [...element.childNodes].forEach((node) => {
    if (isTextNode(node)) {
      splitTextNode(node);
      return;
    }

    if (isElementNode(node) && canSplitInside(node) && !node.hasAttribute(CHAR_ATTR)) {
      splitElementTree(node);
    }
  });
}

function prepareLetters(target) {
  if (target.hasAttribute(READY_ATTR)) {
    return [...target.querySelectorAll("[" + CHAR_ATTR + "]")];
  }

  const label = target.textContent ? target.textContent.trim() : "";

  if (!label) return [];

  target.setAttribute("aria-label", label);
  target.setAttribute(READY_ATTR, "true");
  splitElementTree(target);

  return [...target.querySelectorAll("[" + CHAR_ATTR + "]")];
}

function observeOnce(el, callback) {
  const observer = new IntersectionObserver(
    (entries) => {
      const entry = entries[0];
      if (!entry || !entry.isIntersecting) return;

      observer.unobserve(el);
      callback(el);
    },
    {
      threshold: 0,
      rootMargin: "20% 0px 20% 0px",
    },
  );

  observer.observe(el);
}

function startHeading(target) {
  const letters = prepareLetters(target);
  if (!letters.length) return;

  createLetterIdleMotion(target, {
    letters,
    profile: "display",
  });
}

export function initHeadingAnimations(root = document) {
  if (!canAnimate()) return;

  const headings = [...root.querySelectorAll(HEADING_SELECTOR)].filter(isSafeHeading);

  headings.forEach((heading) => {
    prepareLetters(heading);
    heading.setAttribute(BOUND_ATTR, "heading");

    observeOnce(heading, (target) => {
      startHeading(target);
    });
  });
}
`;

write(files.heading, headingAnimations);

let hero = read(files.hero);
assertIncludes(hero, 'const LINE_SELECTOR = ".hero__title-name, .hero__title-role";', files.hero);
if (!hero.includes('const NAME_LETTER_SELECTOR = ".hero__title-name .hero-title-letter";')) {
  hero = hero.replace(
    'const LINE_SELECTOR = ".hero__title-name, .hero__title-role";',
    'const LINE_SELECTOR = ".hero__title-name, .hero__title-role";\nconst NAME_LETTER_SELECTOR = ".hero__title-name .hero-title-letter";',
  );
}
assertIncludes(hero, 'selector: ".hero-title-letter",', files.hero);
hero = hero.replace('selector: ".hero-title-letter",', 'selector: NAME_LETTER_SELECTOR,');
write(files.hero, hero);

let index = read(files.index);
const broadGuard = 'main .title, .project__head .title, .section-head > .title, .block__header > .title, .text-block > .title, .component-caption > .title, [data-reveal-char]';
assertIncludes(index, broadGuard, files.index);
index = index.replace(broadGuard, chapterHeadingSelector);
write(files.index, index);

const checkHeading = read(files.heading);
if (/main :is\(h2, h3, h4, h5, h6\)|main \.title|project__head|section-head|block__header|text-block|component-caption/.test(checkHeading)) {
  throw new Error('heading animation selector is still too broad');
}

const checkHero = read(files.hero);
if (!checkHero.includes('selector: NAME_LETTER_SELECTOR,')) {
  throw new Error('hero title motion selector was not restricted to the name line');
}

console.log('heading animation scope fixed');
console.log(`backup: ${backupRoot}`);
console.log(`chapter heading selector: ${chapterHeadingSelector}`);
