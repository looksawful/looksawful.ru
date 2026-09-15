import {
  usefulProjectsContent,
  USEFUL_PROJECT_DEFINITIONS,
  type UsefulProjectBadge,
} from "./content/useful-projects.ts";
import type { SubprojectCardData } from "./subproject-cards.ts";

export type PetProjectBadge = UsefulProjectBadge;

type PetProjectCardBase = Omit<SubprojectCardData, "href"> & {
  badge?: PetProjectBadge;
};

export type PetProjectCardData =
  | (PetProjectCardBase & { state: "live"; href: string })
  | (PetProjectCardBase & { state: "coming-soon"; href?: never });

const definitionById = new Map(USEFUL_PROJECT_DEFINITIONS.map((definition) => [definition.id, definition] as const));

export const petProjectCards: readonly PetProjectCardData[] = usefulProjectsContent.cards.map((card) => {
  const definition = definitionById.get(card.id);
  if (!definition || definition.state === "hidden") {
    throw new Error(`Missing renderable useful project definition: ${card.id}`);
  }

  const base = {
    id: card.id,
    title: card.title,
    description: card.description,
    coverEntryId: definition.coverEntryId,
    shape: "portrait" as const,
    source: "site" as const,
    ...("badge" in definition && definition.badge ? { badge: definition.badge } : {}),
  };

  if (definition.state === "live") {
    return { ...base, state: "live", href: definition.href } as const;
  }

  return { ...base, state: "coming-soon" } as const;
});
