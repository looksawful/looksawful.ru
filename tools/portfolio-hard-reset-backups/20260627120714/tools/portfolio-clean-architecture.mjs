#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync, copyFileSync, rmSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const stamp = new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
const backupRoot = path.join(root, "tools", "portfolio-clean-backups", stamp);

const file = (...parts) => path.join(root, ...parts);
const htmlPath = file("index.html");
const mainPath = file("src", "main.js");
const indexCssPath = file("src", "styles", "index.css");
const caseChaptersPath = file("src", "visuals", "dom", "case-chapters.js");

const generatedFiles = [
  file("src", "visuals", "dom", "showcase-toc.js"),
  file("src", "styles", "modules", "portfolio-clean.css"),
  file("src", "styles", "modules", "portfolio-media.css"),
  file("src", "styles", "modules", "showcase-toc.css")
];

const removedFiles = [
  file("src", "visuals", "dom", "restructure-stage-01.js"),
  file("src", "visuals", "dom", "restructure-stage-02.js"),
  file("src", "visuals", "dom", "restructure-stage-03.js"),
  file("src", "styles", "modules", "restructure-stage-01.css"),
  file("src", "styles", "modules", "restructure-stage-02.css"),
  file("src", "styles", "modules", "restructure-stage-03.css")
];

const protectedFiles = [
  "src/components/site-header/site-header.js",
  "src/styles/modules/site-header.css",
  "src/styles/modules/hero.css",
  "src/components/hero-title/hero-title.js",
  "src/components/proximity-core.js",
  "src/components/proximity-components.js",
  "src/styles/modules/proximity.css",
  "src/visuals/dom/playlist-filter-embed.js",
  "src/styles/playlist-filter-embed.css",
  "src/visuals/dom/policy-book.js",
  "src/styles/modules/policy-book.css",
  "src/visuals/dom/artifact-reader.js",
  "src/styles/modules/artifact-reader.css"
].map((p) => file(...p.split("/")));

for (const required of [htmlPath, mainPath, indexCssPath, caseChaptersPath]) {
  if (!existsSync(required)) {
    throw new Error(`required file not found: ${required}`);
  }
}

function ensureDir(target) {
  mkdirSync(path.dirname(target), { recursive: true });
}

function backup(target) {
  if (!existsSync(target)) return;
  const relative = path.relative(root, target);
  const destination = path.join(backupRoot, relative);
  ensureDir(destination);
  copyFileSync(target, destination);
}

[
  htmlPath,
  mainPath,
  indexCssPath,
  caseChaptersPath,
  ...generatedFiles,
  ...removedFiles
].forEach(backup);

function read(target) {
  return readFileSync(target, "utf8").replace(/\r\n/g, "\n");
}

function write(target, value) {
  ensureDir(target);
  writeFileSync(target, value.replace(/\n/g, "\r\n"), "utf8");
}

function tagNameFromOpenTag(openTag) {
  const match = openTag.match(/^<\s*([a-zA-Z0-9:-]+)/);
  return match ? match[1].toLowerCase() : "";
}

function openTagEnd(source, start) {
  let quote = "";
  for (let index = start; index < source.length; index += 1) {
    const char = source[index];
    if (quote) {
      if (char === quote) quote = "";
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }
    if (char === ">") return index + 1;
  }
  return -1;
}

function findMatchingClose(source, openStart, tagName) {
  const firstOpenEnd = openTagEnd(source, openStart);
  if (firstOpenEnd < 0) return null;

  const rx = new RegExp(`<\\/?${tagName}\\b[^>]*>`, "gi");
  rx.lastIndex = firstOpenEnd;
  let depth = 1;

  while (true) {
    const match = rx.exec(source);
    if (!match) return null;
    const text = match[0];
    if (/^<\//.test(text)) {
      depth -= 1;
      if (depth === 0) {
        return {
          openStart,
          openEnd: firstOpenEnd,
          closeStart: match.index,
          closeEnd: match.index + text.length,
          inner: source.slice(firstOpenEnd, match.index),
          openTag: source.slice(openStart, firstOpenEnd),
          closeTag: text
        };
      }
    } else if (!/\/\s*>$/.test(text)) {
      depth += 1;
    }
  }
}

function findElements(source, tagName, predicate) {
  const rx = new RegExp(`<${tagName}\\b[^>]*>`, "gi");
  const result = [];
  let match;

  while ((match = rx.exec(source))) {
    const openTag = match[0];
    if (!predicate(openTag, match.index)) continue;
    const element = findMatchingClose(source, match.index, tagName);
    if (!element) continue;
    result.push(element);
    rx.lastIndex = element.closeEnd;
  }

  return result;
}

