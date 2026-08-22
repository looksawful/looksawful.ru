import type { ClientId } from "../data/catalog/clients.ts";
import type { EngagementTypeId } from "../data/taxonomy/engagement-types.ts";
import type { IndustryId } from "../data/taxonomy/industries.ts";
import type { RoleId } from "../data/taxonomy/roles.ts";
import type { WorkAreaId } from "../data/taxonomy/work-areas.ts";

export interface EngagementData {
  id: string;

  displayName?: string;
  date?: string;
  summary?: string;
  description?: string;

  clientIds?: readonly ClientId[];

  primaryRoleId?: RoleId;
  primaryRoleLabel?: string;
  roleIds?: readonly RoleId[];

  engagementTypeIds?: readonly EngagementTypeId[];
  industryIds?: readonly IndustryId[];
  workAreaIds?: readonly WorkAreaId[];
}
