import { cmsCatalogPath } from "./cms-asset.mjs";

function usage(kind, ownerId, sourcePath, fieldPath, route) {
  return {
    kind,
    ownerId,
    sourcePath,
    ...(fieldPath ? { fieldPath } : {}),
    ...(route ? { route } : {}),
    blockingDelete: true,
  };
}

function staticEntryAssetMap(staticUsage) {
  const map = new Map();
  for (const binding of staticUsage?.bindings ?? []) {
    if (binding?.usage?.kind === "direct-placement" && binding?.usage?.ownerId) {
      map.set(binding.usage.ownerId, binding.assetId);
    }
  }
  return map;
}
export function deriveCmsDeleteBlockers({
  assetId,
  record,
  projects = [],
  coverOverrides = {},
  pageUsage = { records: [] },
  staticUsage = { bindings: [], petCards: [] },
}) {
  const blockers = [];
  if (record?.showInCatalog === true && record?.archived !== true) {
    blockers.push(usage("gallery", assetId, cmsCatalogPath(assetId), "showInCatalog", "/gallery/"));
  }

  for (const project of projects) {
    if (project?.cover?.src === record?.src) {
      blockers.push(usage(
        "project-cover",
        String(project.id),
        "src/content/projects.json",
        `${project.id}.cover.src`,
      ));
    }
  }
  const entryAsset = staticEntryAssetMap(staticUsage);
  for (const card of staticUsage?.petCards ?? []) {
    const entryId = coverOverrides?.[card?.id] ?? card?.coverEntryId;
    if (entryAsset.get(entryId) === assetId) {
      blockers.push(usage(
        "pet-cover",
        String(card.id),
        "src/content/subproject-card-covers.json",
        `${card.id}.coverEntryId`,
        card?.href,
      ));
    }
  }

  for (const recordUsage of pageUsage?.records ?? []) {
    if (recordUsage?.assetId !== assetId) continue;
    blockers.push(usage(
      "page-media",
      String(recordUsage.ownerId),
      String(recordUsage.sourcePath),
      String(recordUsage.referencedPath),
      String(recordUsage.route),
    ));
  }
  for (const binding of staticUsage?.bindings ?? []) {
    if (binding?.assetId !== assetId || binding?.usage?.blockingDelete !== true) continue;
    blockers.push({ ...binding.usage });
  }

  return blockers.sort((left, right) =>
    left.kind.localeCompare(right.kind)
    || left.ownerId.localeCompare(right.ownerId)
    || left.sourcePath.localeCompare(right.sourcePath));
}
