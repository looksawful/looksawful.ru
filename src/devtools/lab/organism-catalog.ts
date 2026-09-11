import {
  CONTENT_BLOCK_TYPES,
  type ContentBlockType,
} from "../../content/contracts/content-block.ts";

export const LAB_ORGANISM_STATUSES = [
  "LIVE",
  "HIDDEN",
  "WIP",
  "EXPERIMENTAL",
  "DEPRECATED",
] as const;

export type LabOrganismStatus = (typeof LAB_ORGANISM_STATUSES)[number];

interface LabOrganismBase {
  readonly id: string;
  readonly label: string;
  readonly status: LabOrganismStatus;
  readonly ownerModule: string;
}

export interface LabContentBlockOrganism extends LabOrganismBase {
  readonly kind: "content-block";
  readonly canonicalType: ContentBlockType;
}

export interface LabSpecializedRuntimeOrganism extends LabOrganismBase {
  readonly kind: "specialized-runtime";
  readonly selector: string;
  readonly projectId?: string;
}

export type LabOrganism = LabContentBlockOrganism | LabSpecializedRuntimeOrganism;

export interface LabOrganismOverride {
  readonly status?: LabOrganismStatus;
}

const CONTENT_BLOCK_OWNER = "src/content/contracts/content-block.ts";

const SPECIALIZED_RUNTIME_ORGANISMS: readonly LabSpecializedRuntimeOrganism[] = [
  {
    id: "berserk-audio-player",
    label: "Berserk Audio Player",
    kind: "specialized-runtime",
    status: "HIDDEN",
    ownerModule: "src/components/berserk-audio-player.ts",
    selector: "[data-berserk-audio-player]",
    projectId: "berserk-timer",
  },
];

function canonicalOrganisms(): LabOrganism[] {
  const contentBlocks: LabContentBlockOrganism[] = CONTENT_BLOCK_TYPES.map((canonicalType) => ({
    id: canonicalType,
    label: canonicalType,
    kind: "content-block",
    status: "LIVE",
    canonicalType,
    ownerModule: CONTENT_BLOCK_OWNER,
  }));

  return [...contentBlocks, ...SPECIALIZED_RUNTIME_ORGANISMS];
}

export function buildLabOrganismCatalog(
  overrides: Readonly<Record<string, LabOrganismOverride>> = {},
): LabOrganism[] {
  const catalog = canonicalOrganisms();
  const knownIds = new Set(catalog.map((item) => item.id));

  for (const id of Object.keys(overrides)) {
    if (!knownIds.has(id)) {
      throw new Error(`Unknown Lab organism: ${id}`);
    }
  }

  return catalog.map((item) => {
    const override = overrides[item.id];
    if (!override?.status) return { ...item };
    return { ...item, status: override.status };
  });
}
