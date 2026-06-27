import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const stamp = new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
const backupRoot = path.join(root, "tools", "portfolio-hard-reset-backups", stamp);

const file = (...parts) => path.join(root, ...parts);
const htmlPath = file("index.html");
const mainPath = file("src", "main.js");
const indexCssPath = file("src", "styles", "index.css");
const caseChaptersPath = file("src", "visuals", "dom", "case-chapters.js");
const tocJsPath = file("src", "visuals", "dom", "showcase-toc.js");
const portfolioCssPath = file("src", "styles", "modules", "portfolio-system.css");

const touchedFiles = [
  htmlPath,
  mainPath,
  indexCssPath,
  caseChaptersPath,
  tocJsPath,
  portfolioCssPath,
];

const removeFiles = [
  file("src", "visuals", "dom", "restructure-stage-01.js"),
  file("src", "visuals", "dom", "restructure-stage-02.js"),
  file("src", "visuals", "dom", "restructure-stage-03.js"),
  file("src", "styles", "modules", "restructure-stage-01.css"),
  file("src", "styles", "modules", "restructure-stage-02.css"),
  file("src", "styles", "modules", "restructure-stage-03.css"),
  file("src", "styles", "modules", "portfolio-clean.css"),
  file("src", "styles", "modules", "portfolio-media.css"),
  file("src", "styles", "modules", "showcase-toc.css"),
  file("src", "styles", "modules", "project.css"),
  file("src", "styles", "modules", "project-responsibilities.css"),
  file("src", "styles", "modules", "jestei-responsibilities-header.css"),
  file("src", "styles", "modules", "lightbox.css"),
  file("src", "styles", "modules", "media-caption.css"),
  file("src", "styles", "modules", "media-effects.css"),
  file("src", "styles", "modules", "random-gallery.css"),
  file("src", "styles", "modules", "media-marquee.css"),
  file("src", "styles", "modules", "media-slider.css"),
  file("src", "styles", "modules", "media-skeleton.css"),
  file("src", "styles", "modules", "cases-generic.css"),
  file("src", "styles", "modules", "cases-jestei.css"),
  file("src", "styles", "modules", "chapter-frames.css"),
  file("src", "styles", "modules", "media.css"),
  file("src", "styles", "modules", "media-grid.css"),
  file("src", "styles", "modules", "mobile-fixes.css"),
  file("src", "styles", "modules", "unassigned.css"),
  file("tools", "portfolio-clean-architecture.mjs"),
];

const removeDirs = [
  file("tools", "portfolio-clean-backups"),
];

function readText(target) {
  return fs.readFileSync(target, "utf8");
}

function writeText(target, value) {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, value.replace(/\n/g, "\r\n"), "utf8");
}

function backupPath(target) {
  return path.join(backupRoot, path.relative(root, target));
}

function backup(target) {
  if (!fs.existsSync(target)) return;
  const destination = backupPath(target);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(target, destination);
}

function backupTree(target) {
  if (!fs.existsSync(target)) return;
  const destination = backupPath(target);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.cpSync(target, destination, { recursive: true, force: true });
}

function countHtmlAssets(html) {
  const count = (pattern) => (html.match(pattern) || []).length;

  return {
    img: count(/<img\b/gi),
    video: count(/<video\b/gi),
    canvas: count(/<canvas\b/gi),
    hrefAssets: count(/href="\/assets\//gi),
    srcAssets: count(/src="\/assets\//gi),
  };
}

function assertSameCounts(before, after) {
  const keys = Object.keys(before);
  const changed = keys.filter((key) => before[key] !== after[key]);

  if (changed.length) {
    throw new Error(
      "Asset count changed: " +
        changed.map((key) => `${key} ${before[key]} -> ${after[key]}`).join(", "),
    );
  }
}

function findOpeningTagStart(html, markerIndex, tagName) {
  const prefix = html.slice(0, markerIndex);
  return prefix.lastIndexOf(`<${tagName}`);
}

function findSectionStartById(html, id) {
  const idIndex = html.indexOf(`id="${id}"`);

  if (idIndex < 0) {
    return -1;
  }

  return findOpeningTagStart(html, idIndex, "section");
}

function splitShowcase(html) {
  const showcaseStart = findSectionStartById(html, "showcase");
  const resumeStart = findSectionStartById(html, "resume");

  if (showcaseStart < 0 || resumeStart < 0 || resumeStart <= showcaseStart) {
    throw new Error("Cannot find showcase/resume boundaries");
  }

  return {
    before: html.slice(0, showcaseStart),
    showcase: html.slice(showcaseStart, resumeStart),
    after: html.slice(resumeStart),
  };
}

function stripTags(value) {
  return value
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeClass(value) {
  return value.replace(/\s+/g, " ").trim();
}

function cleanClassAttribute(tag) {
  return tag.replace(/class="([^"]*)"/g, (_, cls) => {
    const clean = normalizeClass(
      cls
        .replace(/\bstage-\d+[\w-]*\b/g, "")
        .replace(/\bcase-section-clean\b/g, "")
        .replace(/\bmedia-gallery--(?:tiles|banner|carousel|scroll)\b/g, "")
        .replace(/\bmedia-gallery\b/g, ""),
    );

    return clean ? `class="${clean}"` : "";
  });
}

