import type { ProjectId as ProjectCardId } from "../../data/projects.ts";
import { sitePages } from "./manifest.ts";

const projectCardPageIds = {
  jestei: "case:jestei-pool",
  styx: "case:styx",
  sensetique: "case:sensetique",
  shootings: "collection:music-photography",
} as const satisfies Record<ProjectCardId, (typeof sitePages)[number]["id"]>;

export function getProjectCardHref(id: ProjectCardId): string {
  const pageId = projectCardPageIds[id];
  const page = sitePages.find((candidate) => candidate.id === pageId);

  if (!page || !page.enabled) {
    return `#project-${id}`;
  }

  return page.path;
}
