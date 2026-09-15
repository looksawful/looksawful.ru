import {
  usefulProjectsContent,
  USEFUL_PROJECT_DEFINITIONS,
  type UsefulProjectBadge,
} from "./content/useful-projects.ts";
import type { SubprojectCardData } from "./subproject-cards.ts";
import type { MediaEntryId } from "./media/index.ts";

export type PetProjectBadge = UsefulProjectBadge;

type PetProjectCardBase = Omit<SubprojectCardData, "href"> & {
  badge?: PetProjectBadge;
};

export type PetProjectCardData =
  | (PetProjectCardBase & { state: "live"; href: string })
  | (PetProjectCardBase & { state: "coming-soon"; href?: never });

export const petProjectCards: readonly PetProjectCardData[] = usefulProjectsContent.cards.map(
  (card) => {
    const definition = USEFUL_PROJECT_DEFINITIONS.find(({ id }) => id === card.id);
    if (!definition || !definition.visible) {
      throw new Error(`Missing visible useful project definition: ${card.id}`);
    }
    if (!("coverEntryId" in definition) || !definition.coverEntryId) {
      throw new Error(`Missing useful project cover: ${card.id}`);
    }

    const base = {
      id: card.id,
      title: card.title,
      description: card.description,
      coverEntryId: definition.coverEntryId as MediaEntryId,
      shape: "portrait" as const,
      source: "site" as const,
      ...(card.badge ? { badge: card.badge } : {}),
    };

    if (card.state === "live") {
      if (!("href" in definition) || !definition.href) {
        throw new Error(`Missing live useful project href: ${card.id}`);
      }
      return { ...base, state: "live", href: definition.href } as const;
    }

    return { ...base, state: "coming-soon" } as const;
  },
);
