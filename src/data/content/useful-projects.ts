import source from "../../content/editorial/useful-project-cards.json" with { type: "json" };
import type { MediaEntryId } from "../media/index.ts";
import {
  expectAllowedKeys,
  expectRecord,
  normalizeById,
  readEditorialText,
} from "./editorial-validation.ts";

export type UsefulProjectState = "live" | "coming-soon" | "hidden";
export type UsefulProjectBadge = "new";

export type UsefulProjectDefinition =
  | {
      id: string;
      state: "live";
      href: string;
      coverEntryId: MediaEntryId;
      badge?: UsefulProjectBadge;
    }
  | {
      id: string;
      state: "coming-soon";
      coverEntryId: MediaEntryId;
    }
  | {
      id: string;
      state: "hidden";
    };

export const USEFUL_PROJECT_DEFINITIONS = [
  {
    id: "awful-cases",
    state: "live",
    href: "/work/awful-cases/",
    coverEntryId: "useful-awful-cases-cover-use-01",
  },
  {
    id: "moves-awful",
    state: "live",
    href: "/work/moves-awful/",
    coverEntryId: "useful-moves-awful-cover-use-01",
  },
  {
    id: "berserk-timer",
    state: "live",
    href: "/work/berserk-timer/",
    coverEntryId: "useful-berserk-timer-cover-use-01",
  },
  {
    id: "awful-studio",
    state: "coming-soon",
    coverEntryId: "useful-awful-studio-cover-use-01",
  },
  { id: "awful-mockups", state: "hidden" },
  { id: "awful-textures", state: "hidden" },
  { id: "photoshop-translation", state: "hidden" },
  { id: "keys", state: "hidden" },
  { id: "sea", state: "hidden" },
  { id: "comfy-workflows", state: "hidden" },
  { id: "photoshop-workflows", state: "hidden" },
  { id: "blender-scenes", state: "hidden" },
  { id: "shaders", state: "hidden" },
  { id: "3d-assets", state: "hidden" },
] as const satisfies readonly UsefulProjectDefinition[];

export type UsefulProjectId = (typeof USEFUL_PROJECT_DEFINITIONS)[number]["id"];
type UsefulProjectDefinitionEntry = (typeof USEFUL_PROJECT_DEFINITIONS)[number];
type RenderableUsefulProjectDefinition = Exclude<UsefulProjectDefinitionEntry, { state: "hidden" }>;
export type RenderableUsefulProjectId = RenderableUsefulProjectDefinition["id"];

export interface UsefulProjectContent {
  id: RenderableUsefulProjectId;
  title: string;
  description: string;
  state: Exclude<UsefulProjectState, "hidden">;
  badge?: UsefulProjectBadge;
}

function isRenderableDefinition(
  definition: UsefulProjectDefinitionEntry,
): definition is RenderableUsefulProjectDefinition {
  return definition.state !== "hidden";
}

const renderableDefinitions = USEFUL_PROJECT_DEFINITIONS.filter(isRenderableDefinition);
const renderableProjectIds = renderableDefinitions.map(({ id }) => id);
const rawSource: unknown = source;

function parseCard(
  id: RenderableUsefulProjectId,
  value: unknown,
): Omit<UsefulProjectContent, "state" | "badge"> {
  const label = `usefulProjectCards.${id}`;
  const record = expectRecord(value, label);
  expectAllowedKeys(record, ["title", "description"], ["title", "description"], label);
  return {
    id,
    title: readEditorialText(record.title, `${label}.title`),
    description: readEditorialText(record.description, `${label}.description`),
  };
}

function parseSource(value: unknown) {
  const root = expectRecord(value, "usefulProjectCards");
  expectAllowedKeys(root, ["section", "cards"], ["section", "cards"], "usefulProjectCards");

  const section = expectRecord(root.section, "usefulProjectCards.section");
  expectAllowedKeys(section, ["title", "description"], ["title", "description"], "usefulProjectCards.section");

  const cards = expectRecord(root.cards, "usefulProjectCards.cards");
  expectAllowedKeys(cards, renderableProjectIds, renderableProjectIds, "usefulProjectCards.cards");

  const parsedCards = normalizeById(
    renderableProjectIds.map((id) => parseCard(id, cards[id])),
    renderableProjectIds,
    "usefulProjectCards.cards",
  );
  const definitionById = new Map(renderableDefinitions.map((definition) => [definition.id, definition] as const));

  return {
    section: {
      title: readEditorialText(section.title, "usefulProjectCards.section.title"),
      description: readEditorialText(section.description, "usefulProjectCards.section.description"),
    },
    cards: parsedCards.map((card) => {
      const definition = definitionById.get(card.id);
      if (!definition) throw new Error(`Missing useful project definition: ${card.id}`);
      return {
        ...card,
        state: definition.state,
        ...("badge" in definition && definition.badge ? { badge: definition.badge } : {}),
      };
    }),
  } as const;
}

export const usefulProjectsContent = parseSource(rawSource);
