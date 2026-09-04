import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import {
  mediaAssets,
  mediaCatalogItems,
  mediaEntries,
} from "../../src/data/media/index.ts";
import { canonicalMediaAssetId } from "../../src/data/media/asset-aliases.ts";

const fixtureUrl = new URL("../../test/fixtures/media-semantic-baseline.json", import.meta.url);

function canonicalJson(value) {
  if (Array.isArray(value)) {
    return `[${value.map(canonicalJson).join(",")}]`;
  }

  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`)
      .join(",")}}`;
  }

  return JSON.stringify(value);
}

function sha256(value) {
  return createHash("sha256").update(canonicalJson(value)).digest("hex");
}

function optional(value) {
  return value === undefined ? null : value;
}

export function entrySemanticRecord(
  entry,
  asset,
  { normalizeDedupeAliases = false } = {},
) {
  const assetId = normalizeDedupeAliases
    ? canonicalMediaAssetId(entry.assetId)
    : entry.assetId;
  const posterAssetId = entry.posterAssetId
    ? normalizeDedupeAliases
      ? canonicalMediaAssetId(entry.posterAssetId)
      : entry.posterAssetId
    : null;

  return {
    id: entry.id,
    assetId,
    projectIds: optional(entry.projectIds),
    creditId: optional(entry.creditId),
    title: optional(entry.title),
    alt: optional(entry.alt),
    description: optional(entry.description),
    date: optional(entry.date),
    workAreaIds: optional(entry.workAreaIds),
    projectTypeIds: optional(entry.projectTypeIds),
    deliverableIds: optional(entry.deliverableIds),
    tags: optional(entry.tags),
    credits: optional(entry.credits),
    posterAssetId,
    caption: optional(entry.caption),
    purpose: optional(entry.purpose),
    mediaType: asset?.type ?? null,
  };
}

function catalogSemanticRecord(item, assetId = item.asset.id) {
  return {
    assetId,
    title: item.title,
    alt: item.alt,
    description: item.description,
    date: item.date,
    workAreaIds: item.workAreaIds,
    projectTypeIds: item.projectTypeIds,
    deliverableIds: item.deliverableIds,
    tags: item.tags,
    credits: item.credits,
    reusable: item.reusable,
    archived: item.archived,
  };
}

/**
 * Builds the semantic golden snapshot.
 *
 * Migration mode compares contextual usage semantics in canonical identity
 * space. Only approved asset aliases are canonicalized. Contextual fields are
 * never normalized, unioned or dropped, and physical source paths are checked
 * by the dedicated dedupe/physical contracts rather than this usage contract.
 *
 * Catalog metadata is checked only for canonical surviving asset identities.
 * Retired duplicate catalog rows are intentionally absent after logical dedupe;
 * their contextual metadata is protected by the MediaEntry usage semantics.
 * Project membership is usage-owned and intentionally excluded from catalog
 * semantics so the derived browsing/library projection cannot become authority.
 */
