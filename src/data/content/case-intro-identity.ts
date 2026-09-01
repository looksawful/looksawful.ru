import type { CaseId } from "../catalog/cases.ts";
import { getCase, getRole } from "../catalog/lookup.ts";

export interface CaseIntroIdentity {
  role: string;
  period: string;
}

export function resolveCaseIntroIdentity(id: CaseId): CaseIntroIdentity {
  const caseData = getCase(id);
  const role = caseData.primaryRoleLabel
    ?? (caseData.primaryRoleId ? getRole(caseData.primaryRoleId).name : "");

  return {
    role,
    period: caseData.periodLabel ?? caseData.date ?? "",
  };
}
