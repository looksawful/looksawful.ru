export interface EntityBase {
  id: string;
  name: string;
  description?: string;
}

export interface DescribedEntity extends EntityBase {
  statement?: string;
  scope?: readonly string[];
}
