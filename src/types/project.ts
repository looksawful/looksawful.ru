export type ProjectStatus = "active" | "completed" | "archived";

export interface ProjectData {
  id: string;
  name: string;

  summary?: string;
  description?: string;
  date?: string;
  status?: ProjectStatus;

  caseIds?: readonly string[];
  clientIds?: readonly string[];
  collectionIds?: readonly string[];
  engagementIds?: readonly string[];

  projectTypeIds?: readonly string[];
  engagementTypeIds?: readonly string[];
  industryIds?: readonly string[];

  primaryRoleId?: string;
  primaryRoleLabel?: string;
  roleIds?: readonly string[];

  workAreaIds?: readonly string[];
  serviceIds?: readonly string[];
  deliverableIds?: readonly string[];

  skillIds?: readonly string[];
  technologyIds?: readonly string[];
  softwareIds?: readonly string[];

  professionalQualityIds?: readonly string[];
}
