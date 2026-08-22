import type { EntityBase } from "./entity.ts";
import type { RoleId } from "../data/taxonomy/roles.ts";
import type { WorkAreaId } from "../data/taxonomy/work-areas.ts";

export type CollectionVisibility = "public" | "hidden";

export interface CollectionData extends EntityBase {
  visibility: CollectionVisibility;

  displayName?: string;
  summary?: string;

  primaryRoleId?: RoleId;
  primaryRoleLabel?: string;
  roleIds?: readonly RoleId[];

  workAreaIds?: readonly WorkAreaId[];
}
