import type { EntityBase } from "./entity.ts";

export type CollectionVisibility = "public" | "hidden";

export interface CollectionData extends EntityBase {
  visibility: CollectionVisibility;

  displayName?: string;
  summary?: string;

  primaryRoleId?: string;
  primaryRoleLabel?: string;
  roleIds?: readonly string[];

  workAreaIds?: readonly string[];
}
