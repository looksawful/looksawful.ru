import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import ts from "@typescript/typescript6";

import { mediaEntries } from "../../src/data/media/entries/index.ts";
import { dedupeUsageEvidenceByEntryId } from "../../src/data/media/usage-records.ts";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const ENTRY_DIR = path.join(ROOT, "src/data/media/entries");
const WRITE = process.argv.includes("--write");

const CONTEXT_KEYS = [
  "title",
  "alt",
  "description",
  "date",
  "projectIds",
  "workAreaIds",
  "projectTypeIds",
  "deliverableIds",
  "tags",
  "credits",
];
const MATERIALIZED_KEYS = ["assetId", ...CONTEXT_KEYS];

function propertyName(node) {
  if (!node?.name) return null;
  if (ts.isIdentifier(node.name) || ts.isStringLiteral(node.name)) return node.name.text;
  return null;
}

function literalValue(node) {
  if (ts.isStringLiteralLike(node)) return node.text;
  if (ts.isNumericLiteral(node)) return Number(node.text);
  if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
  if (node.kind === ts.SyntaxKind.NullKeyword) return null;
  if (ts.isArrayLiteralExpression(node)) {
    const values = [];
    for (const element of node.elements) {
      const value = literalValue(element);
      if (value === UNSUPPORTED) return UNSUPPORTED;
      values.push(value);
    }
    return values;
  }
  return UNSUPPORTED;
}

const UNSUPPORTED = Symbol("unsupported");

function stableEqual(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function expressionFor(value) {
  if (typeof value === "string") return ts.factory.createStringLiteral(value);
  if (typeof value === "number") return ts.factory.createNumericLiteral(value);
  if (typeof value === "boolean") {
    return value ? ts.factory.createTrue() : ts.factory.createFalse();
  }
  if (value === null) return ts.factory.createNull();
  if (Array.isArray(value)) {
    return ts.factory.createArrayLiteralExpression(value.map(expressionFor), false);
  }
  throw new TypeError(`Unsupported materialized MediaEntry value: ${JSON.stringify(value)}`);
}

function entryIdForObject(node) {
  const property = node.properties.find(
    (item) => ts.isPropertyAssignment(item)
      && propertyName(item) === "id"
      && ts.isStringLiteralLike(item.initializer),
  );
  return property?.initializer?.text ?? null;
}

function updateEntryObject(node, runtimeEntry) {
  const existingByKey = new Map();
  for (const property of node.properties) {
    if (!ts.isPropertyAssignment(property)) continue;
    const key = propertyName(property);
    if (key) existingByKey.set(key, property);
  }

  let changed = false;
  const replacements = new Map();

  for (const key of MATERIALIZED_KEYS) {
    if (!Object.prototype.hasOwnProperty.call(runtimeEntry, key)) continue;
    const value = runtimeEntry[key];
    if (value === undefined) continue;

    const existing = existingByKey.get(key);
    if (existing) {
      const currentValue = literalValue(existing.initializer);
      if (currentValue !== UNSUPPORTED && stableEqual(currentValue, value)) continue;
      replacements.set(key, ts.factory.updatePropertyAssignment(
        existing,
        existing.name,
        expressionFor(value),
      ));
      changed = true;
    } else {
      replacements.set(
        key,
        ts.factory.createPropertyAssignment(key, expressionFor(value)),
      );
      changed = true;
    }
  }

  if (!changed) return node;

  const properties = [];
  const emitted = new Set();
  for (const property of node.properties) {
    const key = ts.isPropertyAssignment(property) ? propertyName(property) : null;
    if (key && replacements.has(key)) {
      properties.push(replacements.get(key));
      emitted.add(key);
    } else {
      properties.push(property);
    }
  }

  const assetIndex = properties.findIndex(
    (property) => ts.isPropertyAssignment(property) && propertyName(property) === "assetId",
  );
  let insertAt = assetIndex >= 0 ? assetIndex + 1 : properties.length;
  for (const key of CONTEXT_KEYS) {
    if (!replacements.has(key) || emitted.has(key)) continue;
    properties.splice(insertAt, 0, replacements.get(key));
    insertAt += 1;
    emitted.add(key);
  }

  return ts.factory.updateObjectLiteralExpression(node, properties);
}

export function materializeMediaEntrySource(sourceText, fileName, runtimeEntries) {
  const sourceFile = ts.createSourceFile(
    fileName,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
  const edits = [];

  function visit(node) {
    if (ts.isObjectLiteralExpression(node)) {
      const entryId = entryIdForObject(node);
      const runtimeEntry = entryId ? runtimeEntries.get(entryId) : null;
      if (runtimeEntry) {
        const updated = updateEntryObject(node, runtimeEntry);
        if (updated !== node) {
          edits.push({
            start: node.getStart(sourceFile),
            end: node.getEnd(),
            text: printer.printNode(ts.EmitHint.Expression, updated, sourceFile),
          });
          return;
        }
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  return edits
    .sort((left, right) => right.start - left.start)
    .reduce(
      (text, edit) => `${text.slice(0, edit.start)}${edit.text}${text.slice(edit.end)}`,
      sourceText,
    );
}

function materializedRuntimeEntries() {
  return new Map(mediaEntries.map((entry) => {
    const evidence = dedupeUsageEvidenceByEntryId.get(entry.id);
    const desired = {
      id: entry.id,
      assetId: entry.assetId,
      projectIds: entry.projectIds ?? [],
    };

    if (evidence) {
      for (const key of CONTEXT_KEYS) {
        if (Object.prototype.hasOwnProperty.call(evidence, key)) {
          desired[key] = evidence[key];
        }
      }
    }

    return [entry.id, desired];
  }));
}

async function main() {
  const runtimeEntries = materializedRuntimeEntries();
  const filenames = (await readdir(ENTRY_DIR))
    .filter((filename) => filename.endsWith(".ts"))
    .sort();
  const changed = [];

  for (const filename of filenames) {
    if (filename === "index.ts") continue;
    const filePath = path.join(ENTRY_DIR, filename);
    const source = await readFile(filePath, "utf8");
    const next = materializeMediaEntrySource(source, filename, runtimeEntries);
    if (next === source) continue;
    changed.push(path.relative(ROOT, filePath).replaceAll("\\", "/"));
    if (WRITE) await writeFile(filePath, next, "utf8");
  }

  const result = {
    mode: WRITE ? "write" : "check",
    runtimeEntryCount: runtimeEntries.size,
    changedFileCount: changed.length,
    changedFiles: changed,
  };
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);

  if (!WRITE && changed.length > 0) process.exitCode = 1;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  await main();
}
