import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { mediaAssets, mediaEntries } from "../../src/data/media/index.ts";
import { mediaCatalogItems as baseMediaCatalogItems } from "../../src/data/media/catalog.ts";
import logicalSource from "../media-migration/manifests/2026-09-03-media-dedupe/logical-assets.json" with { type: "json" };

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
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

const retiredAliasMap = new Map(
  logicalSource.components.flatMap((component) =>
    component.removeAssetIds.map((fromAssetId) => [fromAssetId, component.canonicalAssetId]),
  ),
);
const legacyContextAssetByEntryId = new Map(
  logicalSource.components.flatMap((component) => {
    const legacyAssetId = component.removeAssetIds[0] ?? component.canonicalAssetId;
    return component.entryIds.map((entryId) => [entryId, legacyAssetId]);
  }),
);

function canonicalMediaAssetId(assetId) {
  return retiredAliasMap.get(assetId) ?? assetId;
}

function normalizedArray(value) {
  return value ?? [];
}

function resolveContext(entry, catalog) {
  if (!catalog) return entry;
  const result = {};
  for (const key of CONTEXT_KEYS) {
    result[key] = entry[key] !== undefined ? entry[key] : catalog[key];
  }
  return result;
}

export function semanticEntryRecord(entry, asset) {
  return {
    id: entry.id,
    assetId: canonicalMediaAssetId(entry.assetId),
    mediaType: asset?.type ?? null,
    src: asset?.src ?? null,
    title: entry.title ?? "",
    alt: entry.alt ?? "",
    description: entry.description ?? "",
    date: entry.date ?? "",
    projectIds: normalizedArray(entry.projectIds),
    workAreaIds: normalizedArray(entry.workAreaIds),
    projectTypeIds: normalizedArray(entry.projectTypeIds),
    deliverableIds: normalizedArray(entry.deliverableIds),
    tags: normalizedArray(entry.tags),
    credits: normalizedArray(entry.credits),
    creditId: entry.creditId ?? null,
    caption: entry.caption ?? null,
    purpose: entry.purpose ?? null,
    posterAssetId: entry.posterAssetId
      ? canonicalMediaAssetId(entry.posterAssetId)
      : null,
  };
}

export function buildLiveSemanticSnapshot() {
  const assetById = new Map(mediaAssets.map((asset) => [asset.id, asset]));
  const catalogByAssetId = new Map(
    baseMediaCatalogItems.map((item) => [item.asset.id, item]),
  );

  const entries = [...mediaEntries]
    .sort((left, right) => left.id.localeCompare(right.id))
    .map((entry) => {
      const contextualAssetId = legacyContextAssetByEntryId.get(entry.id) ?? entry.assetId;
      const catalog = catalogByAssetId.get(contextualAssetId)
        ?? catalogByAssetId.get(canonicalMediaAssetId(entry.assetId));
      const context = resolveContext(entry, catalog);
      const canonicalAssetId = canonicalMediaAssetId(entry.assetId);
      return semanticEntryRecord(
        { ...entry, ...context, assetId: canonicalAssetId },
        assetById.get(canonicalAssetId),
      );
    });

  return {
    version: 1,
    entryCount: entries.length,
    entries,
  };
}

function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

export function compareSemanticSnapshots(actual, expected) {
  const actualById = new Map((actual.entries ?? []).map((entry) => [entry.id, entry]));
  const expectedById = new Map((expected.entries ?? []).map((entry) => [entry.id, entry]));
  const ids = [...new Set([...actualById.keys(), ...expectedById.keys()])].sort();
  const mismatches = [];

  for (const entryId of ids) {
    const left = actualById.get(entryId);
    const right = expectedById.get(entryId);
    if (!left || !right) {
      mismatches.push({
        entryId,
        kind: left ? "unexpected-entry" : "missing-entry",
      });
      continue;
    }
    if (stableJson(left) !== stableJson(right)) {
      const changedFields = [...new Set([...Object.keys(left), ...Object.keys(right)])]
        .filter((key) => stableJson(left[key]) !== stableJson(right[key]));
      mismatches.push({ entryId, kind: "changed", changedFields });
    }
  }

  if ((actual.entryCount ?? actual.entries?.length ?? 0)
      !== (expected.entryCount ?? expected.entries?.length ?? 0)) {
    mismatches.push({
      entryId: null,
      kind: "entry-count",
      expected: expected.entryCount ?? expected.entries?.length ?? 0,
      actual: actual.entryCount ?? actual.entries?.length ?? 0,
    });
  }

  return mismatches;
}

function optionValue(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : null;
}

async function main() {
  const writePath = optionValue("--write");
  const checkPath = optionValue("--check");
  if ((writePath ? 1 : 0) + (checkPath ? 1 : 0) !== 1) {
    throw new Error("Use exactly one of --write <path> or --check <path>");
  }

  const actual = buildLiveSemanticSnapshot();
  if (writePath) {
    const target = path.resolve(ROOT, writePath);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, `${JSON.stringify(actual, null, 2)}\n`, "utf8");
    process.stdout.write(`${JSON.stringify({ written: writePath, entryCount: actual.entryCount })}\n`);
    return;
  }

  const expected = JSON.parse(await readFile(path.resolve(ROOT, checkPath), "utf8"));
  const mismatches = compareSemanticSnapshots(actual, expected);
  process.stdout.write(`${JSON.stringify({
    checked: checkPath,
    entryCount: actual.entryCount,
    mismatchCount: mismatches.length,
    mismatches,
  }, null, 2)}\n`);
  if (mismatches.length) process.exitCode = 1;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  await main();
}
