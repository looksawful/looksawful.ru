import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";

const SOURCE_URL = process.env.BASELINE_URL || "https://www.looksawful.ru/";
const OUT_DIR = process.env.BASELINE_OUT || "prod-baseline-artifact";
const SHOTS_DIR = path.join(OUT_DIR, "screenshots");

const VIEWPORTS = [
  { name: "desktop-1920x1080", width: 1920, height: 1080 },
  { name: "desktop-1440x900", width: 1440, height: 900 },
  { name: "tablet-768x1024", width: 768, height: 1024 },
  { name: "mobile-390x844", width: 390, height: 844 },
];

await fs.rm(OUT_DIR, { recursive: true, force: true });
await fs.mkdir(SHOTS_DIR, { recursive: true });

const browser = await chromium.launch({ headless: true });
const report = {
  sourceUrl: SOURCE_URL,
  capturedAt: new Date().toISOString(),
  viewports: {},
};

const slugify = (value) =>
  String(value || "section")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9а-яё]+/giu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "section";

async function settlePage(page) {
  await page.goto(SOURCE_URL, { waitUntil: "domcontentloaded", timeout: 120000 });
  await page.waitForTimeout(1800);
  try {
    await page.waitForLoadState("networkidle", { timeout: 20000 });
  } catch {}

  await page.evaluate(async () => {
    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const viewport = Math.max(window.innerHeight, 600);
    let lastHeight = 0;

    for (let pass = 0; pass < 3; pass += 1) {
      const height = document.documentElement.scrollHeight;
      for (let top = 0; top < height; top += Math.round(viewport * 0.72)) {
        window.scrollTo({ top, behavior: "instant" });
        await sleep(110);
      }
      await sleep(450);
      if (height === lastHeight) break;
      lastHeight = height;
    }

    window.scrollTo({ top: 0, behavior: "instant" });
    await sleep(1200);
  });
}

