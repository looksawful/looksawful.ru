import type { CaseId } from "../../data/catalog/cases.ts";
import type { CollectionId } from "../../data/catalog/collections.ts";
import type { ProjectId } from "../../data/catalog/projects/index.ts";

export type HomepageRenderMode = "full" | "compact" | "card" | "none";

export type HomepageEntityReference =
  | { type: "case"; id: CaseId }
  | { type: "project"; id: ProjectId }
  | { type: "collection"; id: CollectionId };

export interface HomepageEntry {
  entity: HomepageEntityReference;
  mode: HomepageRenderMode;
  order: number;
}

export const homepageEntries = [
  {
    entity: { type: "case", id: "jestei-pool" },
    mode: "full",
    order: 10,
  },
  {
    entity: { type: "case", id: "styx" },
    mode: "full",
    order: 20,
  },
  {
    entity: { type: "case", id: "sensetique" },
    mode: "full",
    order: 30,
  },
  {
    entity: { type: "collection", id: "music-photography" },
    mode: "full",
    order: 40,
  },
] as const satisfies readonly HomepageEntry[];

function entityKey(entity: HomepageEntityReference): string {
  return `${entity.type}:${entity.id}`;
}

export function assertHomepagePresentationSupported(
  entries: readonly HomepageEntry[],
): void {
  for (const entry of entries) {
    if (entry.mode !== "full") {
      throw new Error(
        `Homepage render mode is not implemented: ${entityKey(entry.entity)} -> ${entry.mode}`,
      );
    }
  }
}

assertHomepagePresentationSupported(homepageEntries);
