import { usefulProjectsContent, USEFUL_PROJECT_DEFINITIONS } from "./content/useful-projects.ts";
import type { SubprojectCardData } from "./subproject-cards.ts";
import type { MediaEntryId } from "./media/index.ts";

export type PetProjectBadge = string;

type PetProjectCardBase = Omit<SubprojectCardData, "href"> & {
  badge?: PetProjectBadge;
};

export type PetProjectCardData =
  | (PetProjectCardBase & { state: "live"; href: string })
  | (PetProjectCardBase & { state: "coming-soon"; href?: never });

export const petProjectCards: readonly PetProjectCardData[] = usefulProjectsContent.cards
  .filter((card) => card.visible)
  .map((card) => {
    const definition = USEFUL_PROJECT_DEFINITIONS.find(({ id }) => id === card.id);
    if (!definition) throw new Error(`Missing useful project definition: ${card.id}`);

    const base = {
      id: card.id,
      title: card.title,
      description: card.description,
      coverEntryId: definition.coverEntryId as MediaEntryId,
      shape: "portrait" as const,
      source: "site" as const,
      ...(card.badge ? { badge: card.badge } : {}),
    };

    if (card.state === "live" && "href" in definition) {
      return { ...base, state: "live", href: definition.href } as const;
    }

    return { ...base, state: "coming-soon" } as const;
  });