export function buildSemanticBaseline(
  trackedCatalogAssetIds,
  { normalizeDedupeAliases = false } = {},
) {
  const runtimeAssetById = new Map(mediaAssets.map((asset) => [asset.id, asset]));
  const catalogByAssetId = new Map(
    mediaCatalogItems.map((item) => [item.asset.id, item]),
  );

  const duplicateEntryIds = [];
  const seenEntryIds = new Set();
  const missingAssetRefs = [];
  const missingPosterRefs = [];

  const entrySemantics = [...mediaEntries]
    .sort((left, right) => left.id.localeCompare(right.id))
    .map((entry) => {
      if (seenEntryIds.has(entry.id)) duplicateEntryIds.push(entry.id);
      seenEntryIds.add(entry.id);

      const effectiveAssetId = normalizeDedupeAliases
        ? canonicalMediaAssetId(entry.assetId)
        : entry.assetId;
      const runtimeAsset = runtimeAssetById.get(effectiveAssetId);
      if (!runtimeAsset) {
        missingAssetRefs.push({ entryId: entry.id, assetId: effectiveAssetId });
      }

      const effectivePosterAssetId = entry.posterAssetId
        ? normalizeDedupeAliases
          ? canonicalMediaAssetId(entry.posterAssetId)
          : entry.posterAssetId
        : null;
      if (effectivePosterAssetId && !runtimeAssetById.has(effectivePosterAssetId)) {
        missingPosterRefs.push({
          entryId: entry.id,
          posterAssetId: effectivePosterAssetId,
        });
      }

      return entrySemanticRecord(entry, runtimeAsset, {
        normalizeDedupeAliases,
      });
    });

  const normalizedTrackedCatalogAssetIds = normalizeDedupeAliases
    ? [
        ...new Set(
          trackedCatalogAssetIds.map((assetId) => canonicalMediaAssetId(assetId)),
        ),
      ]
    : [...trackedCatalogAssetIds];

  const missingTrackedCatalogAssetIds = [];
  const trackedCatalogSemantics = [...normalizedTrackedCatalogAssetIds]
    .sort((left, right) => left.localeCompare(right))
    .flatMap((assetId) => {
      const item = catalogByAssetId.get(assetId);
      if (!item) {
        missingTrackedCatalogAssetIds.push(assetId);
        return [];
      }
      return [catalogSemanticRecord(item, assetId)];
    });

  return {
    entryCount: entrySemantics.length,
    uniqueEntryIdCount: seenEntryIds.size,
    duplicateEntryIds,
    missingAssetRefs,
    missingPosterRefs,
    entrySemanticsSha256: sha256(entrySemantics),
    trackedCatalogAssetIds: [...normalizedTrackedCatalogAssetIds].sort((left, right) =>
      left.localeCompare(right),
    ),
    missingTrackedCatalogAssetIds,
    trackedCatalogMetadataSha256: sha256(trackedCatalogSemantics),
  };
}

export async function readSemanticBaselineFixture() {
  return JSON.parse(await readFile(fixtureUrl, "utf8"));
}

export function compareSemanticBaseline(actual, expected) {
  const mismatches = [];
  const scalarFields = [
    "entryCount",
    "uniqueEntryIdCount",
    "entrySemanticsSha256",
    "trackedCatalogMetadataSha256",
  ];

  for (const field of scalarFields) {
    if (actual[field] !== expected[field]) {
      mismatches.push({ field, expected: expected[field], actual: actual[field] });
    }
  }

  if (canonicalJson(actual.trackedCatalogAssetIds) !== canonicalJson(expected.trackedCatalogAssetIds)) {
    mismatches.push({
      field: "trackedCatalogAssetIds",
      expected: expected.trackedCatalogAssetIds,
      actual: actual.trackedCatalogAssetIds,
    });
  }

  if (actual.duplicateEntryIds.length > 0) {
    mismatches.push({ field: "duplicateEntryIds", actual: actual.duplicateEntryIds });
  }
  if (actual.missingAssetRefs.length > 0) {
    mismatches.push({ field: "missingAssetRefs", actual: actual.missingAssetRefs });
  }
  if (actual.missingPosterRefs.length > 0) {
    mismatches.push({ field: "missingPosterRefs", actual: actual.missingPosterRefs });
  }
  if (actual.missingTrackedCatalogAssetIds.length > 0) {
    mismatches.push({
      field: "missingTrackedCatalogAssetIds",
      actual: actual.missingTrackedCatalogAssetIds,
    });
  }

  return mismatches;
}

async function main() {
  const expected = await readSemanticBaselineFixture();
  const normalizeDedupeAliases = process.argv.includes("--migration");
  const actual = buildSemanticBaseline(expected.trackedCatalogAssetIds, {
    normalizeDedupeAliases,
  });
  const mismatches = compareSemanticBaseline(actual, expected);
  const result = {
    baseSha: expected.baseSha,
    normalizeDedupeAliases,
    ...actual,
    matchesFixture: mismatches.length === 0,
    mismatches,
  };

  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);

  if (process.argv.includes("--check") && mismatches.length > 0) {
    process.exitCode = 1;
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  await main();
}
