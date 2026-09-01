export type CaseVisibility = "public" | "hidden";

export interface CaseData {
  id: string;
  name: string;

  visibility: CaseVisibility;

  summary?: string;
  description?: string;
  date?: string;
  periodLabel?: string;

  clientIds?: readonly string[];
  engagementIds?: readonly string[];

  primaryRoleId?: string;
  primaryRoleLabel?: string;
  roleIds?: readonly string[];

  engagementTypeIds?: readonly string[];
  industryIds?: readonly string[];
}
