import type { EntityBase } from "./entity.ts";
import type { WorkAreaId } from "../data/taxonomy/work-areas.ts";

export type CollectionVisibility = "public" | "hidden";

export interface CollectionData extends EntityBase {
  visibility: CollectionVisibility;
  workAreaIds?: readonly WorkAreaId[];
}
