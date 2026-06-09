const fs = require("fs");

const htmlPath = "index.html";

const brandImageUrl = "/assets/styx/galleries/styx-graphic-design";
const brandVideoUrl = "/assets/styx/video/styx-graphic-design";
const communicationsUrl = "/assets/styx/galleries/styx-communications";

function findCloseTag(source, start, tag) {
  const re = new RegExp("<\\/?" + tag + "\\b[^>]*>", "gi");
  re.lastIndex = start;

  let depth = 0;
  let match;

  while ((match = re.exec(source))) {
    const token = match[0];
    const isClose = token.startsWith("</");
    const isSelfClosing = token.endsWith("/>");

    if (!isClose && !isSelfClosing) depth += 1;
    if (isClose) depth -= 1;

    if (depth === 0) return re.lastIndex;
  }

  return -1;
}

function getOpenTag(source, start) {
  const end = source.indexOf(">", start);
  if (end === -1) return "";
  return source.slice(start, end + 1);
}

function findStyxGraphicStack(html) {
  const classIndex = html.indexOf("cv-task-meta-layout-stack--styx-graphic");

  if (classIndex === -1) {
    throw new Error("styx graphic stack not found");
  }

  const start = html.lastIndexOf("<div", classIndex);
  const end = findCloseTag(html, start, "div");

  if (start === -1 || end === -1) {
    throw new Error("styx graphic stack bounds not found");
  }

  return { start, end };
}

function findGraphicLayouts(html, stack) {
  const layouts = [];
  const re = /<div\b[^>]*class="[^"]*cv-task-meta-layout--styx-graphic-single[^"]*"[^>]*>/gi;

  re.lastIndex = stack.start;

  let match;

  while ((match = re.exec(html))) {
    const start = match.index;

    if (start >= stack.end) break;

    const end = findCloseTag(html, start, "div");

    if (end === -1 || end > stack.end) {
      throw new Error("graphic single layout closing div not found");
    }

    layouts.push({ start, end });
    re.lastIndex = end;
  }

  if (layouts.length < 2) {
    throw new Error("expected two styx graphic layouts, found: " + layouts.length);
  }

  return layouts;
}

function findGalleryInsideLayout(html, layout) {
  const layoutHtml = html.slice(layout.start, layout.end);
  const re = /<aside\b[^>]*class="[^"]*cv-task-side-gallery[^"]*"[^>]*>/i;
  const match = re.exec(layoutHtml);

  if (!match) {
    throw new Error("cv-task-side-gallery not found inside layout");
  }

  const start = layout.start + match.index;
  const end = findCloseTag(html, start, "aside");

  if (end === -1) {
    throw new Error("gallery closing aside not found");
  }

  return { start, end };
}

function renderBrandGallery() {
  return [
    '                  <aside class="cv-task-side-gallery" aria-label="styx brand and packaging gallery">',
    '                    <a class="cv-task-side-gallery__link" href="' + brandImageUrl + '/01.webp" target="_blank" rel="noopener noreferrer">',
    '                      <img class="cv-task-side-gallery__media" src="' + brandImageUrl + '/01.webp" alt="styx brand and packaging image 1" loading="lazy" decoding="async" />',
    '                    </a>',
    '                    <a class="cv-task-side-gallery__link" href="' + brandImageUrl + '/02.webp" target="_blank" rel="noopener noreferrer">',
    '                      <img class="cv-task-side-gallery__media" src="' + brandImageUrl + '/02.webp" alt="styx brand and packaging image 2" loading="lazy" decoding="async" />',
    '                    </a>',
    '                    <a class="cv-task-side-gallery__link" href="' + brandImageUrl + '/03.webp" target="_blank" rel="noopener noreferrer">',
    '                      <img class="cv-task-side-gallery__media" src="' + brandImageUrl + '/03.webp" alt="styx brand and packaging image 3" loading="lazy" decoding="async" />',
    '                    </a>',
    '                    <a class="cv-task-side-gallery__link cv-task-side-gallery__link--video" href="' + brandVideoUrl + '/04.mp4" target="_blank" rel="noopener noreferrer" aria-label="open styx brand and packaging video">',
    '                      <video class="cv-task-side-gallery__media" src="' + brandVideoUrl + '/04.mp4" autoplay muted loop playsinline preload="metadata"></video>',
    '                    </a>',
    '                  </aside>'
  ].join("\n");
}

function renderCommunicationsGallery() {
  const items = ["01.webp", "02.webp", "03.webp", "04.webp"].map(function (fileName, index) {
    const href = communicationsUrl + "/" + fileName;

    return [
      '                    <a class="cv-task-side-gallery__link" href="' + href + '" target="_blank" rel="noopener noreferrer">',
      '                      <img class="cv-task-side-gallery__media" src="' + href + '" alt="styx communications image ' + (index + 1) + '" loading="lazy" decoding="async" />',
      '                    </a>'
    ].join("\n");
  }).join("\n");

  return [
    '                  <aside class="cv-task-side-gallery" aria-label="styx communications gallery">',
    items,
    '                  </aside>'
  ].join("\n");
}

function replaceRange(source, start, end, replacement) {
  return source.slice(0, start) + replacement + source.slice(end);
}

let html = fs.readFileSync(htmlPath, "utf8");

let stack = findStyxGraphicStack(html);
let layouts = findGraphicLayouts(html, stack);

let secondGallery = findGalleryInsideLayout(html, layouts[1]);
html = replaceRange(html, secondGallery.start, secondGallery.end, renderCommunicationsGallery());

stack = findStyxGraphicStack(html);
layouts = findGraphicLayouts(html, stack);

let firstGallery = findGalleryInsideLayout(html, layouts[0]);
html = replaceRange(html, firstGallery.start, firstGallery.end, renderBrandGallery());

fs.writeFileSync(htmlPath, html, "utf8");

console.log("done: restored distinct styx brand and communications galleries");
