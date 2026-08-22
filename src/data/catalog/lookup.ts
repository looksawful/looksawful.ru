import type { CaseData } from "../../types/case.ts";
import type { ClientData } from "../../types/client.ts";
import type { RoleData, RoleId } from "../taxonomy/roles.ts";

import { cases, type CaseId } from "./cases.ts";
import { clients, type ClientId } from "./clients.ts";
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

export function getClient(id: ClientId): ClientData {
  return getById(clients, id, "Client");
}

export function getRole(id: RoleId): RoleData {
  return getById(roles, id, "Role");
}
