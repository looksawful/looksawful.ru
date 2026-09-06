import type { MediaCatalogItem } from "../../data/media/catalog.ts";
import { getMediaDeskIssues, mediaDeskCompleteness, type MediaDeskReviewFilter } from "./model.ts";

export interface MediaProjectCount {
  projectId: string;
  count: number;
}

export interface MediaDeskAnalysis {
  total: number;
  imageCount: number;
  videoCount: number;
  modelCount: number;
  archived: number;
  reusable: number;
  missingAlt: number;
  missingDescription: number;
  missingProject: number;
  needsReview: number;
  knownTotalByteLength: number;
  averageCompleteness: number;
  largestAssets: readonly { id: string; title: string; byteLength: number }[];
  projects: readonly MediaProjectCount[];
}

export type MediaAnalysisFilterIntent = Extract<
  MediaDeskReviewFilter,
  "missing-alt" | "missing-description" | "missing-project" | "archived"
>;

export const MEDIA_ANALYSIS_FILTER_EVENT = "media-desk:analysis-filter";

export function dispatchMediaAnalysisFilterIntent(
  target: EventTarget,
  intent: MediaAnalysisFilterIntent,
): void {
  target.dispatchEvent(new CustomEvent(MEDIA_ANALYSIS_FILTER_EVENT, { detail: { intent } }));
}

export function analyzeMediaDeskItems(items: readonly MediaCatalogItem[]): MediaDeskAnalysis {
  const projects = new Map<string, number>();
  let imageCount = 0;
  let videoCount = 0;
  let modelCount = 0;
  let archived = 0;
  let reusable = 0;
  let missingAlt = 0;
  let missingDescription = 0;
  let missingProject = 0;
  let needsReview = 0;
  let knownTotalByteLength = 0;
  let completeness = 0;

  for (const item of items) {
    if (item.asset.type === "image") imageCount += 1;
    else if (item.asset.type === "video") videoCount += 1;
    else modelCount += 1;
    if (item.archived) archived += 1;
    if (item.reusable) reusable += 1;
    const issues = getMediaDeskIssues(item);
    if (issues.includes("missing-alt")) missingAlt += 1;
    if (issues.includes("missing-description")) missingDescription += 1;
    if (issues.includes("missing-project")) missingProject += 1;
    if (issues.length > 0) needsReview += 1;
    knownTotalByteLength += item.byteLength ?? 0;
    completeness += mediaDeskCompleteness(item);
    for (const projectId of item.projectIds) {
      projects.set(projectId, (projects.get(projectId) ?? 0) + 1);
    }
  }

  return {
    total: items.length,
    imageCount,
    videoCount,
    modelCount,
    archived,
    reusable,
    missingAlt,
    missingDescription,
    missingProject,
    needsReview,
    knownTotalByteLength,
    averageCompleteness: items.length === 0 ? 0 : completeness / items.length,
    largestAssets: items
      .filter((item) => (item.byteLength ?? 0) > 0)
      .map((item) => ({ id: item.asset.id, title: item.title, byteLength: item.byteLength ?? 0 }))
      .sort((left, right) => right.byteLength - left.byteLength)
      .slice(0, 10),
    projects: [...projects.entries()]
      .map(([projectId, count]) => ({ projectId, count }))
      .sort((left, right) => right.count - left.count || left.projectId.localeCompare(right.projectId)),
  };
}
