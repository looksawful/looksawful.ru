import type { CaseId } from "../../data/catalog/cases.ts";
import type { CollectionId } from "../../data/catalog/collections.ts";
import type { ProjectId } from "../../data/catalog/projects/index.ts";

export type HomepageRenderMode = "full" | "compact" | "card" | "none";

export type HomepageEntityReference =
  | { type: "case"; id: CaseId }
  | { type: "project"; id: ProjectId }
  | { type: "collection"; id: CollectionId };

export interface HomepagePreviewSectionConfig {
  id: string;
  blockIndexes: readonly number[];
}

export interface HomepagePreviewConfig {
  sections: readonly HomepagePreviewSectionConfig[];
  href: string;
  calloutLabel: string;
  visualOnly?: boolean;
}

export interface HomepageEntry {
  entity: HomepageEntityReference;
  mode: HomepageRenderMode;
  order: number;
  preview?: HomepagePreviewConfig;
}

export const homepageEntries = [
  {
    entity: { type: "case", id: "jestei-pool" },
    mode: "compact",
    order: 10,
    preview: {
      sections: [
        { id: "jestei-home", blockIndexes: [0] },
        { id: "jestei-brand", blockIndexes: [0] },
        { id: "jestei-event", blockIndexes: [0] },
      ],
      href: "/work/jestei-pool/",
      calloutLabel: "Подробнее о проекте",
      visualOnly: true,
    },
  },
  {
    entity: { type: "case", id: "styx" },
    mode: "compact",
    order: 20,
    preview: {
      sections: [
        { id: "styx-production-preview", blockIndexes: [0] },
        { id: "styx-production-media", blockIndexes: [0] },
      ],
      href: "/work/styx/",
      calloutLabel: "Подробнее о проекте",
      visualOnly: true,
    },
  },
  {
    entity: { type: "case", id: "sensetique" },
    mode: "compact",
    order: 30,
    preview: {
      sections: [
        { id: "sensetique-studio-preview", blockIndexes: [0] },
        { id: "sensetique-harsh-light", blockIndexes: [1] },
      ],
      href: "/work/sensetique/",
      calloutLabel: "Подробнее о проекте",
      visualOnly: true,
    },
  },
  {
    entity: { type: "collection", id: "music-photography" },
    mode: "none",
    order: 40,
  },
] as const satisfies readonly HomepageEntry[];

function entityKey(entity: HomepageEntityReference): string {
  return `${entity.type}:${entity.id}`;
}

export function assertHomepagePresentationSupported(
  entries: readonly HomepageEntry[],
): void {
  for (const entry of entries) {
    if (entry.mode !== "full" && entry.mode !== "compact" && entry.mode !== "none") {
      throw new Error(
        `Homepage render mode is not implemented: ${entityKey(entry.entity)} -> ${entry.mode}`,
      );
    }

    if (entry.preview && entry.mode !== "compact") {
      throw new Error(
        `Homepage preview config requires compact mode: ${entityKey(entry.entity)}`,
      );
    }

    if (entry.mode === "compact" && !entry.preview) {
      throw new Error(
        `Homepage compact mode requires explicit preview config: ${entityKey(entry.entity)}`,
      );
    }
  }
}

assertHomepagePresentationSupported(homepageEntries);
