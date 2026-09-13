import type { MediaCatalogItem } from "../../data/media/catalog.ts";
import type { ProjectCardPresentation } from "../../data/projects.ts";
import type { SubprojectCardData } from "../../data/subproject-cards.ts";
import type {
  MediaDeskUsageBinding,
  MediaDeskUsageRecordLike,
} from "./inventory-model.ts";

function binding(
  assetId: string,
  usage: MediaDeskUsageBinding["usage"],
): MediaDeskUsageBinding {
  return { assetId, usage };
}

function catalogSourcePath(item: MediaCatalogItem): string {
  const assetId = item.asset.id;
  if (item.origin === "cms") {
    const recordId = assetId.startsWith("cms-") ? assetId.slice(4) : assetId;
    return `src/content/media-catalog/uploads/${recordId}.json`;
  }
  return `src/content/media-catalog/registered/${assetId}.json`;
}

export function galleryUsages(
  items: readonly MediaCatalogItem[],
): readonly MediaDeskUsageBinding[] {
  return items
    .filter((item) => item.showInCatalog && !item.archived)
    .map((item) => binding(item.asset.id, {
      kind: "gallery",
      ownerId: item.asset.id,
      sourcePath: catalogSourcePath(item),
      fieldPath: "showInCatalog",
      route: "/gallery/",
      blockingDelete: true,
    }));
}

export function mediaEntryUsages(
  entries: readonly MediaDeskUsageRecordLike[],
): readonly MediaDeskUsageBinding[] {
  const result: MediaDeskUsageBinding[] = [];
  for (const entry of entries) {
    result.push(binding(entry.assetId, {
      kind: "direct-placement",
      ownerId: entry.id,
      sourcePath: "src/data/media/entries",
      fieldPath: entry.id,
      blockingDelete: true,
    }));
    if (entry.posterAssetId) {
      result.push(binding(entry.posterAssetId, {
        kind: "video-poster",
        ownerId: entry.id,
        sourcePath: "src/data/media/entries",
        fieldPath: `${entry.id}.posterAssetId`,
        blockingDelete: true,
      }));
    }
  }
  return result;
}

export function projectCoverUsages(
  cards: readonly ProjectCardPresentation[],
  catalog: readonly MediaCatalogItem[],
): readonly MediaDeskUsageBinding[] {
  const byPath = new Map(catalog.map((item) => [item.asset.src, item.asset.id] as const));
  return cards.map((card) => {
    const assetId = byPath.get(card.cover.src);
    if (!assetId) {
      throw new Error(`Unresolved project cover: ${card.id} -> ${card.cover.src}`);
    }
    return binding(assetId, {
      kind: "project-cover",
      ownerId: card.id,
      sourcePath: "src/content/projects.json",
      fieldPath: `${card.id}.cover.src`,
      blockingDelete: true,
    });
  });
}

export function petCoverUsages(
  cards: readonly SubprojectCardData[],
  entries: readonly MediaDeskUsageRecordLike[],
): readonly MediaDeskUsageBinding[] {
  const byEntryId = new Map(entries.map((entry) => [entry.id, entry] as const));
  return cards.map((card) => {
    const entry = byEntryId.get(card.coverEntryId);
    if (!entry) {
      throw new Error(`Unresolved pet cover: ${card.id} -> ${card.coverEntryId}`);
    }
    return binding(entry.assetId, {
      kind: "pet-cover",
      ownerId: card.id,
      sourcePath: "src/data/subproject-cards.ts",
      fieldPath: `${card.id}.coverEntryId`,
      route: card.href?.startsWith("/") ? card.href : undefined,
      blockingDelete: true,
    });
  });
}
