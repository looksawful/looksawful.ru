import type { ProjectCardPresentation } from "../../data/projects.ts";

export {
  renderProjectCard as renderPortfolioEntityCard,
} from "../portfolio-entity-card-renderer.ts";

export type {
  ProjectCardRenderOptions as PortfolioEntityCardRenderOptions,
} from "../portfolio-entity-card-renderer.ts";

/** Canonical semantic name for the current Home Case/Collection card presentation. */
export type PortfolioEntityCardPresentation = ProjectCardPresentation;
