import type { CaseId } from "../data/catalog/cases.ts";
import type { ClientId } from "../data/catalog/clients.ts";
import type { CollectionId } from "../data/catalog/collections.ts";
import type { EngagementId } from "../data/catalog/engagements.ts";

import type { DeliverableId } from "../data/taxonomy/deliverables.ts";
import type { EngagementTypeId } from "../data/taxonomy/engagement-types.ts";
import type { IndustryId } from "../data/taxonomy/industries.ts";
import type { ProfessionalQualityId } from "../data/taxonomy/professional-qualities.ts";
import type { ProjectTypeId } from "../data/taxonomy/project-types.ts";
import type { RoleId } from "../data/taxonomy/roles.ts";
import type { ServiceId } from "../data/taxonomy/services.ts";
import type { SkillId } from "../data/taxonomy/skills.ts";
import type { SoftwareId } from "../data/taxonomy/software.ts";
import type { TechnologyId } from "../data/taxonomy/technologies.ts";
import type { WorkAreaId } from "../data/taxonomy/work-areas.ts";

export type ProjectStatus = "active" | "completed" | "archived";

export interface ProjectData {
  id: string;
  name: string;

  summary?: string;
  description?: string;
  date?: string;
  status?: ProjectStatus;

  caseIds?: readonly CaseId[];
  clientIds?: readonly ClientId[];
  collectionIds?: readonly CollectionId[];
  engagementIds?: readonly EngagementId[];

  projectTypeIds?: readonly ProjectTypeId[];
  engagementTypeIds?: readonly EngagementTypeId[];
  industryIds?: readonly IndustryId[];

  primaryRoleId?: RoleId;
  primaryRoleLabel?: string;
  roleIds?: readonly RoleId[];

  workAreaIds?: readonly WorkAreaId[];
  serviceIds?: readonly ServiceId[];
  deliverableIds?: readonly DeliverableId[];

  skillIds?: readonly SkillId[];
  technologyIds?: readonly TechnologyId[];
  softwareIds?: readonly SoftwareId[];

  professionalQualityIds?: readonly ProfessionalQualityId[];
}