function removeOldToc(showcase) {
  let output = showcase;
  output = output.replace(/\s*<aside\s+class="showcase-toc"[\s\S]*?<\/aside>\s*/g, "\n");
  output = output.replace(/\s*<aside\s+class="stage-01-toc"[\s\S]*?<\/aside>\s*/g, "\n");
  output = output.replace(/\s*<div\s+class="stage-01-mobile-toc"[\s\S]*?<\/div>\s*/g, "\n");
  return output;
}

function collectToc(showcase) {
  const items = [];
  const projectRe = /<article\b[^>]*\bid="(project-[^"]+)"[^>]*>[\s\S]*?<h3\b[^>]*class="[^"]*\btitle\b[^"]*"[^>]*>([\s\S]*?)<\/h3>/gi;
  const chapterRe = /<(?:section|article)\b[^>]*\bid="([^"]+)"[^>]*\bdata-(?:jestei-)?chapter-title="([^"]+)"[^>]*>/gi;

  let match;
  while ((match = projectRe.exec(showcase))) {
    items.push({
      id: match[1],
      title: stripTags(match[2]),
      level: "project",
    });
  }

  while ((match = chapterRe.exec(showcase))) {
    items.push({
      id: match[1],
      title: stripTags(match[2]),
      level: "chapter",
    });
  }

  const seen = new Set();
  return items.filter((item) => {
    if (!item.id || !item.title || seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

function buildToc(showcase) {
  const items = collectToc(showcase);

  if (!items.length) {
    return "";
  }

  const links = items
    .map((item) => {
      const className =
        item.level === "project"
          ? "portfolio-toc__link portfolio-toc__link--project"
          : "portfolio-toc__link";
      return `        <a class="${className}" href="#${item.id}" data-portfolio-toc-link>${item.title}</a>`;
    })
    .join("\n");

  return `
        <aside class="portfolio-toc" data-portfolio-toc aria-label="навигация по кейсам">
          <button class="portfolio-toc__trigger" type="button" aria-expanded="false" data-portfolio-toc-trigger>разделы</button>
          <nav class="portfolio-toc__panel" data-portfolio-toc-panel>
${links}
          </nav>
        </aside>
`;
}

function insertToc(showcase) {
  const toc = buildToc(showcase);

  if (!toc) {
    return showcase;
  }

  return showcase.replace(
    /(<section\b[^>]*class="[^"]*\bsection__screen--showcase\b[^"]*"[^>]*>)/,
    `$1${toc}`,
  );
}

function convertListCard(articleHtml) {
  const titleMatch = articleHtml.match(/<h[1-6]\b[^>]*class="[^"]*\blist-card__title\b[^"]*"[^>]*>([\s\S]*?)<\/h[1-6]>/i);
  const fallbackTitle = articleHtml.match(/<h[1-6]\b[^>]*>([\s\S]*?)<\/h[1-6]>/i);
  const title = stripTags((titleMatch || fallbackTitle || [null, ""])[1]);
  const paragraphs = [...articleHtml.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)]
    .map((match) => stripTags(match[1]))
    .filter(Boolean);

  const text = paragraphs.length
    ? paragraphs.map((paragraph) => `            <p>${paragraph}</p>`).join("\n")
    : [...articleHtml.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)]
        .map((match) => stripTags(match[1]))
        .filter(Boolean)
        .map((paragraph) => `            <p>${paragraph}</p>`)
        .join("\n");

  if (!title && !text) {
    return "";
  }

  return `          <article class="text-section">
            ${title ? `<h6 class="text-section__title">${title}</h6>` : ""}
${text}
          </article>`;
}

function cleanTextSections(showcase) {
  let output = showcase;

  output = output.replace(
    /<section\b([^>]*class="[^"]*\blist-cards\b[^"]*"[^>]*)>([\s\S]*?)<\/section>/gi,
    (match, attrs, body) => {
      const hasConverted = /class="[^"]*\btext-section\b/i.test(body);
      let nextBody = body;

      if (hasConverted) {
        nextBody = nextBody.replace(/<article\b[^>]*class="[^"]*\blist-card\b[^"]*"[^>]*>[\s\S]*?<\/article>/gi, "");
      } else {
        nextBody = nextBody.replace(
          /<article\b[^>]*class="[^"]*\blist-card\b[^"]*"[^>]*>[\s\S]*?<\/article>/gi,
          convertListCard,
        );
      }

      const cleanAttrs = attrs
        .replace(/class="([^"]*)"/i, (_, cls) => {
          const clean = normalizeClass(
            cls
              .replace(/\blist-cards(?:--[\w-]+)?\b/g, "")
              .replace(/\btext-sections\b/g, ""),
          );
          return `class="${normalizeClass(`${clean} text-sections`)}"`;
        })
        .replace(/\sdata-text-sections(?:="")?/g, "");

      return `<section${cleanAttrs} data-text-sections>${nextBody}</section>`;
    },
  );

  output = output.replace(/<article\b[^>]*class="[^"]*\blist-card\b[^"]*"[^>]*>[\s\S]*?<\/article>/gi, convertListCard);

  return output;
}

