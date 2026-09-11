export type LabLifecycle = "live" | "hidden" | "wip";

export interface LabLifecycleInput {
  listed: boolean;
  indexable: boolean;
  developmentStatus?: "wip";
}

export function deriveLabPageLifecycle(input: LabLifecycleInput): LabLifecycle {
  if (input.developmentStatus === "wip") return "wip";
  if (!input.listed || !input.indexable) return "hidden";
  return "live";
}
