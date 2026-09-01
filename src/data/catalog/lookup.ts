import type { CaseData } from "../../types/case.ts";
import type { ClientData } from "../../types/client.ts";
import type { CollectionData } from "../../types/collection.ts";
import type { EngagementData } from "../../types/engagement.ts";
import type { ProjectData } from "../../types/project.ts";
import type { RoleData } from "../taxonomy/roles.ts";

import { cases, type CaseId } from "./cases.ts";
import { clients } from "./clients.ts";
import { collections, type CollectionId } from "./collections.ts";
import { engagements, type EngagementId } from "./engagements.ts";
import { projects, type ProjectId } from "./projects/index.ts";
import { roles } from "../taxonomy/roles.ts";

function getById<T extends { id: string }>(
  items: readonly T[],
  id: string,
  entityName: string,
): T {
  const item = items.find((candidate) => candidate.id === id);

  if (!item) {
    throw new Error(`Unknown ${entityName}: ${id}`);
  }

  return item;
}

export function getCase(id: CaseId): CaseData {
  return getById(cases, id, "Case");
}

export function getClient(id: string): ClientData {
  return getById(clients, id, "Client");
}

export function getCollection(id: CollectionId): CollectionData {
  return getById(collections, id, "Collection");
}

export function getEngagement(id: EngagementId): EngagementData {
  return getById(engagements, id, "Engagement");
}

export function getProject(id: ProjectId): ProjectData {
  return getById(projects, id, "Project");
}

export function getRole(id: string): RoleData {
  return getById(roles, id, "Role");
}