function simplifyDecorativeMarkup(showcase) {
  return showcase
    .replace(/\s*<span\b[^>]*class="[^"]*(?:title-divider|__divider|divider)[^"]*"[^>]*><\/span>\s*/gi, "\n")
    .replace(/\s*<li\b[^>]*aria-hidden="true"[^>]*class="[^"]*divider[^"]*"[^>]*><\/li>\s*/gi, "\n")
    .replace(/\s*<div\s+aria-hidden="true"\s*><\/div>\s*/gi, "\n")
    .replace(/\s*<div\b[^>]*class="[^"]*(?:jestei|case)-chapter-frame__control[^"]*"[^>]*>[\s\S]*?<\/div>\s*/gi, "\n")
    .replace(/\s*<button\b[^>]*data-(?:jestei|case)-chapter-toggle[^>]*>[\s\S]*?<\/button>\s*/gi, "\n")
    .replace(/\s+(?:data-stage-\d+[\w-]*|data-showcase-toc)(?:="[^"]*")?/gi, "")
    .replace(/\s+class=""\s*/g, " ");
}

function markMedia(showcase) {
  return showcase.replace(/<(aside|section|figure|div)\b([^>]*class="[^"]*\bmedia-(?:slider|marquee|banner|figure|row|two|three|quad|six|eight|landscape|portrait|square)\b[^"]*"[^>]*)>/gi, (match, tag, attrs) => {
    if (/data-media-gallery=/.test(attrs) || /data-policy-|data-playlist-filter|playlist-filter|policy-book|artifact-reader/i.test(attrs)) {
      return match;
    }

    const classMatch = attrs.match(/class="([^"]*)"/i);
    const classes = classMatch ? classMatch[1] : "";
    let kind = "tiles";

    if (/\bmedia-slider\b/.test(classes)) kind = "carousel";
    else if (/\bmedia-marquee\b/.test(classes)) kind = "scroll";
    else if (/\bmedia-banner\b|\bmedia-figure\b/.test(classes)) kind = "banner";
    else if (/\bmedia-row\b/.test(classes)) kind = "row";

    const nextAttrs = attrs.replace(/class="([^"]*)"/i, (_, cls) => {
      const clean = normalizeClass(`${cls} media-system media-system--${kind}`);
      return `class="${clean}"`;
    });

    return `<${tag}${nextAttrs} data-media-gallery="${kind}">`;
  });
}

