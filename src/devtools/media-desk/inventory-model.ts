import type { MediaCatalogItem } from "../../data/media/catalog.ts";

export type MediaDeskInventoryDiagnostic =
  | "orphan"
  | "missing-source"
  | "duplicate-id"
  | "duplicate-path";

export type MediaDeskInventoryUsageFilter = "all" | "used" | "orphan";
export type MediaDeskInventoryDiagnosticFilter = "all" | MediaDeskInventoryDiagnostic;

export interface MediaDeskUsageRecordLike {
  readonly id: string;
  readonly assetId: string;
  readonly posterAssetId?: string;
  readonly projectIds?: readonly string[];
}

export interface MediaDeskInventoryUsage {
  readonly direct: number;
  readonly poster: number;
  readonly total: number;
  readonly entryIds: readonly string[];
  readonly projectIds: readonly string[];
}

export interface MediaDeskInventoryRecord {
  readonly assetId: string;
  readonly item: MediaCatalogItem;
  readonly usage: MediaDeskInventoryUsage;
  readonly diagnostics: readonly MediaDeskInventoryDiagnostic[];
}

export interface MediaDeskInventoryFilterState {
  readonly search?: string;
  readonly usage?: MediaDeskInventoryUsageFilter;
  readonly diagnostic?: MediaDeskInventoryDiagnosticFilter;
}

export interface MediaDeskInventoryDiagnosticSummary {
  readonly orphan: number;
  readonly "missing-source": number;
  readonly "duplicate-id": number;
  readonly "duplicate-path": number;
}

interface MutableUsage {
  direct: number;
  poster: number;
  entryIds: string[];
  projectIds: string[];
}

const DIAGNOSTIC_ORDER: readonly MediaDeskInventoryDiagnostic[] = [
  "orphan",
  "missing-source",
  "duplicate-id",
  "duplicate-path",
];

function addUnique(target: string[], value: string): void {
  if (value && !target.includes(value)) target.push(value);
}

function usageFor(
  usageByAssetId: Map<string, MutableUsage>,
  assetId: string,
): MutableUsage {
  const existing = usageByAssetId.get(assetId);
  if (existing) return existing;
  const next: MutableUsage = {
    direct: 0,
    poster: 0,
    entryIds: [],
    projectIds: [],
  };
  usageByAssetId.set(assetId, next);
  return next;
}

function registerPlacement(
  usage: MutableUsage,
  entry: MediaDeskUsageRecordLike,
): void {
  addUnique(usage.entryIds, entry.id);
  for (const projectId of entry.projectIds ?? []) addUnique(usage.projectIds, projectId);
}

function countBy(values: readonly string[]): ReadonlyMap<string, number> {
  const counts = new Map<string, number>();
  for (const value of values) {
    if (!value) continue;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return counts;
}

function searchableText(record: MediaDeskInventoryRecord): string {
  const { item, usage } = record;
  const sourceMaster = item.asset.type === "video" ? item.asset.sourceSrc ?? "" : "";
  return [
    record.assetId,
    item.asset.src,
    sourceMaster,
    item.origin,
    item.asset.type,
    item.title,
    item.alt,
    item.description,
    item.mimeType ?? "",
    ...item.projectIds,
    ...item.workAreaIds,
    ...item.projectTypeIds,
    ...item.deliverableIds,
    ...item.tags,
    ...item.credits,
    ...usage.entryIds,
    ...usage.projectIds,
    ...record.diagnostics,
  ]
    .join(" ")
    .trim()
    .toLocaleLowerCase();
}

export function buildMediaDeskInventoryIndex(
  items: readonly MediaCatalogItem[],
  entries: readonly MediaDeskUsageRecordLike[],
): readonly MediaDeskInventoryRecord[] {
  const usageByAssetId = new Map<string, MutableUsage>();

  for (const entry of entries) {
    const direct = usageFor(usageByAssetId, entry.assetId);
    direct.direct += 1;
    registerPlacement(direct, entry);

    if (entry.posterAssetId) {
      const poster = usageFor(usageByAssetId, entry.posterAssetId);
      poster.poster += 1;
      registerPlacement(poster, entry);
    }
  }

  const idCounts = countBy(items.map(({ asset }) => asset.id));
  const pathCounts = countBy(items.map(({ asset }) => asset.src.trim()));

  return items.map((item) => {
    const usage = usageByAssetId.get(item.asset.id) ?? {
      direct: 0,
      poster: 0,
      entryIds: [],
      projectIds: [],
    };
    const total = usage.direct + usage.poster;
    const diagnostics: MediaDeskInventoryDiagnostic[] = [];

    if (total === 0) diagnostics.push("orphan");
    if (!item.asset.src.trim()) diagnostics.push("missing-source");
    if ((idCounts.get(item.asset.id) ?? 0) > 1) diagnostics.push("duplicate-id");
    if (item.asset.src.trim() && (pathCounts.get(item.asset.src.trim()) ?? 0) > 1) {
      diagnostics.push("duplicate-path");
    }

    return {
      assetId: item.asset.id,
      item,
      usage: {
        direct: usage.direct,
        poster: usage.poster,
        total,
        entryIds: [...usage.entryIds],
        projectIds: [...usage.projectIds],
      },
      diagnostics: DIAGNOSTIC_ORDER.filter((diagnostic) => diagnostics.includes(diagnostic)),
    };
  });
}

export function filterMediaDeskInventoryRecords(
  records: readonly MediaDeskInventoryRecord[],
  state: MediaDeskInventoryFilterState,
): readonly MediaDeskInventoryRecord[] {
  const search = (state.search ?? "").trim().toLocaleLowerCase();
  const usage = state.usage ?? "all";
  const diagnostic = state.diagnostic ?? "all";

  return records.filter((record) => {
    if (usage === "used" && record.usage.total === 0) return false;
    if (usage === "orphan" && record.usage.total !== 0) return false;
    if (diagnostic !== "all" && !record.diagnostics.includes(diagnostic)) return false;
    if (search && !searchableText(record).includes(search)) return false;
    return true;
  });
}

export function summarizeMediaDeskDiagnostics(
  records: readonly MediaDeskInventoryRecord[],
): MediaDeskInventoryDiagnosticSummary {
  const summary: MediaDeskInventoryDiagnosticSummary = {
    orphan: 0,
    "missing-source": 0,
    "duplicate-id": 0,
    "duplicate-path": 0,
  };

  for (const record of records) {
    for (const diagnostic of record.diagnostics) {
      summary[diagnostic] += 1;
    }
  }
  return summary;
}
