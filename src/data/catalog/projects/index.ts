import { jesteiPoolProjects } from "./jestei-pool.ts";

export const projects = [
  ...jesteiPoolProjects,
] as const;

export type Project = (typeof projects)[number];
export type ProjectId = Project["id"];