function normalizeChapterClasses(showcase) {
  return showcase
    .replace(/\bjestei-chapter-frame\b/g, "jestei-chapter-section")
    .replace(/\bcase-chapter-frame\b/g, "case-chapter-section")
    .replace(/\bstage-01-unpacked-frame\b|\bstage-01-flow-panel\b|\bstage-02-text-section\b|\bstage-03-gallery\b/g, "")
    .replace(/class="([^"]*)"/g, (_, cls) => {
      const clean = normalizeClass(cls);
      return clean ? `class="${clean}"` : "";
    });
}

function cleanShowcase(showcase) {
  let output = removeOldToc(showcase);
  output = cleanTextSections(output);
  output = simplifyDecorativeMarkup(output);
  output = markMedia(output);
  output = normalizeChapterClasses(output);
  output = insertToc(output);

  return output
    .replace(/[ \t]+$/gm, "")
    .replace(/\n\s*\n\s*\n+/g, "\n\n")
    .replace(/>\s+\n\s+</g, ">\n<");
}

const mainJs = `let initialized = false;

const has = (selector, root = document) => Boolean(root?.querySelector?.(selector));

async function safe(label, task) {
  try {
    return await task();
  } catch (error) {
    console.error(\`[init] \${label} failed\`, error);
    return null;
  }
}

async function initApp() {
  if (initialized) return;
  const main = document.getElementById("main");
  if (!(main instanceof HTMLElement)) return;

  initialized = true;

  await safe("gsap", () => import("./vendor/gsap-globals.js"));

  await safe("components", async () => {
    const module = await import("./components/index.js");
    return module.initComponents(document);
  });

  const tasks = [];

  if (has("[data-media-marquee], .media-marquee, .jestei-policy-marquee")) {
    tasks.push(safe("mediaMarquee", () => import("./visuals/dom/media-marquee.js")));
  }

  if (has("[data-showcase-auto-slider], .media-slider")) {
    tasks.push(safe("mediaSlider", () => import("./visuals/dom/media-slider.js")));
  }

  if (has("[data-policy-book], .policy-book")) {
    tasks.push(safe("policyBook", () => import("./visuals/dom/policy-book.js")));
  }

  if (has(".list-scroll-x, .jestei-action-rail__viewport")) {
    tasks.push(safe("listScroll", () => import("./visuals/dom/list-scroll.js")));
  }

  if (has("[data-random-gallery]")) {
    tasks.push(
      safe("randomGallery", async () => {
        const module = await import("./visuals/dom/random-gallery.js");
        return module.initRandomGalleries(document);
      }),
    );
  }

  if (has("[data-portfolio-toc]")) {
    tasks.push(
      safe("portfolioToc", async () => {
        const module = await import("./visuals/dom/showcase-toc.js");
        return module.initShowcaseToc(document);
      }),
    );
  }

  if (has("[data-jestei-action-rail]")) {
    tasks.push(
      safe("caseChapters", async () => {
        const module = await import("./visuals/dom/case-chapters.js");
        return module.initCaseChapters(document);
      }),
    );
  }

  if (has("[data-artifact-reader], [data-artifact-reader-open], .artifact-reader, .artifact-stage")) {
    tasks.push(
      safe("artifactReader", async () => {
        const module = await import("./visuals/dom/artifact-reader.js");
        return module.initArtifactReaders(document);
      }),
    );
  }

  if (has("[data-playlist-filter-embed], [data-playlist-filter], .playlist-filter-embed, .playlist-filter")) {
    tasks.push(
      safe("playlistFilter", async () => {
        const module = await import("./visuals/dom/playlist-filter-embed.js");
        return module.initPlaylistFilterEmbed(document);
      }),
    );
  }

  if (has("[data-proximity], [data-proximity-target], [data-proximity-root], .proximity-button, .proximity-card")) {
    tasks.push(safe("proximity", () => import("./components/proximity-components.js")));
  }

  await Promise.allSettled(tasks);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp, { once: true });
} else {
  void initApp();
}
`;

