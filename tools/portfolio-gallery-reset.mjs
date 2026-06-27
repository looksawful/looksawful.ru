import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const write = (file, value) => fs.writeFileSync(path.join(root, file), value, "utf8");
const exists = (file) => fs.existsSync(path.join(root, file));
const ensureDir = (dir) => fs.mkdirSync(path.join(root, dir), { recursive: true });

const timestamp = new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
const backupRoot = path.join(root, "tools", "portfolio-gallery-backups", timestamp);

const protectedNeedles = [
  "id=\"hero\"",
  "id=\"resume\"",
  "data-site-header",
  "class=\"project__header",
  "class=\"jestei-chapter-hero",
  "class=\"case-chapter-hero",
  "data-playlist-filter",
  "playlist-filter",
  "policy-book",
  "artifact-reader",
  "jestei-policy-marquee",
  "data-visual-demo",
  "<canvas",
];

const galleryClassPattern = /\b(media-gallery|media-(?:banner|quad|eight|six|three|two|figure|slider|marquee)|random-gallery)\b/;
const skipClassPattern = /\b(media-item|media-row|token-list|project__logo|jestei-chapter-hero__media|case-chapter-hero__media|project__header|hero|resume)\b/;

function backup(file) {
  if (!exists(file)) return;
  const source = path.join(root, file);
  const target = path.join(backupRoot, file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
}

function countNeedle(value, pattern) {
  return (value.match(pattern) || []).length;
}


function findMatchingBrace(value, openBrace) {
  let depth = 0;
  for (let index = openBrace; index < value.length; index += 1) {
    const char = value[index];
    if (char === "{") depth += 1;
    if (char === "}") depth -= 1;
    if (depth === 0) return index + 1;
  }
  return -1;
}


function findOpenTagEnd(html, start) {
  const end = html.indexOf(">", start);
  if (end < 0) throw new Error("broken html: open tag has no closing >");
  return end + 1;
}

function getTagName(openTag) {
  const match = openTag.match(/^<\s*([a-z0-9-]+)/i);
  return match ? match[1].toLowerCase() : null;
}

function findMatchingClose(html, openStart) {
  const openEnd = findOpenTagEnd(html, openStart);
  const openTag = html.slice(openStart, openEnd);
  const tag = getTagName(openTag);
  if (!tag) return -1;
  const selfClosing = /\/\s*>$/.test(openTag);
  if (selfClosing) return openEnd;

  const tagRe = new RegExp(`<\\/?${tag}\\b[^>]*>`, "gi");
  tagRe.lastIndex = openEnd;
  let depth = 1;
  let match;

  while ((match = tagRe.exec(html))) {
    const token = match[0];
    if (/^<\//.test(token)) depth -= 1;
    else if (!/\/\s*>$/.test(token)) depth += 1;
    if (depth === 0) return tagRe.lastIndex;
  }

  return -1;
}

function getAttr(openTag, attr) {
  const re = new RegExp(`${attr}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, "i");
  const match = openTag.match(re);
  return match ? (match[2] ?? match[3] ?? match[4] ?? "") : "";
}

function escapeAttr(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function stripAttr(openTag, attr) {
  return openTag.replace(new RegExp(`\\s+${attr}(?:\\s*=\\s*(?:"[^"]*"|'[^']*'|[^\\s>]+))?`, "gi"), "");
}

function removeAttrs(openTag, attrs) {
  let value = openTag;
  for (const attr of attrs) value = stripAttr(value, attr);
  return value;
}

function cleanWhitespace(value) {
  return value
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim();
}

function filenameCaption(url, index) {
  const fallback = `изображение ${String(index + 1).padStart(2, "0")}`;
  if (!url) return fallback;
  const clean = url.split(/[?#]/)[0].split("/").filter(Boolean);
  const file = clean.at(-1) || fallback;
  const stem = file.replace(/\.[a-z0-9]+$/i, "");
  if (!stem) return fallback;
  return stem.replace(/[-_]+/g, " ").trim() || fallback;
}

function extractCaptionText(block) {
  const caption = block.match(/<p\b[^>]*class="[^"]*(?:random-gallery__caption|media-group__title|component-caption)[^"]*"[^>]*>([\s\S]*?)<\/p>/i);
  if (!caption) return "";
  return caption[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function unwrapTrack(content) {
  const trackRe = /<div\b[^>]*class="[^"]*(?:media-marquee__track|media-slider__track|random-gallery__grid|random-gallery__stage)[^"]*"[^>]*>/i;
  const match = trackRe.exec(content);
  if (!match) return content;
  const start = match.index;
  const end = findMatchingClose(content, start);
  if (end < 0) return content;
  const openEnd = findOpenTagEnd(content, start);
  const inner = content.slice(openEnd, end - "</div>".length);
  return content.slice(0, start) + inner + content.slice(end);
}

function normalizeMediaItem(tag, index) {
  const openEnd = findOpenTagEnd(tag, 0);
  const open = tag.slice(0, openEnd);
  const tagName = getTagName(open);
  const inner = tag.slice(openEnd, tag.length - (`</${tagName}>`).length);
  const href = getAttr(open, "href");
  const srcMatch = inner.match(/\s(?:src|poster)\s*=\s*"([^"]+)"/i);
  const source = href || (srcMatch ? srcMatch[1] : "");
  const caption = getAttr(open, "data-caption") || filenameCaption(source, index);
  const isAnchor = tagName === "a";
  const isVideo = /\.(mp4|webm|mov)$/i.test(source) || /<video\b/i.test(inner);
  const attrs = [];

  if (isAnchor && href) attrs.push(`href="${escapeAttr(href)}"`);
  if (isAnchor) attrs.push(`rel="noopener noreferrer"`);
  if (isAnchor) attrs.push(`target="_blank"`);
  attrs.push(`class="media-item"`);
  attrs.push(`data-media-item`);
  attrs.push(`data-caption="${escapeAttr(caption)}"`);
  if (isAnchor && !isVideo) attrs.push(`data-lightbox-item`);
  if (isAnchor && isVideo) attrs.push(`data-lightbox-video`);

  return `<${tagName} ${attrs.join(" ")}>${inner}</${tagName}>`;
}

function normalizeMediaItems(content) {
  let result = content;
  const replacements = [];

  const itemRe = /<(a|figure)\b[^>]*class="[^"]*\bmedia-item\b[^"]*"[^>]*>/gi;
  let match;
  while ((match = itemRe.exec(content))) {
    const start = match.index;
    const end = findMatchingClose(content, start);
    if (end < 0) continue;
    const item = content.slice(start, end);
    if (!/<(img|video)\b/i.test(item)) continue;
    replacements.push({ start, end, value: normalizeMediaItem(item, replacements.length) });
  }

  for (const replacement of replacements.sort((a, b) => b.start - a.start)) {
    result = result.slice(0, replacement.start) + replacement.value + result.slice(replacement.end);
  }

  return result;
}

function makeStaticRandomGallery(openTag, block, tagName) {
  const count = Number(getAttr(openTag, "data-random-gallery-count")) || 0;
  const basePath = getAttr(openTag, "data-random-gallery-path");
  const label = getAttr(openTag, "aria-label") || "галерея";
  const caption = extractCaptionText(block);
  const items = [];

  if (basePath && count > 0) {
    for (let index = 1; index <= count; index += 1) {
      const file = `${String(index).padStart(2, "0")}.webp`;
      const url = `${basePath}/${file}`;
      items.push(`<a href="${escapeAttr(url)}" rel="noopener noreferrer" target="_blank" class="media-item" data-media-item data-lightbox-item data-caption="${escapeAttr(filenameCaption(url, index - 1))}"><img alt="" decoding="async" loading="lazy" src="${escapeAttr(url)}" /></a>`);
    }
  }

  const groupType = items.length === 1 ? "single" : items.length === 2 ? "pair" : items.length === 3 ? "trio" : items.length === 4 ? "quad" : "grid";
  const title = caption ? `<p class="media-group__title">${caption}</p>` : "";
  return `<${tagName} aria-label="${escapeAttr(label)}" class="media-group media-group--${groupType}" data-media-group="${groupType}" data-media-count="${items.length}">\n${title}\n${items.join("\n")}\n</${tagName}>`;
}

function normalizeGalleryBlock(openTag, block) {
  const tagName = getTagName(openTag);
  const className = getAttr(openTag, "class");
  if (!tagName || skipClassPattern.test(className)) return block;
  if (!galleryClassPattern.test(className)) return block;
  if (!/<(img|video)\b/i.test(block) && !/\brandom-gallery\b/.test(className)) return block;

  const protectedInside = protectedNeedles.some((needle) => block.includes(needle));
  if (protectedInside) return block;

  if (/\brandom-gallery\b/.test(className)) return makeStaticRandomGallery(openTag, block, tagName);

  let contentStart = findOpenTagEnd(block, 0);
  let contentEnd = block.length - (`</${tagName}>`).length;
  if (contentEnd <= contentStart) return block;

  let content = block.slice(contentStart, contentEnd);
  content = unwrapTrack(content);
  content = normalizeMediaItems(content);
  content = content
    .replace(/\sdata-showcase-auto-slider(?:\s*=\s*"[^"]*")?/gi, "")
    .replace(/\sdata-media-marquee(?:\s*=\s*"[^"]*")?/gi, "")
    .replace(/\sdata-media-marquee-speed\s*=\s*"[^"]*"/gi, "")
    .replace(/\sdata-media-marquee-track(?:\s*=\s*"[^"]*")?/gi, "");

  const itemCount = (content.match(/\bdata-media-item\b/g) || []).length;
  if (!itemCount) return block;

  let type = "grid";
  if (itemCount === 1) type = "single";
  else if (itemCount === 2) type = "pair";
  else if (itemCount === 3) type = "trio";
  else if (itemCount === 4) type = "quad";

  let shape = "";
  if (/\bmedia-portrait\b/.test(className)) shape = " media-group--portrait";
  else if (/\bmedia-landscape\b/.test(className)) shape = " media-group--landscape";
  else if (/\bmedia-square\b/.test(className)) shape = " media-group--square";

  const label = getAttr(openTag, "aria-label");
  const id = getAttr(openTag, "id");
  const attrs = [];
  if (id) attrs.push(`id="${escapeAttr(id)}"`);
  if (label) attrs.push(`aria-label="${escapeAttr(label)}"`);
  attrs.push(`class="media-group media-group--${type}${shape}"`);
  attrs.push(`data-media-group="${type}"`);
  attrs.push(`data-media-count="${itemCount}"`);

  return `<${tagName} ${attrs.join(" ")}>\n${cleanWhitespace(content)}\n</${tagName}>`;
}

function normalizeGalleries(html) {
  const wrappers = [];
  const openRe = /<(aside|section|figure|div)\b[^>]*class="[^"]*(?:media-gallery|media-(?:banner|quad|eight|six|three|two|figure|slider|marquee)|random-gallery)[^"]*"[^>]*>/gi;
  let match;

  while ((match = openRe.exec(html))) {
    const start = match.index;
    const openTag = match[0];
    const className = getAttr(openTag, "class");
    if (skipClassPattern.test(className)) continue;
    const end = findMatchingClose(html, start);
    if (end < 0) continue;
    const block = html.slice(start, end);
    if (!/<(img|video)\b/i.test(block) && !/\brandom-gallery\b/.test(className)) continue;
    const value = normalizeGalleryBlock(openTag, block);
    if (value !== block) wrappers.push({ start, end, value });
  }

  // Keep only outermost non-overlapping replacements.
  wrappers.sort((a, b) => a.start - b.start || b.end - a.end);
  const filtered = [];
  let lastEnd = -1;
  for (const wrapper of wrappers) {
    if (wrapper.start < lastEnd) continue;
    filtered.push(wrapper);
    lastEnd = wrapper.end;
  }

  let result = html;
  for (const replacement of filtered.sort((a, b) => b.start - a.start)) {
    result = result.slice(0, replacement.start) + replacement.value + result.slice(replacement.end);
  }

  return result;
}

function patchMainJs(value) {
  let out = value;
  const randomTask = /[\n\r ]*if \(has\("\[data-random-gallery\]"\)\) \{[\s\S]*?\n  \}/;
  out = out.replace(randomTask, "");
  const mediaSliderTask = /[\n\r ]*if \(has\("\[data-showcase-auto-slider\], \.media-slider"\)\) \{[\s\S]*?\n  \}/;
  out = out.replace(mediaSliderTask, "");

  if (!out.includes("portfolioGallery")) {
    const anchor = `  if (has("[data-portfolio-toc]")) {`;
    const insert = `  if (has("[data-lightbox-item], [data-lightbox-video]")) {
    tasks.push(
      safe("portfolioGallery", async () => {
        const module = await import("./visuals/dom/portfolio-gallery.js");
        return module.initPortfolioGallery(document);
      }),
    );
  }

`;
    if (out.includes(anchor)) out = out.replace(anchor, insert + anchor);
    else out = out.replace("  await Promise.allSettled(tasks);", insert + "  await Promise.allSettled(tasks);");
  }

  return out.replace(/\n{3,}/g, "\n\n");
}

function patchIndexCss(value) {
  let out = value;
  const importLine = '@import "./modules/portfolio-gallery.css";';
  if (!out.includes(importLine)) {
    out = out.trimEnd() + "\n" + importLine + "\n";
  }
  return out;
}

function assertProtectedDiff(before, after) {
  const checks = [
    ["hero section", /<section\b[^>]*id="hero"[\s\S]*?<\/section>\s*<h2 class="visually-hidden" id="showcase-title">/],
    ["site header", /<header\b[^>]*data-site-header[\s\S]*?<\/header>\s*<main/],
    ["mailto typo comment", /<!-- ЭТО НЕ ОПЕЧАТКА, БУКВЫ S НЕТ -->/],
  ];

  for (const [label, pattern] of checks) {
    const a = before.match(pattern)?.[0];
    const b = after.match(pattern)?.[0];
    if (!a || !b || a !== b) {
      throw new Error(`protected area changed: ${label}`);
    }
  }
}


function patchPortfolioSystemCss(value) {
  let out = value;

  const mediaStart = out.indexOf(".media-system,");
  const mediaEnd = out.indexOf(".jestei-action-rail {", mediaStart);
  if (mediaStart >= 0 && mediaEnd > mediaStart) {
    out = out.slice(0, mediaStart) + out.slice(mediaEnd);
  }

  const legacyStart = out.indexOf(".random-gallery__grid,");
  const legacyEnd = out.indexOf("@media (min-width: 88rem)", legacyStart);
  if (legacyStart >= 0 && legacyEnd > legacyStart) {
    out = out.slice(0, legacyStart) + out.slice(legacyEnd);
  }

  const mobileStart = out.indexOf("@media (max-width: 48rem)");
  if (mobileStart >= 0) {
    const end = findMatchingBrace(out, out.indexOf("{", mobileStart));
    if (end > mobileStart) {
      const mobile = `@media (max-width: 48rem) {
  .project {
    gap: var(--project-gap);
  }

  .project__head {
    grid-template-columns: 1fr;
    align-items: start;
  }

  .project__logo {
    max-width: min(16rem, 70vw);
  }

  .project-responsibilities {
    display: flex;
    gap: var(--gap);
    overflow-x: auto;
    overscroll-behavior-inline: contain;
    scroll-snap-type: x proximity;
    -webkit-overflow-scrolling: touch;
  }

  .responsibility-card {
    flex: 0 0 min(19rem, 86vw);
    scroll-snap-align: start;
  }

  .jestei-chapter-hero,
  .case-chapter-hero {
    justify-items: stretch;
    padding-block: var(--gap-lg);
  }

  .jestei-chapter-hero__title,
  .case-chapter-hero__title {
    justify-self: center;
    text-align: center;
  }

  .jestei-chapter-hero__subtitle,
  .case-chapter-hero__subtitle {
    width: 100%;
    font-size: clamp(1.1rem, 5.1vw, 1.45rem);
  }

  .text-sections {
    grid-template-columns: 1fr;
  }
}
`;
      out = out.slice(0, mobileStart) + mobile + out.slice(end);
    }
  }

  return out.replace(/\n{3,}/g, "\n\n").trim() + "\n";
}


function main() {
  const files = [
    "index.html",
    "src/main.js",
    "src/styles/index.css",
    "src/styles/modules/portfolio-system.css",
    "src/styles/modules/portfolio-gallery.css",
    "src/visuals/dom/portfolio-gallery.js",
  ];

  for (const file of files) backup(file);

  const htmlBefore = read("index.html");
  const countsBefore = {
    video: countNeedle(htmlBefore, /<video\b/g),
    canvas: countNeedle(htmlBefore, /<canvas\b/g),
    existingImg: countNeedle(htmlBefore, /<img\b/g),
    oldRandomCount: [...htmlBefore.matchAll(/data-random-gallery-count="(\d+)"/g)].reduce((sum, item) => sum + Number(item[1] || 0), 0),
  };

  let htmlAfter = normalizeGalleries(htmlBefore);
  assertProtectedDiff(htmlBefore, htmlAfter);

  const countsAfter = {
    video: countNeedle(htmlAfter, /<video\b/g),
    canvas: countNeedle(htmlAfter, /<canvas\b/g),
    img: countNeedle(htmlAfter, /<img\b/g),
    mediaGroups: countNeedle(htmlAfter, /data-media-group=/g),
    randomGalleryRefs: countNeedle(htmlAfter, /data-random-gallery/g),
    sliders: countNeedle(htmlAfter, /data-showcase-auto-slider|media-slider/g),
  };

  if (countsAfter.video !== countsBefore.video) throw new Error(`video count changed: ${countsBefore.video} -> ${countsAfter.video}`);
  if (countsAfter.canvas !== countsBefore.canvas) throw new Error(`canvas count changed: ${countsBefore.canvas} -> ${countsAfter.canvas}`);

  const expectedImg = countsBefore.existingImg + countsBefore.oldRandomCount;
  if (countsAfter.img < countsBefore.existingImg) {
    throw new Error(`img count decreased: ${countsBefore.existingImg} -> ${countsAfter.img}`);
  }

  write("index.html", htmlAfter);
  write("src/main.js", patchMainJs(read("src/main.js")));
  write("src/styles/index.css", patchIndexCss(read("src/styles/index.css")));
  if (exists("src/styles/modules/portfolio-system.css")) {
    write("src/styles/modules/portfolio-system.css", patchPortfolioSystemCss(read("src/styles/modules/portfolio-system.css")));
  }

  console.log("");
  console.log("portfolio gallery reset complete");
  console.log(`backup: ${backupRoot}`);
  console.log(`img before html: ${countsBefore.existingImg}`);
  console.log(`random gallery images materialized: ${countsBefore.oldRandomCount}`);
  console.log(`img after html: ${countsAfter.img}`);
  console.log(`video: ${countsAfter.video}`);
  console.log(`canvas: ${countsAfter.canvas}`);
  console.log(`media groups: ${countsAfter.mediaGroups}`);
  console.log(`remaining random gallery refs: ${countsAfter.randomGalleryRefs}`);
  console.log(`remaining slider refs: ${countsAfter.sliders}`);
  if (countsAfter.img !== expectedImg) {
    console.log(`note: expected html img count after static random galleries: ${expectedImg}`);
  }
}

main();
