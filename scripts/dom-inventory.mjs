import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE_GLOBS = ["src", "scripts"];
const REPORT_PATH = path.join(ROOT, "_local", "reports", "dom-inventory.json");

const SECTION_RE = /<section\b[^>]*\bid=(["'])(?<id>[^"']+)\1[^>]*>/giu;
const OPERATION_PATTERNS = [
  ["innerHTML", /\.innerHTML\s*=/gu],
  ["outerHTML", /\.outerHTML\s*=/gu],
  ["insertAdjacentHTML", /\.insertAdjacentHTML\s*\(/gu],
  ["insertAdjacentElement", /\.insertAdjacentElement\s*\(/gu],
  ["append", /\.append\s*\(/gu],
  ["prepend", /\.prepend\s*\(/gu],
  ["before", /\.before\s*\(/gu],
  ["after", /\.after\s*\(/gu],
  ["replaceWith", /\.replaceWith\s*\(/gu],
  ["remove", /\.remove\s*\(/gu],
  ["style.setProperty", /\.style\.setProperty\s*\(/gu],
  ["setAttributeStyle", /\.setAttribute\s*\(\s*["']style["']/gu],
  ["hidden", /\.hidden\s*=/gu],
  ["createStyle", /createElement\s*\(\s*["']style["']\s*\)/gu],
  ["MutationObserver", /\bnew\s+MutationObserver\s*\(/gu],
  ["setTimeout", /\bsetTimeout\s*\(/gu],
  ["setInterval", /\bsetInterval\s*\(/gu],
];

const REPAIR_FILE_RE = /(?:^|[\\/])[^\\/]*(?:repair|repairs|fix|fixes|final|restore|override|lock)[^\\/]*\.(?:css|js|mjs)$/iu;
const CSS_IMPORT_RE = /@import\s+["'](?<href>[^"']+)["']/giu;
const JS_IMPORT_RE = /import\s+(?:[^"']+?\s+from\s+)?["'](?<href>[^"']+)["']/giu;

async function walk(dir) {
  const entries = await import("node:fs/promises").then(({ readdir }) =>
    readdir(dir, { withFileTypes: true }),
  );
  const files = [];

  for (const entry of entries) {
    if (entry.name === "node_modules" || entry.name === "dist" || entry.name === "_local") {
      continue;
    }

    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(fullPath)));
    } else {
      files.push(fullPath);
    }
  }

  return files;
}

function lineNumberAt(source, index) {
  let line = 1;
  for (let i = 0; i < index; i += 1) {
    if (source.charCodeAt(i) === 10) line += 1;
  }
  return line;
}

function collectMatches(source, pattern) {
  const matches = [];
  pattern.lastIndex = 0;

  for (const match of source.matchAll(pattern)) {
    matches.push({
      line: lineNumberAt(source, match.index ?? 0),
      text: match[0].slice(0, 180),
    });
  }

  return matches;
}

function getTargetIds(source, operationIndex) {
  const before = source.slice(Math.max(0, operationIndex - 360), operationIndex);
  const ids = [...before.matchAll(/#([a-z0-9_-]+)/giu)].map((match) => match[1]);
  return [...new Set(ids)].slice(-4);
}

function collectOperations(file, source) {
  const relativePath = path.relative(ROOT, file).replaceAll("\\", "/");
  const operations = [];

  for (const [name, pattern] of OPERATION_PATTERNS) {
    pattern.lastIndex = 0;
    for (const match of source.matchAll(pattern)) {
      operations.push({
        operation: name,
        file: relativePath,
        line: lineNumberAt(source, match.index ?? 0),
        targetHints: getTargetIds(source, match.index ?? 0),
        snippet: source
          .slice(match.index ?? 0, Math.min(source.length, (match.index ?? 0) + 180))
          .replace(/\s+/gu, " ")
          .trim(),
      });
    }
  }

  return operations;
}

function collectImports(file, source) {
  const relativePath = path.relative(ROOT, file).replaceAll("\\", "/");
  const imports = [];

  for (const pattern of [CSS_IMPORT_RE, JS_IMPORT_RE]) {
    pattern.lastIndex = 0;
    for (const match of source.matchAll(pattern)) {
      const href = match.groups?.href;
      if (!href) continue;
      imports.push({
        from: relativePath,
        href,
        line: lineNumberAt(source, match.index ?? 0),
      });
    }
  }

  return imports;
}

function collectSections(indexHtml) {
  return [...indexHtml.matchAll(SECTION_RE)].map((match, index) => {
    const id = match.groups.id;
    const tag = match[0];

    return {
      order: index + 1,
      id,
      line: lineNumberAt(indexHtml, match.index ?? 0),
      family: tag.match(/\bdata-section-family=(["'])(?<value>[^"']+)\1/iu)?.groups?.value ?? null,
      className: tag.match(/\bclass=(["'])(?<value>[^"']+)\1/iu)?.groups?.value ?? null,
      source: "index.html",
    };
  });
}

function groupOperationsByTarget(sections, operations) {
  const bySection = Object.fromEntries(
    sections.map((section) => [
      section.id,
      {
        ...section,
        mutators: [],
        movers: [],
        styleMutators: [],
        observers: [],
        timers: [],
      },
    ]),
  );

  for (const operation of operations) {
    const targetIds = operation.targetHints.filter((id) => bySection[id]);
    const targets = targetIds.length ? targetIds : ["__unknown__"];

    for (const target of targets) {
      if (!bySection[target]) continue;

      if (
        operation.operation === "insertAdjacentElement" ||
        operation.operation === "append" ||
        operation.operation === "prepend" ||
        operation.operation === "before" ||
        operation.operation === "after" ||
        operation.operation === "replaceWith" ||
        operation.operation === "remove"
      ) {
        bySection[target].movers.push(operation);
      } else if (
        operation.operation === "style.setProperty" ||
        operation.operation === "setAttributeStyle" ||
        operation.operation === "hidden"
      ) {
        bySection[target].styleMutators.push(operation);
      } else if (operation.operation === "MutationObserver") {
        bySection[target].observers.push(operation);
      } else if (operation.operation === "setTimeout" || operation.operation === "setInterval") {
        bySection[target].timers.push(operation);
      } else {
        bySection[target].mutators.push(operation);
      }
    }
  }

  return Object.values(bySection);
}

async function main() {
  const indexHtml = await readFile(path.join(ROOT, "index.html"), "utf8");
  const files = (
    await Promise.all(SOURCE_GLOBS.map((dir) => walk(path.join(ROOT, dir))))
  )
    .flat()
    .filter((file) => /\.(?:css|html|js|mjs)$/iu.test(file));

  const sources = await Promise.all(
    files.map(async (file) => ({
      file,
      source: await readFile(file, "utf8"),
    })),
  );

  const sections = collectSections(indexHtml);
  const operations = sources.flatMap(({ file, source }) => collectOperations(file, source));
  const imports = sources.flatMap(({ file, source }) => collectImports(file, source));
  const repairFiles = sources
    .map(({ file }) => path.relative(ROOT, file).replaceAll("\\", "/"))
    .filter((file) => REPAIR_FILE_RE.test(file));

  const report = {
    generatedAt: new Date().toISOString(),
    sections: groupOperationsByTarget(sections, operations),
    operations,
    imports,
    repairFiles,
    totals: {
      sections: sections.length,
      operations: operations.length,
      imports: imports.length,
      repairFiles: repairFiles.length,
    },
  };

  await mkdir(path.dirname(REPORT_PATH), { recursive: true });
  await writeFile(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);

  console.log(
    [
      `DOM inventory written to ${path.relative(ROOT, REPORT_PATH).replaceAll("\\", "/")}`,
      `sections=${report.totals.sections}`,
      `operations=${report.totals.operations}`,
      `repairFiles=${report.totals.repairFiles}`,
    ].join(" "),
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
