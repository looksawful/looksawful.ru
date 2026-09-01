import { jesteiPoolProjects } from "./jestei-pool.ts";
import { otherProjects } from "./other.ts";
import { sensetiqueProjects } from "./sensetique.ts";
import { shootingsProjects } from "./shootings.ts";
import { styxProjects } from "./styx.ts";
import type { CanonicalProjectData } from "./types.ts";

export const projects = [
  ...jesteiPoolProjects,
  ...styxProjects,
  ...sensetiqueProjects,
  ...shootingsProjects,
  ...otherProjects,
] as const satisfies readonly CanonicalProjectData[];

export type Project = (typeof projects)[number];
export type ProjectId = Project["id"];
