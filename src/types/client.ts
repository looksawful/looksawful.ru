import type { EntityBase } from "./entity.ts";

export interface ClientData extends EntityBase {
  industryIds?: readonly string[];
}
