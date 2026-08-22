import type { EntityBase } from "./entity.ts";
import type { IndustryId } from "../data/taxonomy/industries.ts";

export interface ClientData extends EntityBase {
  industryIds?: readonly IndustryId[];
}
