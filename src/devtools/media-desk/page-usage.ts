import pageUsageIndex from "../../data/media/page-usage.generated.json" with { type: "json" };
import type { MediaDeskPageUsageRecord } from "./usage-sources.ts";

export interface MediaDeskUnresolvedPageUsage {
  readonly ownerId: string;
  readonly route: string;
  readonly sourcePath: string;
  readonly referencedPath: string;
}

function pageRecord(value: unknown): value is MediaDeskPageUsageRecord {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<MediaDeskPageUsageRecord>;
  return typeof candidate.assetId === "string"
    && typeof candidate.ownerId === "string"
    && typeof candidate.route === "string"
    && typeof candidate.sourcePath === "string"
    && typeof candidate.referencedPath === "string";
}

function unresolvedRecord(value: unknown): value is MediaDeskUnresolvedPageUsage {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<MediaDeskUnresolvedPageUsage>;
  return typeof candidate.ownerId === "string"
    && typeof candidate.route === "string"
    && typeof candidate.sourcePath === "string"
    && typeof candidate.referencedPath === "string";
}

export const pageUsageRecords: readonly MediaDeskPageUsageRecord[] = Array.isArray(pageUsageIndex.records)
  ? pageUsageIndex.records.filter(pageRecord)
  : [];

export const unresolvedPageUsages: readonly MediaDeskUnresolvedPageUsage[] = Array.isArray(pageUsageIndex.unresolved)
  ? pageUsageIndex.unresolved.filter(unresolvedRecord)
  : [];
