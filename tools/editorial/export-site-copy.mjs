import { execFileSync } from "node:child_process";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { performance } from "node:perf_hooks";
import ts from "typescript";

import { sitePages } from "../../src/site/pages/manifest.ts";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));

const COPY_KEYS = new Set([
  "alt",
  "ariaLabel",
  "body",
  "caption",
  "coverAlt",
  "credit",
  "credits",
  "description",
  "eyebrow",
  "focus",
  "heading",
  "label",
  "lead",
  "lines",
  "name",
  "note",
  "paragraphs",
  "period",
  "placeholder",
  "role",
  "summary",
  "text",
  "title",
]);

const STRUCTURAL_KEYS = new Set([
  "id",
  "assetId",
  "entryId",
  "projectId",
  "logoUsageId",
  "href",
  "url",
  "src",
  "sourceSrc",
  "path",
  "route",
  "className",
  "mediaClassName",
  "surfaceClassName",
  "captionClassName",
  "type",
  "kind",
  "layout",
  "mode",
  "renderer",
  "presentation",
  "device",
]);

const TS_SOURCE_ROOTS = [
  "src/data/catalog",
  "src/data/content",
  "src/data/taxonomy",
];

function normalizeText(value) {
  return value.replace(/\s+/g, " ").trim();
}

