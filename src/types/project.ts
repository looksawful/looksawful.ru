export type ProjectStatus = "active" | "completed" | "archived";

export interface ProjectIdTypes {
  caseId: string;
  clientId: string;
  collectionId: string;
  engagementId: string;
  projectTypeId: string;
  engagementTypeId: string;
  industryId: string;
  roleId: string;
  workAreaId: string;
  serviceId: string;
  deliverableId: string;
  skillId: string;
  technologyId: string;
  softwareId: string;
  professionalQualityId: string;
}

export interface ProjectData<Ids extends ProjectIdTypes = ProjectIdTypes> {
  id: string;
  name: string;

  summary?: string;
  description?: string;
  date?: string;
  status?: ProjectStatus;

  caseIds?: readonly Ids["caseId"][];
  clientIds?: readonly Ids["clientId"][];
  collectionIds?: readonly Ids["collectionId"][];
  engagementIds?: readonly Ids["engagementId"][];

  projectTypeIds?: readonly Ids["projectTypeId"][];
  engagementTypeIds?: readonly Ids["engagementTypeId"][];
  industryIds?: readonly Ids["industryId"][];

  primaryRoleId?: Ids["roleId"];
  primaryRoleLabel?: string;
  roleIds?: readonly Ids["roleId"][];

  workAreaIds?: readonly Ids["workAreaId"][];
  serviceIds?: readonly Ids["serviceId"][];
  deliverableIds?: readonly Ids["deliverableId"][];

  skillIds?: readonly Ids["skillId"][];
  technologyIds?: readonly Ids["technologyId"][];
  softwareIds?: readonly Ids["softwareId"][];

  professionalQualityIds?: readonly Ids["professionalQualityId"][];
}
