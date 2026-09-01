import type { ProjectCardPresentation } from "../../data/projects.ts";
import { sitePages } from "./manifest.ts";

export function getProjectCardHref(
  card: Pick<ProjectCardPresentation, "id" | "pageId">,
): string {
  const page = sitePages.find((candidate) => candidate.id === card.pageId);

  if (!page || !page.enabled) {
    return `#project-${card.id}`;
  }

  return page.path;
}

export const getHomeCardHref = getProjectCardHref;
