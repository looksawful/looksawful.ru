import type { ProjectCardPresentation } from "../../data/projects.ts";

export {
  renderProjectCard as renderPortfolioEntityCard,
} from "../../templates/project-card.ts";

export type {
  ProjectCardRenderOptions as PortfolioEntityCardRenderOptions,
} from "../../templates/project-card.ts";

/** Canonical semantic name for the current Home Case/Collection card presentation. */
export type PortfolioEntityCardPresentation = ProjectCardPresentation;