const caseChaptersJs = `function initActionRail(root) {
  const rails = root.querySelectorAll("[data-jestei-action-rail]");

  rails.forEach((rail) => {
    const viewport = rail.querySelector("[data-jestei-action-rail-viewport]");
    const prev = rail.querySelector("[data-jestei-action-rail-prev]");
    const next = rail.querySelector("[data-jestei-action-rail-next]");

    if (!(viewport instanceof HTMLElement)) return;

    const step = () => Math.max(240, Math.round(viewport.clientWidth * 0.8));
    const move = (direction) => viewport.scrollBy({ left: direction * step(), behavior: "smooth" });

    prev?.addEventListener("click", () => move(-1));
    next?.addEventListener("click", () => move(1));
  });
}

export function initCaseChapters(root = document) {
  initActionRail(root);
}
`;

const tocJs = `function setOpen(trigger, panel, value) {
  trigger.setAttribute("aria-expanded", String(value));
  panel.dataset.open = String(value);
}

export function initShowcaseToc(root = document) {
  const toc = root.querySelector("[data-portfolio-toc]");
  if (!(toc instanceof HTMLElement) || toc.dataset.ready === "true") return;
  toc.dataset.ready = "true";

  const trigger = toc.querySelector("[data-portfolio-toc-trigger]");
  const panel = toc.querySelector("[data-portfolio-toc-panel]");
  const links = [...toc.querySelectorAll("[data-portfolio-toc-link]")];

  if (trigger instanceof HTMLButtonElement && panel instanceof HTMLElement) {
    trigger.addEventListener("click", () => {
      setOpen(trigger, panel, panel.dataset.open !== "true");
    });

    links.forEach((link) => {
      link.addEventListener("click", () => setOpen(trigger, panel, false));
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") setOpen(trigger, panel, false);
    });
  }

  const targets = links
    .map((link) => {
      const id = link.getAttribute("href")?.slice(1);
      const target = id ? document.getElementById(decodeURIComponent(id)) || document.getElementById(id) : null;
      return target ? { link, target } : null;
    })
    .filter(Boolean);

  const activate = (link) => {
    links.forEach((item) => item.classList.toggle("is-active", item === link));
  };

  if ("IntersectionObserver" in window && targets.length) {
    const observer = new IntersectionObserver(
      (entries) => {
        const active = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (active) {
          const item = targets.find((candidate) => candidate.target === active.target);
          if (item) activate(item.link);
        }
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: [0.05, 0.2, 0.4] },
    );

    targets.forEach(({ target }) => observer.observe(target));
  }
}
`;

const indexCss = `@import "./modules/core.css";
@import "./modules/layout.css";
@import "./modules/typography.css";
@import "./modules/canvas.css";
@import "./modules/proximity.css";
@import "./modules/awfulface.css";
@import "./modules/hero-skill-marquee.css";
@import "./modules/site-header.css";
@import "./modules/hero.css";
@import "./modules/resume.css";
@import "./modules/footer.css";
@import "./modules/policy-book.css";
@import "./modules/artifact-reader.css";
@import "./modules/jestei-policy-marquee.css";
@import "./modules/jestei-token-colors.css";
@import "./modules/portfolio-system.css";
`;

