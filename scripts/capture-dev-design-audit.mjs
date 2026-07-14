import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";

const SOURCE_URL = process.env.AUDIT_URL || "http://127.0.0.1:4173/";
const OUT_DIR = process.env.AUDIT_OUT || "dev-design-audit";
const CAPTURE_SHA = process.env.CAPTURE_SHA || "unknown";
const SHOTS_DIR = path.join(OUT_DIR, "screenshots");
const SECTION_SHOTS_DIR = path.join(SHOTS_DIR, "sections");
const STATE_SHOTS_DIR = path.join(SHOTS_DIR, "states");

const VIEWPORTS = [
  { name: "desktop-1920x1080", width: 1920, height: 1080 },
  { name: "desktop-1600x1000", width: 1600, height: 1000 },
  { name: "desktop-1440x900", width: 1440, height: 900 },
  { name: "desktop-1280x800", width: 1280, height: 800 },
  { name: "laptop-1024x768", width: 1024, height: 768 },
  { name: "tablet-768x1024", width: 768, height: 1024 },
  { name: "mobile-430x932", width: 430, height: 932 },
  { name: "mobile-390x844", width: 390, height: 844 },
  { name: "mobile-375x812", width: 375, height: 812 },
  { name: "mobile-360x800", width: 360, height: 800 },
];

const SECTION_CAPTURE_VIEWPORTS = new Set([
  "desktop-1920x1080",
  "desktop-1440x900",
  "laptop-1024x768",
  "tablet-768x1024",
  "mobile-430x932",
  "mobile-390x844",
  "mobile-360x800",
]);

await fs.rm(OUT_DIR, { recursive: true, force: true });
await fs.mkdir(SECTION_SHOTS_DIR, { recursive: true });
await fs.mkdir(STATE_SHOTS_DIR, { recursive: true });

const browser = await chromium.launch({ headless: true });
const report = {
  sourceUrl: SOURCE_URL,
  captureSha: CAPTURE_SHA,
  capturedAt: new Date().toISOString(),
  viewports: {},
};

const slugify = (value) =>
  String(value || "section")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9а-яё]+/giu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90) || "section";

async function settlePage(page) {
  await page.goto(SOURCE_URL, { waitUntil: "domcontentloaded", timeout: 120000 });
  await page.waitForTimeout(1800);
  try {
    await page.waitForLoadState("networkidle", { timeout: 25000 });
  } catch {}
  await page.evaluate(async () => {
    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    try { await document.fonts?.ready; } catch {}
    const step = Math.max(420, Math.round(window.innerHeight * 0.68));
    let previousHeight = 0;
    for (let pass = 0; pass < 4; pass += 1) {
      const height = document.documentElement.scrollHeight;
      for (let top = 0; top < height; top += step) {
        window.scrollTo({ top, behavior: "instant" });
        await sleep(100);
      }
      await sleep(450);
      if (height === previousHeight) break;
      previousHeight = height;
    }
    window.scrollTo({ top: 0, behavior: "instant" });
    await sleep(1200);
  });
}