function currentSha() {
  try {
    return execFileSync("git", ["rev-parse", "HEAD"], {
      cwd: ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "unknown";
  }
}

function routeByPageId() {
  return new Map(sitePages.map((page) => [page.id, page.path]));
}

function inferPageId(source) {
  const normalized = source.replaceAll("\\", "/");

  const caseMatch = normalized.match(/src\/content\/(?:i18n\/en\/)?cases\/([^/]+)\.json$/);
  if (caseMatch) return `case:${caseMatch[1]}`;

  if (normalized.includes("src/content/shootings/")) return "collection:music-photography";
  if (normalized.includes("src/content/collections/music-photography")) return "collection:music-photography";

  const standaloneMatch = normalized.match(/src\/content\/standalone-projects\/([^/]+)\.json$/);
  if (standaloneMatch) return `project:${standaloneMatch[1]}`;

  if (normalized.endsWith("src/content/editorial/cv.json") || normalized.endsWith("src/content/cv.json")) {
    return "cv";
  }

  if (
    normalized.endsWith("src/content/editorial/home-project-cards.json")
    || normalized.endsWith("src/content/projects.json")
    || normalized.endsWith("src/content/navigation.json")
  ) {
    return "home";
  }

  const tsName = path.basename(normalized, path.extname(normalized));
  if (tsName.startsWith("jestei")) return "case:jestei-pool";
  if (tsName.startsWith("styx")) return "case:styx";
  if (tsName.startsWith("sensetique")) return "case:sensetique";
  if (tsName.startsWith("awful-cases")) return "project:awful-cases";
  if (tsName.startsWith("moves-awful")) return "project:moves-awful";
  if (tsName.startsWith("berry")) return "project:berry-social-content-2020";
  if (tsName.startsWith("shootings")) return "collection:music-photography";

  return null;
}

function inferLocale(source) {
  return source.replaceAll("\\", "/").includes("/i18n/en/") ? "en" : "ru";
}

async function walkFiles(root, predicate) {
  const output = [];
  let entries;
  try {
    entries = await readdir(root, { withFileTypes: true });
  } catch {
    return output;
  }

  for (const entry of entries) {
    const full = path.join(root, entry.name);
    if (entry.isDirectory()) output.push(...await walkFiles(full, predicate));
    else if (predicate(full)) output.push(full);
  }
  return output;
}

function pushEntry(entries, routeMap, authoredKeys, {
  pageId,
  locale,
  section = null,
  field,
  source,
  sourceLine = null,
  text,
  origin,
}) {
  const normalized = normalizeText(text);
  if (!normalized) return;

  const entry = {
    pageId,
    route: pageId ? routeMap.get(pageId) ?? null : null,
    locale,
    section,
    field,
    source: source.replaceAll("\\", "/"),
    sourceLine,
    origin,
    text: normalized,
  };

  const exactKey = [entry.source, entry.field, entry.section ?? "", entry.locale, entry.text].join("|");
  if (authoredKeys.has(exactKey)) return;
  authoredKeys.add(exactKey);
  entries.push(entry);
}

function collectJsonCopy(value, context) {
  const { entries, routeMap, authoredKeys, pageId, locale, source } = context;

  function visit(node, fieldPath, section, parentKey = null) {
    if (typeof node === "string") {
      if (parentKey && (COPY_KEYS.has(parentKey) || parentKey === "items")) {
        pushEntry(entries, routeMap, authoredKeys, {
          pageId,
          locale,
          section,
          field: fieldPath,
          source,
          text: node,
          origin: "json-source",
        });
      }
      return;
    }

    if (Array.isArray(node)) {
      node.forEach((item, index) => visit(item, `${fieldPath}[${index}]`, section, parentKey));
      return;
    }

    if (!node || typeof node !== "object") return;

    const localSection = typeof node.id === "string" ? node.id : section;
    for (const [key, child] of Object.entries(node)) {
      if (STRUCTURAL_KEYS.has(key)) continue;
      const childPath = fieldPath ? `${fieldPath}.${key}` : key;

      if (typeof child === "string" && COPY_KEYS.has(key)) {
        pushEntry(entries, routeMap, authoredKeys, {
          pageId,
          locale,
          section: localSection,
          field: childPath,
          source,
          text: child,
          origin: "json-source",
        });
        continue;
      }

      visit(child, childPath, localSection, key);
    }
  }

  visit(value, "", null);
}

function propertyName(node) {
  if (ts.isIdentifier(node) || ts.isStringLiteral(node) || ts.isNumericLiteral(node)) return node.text;
  return null;
}

function collectStringLiterals(node) {
  const values = [];
  const visit = (current) => {
    if (ts.isStringLiteral(current) || ts.isNoSubstitutionTemplateLiteral(current)) {
      values.push({ text: current.text, pos: current.getStart() });
      return;
    }
    if (ts.isArrayLiteralExpression(current)) current.elements.forEach(visit);
  };
  visit(node);
  return values;
}

function collectTsCopy(sourceText, source, context) {
  const { entries, routeMap, authoredKeys, pageId, locale } = context;
  const sourceFile = ts.createSourceFile(source, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);

  function visit(node) {
    if (ts.isPropertyAssignment(node)) {
      const key = propertyName(node.name);
      if (key && COPY_KEYS.has(key) && !STRUCTURAL_KEYS.has(key)) {
        for (const value of collectStringLiterals(node.initializer)) {
          const line = sourceFile.getLineAndCharacterOfPosition(value.pos).line + 1;
          pushEntry(entries, routeMap, authoredKeys, {
            pageId,
            locale,
            field: key,
            source,
            sourceLine: line,
            text: value.text,
            origin: "ts-source",
          });
        }
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
}

function decodeHtml(value) {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, "\"")
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)));
}

function collectHtmlCopy(html, source, pageId, route, entries, authoredKeys) {
  const withoutHidden = html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(script|style|svg|template)\b[\s\S]*?<\/\1>/gi, " ");

  const title = withoutHidden.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  if (title) {
    pushEntry(entries, new Map([[pageId, route]]), authoredKeys, {
      pageId,
      locale: "ru",
      section: "meta",
      field: "title",
      source,
      text: decodeHtml(title.replace(/<[^>]+>/g, " ")),
      origin: "static-html",
    });
  }

  for (const match of withoutHidden.matchAll(/<meta\s+[^>]*name=["']description["'][^>]*content=["']([^"']*)["'][^>]*>/gi)) {
    pushEntry(entries, new Map([[pageId, route]]), authoredKeys, {
      pageId,
      locale: "ru",
      section: "meta",
      field: "description",
      source,
      text: decodeHtml(match[1]),
      origin: "static-html",
    });
  }

  const visible = decodeHtml(
    withoutHidden
      .replace(/<(br|\/p|\/div|\/li|\/h[1-6]|\/section|\/article|\/main|\/header|\/footer)>/gi, "\n")
      .replace(/<[^>]+>/g, " "),
  );

  visible.split(/\n+/).map(normalizeText).filter(Boolean).forEach((text, index) => {
    pushEntry(entries, new Map([[pageId, route]]), authoredKeys, {
      pageId,
      locale: "ru",
      section: "body",
      field: `text[${index}]`,
      source,
      text,
      origin: "static-html",
    });
  });
}

function buildCoverage(entries) {
  const contentPages = sitePages.filter((page) => page.enabled && page.type !== "not-found");
  const covered = new Set(entries.map((entry) => entry.pageId).filter(Boolean));
  const routes = contentPages.map((page) => ({
    pageId: page.id,
    route: page.path,
    covered: covered.has(page.id),
  }));

  return {
    coveredRoutes: routes.filter((item) => item.covered).length,
    totalRoutes: routes.length,
    routes,
  };
}

export async function buildSiteCopyExport() {
  const started = performance.now();
  const routeMap = routeByPageId();
  const entries = [];
  const authoredKeys = new Set();
  const sources = new Set();

  const contentRoot = path.join(ROOT, "src/content");
  const jsonFiles = await walkFiles(contentRoot, (file) => file.endsWith(".json"));

  for (const file of jsonFiles) {
    const source = path.relative(ROOT, file).replaceAll(path.sep, "/");
    const raw = await readFile(file, "utf8");
    let value;
    try {
      value = JSON.parse(raw);
    } catch {
      continue;
    }
    sources.add(source);
    collectJsonCopy(value, {
      entries,
      routeMap,
      authoredKeys,
      pageId: inferPageId(source),
      locale: inferLocale(source),
      source,
    });
  }

  for (const sourceRoot of TS_SOURCE_ROOTS) {
    const absoluteRoot = path.join(ROOT, sourceRoot);
    const tsFiles = await walkFiles(absoluteRoot, (file) => file.endsWith(".ts"));
    for (const file of tsFiles) {
      const source = path.relative(ROOT, file).replaceAll(path.sep, "/");
      sources.add(source);
      collectTsCopy(await readFile(file, "utf8"), source, {
        entries,
        routeMap,
        authoredKeys,
        pageId: inferPageId(source),
        locale: inferLocale(source),
      });
    }
  }

  for (const page of sitePages) {
    if (!page.enabled || page.build.kind !== "public-static") continue;
    const source = page.build.sourcePath;
    const absolute = path.join(ROOT, source);
    try {
      const html = await readFile(absolute, "utf8");
      sources.add(source);
      collectHtmlCopy(html, source, page.id, page.path, entries, authoredKeys);
    } catch {
      // Missing static sources are reported through route coverage below.
    }
  }

  entries.sort((a, b) =>
    (a.route ?? "").localeCompare(b.route ?? "")
    || a.locale.localeCompare(b.locale)
    || a.source.localeCompare(b.source)
    || (a.sourceLine ?? 0) - (b.sourceLine ?? 0)
    || a.field.localeCompare(b.field)
  );

  const coverage = buildCoverage(entries);
  const chars = entries.reduce((sum, entry) => sum + entry.text.length, 0);
  const elapsedMs = Math.round((performance.now() - started) * 100) / 100;

  return {
    schemaVersion: 1,
    sourceCommit: currentSha(),
    generatedAt: new Date().toISOString(),
    stats: {
      sources: sources.size,
      entries: entries.length,
      chars,
      elapsedMs,
      ...coverage,
    },
    entries,
  };
}

export function validateSiteCopyExport(result) {
  const errors = [];
  if (result.schemaVersion !== 1) errors.push("schemaVersion must be 1");
  if (!Array.isArray(result.entries) || result.entries.length === 0) errors.push("entries must be non-empty");

  for (const [index, entry] of result.entries.entries()) {
    if (!entry.source) errors.push(`entries[${index}].source is required`);
    if (!entry.field) errors.push(`entries[${index}].field is required`);
    if (!entry.locale) errors.push(`entries[${index}].locale is required`);
    if (!entry.text || !entry.text.trim()) errors.push(`entries[${index}].text is empty`);
  }

  const jesteiRu = result.entries.some((entry) => entry.pageId === "case:jestei-pool" && entry.locale === "ru");
  const jesteiEn = result.entries.some((entry) => entry.pageId === "case:jestei-pool" && entry.locale === "en");
  if (!jesteiRu || !jesteiEn) errors.push("Jestei Pool must have both RU and EN source copy");

  if (result.stats.coveredRoutes !== result.stats.totalRoutes) {
    const missing = result.stats.routes.filter((item) => !item.covered).map((item) => item.route).join(", ");
    errors.push(`source-first route coverage incomplete: ${missing}`);
  }

  return errors;
}

async function main() {
  const args = process.argv.slice(2);
  const check = args.includes("--check");
  const outIndex = args.indexOf("--out");
  const out = outIndex >= 0 ? args[outIndex + 1] : null;
  const result = await buildSiteCopyExport();
  const errors = validateSiteCopyExport(result);

  if (out) {
    const destination = path.resolve(ROOT, out);
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, `${JSON.stringify(result, null, 2)}\n`, "utf8");
  }

  const { stats } = result;
  console.log(
    `site-copy: ${stats.entries} entries, ${stats.chars} chars, ${stats.sources} sources, `
      + `${stats.coveredRoutes}/${stats.totalRoutes} routes, ${stats.elapsedMs} ms`,
  );

  if (check && errors.length) {
    errors.forEach((error) => console.error(`site-copy error: ${error}`));
    process.exitCode = 1;
  }
}

const isDirect = process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;
if (isDirect) await main();