const portfolioCss = `:root {
  --portfolio-anchor-offset: clamp(92px, 11vh, 148px);
  --portfolio-column: minmax(0, 80rem);
}

html {
  scroll-padding-top: var(--portfolio-anchor-offset);
}

:where(#showcase, #showcase section[id], #showcase article[id]) {
  scroll-margin-top: var(--portfolio-anchor-offset);
}

.section__screen--showcase {
  position: relative;
  align-items: start;
}

.showcase-stack,
.project,
.project-chapter,
.case-chapter-section,
.jestei-chapter-section,
.block,
.text-block,
.text-sections {
  min-width: 0;
}

.project {
  display: grid;
  gap: var(--project-gap);
}

.project__header,
.jestei-chapter-section,
.case-chapter-section {
  display: grid;
  gap: var(--gap-lg);
  border: 0;
  background: transparent;
}

.project__head {
  display: grid;
  grid-template-columns: minmax(8rem, 16rem) minmax(0, 1fr) auto;
  gap: var(--gap);
  align-items: end;
}

.project__logo {
  min-width: 0;
  margin: 0;
}

.project__logo :where(canvas, img) {
  width: 100%;
  aspect-ratio: 1;
}

.jestei-responsibilities-header,
.project-responsibilities {
  min-width: 0;
}

.project-responsibilities {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--gap);
}

.responsibility-card,
.jestei-action-card,
.text-section {
  min-width: 0;
  border: 0;
  background: transparent;
}

.responsibility-card {
  display: grid;
  gap: 0.8rem;
  align-content: start;
}

.responsibility-card__title,
.text-section__title {
  margin: 0;
  font-size: var(--md);
  line-height: 1.05;
}

.responsibility-card__list {
  display: grid;
  gap: 0.65rem;
}

.responsibility-card__item {
  display: grid;
  gap: 0.25rem;
}

.responsibility-card__item-title {
  font-weight: 700;
  line-height: 1.12;
}

.responsibility-card__item-text {
  color: var(--muted);
  font-size: var(--sm);
  line-height: 1.25;
}

.jestei-chapter-hero,
.case-chapter-hero {
  display: grid;
  gap: var(--gap);
  justify-items: center;
  min-width: 0;
  padding-block: var(--gap-lg);
  overflow: visible;
  border: 0;
  background: transparent;
}

.jestei-chapter-hero__title,
.case-chapter-hero__title {
  max-width: 100%;
  text-align: center;
}

.jestei-chapter-hero__subtitle,
.case-chapter-hero__subtitle {
  width: min(100%, 74rem);
  max-width: min(100%, 74rem);
  margin: 0 auto;
  color: var(--muted);
  font-size: clamp(1.35rem, 2.15vw, 2.15rem);
  line-height: 1.18;
}

.jestei-chapter-hero__media,
.case-chapter-hero__media {
  justify-self: stretch;
  width: 100%;
  max-width: 100%;
  margin: 0;
}

.project-chapter,
.block,
.text-block {
  display: grid;
  gap: var(--gap);
}

.block__header,
.section-head,
.text-block {
  width: min(100%, var(--heading));
  max-width: min(100%, var(--heading));
}

.block__header > p,
.section-head > p,
.text-block > p,
.text-section > p {
  max-width: var(--text);
}

.text-sections {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 22rem), 1fr));
  gap: var(--gap);
}

.text-section {
  display: grid;
  gap: 0.7rem;
  align-content: start;
}

.text-section > p {
  margin: 0;
}

.media-system,
.media-row,
.media-two,
.media-three,
.media-quad,
.media-six,
.media-eight,
.media-banner,
.media-figure,
.media-slider,
.media-marquee,
.random-gallery {
  display: grid;
  gap: var(--gap);
  width: 100%;
  max-width: 100%;
  min-width: 0;
  margin: 0;
  padding: 0;
}

.media-row {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: start;
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

.media-banner,
.media-figure,
.media-system--banner {
  grid-template-columns: 1fr;
}

.media-item {
  display: block;
  min-width: 0;
  overflow: hidden;
  border: var(--line);
  border-radius: var(--r);
  background: var(--black);
  color: var(--white);
  aspect-ratio: 1;
  text-decoration: none;
}

.no-stroke,
.no-stroke .media-item,
.media-item.no-stroke {
  border: 0;
}

.bg-white,
.media-contain {
  background: var(--white);
  color: var(--black);
}

.media-item :where(img, video, canvas),
.media-item > :where(img, video, canvas) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.media-contain :where(img, video, canvas),
.media-item.media-contain > :where(img, video, canvas) {
  object-fit: contain;
}

.media-landscape > .media-item,
.media-banner > .media-item,
.media-system--banner > .media-item,
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
  display: block;
  overflow: hidden;
  touch-action: pan-y;
}

.media-slider__track {
  display: flex;
  gap: var(--media-slider-gap);
  width: max-content;
  max-width: none;
  will-change: transform;
}

.media-slider > .media-item,
.media-slider__track > .media-item {
  flex: 0 0 var(--media-slider-card-basis);
  width: var(--media-slider-card-basis);
}

.media-slider.media-square {
  --media-slider-card-basis: calc((100% - (var(--media-slider-gap) * 2)) / 3);
}

.media-slider__arrow,
.media-slider__dot {
  appearance: none;
  border: var(--line);
  background: var(--white);
  color: var(--black);
  cursor: pointer;
}

.media-slider__arrow {
  position: absolute;
  z-index: 2;
  top: 50%;
  display: grid;
  width: clamp(1.75rem, 3vw, 2.25rem);
  aspect-ratio: 1;
  place-items: center;
  padding: 0;
  border-radius: 999px;
  transform: translateY(-50%);
}

.media-slider__arrow--prev {
  left: var(--gap);
}

.media-slider__arrow--next {
  right: var(--gap);
}

.media-slider__dots {
  position: absolute;
  right: var(--gap);
  bottom: var(--gap);
  left: var(--gap);
  display: flex;
  gap: 0.35rem;
  width: max-content;
  max-width: calc(100% - (var(--gap) * 2));
  margin: auto;
  padding: 0.35rem 0.5rem;
  overflow: auto;
  border: var(--line);
  border-radius: 999px;
  background: var(--white);
  scrollbar-width: none;
}

.media-slider__dots::-webkit-scrollbar {
  display: none;
}

.media-slider__dot {
  width: 0.5rem;
  aspect-ratio: 1;
  padding: 0;
  border-radius: 999px;
  opacity: 0.45;
}

.media-slider__dot.is-active {
  width: 1rem;
  background: var(--black);
  opacity: 1;
}

.media-marquee {
  display: block;
  overflow: hidden;
}

.media-marquee__track {
  display: flex;
  gap: var(--gap);
  width: max-content;
  max-width: none;
  will-change: transform;
}

.media-marquee .media-item {
  flex: 0 0 clamp(16rem, 30vw, 34rem);
}

.jestei-action-rail {
  width: 100%;
  max-width: 100%;
  min-width: 0;
}

.jestei-action-rail__viewport {
  overflow-x: auto;
  overscroll-behavior-inline: contain;
  scroll-snap-type: x proximity;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
}

.jestei-action-rail__viewport::-webkit-scrollbar {
  display: none;
}

.jestei-action-rail__track {
  display: flex;
  gap: var(--gap);
  width: max-content;
  max-width: none;
}

.jestei-action-card {
  display: grid;
  flex: 0 0 clamp(16rem, 26vw, 24rem);
  gap: 0.5rem;
  scroll-snap-align: start;
}

.jestei-action-rail__controls {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-block-start: 0.75rem;
}

.portfolio-toc {
  display: contents;
}

.portfolio-toc__trigger {
  position: fixed;
  z-index: 80;
  right: clamp(1rem, 4vw, 1.5rem);
  bottom: clamp(1rem, 4vw, 1.5rem);
  display: none;
  min-height: 2.75rem;
  padding: 0 1rem;
  border: var(--line);
  border-radius: 999px;
  background: var(--white);
  color: var(--black);
  font: inherit;
  cursor: pointer;
}

.portfolio-toc__panel {
  display: grid;
  gap: 0.32rem;
  min-width: 0;
}

.portfolio-toc__link {
  display: block;
  padding-block: 0.34rem;
  color: currentColor;
  font-size: 0.82rem;
  line-height: 1.18;
  text-decoration: none;
  opacity: 0.58;
}

.portfolio-toc__link--project {
  margin-block-start: 0.65rem;
  font-weight: 700;
  opacity: 1;
}

.portfolio-toc__link.is-active {
  opacity: 1;
  text-decoration: underline;
  text-underline-offset: 0.22em;
}

.random-gallery__grid,
[data-random-gallery-grid] {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 10rem), 1fr));
  gap: var(--gap);
}

.has-lightbox {
  overflow: hidden;
}

.lightbox {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: grid;
  place-items: center;
  padding: clamp(0.75rem, 3vw, 2rem);
  background: rgba(255, 255, 255, 0.92);
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--motion-fast) var(--ease-standard);
}

.lightbox.is-open {
  opacity: 1;
  pointer-events: auto;
}

.lightbox__dialog {
  display: grid;
  gap: 0.7rem;
  width: min(100%, 88rem);
  max-height: calc(100vh - clamp(1.5rem, 6vw, 4rem));
}

.lightbox__toolbar {
  display: flex;
  justify-content: flex-end;
}

.lightbox__body {
  display: grid;
  place-items: center;
  min-height: 0;
}

.lightbox__body img,
.lightbox__body video {
  max-width: 100%;
  max-height: calc(100vh - clamp(5rem, 12vw, 8rem));
  border-radius: var(--r);
  object-fit: contain;
}

@media (min-width: 88rem) {
  .section__screen--showcase {
    display: grid;
    grid-template-columns: clamp(10rem, 13vw, 15rem) var(--portfolio-column) minmax(clamp(2rem, 8vw, 9rem), 1fr);
    column-gap: clamp(2rem, 3.8vw, 4.5rem);
  }

  .section__screen--showcase > .portfolio-toc {
    display: block;
    position: sticky;
    top: var(--portfolio-anchor-offset);
    grid-column: 1;
    max-height: calc(100vh - var(--portfolio-anchor-offset) - 2rem);
    overflow: auto;
  }

  .section__screen--showcase > .showcase-stack {
    grid-column: 2;
  }
}

@media (max-width: 87.999rem) {
  .portfolio-toc {
    display: block;
  }

  .portfolio-toc__trigger {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .portfolio-toc__panel {
    position: fixed;
    z-index: 79;
    right: clamp(1rem, 4vw, 1.5rem);
    bottom: calc(clamp(1rem, 4vw, 1.5rem) + 3.25rem);
    width: min(22rem, calc(100vw - 2rem));
    max-height: min(60vh, 32rem);
    padding: 1rem;
    overflow: auto;
    border: var(--line);
    border-radius: var(--r);
    background: var(--white);
    color: var(--black);
    box-shadow: 0 1.5rem 4rem rgba(0, 0, 0, 0.14);
    opacity: 0;
    pointer-events: none;
    transform: translateY(0.5rem);
  }

  .portfolio-toc__panel[data-open="true"] {
    opacity: 1;
    pointer-events: auto;
    transform: translateY(0);
  }
}

@media (max-width: 48rem) {
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

  .text-sections,
  .media-row,
  .media-two,
  .media-three,
  .media-quad,
  .media-six,
  .media-eight,
  .media-system--tiles {
    grid-template-columns: 1fr;
  }

  .media-six.media-square,
  .media-eight.media-square {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .media-slider,
  .media-slider__track {
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    -webkit-overflow-scrolling: touch;
  }

  .media-slider {
    display: block;
  }

  .media-slider__track {
    transform: none !important;
    width: auto;
  }

  .media-slider > .media-item,
  .media-slider__track > .media-item {
    flex-basis: min(86vw, 34rem);
    width: min(86vw, 34rem);
    scroll-snap-align: start;
  }

  .media-slider__arrow,
  .media-slider__dots {
    display: none;
  }

  .media-marquee {
    overflow-x: auto;
    overscroll-behavior-inline: contain;
    scroll-snap-type: x proximity;
    -webkit-overflow-scrolling: touch;
  }

  .media-marquee__track {
    transform: none !important;
  }

  .media-marquee .media-item {
    flex-basis: min(82vw, 28rem);
    scroll-snap-align: start;
  }
}
`;

