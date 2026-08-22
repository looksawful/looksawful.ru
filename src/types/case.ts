import type { ClientId } from "../data/catalog/clients.ts";
import type { EngagementTypeId } from "../data/taxonomy/engagement-types.ts";
import type { IndustryId } from "../data/taxonomy/industries.ts";
import type { RoleId } from "../data/taxonomy/roles.ts";

export type CaseVisibility = "public" | "hidden";

export interface CaseData {
  id: string;
  name: string;

  visibility: CaseVisibility;

  summary?: string;
  description?: string;
  date?: string;

  clientIds?: readonly ClientId[];
  roleIds?: readonly RoleId[];
  engagementTypeIds?: readonly EngagementTypeId[];
  industryIds?: readonly IndustryId[];
}
