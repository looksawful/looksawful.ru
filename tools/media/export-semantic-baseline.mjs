import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import {
  mediaAssets,
  mediaCatalogItems,
  mediaEntries,
} from "../../src/data/media/index.ts";
import { registeredMediaAssets } from "../../src/data/media/assets/registered.ts";
import { mediaCatalogItems as baseMediaCatalogItems } from "../../src/data/media/catalog.ts";
import { dedupeUsageEvidenceByEntryId } from "../../src/data/media/usage-records.ts";

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

function entrySemanticRecord(entry, asset, assetId = entry.assetId) {
  return {
    id: entry.id,
    assetId,
    projectIds: entry.projectIds ?? [],
    creditId: entry.creditId ?? null,
    alt: entry.alt ?? null,
    posterAssetId: entry.posterAssetId ?? null,
    caption: entry.caption ?? null,
    purpose: entry.purpose ?? null,
    mediaType: asset?.type ?? null,
    src: asset?.src ?? null,
  };
}

function catalogSemanticRecord(item, assetId = item.asset.id) {
  return {
    assetId,
    title: item.title,
    alt: item.alt,
    description: item.description,
    date: item.date,
    projectIds: item.projectIds,
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
 * During the reviewed dedupe migration, runtime entries intentionally point at
 * canonical assets. `normalizeDedupeAliases` projects only those asset
 * identities back to their pre-dedupe values for comparison with the frozen
 * 83ea6cb8 fixture. Contextual values are never normalized, unioned or dropped.
 *
 * The migration comparison reads the legacy/base catalog projection because
 * retired rows remain available until the final source cleanup. Runtime
 * browsing is validated independently through catalog-view tests.
 */
export function buildSemanticBaseline(
  trackedCatalogAssetIds,
  { normalizeDedupeAliases = false } = {},
) {
  const runtimeAssetById = new Map(mediaAssets.map((asset) => [asset.id, asset]));
  const legacyAssetById = new Map(
    [...registeredMediaAssets, ...mediaAssets].map((asset) => [asset.id, asset]),
  );
  const catalogItems = normalizeDedupeAliases
    ? baseMediaCatalogItems
    : mediaCatalogItems;
  const catalogByAssetId = new Map(
    catalogItems.map((item) => [item.asset.id, item]),
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

      const runtimeAsset = runtimeAssetById.get(entry.assetId);
      if (!runtimeAsset) {
        missingAssetRefs.push({ entryId: entry.id, assetId: entry.assetId });
      }

      if (entry.posterAssetId && !runtimeAssetById.has(entry.posterAssetId)) {
        missingPosterRefs.push({ entryId: entry.id, posterAssetId: entry.posterAssetId });
      }

      if (!normalizeDedupeAliases) {
        return entrySemanticRecord(entry, runtimeAsset);
      }

      const migration = dedupeUsageEvidenceByEntryId.get(entry.id);
      const baselineAssetId =
        migration && entry.assetId === migration.toAssetId
          ? migration.fromAssetId
          : entry.assetId;
      const baselineAsset = legacyAssetById.get(baselineAssetId) ?? runtimeAsset;
      return entrySemanticRecord(entry, baselineAsset, baselineAssetId);
    });

  const missingTrackedCatalogAssetIds = [];
  const trackedCatalogSemantics = [...trackedCatalogAssetIds]
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
    trackedCatalogAssetIds: [...trackedCatalogAssetIds].sort((left, right) =>
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