function maybeRemoveReadme() {
  const readme = file("README.md");
  if (!fs.existsSync(readme)) return;
  const content = readText(readme);
  if (/portfolio clean|stage 04|clean architecture/i.test(content)) {
    backup(readme);
    fs.rmSync(readme, { force: true });
  }
}

function cleanIndexHtml() {
  const original = readText(htmlPath);
  const beforeCounts = countHtmlAssets(original);
  const parts = splitShowcase(original);
  const showcase = cleanShowcase(parts.showcase);
  const next = parts.before + showcase + parts.after;
  const afterCounts = countHtmlAssets(next);

  assertSameCounts(beforeCounts, afterCounts);
  writeText(htmlPath, next);
}

function writeCleanFiles() {
  writeText(mainPath, mainJs);
  writeText(caseChaptersPath, caseChaptersJs);
  writeText(tocJsPath, tocJs);
  writeText(indexCssPath, indexCss);
  writeText(portfolioCssPath, portfolioCss);
}

function removeOldFiles() {
  removeFiles.forEach((target) => {
    if (!fs.existsSync(target)) return;
    backup(target);
    fs.rmSync(target, { force: true });
  });

  removeDirs.forEach((target) => {
    if (!fs.existsSync(target)) return;
    backupTree(target);
    fs.rmSync(target, { recursive: true, force: true });
  });
}

function main() {
  if (!fs.existsSync(htmlPath)) {
    throw new Error("Run this from the project root: index.html not found");
  }

  fs.mkdirSync(backupRoot, { recursive: true });
  touchedFiles.forEach(backup);

  cleanIndexHtml();
  writeCleanFiles();
  removeOldFiles();
  maybeRemoveReadme();

  console.log("portfolio hard reset complete");
  console.log("backup:", backupRoot);
}

main();
