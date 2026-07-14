import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const budgetPath = path.join("scripts", "css-contract-budget.json");
const writeBudget = process.argv.includes("--write-budget");

const PATTERNS = {
  cssImportant: /!important\b/gu,
  jsImportantSetProperty: /\.style\.setProperty\([\s\S]*?["']important["'][\s\S]*?\)/gu,
  innerHTMLAssignment: /\.innerHTML\s*=/gu,
  insertAdjacentHTML: /\.insertAdjacentHTML\s*\(/gu,
  globalMutationObserver: /new\s+MutationObserver\s*\(/gu,
  injectedStyleElement: /createElement\s*\(\s*["']style["']\s*\)/gu,
  inlineStyleTag: /<style\b/giu,
  heroOnlyReference: /hero-only/giu,
};

const cssRepairFilePattern = /(?:repair|fix|fixes|final|restore|override|lock)/iu;

async function walk(dir, predicate = () => true) {
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
  const files = [];

  for (const entry of entries) {
    const next = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(next, predicate)));
    } else if (entry.isFile() && predicate(next)) {
      files.push(next);
    }
  }

  return files;
}

function countMatches(text, pattern) {
  return [...text.matchAll(pattern)].length;
}

async function scanFile(filePath, metrics) {
  const text = await readFile(filePath, "utf8");
  const normalizedPath = filePath.replace(/\\/gu, "/");
  const isCss = filePath.endsWith(".css");
  const isJs = filePath.endsWith(".js") || filePath.endsWith(".mjs");
  const isHtml = filePath.endsWith(".html");

  if (isCss) {
    addMetric(metrics, "cssImportant", normalizedPath, countMatches(text, PATTERNS.cssImportant));
    if (cssRepairFilePattern.test(path.basename(filePath))) {
      addMetric(metrics, "repairCssFiles", normalizedPath, 1);
    }
  }

  if (isJs) {
    addMetric(metrics, "jsImportantSetProperty", normalizedPath, countMatches(text, PATTERNS.jsImportantSetProperty));
    addMetric(metrics, "innerHTMLAssignment", normalizedPath, countMatches(text, PATTERNS.innerHTMLAssignment));
    addMetric(metrics, "insertAdjacentHTML", normalizedPath, countMatches(text, PATTERNS.insertAdjacentHTML));
    addMetric(metrics, "globalMutationObserver", normalizedPath, countMatches(text, PATTERNS.globalMutationObserver));
    addMetric(metrics, "injectedStyleElement", normalizedPath, countMatches(text, PATTERNS.injectedStyleElement));
  }

  if (isHtml) {
    addMetric(metrics, "inlineStyleTag", normalizedPath, countMatches(text, PATTERNS.inlineStyleTag));
  }

  addMetric(metrics, "heroOnlyReference", normalizedPath, countMatches(text, PATTERNS.heroOnlyReference));
}

function addMetric(metrics, name, filePath, count) {
  if (!count) return;

  metrics[name] ||= { count: 0, files: {} };
  metrics[name].count += count;
  metrics[name].files[filePath] = count;
}

async function collectMetrics() {
  const files = [
    "index.html",
    ...(await walk("src", (filePath) => /\.(?:css|js|mjs)$/iu.test(filePath))),
  ];
  const metrics = {};

  for (const file of files) {
    await scanFile(file, metrics);
  }

  return Object.fromEntries(Object.entries(metrics).sort(([a], [b]) => a.localeCompare(b)));
}

function budgetFromMetrics(metrics) {
  return Object.fromEntries(
    Object.entries(metrics).map(([name, value]) => [
      name,
      {
        max: value.count,
        reason: "Current dev debt budget. Lower this value when the refactor removes the pattern.",
      },
    ]),
  );
}

function compareToBudget(metrics, budget) {
  const failures = [];

  for (const [name, value] of Object.entries(metrics)) {
    const max = budget[name]?.max;
    if (typeof max !== "number") {
      failures.push(`${name}: no budget entry for count ${value.count}`);
    } else if (value.count > max) {
      failures.push(`${name}: count ${value.count} exceeds budget ${max}`);
    }
  }

  return failures;
}

const metrics = await collectMetrics();

if (writeBudget) {
  await writeFile(`${budgetPath}.tmp`, `${JSON.stringify(budgetFromMetrics(metrics), null, 2)}\n`, "utf8");
  await import("node:fs/promises").then(({ rename }) => rename(`${budgetPath}.tmp`, budgetPath));
  console.log(`wrote ${budgetPath}`);
  process.exit(0);
}

console.log(JSON.stringify(metrics, null, 2));

const budget = JSON.parse(await readFile(budgetPath, "utf8"));
const failures = compareToBudget(metrics, budget);

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
