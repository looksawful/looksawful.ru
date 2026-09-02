import type { MediaCatalogItem } from "../../data/media/catalog.ts";

export type MediaDeskReviewFilter =
  | "all"
  | "needs-review"
  | "missing-alt"
  | "missing-description"
  | "missing-project"
  | "archived";

export type MediaDeskSort = "title" | "recent" | "project" | "completeness-desc";

export interface MediaDeskState {
  search?: string;
  mediaType?: "all" | "image" | "video" | "model";
  projectId?: string;
  review?: MediaDeskReviewFilter;
  sort?: MediaDeskSort;
}

export type MediaDeskIssue = "missing-alt" | "missing-description" | "missing-project";

const normalize = (value: string): string => value.trim().toLocaleLowerCase();

export function getMediaDeskIssues(item: MediaCatalogItem): readonly MediaDeskIssue[] {
  const issues: MediaDeskIssue[] = [];
  if (!item.alt.trim()) issues.push("missing-alt");
  if (!item.description.trim()) issues.push("missing-description");
  if (item.projectIds.length === 0) issues.push("missing-project");
  return issues;
}

export function mediaDeskCompleteness(item: MediaCatalogItem): number {
  const checks = [
    item.title.trim().length > 0,
    item.alt.trim().length > 0,
    item.description.trim().length > 0,
    item.projectIds.length > 0,
    item.workAreaIds.length > 0,
    item.tags.length > 0,
    item.credits.length > 0,
  ];
  return checks.filter(Boolean).length / checks.length;
}

function projectLabel(item: MediaCatalogItem, projectNames: ReadonlyMap<string, string>): string {
  return item.projectIds.map((id) => projectNames.get(id) ?? id).join(" · ");
}

function searchableText(item: MediaCatalogItem, projectNames: ReadonlyMap<string, string>): string {
  return normalize([
    item.asset.id,
    item.title,
    item.alt,
    item.description,
    projectLabel(item, projectNames),
    ...item.projectIds,
    ...item.workAreaIds,
    ...item.projectTypeIds,
    ...item.deliverableIds,
    ...item.tags,
    ...item.credits,
  ].join(" "));
}

function matchesReview(item: MediaCatalogItem, review: MediaDeskReviewFilter): boolean {
  if (review === "all") return true;
  if (review === "archived") return item.archived;
  const issues = getMediaDeskIssues(item);
  if (review === "needs-review") return issues.length > 0;
  return issues.includes(review);
}

function timestamp(value: string): number {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function filterAndSortMediaDeskItems(
  items: readonly MediaCatalogItem[],
  state: MediaDeskState,
  projectNames: ReadonlyMap<string, string>,
): readonly MediaCatalogItem[] {
  const search = normalize(state.search ?? "");
  const mediaType = state.mediaType ?? "all";
  const projectId = state.projectId ?? "";
  const review = state.review ?? "all";
  const sort = state.sort ?? "recent";

  const filtered = items.filter((item) => {
    if (mediaType !== "all" && item.asset.type !== mediaType) return false;
    if (projectId && !item.projectIds.includes(projectId as never)) return false;
    if (!matchesReview(item, review)) return false;
    if (search && !searchableText(item, projectNames).includes(search)) return false;
    return true;
  });

  return [...filtered].sort((left, right) => {
    if (sort === "title") return left.title.localeCompare(right.title);
    if (sort === "project") {
      return projectLabel(left, projectNames).localeCompare(projectLabel(right, projectNames))
        || left.title.localeCompare(right.title);
    }
    if (sort === "completeness-desc") {
      return mediaDeskCompleteness(right) - mediaDeskCompleteness(left)
        || left.title.localeCompare(right.title);
    }
    return timestamp(right.date) - timestamp(left.date)
      || left.title.localeCompare(right.title);
  });
}