async function captureInteractionStates(page, viewportName) {
  const ids = await page.evaluate(() => {
    const visible = (element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== "none" && style.visibility !== "hidden" && Number(style.opacity) > 0 && rect.width > 1 && rect.height > 1;
    };
    const candidates = [...document.querySelectorAll(
      "button, a[href], input, select, textarea, summary, [role='button'], [tabindex]:not([tabindex='-1'])",
    )].filter(visible).slice(0, 220);
    return candidates.map((element, index) => {
      const id = `audit-interaction-${index + 1}`;
      element.setAttribute("data-design-audit-id", id);
      return id;
    });
  });

  const properties = [
    "color", "background-color", "background-image", "border-top-color", "border-right-color",
    "border-bottom-color", "border-left-color", "border-top-width", "border-right-width",
    "border-bottom-width", "border-left-width", "border-radius", "outline-color", "outline-width",
    "outline-offset", "box-shadow", "opacity", "transform", "filter", "text-decoration-line",
    "text-decoration-color", "cursor", "font-size", "font-weight", "letter-spacing",
  ];

  const snapshot = async (locator) => locator.evaluate((element, props) => {
    const style = getComputedStyle(element);
    return Object.fromEntries(props.map((property) => [property, style.getPropertyValue(property)]));
  }, properties);

  const interactions = [];
  for (const id of ids) {
    const locator = page.locator(`[data-design-audit-id="${id}"]`);
    try {
      if (!(await locator.isVisible())) continue;
      const metadata = await locator.evaluate((element) => ({
        id: element.id || null,
        tag: element.tagName.toLowerCase(),
        className: typeof element.className === "string" ? element.className : null,
        text: String(element.innerText || element.getAttribute("aria-label") || "").replace(/\s+/gu, " ").trim().slice(0, 220),
        href: element instanceof HTMLAnchorElement ? element.href : null,
        type: element.getAttribute("type"),
        role: element.getAttribute("role"),
        ariaLabel: element.getAttribute("aria-label"),
        ariaExpanded: element.getAttribute("aria-expanded"),
        ariaPressed: element.getAttribute("aria-pressed"),
        disabled: "disabled" in element ? Boolean(element.disabled) : false,
      }));
      const base = await snapshot(locator);
      let hover = null;
      let focus = null;
      let active = null;
      try {
        await locator.hover({ timeout: 3000 });
        hover = await snapshot(locator);
      } catch {}
      try {
        await locator.focus({ timeout: 3000 });
        focus = await snapshot(locator);
      } catch {}
      try {
        const box = await locator.boundingBox();
        if (box) {
          await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
          await page.mouse.down();
          active = await snapshot(locator);
          await page.mouse.up();
        }
      } catch {
        try { await page.mouse.up(); } catch {}
      }
      try { await locator.evaluate((element) => element.blur?.()); } catch {}
      await page.mouse.move(0, 0);
      interactions.push({ auditId: id, ...metadata, states: { base, hover, focus, active } });
    } catch (error) {
      interactions.push({ auditId: id, error: String(error) });
    }
  }

  if (viewportName === "mobile-390x844") {
    const expandable = page.locator("button[aria-controls][aria-expanded='false']").first();
    try {
      if (await expandable.isVisible()) {
        await expandable.click();
        await page.waitForTimeout(250);
        await page.screenshot({
          path: path.join(STATE_SHOTS_DIR, `${viewportName}--expanded-control.png`),
          fullPage: false,
          animations: "disabled",
        });
        await expandable.click();
      }
    } catch {}
  }

  return interactions;
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
  page.on("console", (message) => consoleMessages.push({ type: message.type(), text: message.text() }));
  page.on("pageerror", (error) => pageErrors.push(String(error)));
  page.on("requestfailed", (request) => failedRequests.push({
    url: request.url(),
    resourceType: request.resourceType(),
    error: request.failure()?.errorText || "unknown",
  }));

  await settlePage(page);
  await page.screenshot({
    path: path.join(SHOTS_DIR, `${viewport.name}--full.png`),
    fullPage: true,
    animations: "disabled",
  });

  const data = await page.evaluate(() => {
    const clean = (value) => String(value || "").replace(/\s+/gu, " ").trim();
    const visible = (element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== "none" && style.visibility !== "hidden" && Number(style.opacity) > 0 && rect.width > 0.5 && rect.height > 0.5;
    };
    const rectOf = (element) => {
      const rect = element.getBoundingClientRect();
      return {
        x: Number(rect.x.toFixed(2)),
        y: Number((rect.y + window.scrollY).toFixed(2)),
        viewportY: Number(rect.y.toFixed(2)),
        width: Number(rect.width.toFixed(2)),
        height: Number(rect.height.toFixed(2)),
        right: Number(rect.right.toFixed(2)),
        bottom: Number((rect.bottom + window.scrollY).toFixed(2)),
      };
    };
    const depthOf = (element) => {
      let depth = 0;
      let current = element;
      while (current && current !== document.body) {
        depth += 1;
        current = current.parentElement;
      }
      return depth;
    };
    const pathOf = (element) => {
      const parts = [];
      let current = element;
      while (current && current !== document.body && parts.length < 8) {
        let part = current.tagName.toLowerCase();
        if (current.id) part += `#${current.id}`;
        else if (typeof current.className === "string" && current.className.trim()) {
          part += `.${current.className.trim().split(/\s+/u).slice(0, 2).join(".")}`;
        }
        parts.unshift(part);
        current = current.parentElement;
      }
      return `body > ${parts.join(" > ")}`;
    };
    const STYLE_PROPERTIES = [
      "display", "position", "box-sizing", "width", "height", "min-width", "max-width",
      "min-height", "max-height", "inset", "top", "right", "bottom", "left",
      "margin-top", "margin-right", "margin-bottom", "margin-left", "padding-top",
      "padding-right", "padding-bottom", "padding-left", "gap", "row-gap", "column-gap",
      "grid-template-columns", "grid-template-rows", "grid-auto-flow", "flex-direction",
      "flex-wrap", "align-items", "align-content", "justify-content", "justify-items",
      "overflow", "overflow-x", "overflow-y", "scroll-snap-type", "scroll-snap-align",
      "border-top-width", "border-right-width", "border-bottom-width", "border-left-width",
      "border-top-style", "border-right-style", "border-bottom-style", "border-left-style",
      "border-top-color", "border-right-color", "border-bottom-color", "border-left-color",
      "border-top-left-radius", "border-top-right-radius", "border-bottom-right-radius",
      "border-bottom-left-radius", "outline-width", "outline-style", "outline-color",
      "outline-offset", "box-shadow", "background-color", "background-image", "color",
      "font-family", "font-size", "font-weight", "font-style", "line-height", "letter-spacing",
      "text-align", "text-transform", "text-decoration-line", "text-decoration-color",
      "text-wrap", "white-space", "word-break", "overflow-wrap", "object-fit", "object-position",
      "aspect-ratio", "opacity", "visibility", "z-index", "transform", "transform-origin",
      "filter", "backdrop-filter", "mix-blend-mode", "transition-property", "transition-duration",
      "animation-name", "animation-duration", "cursor", "pointer-events",
    ];
    const styleOf = (element, pseudo = null) => {
      const style = getComputedStyle(element, pseudo);
      return Object.fromEntries(STYLE_PROPERTIES.map((property) => [property, style.getPropertyValue(property)]));
    };
    const descriptor = (element) => ({
      tag: element.tagName.toLowerCase(),
      id: element.id || null,
      className: typeof element.className === "string" ? element.className : null,
      role: element.getAttribute("role"),
      ariaLabel: element.getAttribute("aria-label"),
      data: Object.fromEntries([...element.attributes].filter((attribute) => attribute.name.startsWith("data-")).map((attribute) => [attribute.name, attribute.value])),
      hidden: element.hidden,
      visible: visible(element),
      depth: depthOf(element),
      domPath: pathOf(element),
      rect: rectOf(element),
      style: styleOf(element),
      before: styleOf(element, "::before"),
      after: styleOf(element, "::after"),
    });
    const allElements = [...document.body.querySelectorAll("*")].filter(visible);
    const textSelector = "h1,h2,h3,h4,h5,h6,p,li,dt,dd,figcaption,label,button,a,summary,blockquote,pre,code,small,address";
    const texts = [...document.querySelectorAll(textSelector)].filter(visible).map((element) => ({
      ...descriptor(element),
      text: clean(element.innerText || element.textContent),
      headingLevel: /^H[1-6]$/u.test(element.tagName) ? Number(element.tagName.slice(1)) : null,
      parentTag: element.parentElement?.tagName.toLowerCase() || null,
      parentClass: typeof element.parentElement?.className === "string" ? element.parentElement.className : null,
    })).filter((entry) => entry.text);
    const sectionSelector = "body > main > section, main > section, section[id], [data-section-root]";
    const sections = [...document.querySelectorAll(sectionSelector)].filter((element, index, array) => array.indexOf(element) === index).map((section, index) => ({
      index,
      ...descriptor(section),
      text: clean(section.innerText),
      headings: [...section.querySelectorAll("h1,h2,h3,h4,h5,h6")].filter(visible).map((heading) => ({ level: Number(heading.tagName.slice(1)), text: clean(heading.innerText), rect: rectOf(heading), style: styleOf(heading) })),
      paragraphs: [...section.querySelectorAll("p")].filter(visible).map((paragraph) => ({ text: clean(paragraph.innerText), rect: rectOf(paragraph), style: styleOf(paragraph) })),
      directChildren: [...section.children].filter(visible).map((child) => ({ ...descriptor(child), text: clean(child.innerText).slice(0, 400) })),
    }));
    const organismSelector = [
      "article", "nav", "header", "footer", "dialog", "form", "figure",
      "[data-component]", "[data-section-component]", "[data-animation]", "[data-visual-demo]",
      "[class*='bento']", "[class*='slider']", "[class*='gallery']", "[class*='carousel']",
      "[class*='marquee']", "[class*='card']", "[class*='controls']", "[class*='toolbar']",
      "[class*='media']", "[class*='container']", "[class*='grid']", "[class*='rail']",
    ].join(",");
    const organisms = [...document.querySelectorAll(organismSelector)].filter(visible).map((element) => ({
      ...descriptor(element),
      text: clean(element.innerText).slice(0, 500),
      childCount: element.children.length,
      interactiveCount: element.querySelectorAll("button,a[href],input,select,textarea,[role='button']").length,
      mediaCount: element.querySelectorAll("img,video,canvas,svg,iframe,picture").length,
    }));
    const media = [...document.querySelectorAll("img,picture,video,canvas,svg,iframe")].filter(visible).map((element) => ({
      ...descriptor(element),
      src: element.currentSrc || element.src || null,
      alt: element.alt ?? null,
      naturalWidth: element.naturalWidth ?? null,
      naturalHeight: element.naturalHeight ?? null,
      backingWidth: element instanceof HTMLCanvasElement ? element.width : null,
      backingHeight: element instanceof HTMLCanvasElement ? element.height : null,
      parent: element.parentElement ? descriptor(element.parentElement) : null,
    }));
    const horizontalScrolls = allElements.filter((element) => element.scrollWidth > element.clientWidth + 4).map((element) => ({
      ...descriptor(element),
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth,
      overflowAmount: element.scrollWidth - element.clientWidth,
      text: clean(element.innerText).slice(0, 300),
    }));
    const offscreen = allElements.filter((element) => {
      const rect = element.getBoundingClientRect();
      return rect.left < -1 || rect.right > window.innerWidth + 1;
    }).map((element) => ({ ...descriptor(element), text: clean(element.innerText).slice(0, 180) }));
    const frequency = (values) => Object.entries(values.reduce((accumulator, value) => {
      const key = String(value || "").trim();
      if (!key) return accumulator;
      accumulator[key] = (accumulator[key] || 0) + 1;
      return accumulator;
    }, {})).sort((a, b) => b[1] - a[1]).map(([value, count]) => ({ value, count }));
    const computed = allElements.map((element) => getComputedStyle(element));
    const census = {
      fontSizes: frequency(computed.map((style) => style.fontSize)),
      fontWeights: frequency(computed.map((style) => style.fontWeight)),
      lineHeights: frequency(computed.map((style) => style.lineHeight)),
      letterSpacings: frequency(computed.map((style) => style.letterSpacing)),
      textColors: frequency(computed.map((style) => style.color)),
      backgroundColors: frequency(computed.map((style) => style.backgroundColor)),
      borderWidths: frequency(computed.flatMap((style) => [style.borderTopWidth, style.borderRightWidth, style.borderBottomWidth, style.borderLeftWidth])),
      borderColors: frequency(computed.flatMap((style) => [style.borderTopColor, style.borderRightColor, style.borderBottomColor, style.borderLeftColor])),
      radii: frequency(computed.flatMap((style) => [style.borderTopLeftRadius, style.borderTopRightRadius, style.borderBottomRightRadius, style.borderBottomLeftRadius])),
      gaps: frequency(computed.flatMap((style) => [style.gap, style.rowGap, style.columnGap])),
      paddings: frequency(computed.flatMap((style) => [style.paddingTop, style.paddingRight, style.paddingBottom, style.paddingLeft])),
      margins: frequency(computed.flatMap((style) => [style.marginTop, style.marginRight, style.marginBottom, style.marginLeft])),
      shadows: frequency(computed.map((style) => style.boxShadow).filter((value) => value !== "none")),
      zIndices: frequency(computed.map((style) => style.zIndex).filter((value) => value !== "auto")),
    };
    const rootComputed = getComputedStyle(document.documentElement);
    const customProperties = {};
    for (const property of rootComputed) {
      if (property.startsWith("--")) customProperties[property] = rootComputed.getPropertyValue(property).trim();
    }
    const mediaQueries = [];
    const visitRules = (rules, source) => {
      for (const rule of rules || []) {
        if (rule instanceof CSSMediaRule) {
          mediaQueries.push({ condition: rule.conditionText, source, matches: matchMedia(rule.conditionText).matches, ruleCount: rule.cssRules.length });
          visitRules(rule.cssRules, source);
        } else if ("cssRules" in rule) {
          try { visitRules(rule.cssRules, source); } catch {}
        }
      }
    };
    for (const sheet of document.styleSheets) {
      try { visitRules(sheet.cssRules, sheet.href || "inline"); } catch {}
    }
    const duplicateIds = Object.entries([...document.querySelectorAll("[id]")].reduce((accumulator, element) => {
      accumulator[element.id] = (accumulator[element.id] || 0) + 1;
      return accumulator;
    }, {})).filter(([, count]) => count > 1).map(([id, count]) => ({ id, count }));
    return {
      title: document.title,
      url: location.href,
      lang: document.documentElement.lang,
      captureRuntime: { userAgent: navigator.userAgent, devicePixelRatio: devicePixelRatio },
      viewport: { width: innerWidth, height: innerHeight },
      documentSize: { width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight },
      root: descriptor(document.documentElement),
      body: descriptor(document.body),
      sections,
      texts,
      organisms,
      media,
      horizontalScrolls,
      offscreen,
      census,
      customProperties,
      mediaQueries,
      duplicateIds,
      headingsOutline: texts.filter((entry) => entry.headingLevel).map((entry) => ({ level: entry.headingLevel, text: entry.text, domPath: entry.domPath, rect: entry.rect, style: entry.style })),
      resources: performance.getEntriesByType("resource").map((entry) => ({ name: entry.name, initiatorType: entry.initiatorType, transferSize: entry.transferSize, encodedBodySize: entry.encodedBodySize, decodedBodySize: entry.decodedBodySize, duration: Math.round(entry.duration) })),
      stylesheets: [...document.styleSheets].map((sheet) => sheet.href || "inline"),
      scripts: [...document.scripts].map((script) => ({ src: script.src || null, type: script.type || null, async: script.async, defer: script.defer })),
      bodyHtml: document.body.outerHTML,
    };
  });

  if (viewport.name === "desktop-1440x900") {
    await fs.writeFile(path.join(OUT_DIR, "post-init-body.html"), data.bodyHtml, "utf8");
  }
  delete data.bodyHtml;
  data.interactions = await captureInteractionStates(page, viewport.name);
  data.consoleMessages = consoleMessages;
  data.pageErrors = pageErrors;
  data.failedRequests = failedRequests;
  data.sectionScreenshots = [];

  if (SECTION_CAPTURE_VIEWPORTS.has(viewport.name)) {
    const locator = page.locator("body > main > section, main > section, section[id], [data-section-root]");
    const count = await locator.count();
    const used = new Map();
    for (let index = 0; index < count; index += 1) {
      const section = locator.nth(index);
      try {
        if (!(await section.isVisible())) continue;
        const metadata = await section.evaluate((element) => ({
          id: element.id || "",
          className: typeof element.className === "string" ? element.className : "",
          heading: element.querySelector("h1,h2,h3")?.textContent?.replace(/\s+/gu, " ").trim() || "",
        }));
        let name = slugify(metadata.id || metadata.heading || metadata.className || `section-${index + 1}`);
        const occurrence = (used.get(name) || 0) + 1;
        used.set(name, occurrence);
        if (occurrence > 1) name = `${name}-${occurrence}`;
        const fileName = `${viewport.name}--${String(index + 1).padStart(2, "0")}--${name}.png`;
        await section.screenshot({ path: path.join(SECTION_SHOTS_DIR, fileName), animations: "disabled", timeout: 60000 });
        data.sectionScreenshots.push({ index, id: metadata.id || null, heading: metadata.heading || null, file: `screenshots/sections/${fileName}` });
      } catch (error) {
        data.sectionScreenshots.push({ index, error: String(error) });
      }
    }
  }

  await fs.writeFile(path.join(OUT_DIR, `design-${viewport.name}.json`), JSON.stringify(data, null, 2), "utf8");
  await context.close();
  return data;
}

for (const viewport of VIEWPORTS) {
  report.viewports[viewport.name] = await captureViewport(viewport);
}

await browser.close();
await fs.writeFile(path.join(OUT_DIR, "design-audit-all.json"), JSON.stringify(report, null, 2), "utf8");
const summary = {
  sourceUrl: SOURCE_URL,
  captureSha: CAPTURE_SHA,
  capturedAt: report.capturedAt,
  viewports: Object.fromEntries(Object.entries(report.viewports).map(([name, data]) => [name, {
    documentSize: data.documentSize,
    sections: data.sections.filter((section) => section.visible).length,
    texts: data.texts.length,
    organisms: data.organisms.length,
    media: data.media.length,
    interactions: data.interactions.length,
    horizontalScrolls: data.horizontalScrolls.length,
    offscreen: data.offscreen.length,
    duplicateIds: data.duplicateIds.length,
    consoleErrors: data.consoleMessages.filter((entry) => entry.type === "error").length,
    pageErrors: data.pageErrors.length,
    failedRequests: data.failedRequests.length,
  }]))
};
await fs.writeFile(path.join(OUT_DIR, "summary.json"), JSON.stringify(summary, null, 2), "utf8");
console.log(JSON.stringify(summary, null, 2));
