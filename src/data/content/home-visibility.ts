import visibilityJson from "../../content/visibility/home.json" with { type: "json" };
import { parseSectionVisibility } from "./section-visibility.ts";

export const homeSectionIds = ["client-logo-wall"] as const;
export type HomeSectionId = (typeof homeSectionIds)[number];

const rawVisibility: unknown = visibilityJson;
const homeSectionVisibility = parseSectionVisibility(rawVisibility, homeSectionIds);
const visibilityById = new Map(
  homeSectionVisibility.map(({ id, visible }) => [id, visible]),
);

export function isHomeSectionVisible(id: HomeSectionId): boolean {
  const visible = visibilityById.get(id);
  if (visible === undefined) {
    throw new Error(`missing required home section visibility id: ${id}`);
  }
  return visible;
}