async function captureViewport(viewport) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    locale: "ru-RU",
    colorScheme: "light",
    reducedMotion: "no-preference",
    deviceScaleFactor: 1,
  });

  const page = await context.newPage();
  const consoleMessages = [];
  const pageErrors = [];
  const failedRequests = [];

  page.on("console", (message) => {
    consoleMessages.push({ type: message.type(), text: message.text() });
  });
  page.on("pageerror", (error) => pageErrors.push(String(error)));
  page.on("requestfailed", (request) => {
    failedRequests.push({
      url: request.url(),
      resourceType: request.resourceType(),
      error: request.failure()?.errorText || "unknown",
    });
  });

  await settlePage(page);

  await page.screenshot({
    path: path.join(SHOTS_DIR, `${viewport.name}--full.png`),
    fullPage: true,
    animations: "disabled",
  });

  const data = await page.evaluate(() => {
    const clean = (value) => String(value || "").replace(/\s+/gu, " ").trim();
    const isVisible = (element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return (
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        Number(style.opacity) > 0 &&
        rect.width > 0 &&
        rect.height > 0
      );
    };
    const rectOf = (element) => {
      const rect = element.getBoundingClientRect();
      return {
        x: Math.round(rect.x),
        y: Math.round(rect.y + window.scrollY),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        right: Math.round(rect.right),
        bottom: Math.round(rect.bottom + window.scrollY),
      };
    };
    const selectedStyle = (element) => {
      const style = getComputedStyle(element);
      const properties = [
        "display",
        "position",
        "box-sizing",
        "width",
        "height",
        "min-width",
        "max-width",
        "min-height",
        "max-height",
        "margin-top",
        "margin-right",
        "margin-bottom",
        "margin-left",
        "padding-top",
        "padding-right",
        "padding-bottom",
        "padding-left",
        "gap",
        "row-gap",
        "column-gap",
        "grid-template-columns",
        "grid-template-rows",
        "flex-direction",
        "flex-wrap",
        "align-items",
        "justify-content",
        "overflow",
        "overflow-x",
        "overflow-y",
        "border-top-width",
        "border-right-width",
        "border-bottom-width",
        "border-left-width",
        "border-top-color",
        "border-right-color",
        "border-bottom-color",
        "border-left-color",
        "border-radius",
        "background-color",
        "background-image",
        "color",
        "font-family",
        "font-size",
        "font-weight",
        "line-height",
        "letter-spacing",
        "text-align",
        "text-transform",
        "white-space",
        "object-fit",
        "object-position",
        "opacity",
        "visibility",
        "z-index",
        "transform",
      ];
      return Object.fromEntries(properties.map((property) => [property, style.getPropertyValue(property)]));
    };
    const elementDescriptor = (element) => ({
      tag: element.tagName.toLowerCase(),
      id: element.id || null,
      className: typeof element.className === "string" ? element.className : null,
      role: element.getAttribute("role"),
      ariaLabel: element.getAttribute("aria-label"),
      hidden: element.hidden,
      visible: isVisible(element),
      rect: rectOf(element),
      style: selectedStyle(element),
    });

    const allSectionCandidates = [
      ...document.querySelectorAll(
        "body > main > section, body > section, main > section, section[id], [data-section-root]",
      ),
    ].filter((element, index, array) => array.indexOf(element) === index);

    const sections = allSectionCandidates.map((section, index) => ({
      index,
      ...elementDescriptor(section),
      directChildren: [...section.children].map((child) => ({
        ...elementDescriptor(child),
        text: clean(child.innerText).slice(0, 500),
      })),
      headings: [...section.querySelectorAll("h1,h2,h3,h4,h5,h6")]
        .filter(isVisible)
        .map((heading) => ({
          ...elementDescriptor(heading),
          level: heading.tagName.toLowerCase(),
          text: clean(heading.innerText),
        })),
      paragraphs: [...section.querySelectorAll("p")]
        .filter(isVisible)
        .map((paragraph) => ({
          ...elementDescriptor(paragraph),
          text: clean(paragraph.innerText),
        })),
      listItems: [...section.querySelectorAll("li")]
        .filter(isVisible)
        .map((item) => ({
          ...elementDescriptor(item),
          text: clean(item.innerText),
        })),
      links: [...section.querySelectorAll("a[href]")]
        .filter(isVisible)
        .map((link) => ({
          ...elementDescriptor(link),
          text: clean(link.innerText),
          href: link.href,
          target: link.target || null,
        })),
      images: [...section.querySelectorAll("img")]
        .filter(isVisible)
        .map((image) => ({
          ...elementDescriptor(image),
          src: image.currentSrc || image.src,
          alt: image.alt,
          loading: image.loading || null,
          naturalWidth: image.naturalWidth,
          naturalHeight: image.naturalHeight,
          complete: image.complete,
        })),
      videos: [...section.querySelectorAll("video")]
        .filter(isVisible)
        .map((video) => ({
          ...elementDescriptor(video),
          currentSrc: video.currentSrc,
          poster: video.poster,
          autoplay: video.autoplay,
          loop: video.loop,
          muted: video.muted,
          controls: video.controls,
          paused: video.paused,
          readyState: video.readyState,
          duration: Number.isFinite(video.duration) ? video.duration : null,
        })),
      canvases: [...section.querySelectorAll("canvas")]
        .filter(isVisible)
        .map((canvas) => ({
          ...elementDescriptor(canvas),
          backingWidth: canvas.width,
          backingHeight: canvas.height,
          dataset: { ...canvas.dataset },
        })),
      svgs: [...section.querySelectorAll("svg")]
        .filter(isVisible)
        .map((svg) => ({
          ...elementDescriptor(svg),
          viewBox: svg.getAttribute("viewBox"),
        })),
      text: clean(section.innerText),
      htmlLength: section.outerHTML.length,
    }));

    const visibleHeadings = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")]
      .filter(isVisible)
      .map((heading) => ({
        ...elementDescriptor(heading),
        level: heading.tagName.toLowerCase(),
        text: clean(heading.innerText),
      }));

    const visibleButtons = [...document.querySelectorAll("button")]
      .filter(isVisible)
      .map((button) => ({
        ...elementDescriptor(button),
        text: clean(button.innerText),
        type: button.type,
        disabled: button.disabled,
      }));

    const navs = [...document.querySelectorAll("nav")]
      .filter(isVisible)
      .map((nav) => ({
        ...elementDescriptor(nav),
        text: clean(nav.innerText),
        links: [...nav.querySelectorAll("a[href]")]
          .filter(isVisible)
          .map((link) => ({ text: clean(link.innerText), href: link.href })),
      }));

    const header = document.querySelector("body > header, header");
    const footer = document.querySelector("body > footer, footer");

    const allImages = [...document.images].map((image) => ({
      src: image.currentSrc || image.src,
      alt: image.alt,
      visible: isVisible(image),
      complete: image.complete,
      naturalWidth: image.naturalWidth,
      naturalHeight: image.naturalHeight,
      rect: rectOf(image),
    }));

    const resources = performance.getEntriesByType("resource").map((entry) => ({
      name: entry.name,
      initiatorType: entry.initiatorType,
      transferSize: entry.transferSize,
      encodedBodySize: entry.encodedBodySize,
      decodedBodySize: entry.decodedBodySize,
      duration: Math.round(entry.duration),
    }));

    return {
      title: document.title,
      url: location.href,
      lang: document.documentElement.lang,
      bodyClass: document.body.className,
      htmlClass: document.documentElement.className,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio,
      },
      documentSize: {
        width: document.documentElement.scrollWidth,
        height: document.documentElement.scrollHeight,
      },
      rootStyle: selectedStyle(document.documentElement),
      bodyStyle: selectedStyle(document.body),
      header: header
        ? { ...elementDescriptor(header), text: clean(header.innerText), html: header.outerHTML }
        : null,
      footer: footer
        ? { ...elementDescriptor(footer), text: clean(footer.innerText), html: footer.outerHTML }
        : null,
      navs,
      visibleHeadings,
      visibleButtons,
      sections,
      allImages,
      dialogs: [...document.querySelectorAll("dialog")].map((dialog) => ({
        ...elementDescriptor(dialog),
        open: dialog.open,
        text: clean(dialog.innerText),
      })),
      stylesheets: [...document.styleSheets].map((sheet) => sheet.href || "inline"),
      scripts: [...document.scripts].map((script) => ({
        src: script.src || null,
        type: script.type || null,
        async: script.async,
        defer: script.defer,
      })),
      resources,
      bodyHtml: document.body.outerHTML,
    };
  });

  if (viewport.name === "desktop-1440x900") {
    await fs.writeFile(path.join(OUT_DIR, "post-init-body.html"), data.bodyHtml, "utf8");
  }
  delete data.bodyHtml;

  const shouldCaptureSections = ["desktop-1440x900", "mobile-390x844"].includes(viewport.name);
  data.sectionScreenshots = [];

  if (shouldCaptureSections) {
    const sections = page.locator(
      "body > main > section, body > section, main > section, section[id], [data-section-root]",
    );
    const count = await sections.count();
    const usedNames = new Map();

    for (let index = 0; index < count; index += 1) {
      const section = sections.nth(index);
      try {
        if (!(await section.isVisible())) continue;
        const metadata = await section.evaluate((element) => ({
          id: element.id || "",
          className: typeof element.className === "string" ? element.className : "",
          heading: element.querySelector("h1,h2,h3")?.textContent?.trim() || "",
        }));
        let name = slugify(metadata.id || metadata.heading || metadata.className || `section-${index + 1}`);
        const occurrence = (usedNames.get(name) || 0) + 1;
        usedNames.set(name, occurrence);
        if (occurrence > 1) name = `${name}-${occurrence}`;
        const fileName = `${viewport.name}--${String(index + 1).padStart(2, "0")}--${name}.png`;
        await section.screenshot({
          path: path.join(SHOTS_DIR, fileName),
          animations: "disabled",
          timeout: 45000,
        });
        data.sectionScreenshots.push({
          index,
          id: metadata.id || null,
          heading: metadata.heading || null,
          file: `screenshots/${fileName}`,
        });
      } catch (error) {
        data.sectionScreenshots.push({ index, error: String(error) });
      }
    }
  }

  data.consoleMessages = consoleMessages;
  data.pageErrors = pageErrors;
  data.failedRequests = failedRequests;

  await fs.writeFile(
    path.join(OUT_DIR, `audit-${viewport.name}.json`),
    JSON.stringify(data, null, 2),
    "utf8",
  );

  await context.close();
  return data;
}

for (const viewport of VIEWPORTS) {
  report.viewports[viewport.name] = await captureViewport(viewport);
}

await browser.close();
await fs.writeFile(path.join(OUT_DIR, "audit-all.json"), JSON.stringify(report, null, 2), "utf8");

const summary = {
  sourceUrl: SOURCE_URL,
  capturedAt: report.capturedAt,
  viewports: Object.fromEntries(
    Object.entries(report.viewports).map(([name, data]) => [
      name,
      {
        documentSize: data.documentSize,
        visibleSections: data.sections.filter((section) => section.visible).length,
        headings: data.visibleHeadings.length,
        images: data.allImages.length,
        consoleErrors: data.consoleMessages.filter((message) => message.type === "error").length,
        pageErrors: data.pageErrors.length,
        failedRequests: data.failedRequests.length,
      },
    ]),
  ),
};

await fs.writeFile(path.join(OUT_DIR, "summary.json"), JSON.stringify(summary, null, 2), "utf8");
console.log(JSON.stringify(summary, null, 2));
