import type { ProjectId } from "../../data/catalog/projects/index.ts";
import type { MediaEntryId } from "../../data/media/index.ts";

export type ProjectTeaserShape = "landscape" | "square" | "portrait";

/**
 * Target presentation contract for a canonical Project teaser.
 * Canonical Project title/description/date/role are resolved from Project by projectId.
 */
export interface ProjectTeaserPresentation {
  projectId: ProjectId;
  coverEntryId: MediaEntryId;
  shape: ProjectTeaserShape;
  hrefOverride?: string;
}
