import type { CaseId } from "../../data/catalog/cases.ts";
import type { CollectionId } from "../../data/catalog/collections.ts";
import type { ProjectId } from "../../data/catalog/projects/index.ts";

export type EntityPageId =
  | `case:${CaseId}`
  | `collection:${CollectionId}`
  | `project:${ProjectId}`;

export type SectionId = string;