function hasClass(openTag, classRegex) {
  const match = openTag.match(/\bclass\s*=\s*(['"])([\s\S]*?)\1/i);
  return Boolean(match && classRegex.test(match[2]));
}

function addClasses(openTag, classNames) {
  const unique = (values) => [...new Set(values.filter(Boolean))];
  const match = openTag.match(/\bclass\s*=\s*(['"])([\s\S]*?)\1/i);

  if (!match) {
    return openTag.replace(/>$/, ` class="${unique(classNames).join(" ")}">`);
  }

  const current = match[2].split(/\s+/).filter(Boolean);
  const next = unique([...current, ...classNames]).join(" ");
  return openTag.replace(match[0], `class=${match[1]}${next}${match[1]}`);
}

function removeClasses(openTag, classRegex) {
  const match = openTag.match(/\bclass\s*=\s*(['"])([\s\S]*?)\1/i);
  if (!match) return openTag;
  const next = match[2].split(/\s+/).filter((item) => !classRegex.test(item)).join(" ");
  return openTag.replace(match[0], next ? `class=${match[1]}${next}${match[1]}` : "");
}

function replaceClasses(openTag, replacer) {
  const match = openTag.match(/\bclass\s*=\s*(['"])([\s\S]*?)\1/i);
  if (!match) return openTag;
  const next = match[2].split(/\s+/).filter(Boolean).map(replacer).filter(Boolean).join(" ");
  return openTag.replace(match[0], next ? `class=${match[1]}${next}${match[1]}` : "");
}

function removeAttrs(openTag, names) {
  let next = openTag;
  for (const name of names) {
    const rx = new RegExp(`\\s+${name}(?:\\s*=\\s*(?:"[^"]*"|'[^']*'|[^\\s>]+))?`, "gi");
    next = next.replace(rx, "");
  }
  return next;
}

function addAttr(openTag, name, value = "") {
  const rx = new RegExp(`\\s${name}(?:\\s*=\\s*(?:"[^"]*"|'[^']*'|[^\\s>]+))?`, "i");
  if (rx.test(openTag)) return openTag;
  const attr = value === "" ? ` ${name}` : ` ${name}="${value}"`;
  return openTag.replace(/>$/, `${attr}>`);
}

function replaceElementOpenTag(block, updater) {
  const end = openTagEnd(block, 0);
  if (end < 0) return block;
  return updater(block.slice(0, end)) + block.slice(end);
}

function removeFirstElementByClass(block, tagName, classRegex) {
  const element = findElements(block, tagName, (tag) => hasClass(tag, classRegex))[0];
  if (!element) return block;
  return block.slice(0, element.openStart) + block.slice(element.closeEnd);
}

function extractFirstElementInnerByClass(block, tagName, classRegex) {
  const element = findElements(block, tagName, (tag) => hasClass(tag, classRegex))[0];
  if (!element) return { block, inner: "" };
  return {
    block: block.slice(0, element.openStart) + block.slice(element.closeEnd),
    inner: element.inner
  };
}

function unwrapElementsByClass(fragment, tagName, classRegex) {
  let current = fragment;
  let changed = true;

  while (changed) {
    changed = false;
    const elements = findElements(current, tagName, (tag) => hasClass(tag, classRegex));
    for (const element of elements.reverse()) {
      current = current.slice(0, element.openStart) + element.inner + current.slice(element.closeEnd);
      changed = true;
    }
  }

  return current;
}

function stripTags(value) {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function transformChapterFrames(html) {
  const frames = findElements(html, "section", (tag) => (
    /\bdata-jestei-chapter-frame\b/i.test(tag) ||
    /\bdata-case-chapter-frame\b/i.test(tag) ||
    hasClass(tag, /\b(?:jestei-chapter-frame|case-chapter-frame)\b/)
  ));

  let current = html;

  for (const frame of frames.reverse()) {
    let block = current.slice(frame.openStart, frame.closeEnd);
    block = removeFirstElementByClass(block, "div", /\b(?:jestei-chapter-frame__control|case-chapter-frame__control)\b/);

    let extracted = extractFirstElementInnerByClass(block, "div", /\b(?:jestei-chapter-frame__body-wrap|case-chapter-frame__body-wrap)\b/);
    block = extracted.block;

    let bodyInner = extracted.inner;
    if (bodyInner) {
      const body = findElements(bodyInner, "div", (tag) => hasClass(tag, /\b(?:jestei-chapter-frame__body|case-chapter-frame__body)\b/))[0];
      bodyInner = body ? body.inner : bodyInner;
      bodyInner = unwrapElementsByClass(bodyInner, "section", /\b(?:jestei-chapter-panel|case-chapter-panel)\b/);
    }

    block = replaceElementOpenTag(block, (openTag) => {
      let next = openTag;
      next = removeAttrs(next, ["data-jestei-chapter-frame", "data-case-chapter-frame"]);
      next = replaceClasses(next, (className) => (
        className
          .replace(/^jestei-chapter-frame$/, "jestei-chapter-section")
          .replace(/^case-chapter-frame$/, "case-chapter-section")
          .replace(/^jestei-chapter-frame--/, "jestei-chapter-section--")
          .replace(/^case-chapter-frame--/, "case-chapter-section--")
      ));
      next = addClasses(next, ["case-section-clean"]);
      return next;
    });

    if (bodyInner.trim()) {
      const closeIndex = block.lastIndexOf("</section>");
      block = block.slice(0, closeIndex) + "\n" + bodyInner.trim() + "\n" + block.slice(closeIndex);
    }

    current = current.slice(0, frame.openStart) + block + current.slice(frame.closeEnd);
  }

  return current;
}

function transformListCards(html) {
  const protectedRanges = [];
  for (const id of ["hero", "resume"]) {
    const rx = new RegExp(`<([a-z0-9]+)\\b[^>]*\\bid=["']${id}["'][^>]*>`, "i");
    const match = rx.exec(html);
    if (match) {
      const element = findMatchingClose(html, match.index, match[1].toLowerCase());
      if (element) protectedRanges.push([element.openStart, element.closeEnd]);
    }
  }

  const inProtectedRange = (index) => protectedRanges.some(([start, end]) => index >= start && index <= end);
  const blocks = findElements(html, "section", (tag, index) => (
    !inProtectedRange(index) &&
    hasClass(tag, /\blist-cards\b/)
  ));

  let current = html;

  for (const blockElement of blocks.reverse()) {
    const block = current.slice(blockElement.openStart, blockElement.closeEnd);

    if (/\b(?:policy-book|playlist-filter|jestei-policy-marquee|project-responsibilities|responsibility-card)\b/.test(block)) {
      continue;
    }

    const articles = findElements(block, "article", (tag) => hasClass(tag, /\blist-card\b/));
    if (!articles.length) continue;

    let convertedInner = block.slice(blockElement.openEnd - blockElement.openStart, block.lastIndexOf("</section>"));

    for (const article of articles.reverse()) {
      const articleBlock = block.slice(article.openStart, article.closeEnd);
      const heading = articleBlock.match(/<h([1-6])\b[^>]*class\s*=\s*(['"])[^'"]*\blist-card__title\b[^'"]*\2[^>]*>([\s\S]*?)<\/h\1>/i);
      const level = heading ? heading[1] : "6";
      const title = heading ? heading[3].trim() : "";

      const items = [...articleBlock.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)]
        .map((match) => match[1].replace(/\s+/g, " ").trim())
        .filter(Boolean);

      const paragraphs = items.map((item) => `    <p>${item}</p>`).join("\n");
      const titleMarkup = title ? `    <h${level} class="text-section__title">${title}</h${level}>\n` : "";
      const replacement = `<article class="text-section">\n${titleMarkup}${paragraphs}\n  </article>`;

      const relativeStart = article.openStart - blockElement.openStart - (blockElement.openEnd - blockElement.openStart);
      const relativeEnd = article.closeEnd - blockElement.openStart - (blockElement.openEnd - blockElement.openStart);
      convertedInner = convertedInner.slice(0, relativeStart) + replacement + convertedInner.slice(relativeEnd);
    }

    convertedInner = convertedInner
      .replace(/<span\b[^>]*class\s*=\s*(['"])[^'"]*\blist-card__title-divider\b[^'"]*\1[^>]*><\/span>/gi, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    let openTag = blockElement.openTag;
    openTag = replaceClasses(openTag, (className) => {
      if (className === "list-cards") return "text-sections";
      if (/^list-cards--/.test(className)) return "";
      return className;
    });
    openTag = addClasses(openTag, ["text-sections"]);
    openTag = addAttr(openTag, "data-text-sections", "");

    const replacement = `${openTag}\n${convertedInner}\n</section>`;
    current = current.slice(0, blockElement.openStart) + replacement + current.slice(blockElement.closeEnd);
  }

  return current;
}

function addGalleryTypes(html) {
  return html.replace(/<(section|aside|figure|div)\b[^>]*class\s*=\s*(['"])([^'"]+)\2[^>]*>/gi, (openTag, tag, quote, classes) => {
    if (/\b(?:hero|site-header|resume|policy-book|jestei-policy-marquee|playlist-filter|artifact-reader|visual-canvas)\b/.test(classes)) {
      return openTag;
    }

    let type = "";
    if (/\bmedia-slider\b/.test(classes)) type = "carousel";
    else if (/\bmedia-marquee\b/.test(classes)) type = "scroll";
    else if (/\b(?:media-banner|media-figure)\b/.test(classes)) type = "banner";
    else if (/\b(?:media-two|media-three|media-quad|media-six|media-eight|random-gallery)\b/.test(classes)) type = "tiles";

    if (!type) return openTag;

    let next = addClasses(openTag, ["media-gallery", `media-gallery--${type}`]);
    next = addAttr(next, "data-media-gallery", type);
    return next;
  });
}

function buildShowcaseToc(html) {
  html = html
    .replace(/\n\s*<aside\b[^>]*data-showcase-toc[\s\S]*?<\/aside>\s*/gi, "\n")
    .replace(/\n\s*<button\b[^>]*data-showcase-toc-trigger[\s\S]*?<\/button>\s*/gi, "\n");

  const sectionOpen = html.match(/<section\b[^>]*class\s*=\s*(['"])[^'"]*\bsection__screen--showcase\b[^'"]*\1[^>]*>/i);
  if (!sectionOpen) return html;

  const items = [];
  const elementRx = /<(section|article)\b[^>]*\bid\s*=\s*(['"])([^'"]+)\2[^>]*>/gi;
  let match;

  while ((match = elementRx.exec(html))) {
    const id = match[3];
    const openTag = match[0];
    if (!/^project-/.test(id) && !/^jestei-frame-/.test(id)) continue;
    if (/\b(?:hero|resume)\b/.test(openTag)) continue;

    const tagName = match[1].toLowerCase();
    const element = findMatchingClose(html, match.index, tagName);
    if (!element) continue;

    const headingMatch = element.inner.match(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/i);
    const label = headingMatch ? stripTags(headingMatch[2]) : id.replace(/^project-/, "").replace(/^jestei-frame-/, "");
    if (!label) continue;
    items.push({ id, label, isProject: /^project-/.test(id) });
  }

  const unique = [];
  const seen = new Set();
  for (const item of items) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    unique.push(item);
  }

  if (!unique.length) return html;

  const links = unique.map((item) => (
    `      <a class="showcase-toc__link${item.isProject ? " showcase-toc__link--project" : ""}" href="#${item.id}" data-showcase-toc-link>${item.label}</a>`
  )).join("\n");

  const toc = `
            <aside class="showcase-toc" data-showcase-toc aria-label="навигация по кейсам">
              <button class="showcase-toc__trigger" type="button" aria-expanded="false" data-showcase-toc-trigger>разделы</button>
              <nav class="showcase-toc__panel" data-showcase-toc-panel>
${links}
              </nav>
            </aside>`;

  return html.slice(0, sectionOpen.index + sectionOpen[0].length) + toc + html.slice(sectionOpen.index + sectionOpen[0].length);
}

function cleanMainJs(value) {
  let next = value
    .replace(/^\s*import\s+\{\s*initRestructureStage0[123]\s*\}\s+from\s+['"][^'"]+restructure-stage-0[123]\.js['"];\s*\n/gm, "")
    .replace(/\n\s*await\s+runInitStep\("initRestructureStage0[123]"[\s\S]*?\n\s*\}\);\s*/g, "\n")
    .replace(/\n?\s*initRestructureStage0[123]\(\);\s*/g, "\n")
    .replace(/\n{3,}/g, "\n\n");

  next = next.replace(/if \(has\("\[data-jestei-chapter-frame\], \[data-case-chapter-frame\], \[data-jestei-action-rail\]", root\)\) \{/,
    `if (has("[data-jestei-action-rail]", root)) {`);

  if (!/initShowcaseToc/.test(next)) {
    next = next.replace(/if \(has\("\[data-random-gallery\]", root\)\) \{[\s\S]*?\n  \}/, (block) => `${block}

  if (has("[data-showcase-toc]", root)) {
    tasks.push(runInitStep("initShowcaseToc", async () => {
      const module = await import("./visuals/dom/showcase-toc.js");
      return module.initShowcaseToc(root);
    }));
  }`);
  }

  next = next.replace(/\n{3,}/g, "\n\n").trimEnd() + "\n";
  return next;
}

const cleanCaseChaptersJs = `const mountedJesteiRails = new WeakSet();

function getRailParts(rail) {
  return {
    viewport: rail.querySelector("[data-jestei-action-rail-viewport]"),
    prev: rail.querySelector("[data-jestei-action-rail-prev]"),
    next: rail.querySelector("[data-jestei-action-rail-next]")
  };
}

function updateRailControls(rail, viewport, prev, next) {
  const maxScroll = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
  const currentScroll = viewport.scrollLeft;

  prev.hidden = currentScroll <= 1;
  next.hidden = currentScroll >= maxScroll - 1;
  rail.dataset.railReady = "true";
}

function initJesteiActionRail(rail) {
  if (!(rail instanceof HTMLElement) || mountedJesteiRails.has(rail)) {
    return;
  }

  const { viewport, prev, next } = getRailParts(rail);

  if (!(viewport instanceof HTMLElement) || !(prev instanceof HTMLButtonElement) || !(next instanceof HTMLButtonElement)) {
    return;
  }

  mountedJesteiRails.add(rail);
  rail.dataset.railReady = "false";
  prev.hidden = true;

  let dragState = null;
  const update = () => updateRailControls(rail, viewport, prev, next);

  const scrollByPage = (direction) => {
    viewport.scrollBy({
      left: direction * Math.max(240, viewport.clientWidth * 0.82),
      behavior: "smooth"
    });
  };

  const stopDragging = (event) => {
    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    viewport.classList.remove("is-dragging");

    if (viewport.hasPointerCapture(event.pointerId)) {
      viewport.releasePointerCapture(event.pointerId);
    }

    dragState = null;
    update();
  };

  prev.addEventListener("click", () => scrollByPage(-1));
  next.addEventListener("click", () => scrollByPage(1));

  viewport.addEventListener("pointerdown", (event) => {
    if (event.button !== undefined && event.button !== 0) {
      return;
    }

    dragState = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startScrollLeft: viewport.scrollLeft
    };

    viewport.classList.add("is-dragging");
    viewport.setPointerCapture(event.pointerId);
  });

  viewport.addEventListener("pointermove", (event) => {
    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    event.preventDefault();
    viewport.scrollLeft = dragState.startScrollLeft - (event.clientX - dragState.startX);
    update();
  });

  viewport.addEventListener("pointerup", stopDragging);
  viewport.addEventListener("pointercancel", stopDragging);
  viewport.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);

  requestAnimationFrame(update);
}

export function initCaseChapters(root = document) {
  root.querySelectorAll("[data-jestei-action-rail]").forEach(initJesteiActionRail);
}
`;

const showcaseTocJs = `const mountedTocs = new WeakSet();

function setOpen(trigger, panel, isOpen) {
  trigger.setAttribute("aria-expanded", String(isOpen));
  panel.dataset.open = String(isOpen);
}

function initToc(root) {
  const toc = root.querySelector("[data-showcase-toc]");

  if (!(toc instanceof HTMLElement) || mountedTocs.has(toc)) {
    return;
  }

  const trigger = toc.querySelector("[data-showcase-toc-trigger]");
  const panel = toc.querySelector("[data-showcase-toc-panel]");
  const links = [...toc.querySelectorAll("[data-showcase-toc-link]")];

  if (!(trigger instanceof HTMLButtonElement) || !(panel instanceof HTMLElement) || !links.length) {
    return;
  }

  mountedTocs.add(toc);
  setOpen(trigger, panel, false);

  trigger.addEventListener("click", () => {
    setOpen(trigger, panel, trigger.getAttribute("aria-expanded") !== "true");
  });

  links.forEach((link) => {
    link.addEventListener("click", () => setOpen(trigger, panel, false));
  });

  const targets = links
    .map((link) => {
      const href = link.getAttribute("href");
      return href && href.startsWith("#") ? document.getElementById(decodeURIComponent(href.slice(1))) : null;
    })
    .filter((target) => target instanceof HTMLElement);

  if (!targets.length || !("IntersectionObserver" in window)) {
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

    if (!visible) {
      return;
    }

    const activeId = visible.target.id;
    links.forEach((link) => {
      const isActive = link.getAttribute("href") === "#" + activeId;
      link.classList.toggle("is-active", isActive);
      if (isActive) {
        link.setAttribute("aria-current", "true");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }, {
    rootMargin: "-30% 0px -58% 0px",
    threshold: [0, 0.2, 0.45, 0.7]
  });

  targets.forEach((target) => observer.observe(target));
}

export function initShowcaseToc(root = document) {
  initToc(root);
}
`;

const portfolioCleanCss = `:root {
  --case-flow-width: min(100% - clamp(20px, 6vw, 96px), 1280px);
  --case-flow-gap: var(--gap-lg);
  --case-anchor-offset: clamp(92px, 11vh, 148px);
}

html {
  scroll-padding-top: var(--case-anchor-offset);
}

:where(section[id], article[id], [id^="project-"], [id^="jestei-frame-"], #showcase) {
  scroll-margin-top: var(--case-anchor-offset);
}

.section__screen--showcase {
  position: relative;
  inline-size: 100%;
}

.showcase-stack {
  min-inline-size: 0;
}

.case-section-clean,
.jestei-chapter-section,
.case-chapter-section {
  display: grid;
  gap: var(--case-flow-gap);
  min-inline-size: 0;
  overflow: visible;
  border: 0;
  border-radius: 0;
  background: transparent;
}

.case-section-clean + .case-section-clean {
  margin-block-start: var(--project-gap);
}

.jestei-chapter-section > .jestei-chapter-hero,
.case-chapter-section > .case-chapter-hero {
  border-block-end: var(--line);
}

.jestei-chapter-hero,
.case-chapter-hero {
  display: grid;
  justify-items: center;
  gap: var(--gap);
  min-inline-size: 0;
  overflow: hidden;
  padding: var(--gap-lg) var(--gap) var(--gap);
  background: var(--white);
}

.jestei-chapter-hero__title,
.case-chapter-hero__title {
  max-inline-size: 100%;
  margin: 0;
  text-align: center;
  white-space: nowrap;
}

.jestei-chapter-hero__subtitle,
.case-chapter-hero__subtitle {
  max-inline-size: min(100%, 74rem);
  margin: 0 auto;
  color: rgba(0, 0, 0, 0.68);
  font-size: clamp(1.5rem, 2.2vw, 2.18rem);
  line-height: 1.18;
  text-align: left;
}

.jestei-chapter-hero__media,
.case-chapter-hero__media {
  justify-self: stretch;
  inline-size: 100%;
  max-inline-size: none;
  min-inline-size: 0;
  margin: 0;
  background: var(--white);
}

.case-section-clean :where(.project-chapter, .block, .text-block) {
  min-inline-size: 0;
}

.case-section-clean :where(.block, .text-block) {
  display: grid;
  gap: var(--gap);
}

.case-section-clean :where(.block__header, .section-head) {
  display: grid;
  gap: clamp(0.75rem, 2vw, 1.2rem);
  max-inline-size: min(100%, 74rem);
}

.text-sections {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 18rem), 1fr));
  gap: var(--gap);
  min-inline-size: 0;
  margin: 0;
  padding: 0;
}

.text-section {
  display: grid;
  align-content: start;
  gap: clamp(0.7rem, 1.5vw, 1rem);
  min-inline-size: 0;
  margin: 0;
  padding: 0;
  overflow: visible;
  border: 0;
  border-radius: 0;
  background: transparent;
  color: inherit;
}

.text-section__title {
  margin: 0;
}

.text-section p {
  margin: 0;
  max-inline-size: 66rem;
}

:where(.project p, .text-block, .text-section, .jestei-action-card, .responsibility-card) {
  overflow-wrap: break-word;
}

:where(img, video, canvas, svg) {
  max-inline-size: 100%;
}

@media (max-width: 48rem) {
  :root {
    --case-anchor-offset: clamp(84px, 12vh, 128px);
  }

  .jestei-chapter-hero,
  .case-chapter-hero {
    gap: clamp(1rem, 4vw, 1.35rem);
    padding: var(--component-gap);
  }

  .jestei-chapter-hero__title,
  .case-chapter-hero__title {
    padding-inline: 0;
    max-inline-size: 100%;
    white-space: normal;
  }

  .jestei-chapter-hero__subtitle,
  .case-chapter-hero__subtitle {
    max-inline-size: 100%;
    padding-inline: 0;
    font-size: clamp(1.12rem, 4.85vw, 1.55rem);
    line-height: 1.16;
    text-align: left;
  }

  .text-sections {
    grid-template-columns: 1fr;
  }
}
`;

const portfolioMediaCss = `.media-gallery {
  min-inline-size: 0;
  max-inline-size: 100%;
}

.media-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--gap);
  align-items: start;
}

.media-two,
.media-three,
.media-quad,
.media-six,
.media-eight,
.media-banner,
.media-figure {
  display: grid;
  gap: var(--gap);
  margin: 0;
  padding: 0;
  min-inline-size: 0;
}

.media-banner,
.media-figure,
.media-gallery--banner {
  grid-template-columns: 1fr;
}

.media-two,
.media-quad {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.media-three,
.media-six {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.media-eight {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.media-item {
  display: block;
  min-inline-size: 0;
  overflow: hidden;
  border: var(--line);
  border-radius: var(--r);
  background: var(--black);
  color: var(--white);
  aspect-ratio: 1;
  text-decoration: none;
}

.media-item img,
.media-item video,
.media-item canvas {
  display: block;
  inline-size: 100%;
  block-size: 100%;
  object-fit: cover;
}

.media-contain img,
.media-contain video,
.media-contain canvas,
.media-item.media-contain > img,
.media-item.media-contain > video,
.media-item.media-contain > canvas {
  object-fit: contain;
}

.media-banner > .media-item,
.media-landscape > .media-item,
.media-gallery--banner > .media-item,
.media-item.media-landscape {
  aspect-ratio: 16 / 9;
}

.media-portrait > .media-item,
.media-item.media-portrait {
  aspect-ratio: 9 / 16;
}

.media-slider {
  --media-slider-gap: var(--gap);
  --media-slider-card-basis: 100%;
  position: relative;
  inline-size: 100%;
  max-inline-size: 100%;
  margin: 0;
  overflow: hidden;
  isolation: isolate;
  touch-action: pan-y;
  container-type: inline-size;
}

.media-slider__track {
  display: flex;
  flex-wrap: nowrap;
  align-items: stretch;
  gap: var(--media-slider-gap);
  inline-size: max-content;
  min-inline-size: max-content;
  max-inline-size: none;
  transform: translate3d(0, 0, 0);
  will-change: transform;
}

.media-slider > .media-item,
.media-slider__track > .media-item {
  flex: 0 0 var(--media-slider-card-basis);
  inline-size: var(--media-slider-card-basis);
}

.media-slider.media-square {
  --media-slider-card-basis: calc((100% - (var(--media-slider-gap) * 2)) / 3);
}

.media-marquee {
  overflow: hidden;
  inline-size: 100%;
  max-inline-size: 100%;
}

.media-marquee__track {
  display: flex;
  gap: var(--gap);
  inline-size: max-content;
  max-inline-size: none;
  will-change: transform;
}

.media-marquee .media-item {
  flex: 0 0 clamp(14rem, 24vw, 28rem);
}

.random-gallery {
  display: grid;
  gap: var(--gap);
}

@media (max-width: 48rem) {
  .media-row {
    grid-template-columns: 1fr;
  }

  .media-two,
  .media-three,
  .media-quad,
  .media-six,
  .media-eight,
  .media-gallery--tiles {
    grid-template-columns: 1fr;
  }

  .media-six.media-square,
  .media-eight.media-square,
  .media-gallery--tiles.media-square {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .media-banner > .media-item,
  .media-figure > .media-item,
  .media-gallery--banner > .media-item {
    min-block-size: clamp(14rem, 64vw, 28rem);
  }

  .media-slider,
  .media-gallery--carousel {
    overflow-x: auto;
    overflow-y: hidden;
    scroll-snap-type: x mandatory;
    overscroll-behavior-inline: contain;
    -webkit-overflow-scrolling: touch;
  }

  .media-slider__track {
    transform: none;
    will-change: auto;
  }

  .media-slider > .media-item,
  .media-slider__track > .media-item {
    flex-basis: min(82vw, 30rem);
    inline-size: min(82vw, 30rem);
    scroll-snap-align: start;
  }

  .media-slider__arrow,
  .media-slider__dots {
    display: none;
  }

  .media-marquee .media-item {
    flex-basis: min(76vw, 24rem);
  }
}
`;

const showcaseTocCss = `.showcase-toc {
  display: contents;
}

.showcase-toc__trigger {
  position: fixed;
  z-index: 80;
  right: clamp(1rem, 4vw, 1.5rem);
  bottom: clamp(1rem, 4vw, 1.5rem);
  display: none;
  min-block-size: 2.75rem;
  padding: 0 1rem;
  border: var(--line);
  border-radius: 999px;
  background: var(--white);
  color: var(--black);
  font: inherit;
  cursor: pointer;
}

.showcase-toc__panel {
  display: grid;
  gap: 0.32rem;
  min-inline-size: 0;
}

.showcase-toc__link {
  display: block;
  padding: 0.34rem 0;
  color: currentColor;
  font-size: 0.82rem;
  line-height: 1.18;
  text-decoration: none;
  opacity: 0.58;
}

.showcase-toc__link--project {
  margin-block-start: 0.65rem;
  font-weight: 700;
  opacity: 1;
}

.showcase-toc__link.is-active {
  opacity: 1;
  text-decoration: underline;
  text-underline-offset: 0.22em;
}

@media (min-width: 88rem) {
  .section__screen--showcase {
    display: grid;
    grid-template-columns: clamp(10rem, 13vw, 15rem) minmax(0, 80rem) minmax(clamp(2rem, 8vw, 9rem), 1fr);
    column-gap: clamp(2rem, 3.8vw, 4.5rem);
    align-items: start;
  }

  .section__screen--showcase > .showcase-toc {
    display: block;
    position: sticky;
    top: var(--case-anchor-offset, 8rem);
    grid-column: 1;
    max-block-size: calc(100vh - var(--case-anchor-offset, 8rem) - 2rem);
    overflow: auto;
  }

  .section__screen--showcase > .showcase-stack {
    grid-column: 2;
    min-inline-size: 0;
  }
}

@media (max-width: 87.999rem) {
  .showcase-toc {
    display: block;
  }

  .showcase-toc__trigger {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .showcase-toc__panel {
    position: fixed;
    z-index: 79;
    right: clamp(1rem, 4vw, 1.5rem);
    bottom: calc(clamp(1rem, 4vw, 1.5rem) + 3.25rem);
    inline-size: min(22rem, calc(100vw - 2rem));
    max-block-size: min(60vh, 32rem);
    padding: 1rem;
    overflow: auto;
    border: var(--line);
    border-radius: var(--r);
    background: var(--white);
    color: var(--black);
    box-shadow: 0 1.5rem 4rem rgba(0, 0, 0, 0.14);
    transform: translateY(0.5rem);
    opacity: 0;
    pointer-events: none;
  }

  .showcase-toc__panel[data-open="true"] {
    transform: translateY(0);
    opacity: 1;
    pointer-events: auto;
  }
}
`;

const cleanIndexCss = `@import "./modules/core.css";
@import "./modules/layout.css";
@import "./modules/typography.css";
@import "./modules/canvas.css";

@import "./modules/proximity.css";
@import "./modules/awfulface.css";
@import "./modules/hero-skill-marquee.css";
@import "./modules/site-header.css";
@import "./modules/hero.css";
@import "./modules/footer.css";

@import "./modules/project.css";
@import "./modules/project-responsibilities.css";
@import "./modules/jestei-responsibilities-header.css";
@import "./modules/resume.css";

@import "./modules/policy-book.css";
@import "./modules/artifact-reader.css";
@import "./modules/jestei-policy-marquee.css";
@import "./modules/jestei-token-colors.css";

@import "./modules/lightbox.css";
@import "./modules/media-caption.css";
@import "./modules/media-effects.css";
@import "./modules/random-gallery.css";
@import "./modules/media-marquee.css";
@import "./modules/media-slider.css";
@import "./modules/media-skeleton.css";

@import "./modules/portfolio-clean.css";
@import "./modules/portfolio-media.css";
@import "./modules/showcase-toc.css";
`;

// HTML cleanup
let html = read(htmlPath);
const beforeCounts = {
  img: (html.match(/<img\b/g) || []).length,
  video: (html.match(/<video\b/g) || []).length,
  canvas: (html.match(/<canvas\b/g) || []).length,
  assetHref: (html.match(/href="\/assets\//g) || []).length,
  assetSrc: (html.match(/src="\/assets\//g) || []).length
};

html = transformChapterFrames(html);
html = transformListCards(html);
html = addGalleryTypes(html);
html = buildShowcaseToc(html);

const afterCounts = {
  img: (html.match(/<img\b/g) || []).length,
  video: (html.match(/<video\b/g) || []).length,
  canvas: (html.match(/<canvas\b/g) || []).length,
  assetHref: (html.match(/href="\/assets\//g) || []).length,
  assetSrc: (html.match(/src="\/assets\//g) || []).length
};

for (const key of Object.keys(beforeCounts)) {
  if (beforeCounts[key] !== afterCounts[key]) {
    throw new Error(`asset count changed for ${key}: before ${beforeCounts[key]}, after ${afterCounts[key]}`);
  }
}

write(htmlPath, html);

// JS cleanup
write(mainPath, cleanMainJs(read(mainPath)));
write(caseChaptersPath, cleanCaseChaptersJs);
write(file("src", "visuals", "dom", "showcase-toc.js"), showcaseTocJs);

// CSS cleanup
write(indexCssPath, cleanIndexCss);
write(file("src", "styles", "modules", "portfolio-clean.css"), portfolioCleanCss);
write(file("src", "styles", "modules", "portfolio-media.css"), portfolioMediaCss);
write(file("src", "styles", "modules", "showcase-toc.css"), showcaseTocCss);

// Remove temporary stage files
for (const target of removedFiles) {
  if (existsSync(target)) {
    rmSync(target, { force: true });
  }
}

const report = {
  backupRoot,
  counts: afterCounts,
  removedFiles: removedFiles.map((target) => path.relative(root, target)),
  generatedFiles: generatedFiles.map((target) => path.relative(root, target)),
  protectedFiles: protectedFiles.map((target) => path.relative(root, target))
};

write(file("tools", "portfolio-clean-backups", stamp, "report.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
