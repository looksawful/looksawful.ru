export interface EngagementData {
  id: string;

  displayName?: string;
  date?: string;
  summary?: string;
  description?: string;

  clientIds?: readonly string[];

  primaryRoleId?: string;
  primaryRoleLabel?: string;
  roleIds?: readonly string[];

  engagementTypeIds?: readonly string[];
  industryIds?: readonly string[];
  workAreaIds?: readonly string[];
}
