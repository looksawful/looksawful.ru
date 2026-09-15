import source from "../../content/editorial/useful-project-cards.json" with { type: "json" };
import {
  expectAllowedKeys,
  expectRecord,
  normalizeById,
  readEditorialText,
} from "./editorial-validation.ts";

export type UsefulProjectState = "live" | "coming-soon" | "hidden";

export const USEFUL_PROJECT_DEFINITIONS = [
  { id: "awful-cases", visible: true, state: "live", href: "/work/awful-cases/", coverEntryId: "useful-awful-cases-cover-use-01" },
  { id: "moves-awful", visible: true, state: "live", href: "/work/moves-awful/", coverEntryId: "useful-moves-awful-cover-use-01" },
  { id: "berserk-timer", visible: true, state: "live", href: "/work/berserk-timer/", coverEntryId: "useful-berserk-timer-cover-use-01" },
  { id: "awful-studio", visible: true, state: "coming-soon", coverEntryId: "useful-awful-studio-cover-use-01" },
  { id: "awful-mockups", visible: true, state: "coming-soon", coverEntryId: "useful-awful-mockups-cover-use-01" },
  { id: "awful-3d-mockups", visible: true, state: "coming-soon", coverEntryId: "useful-awful-3d-mockups-cover-use-01" },
] as const satisfies readonly {
  id: string;
  visible: boolean;
  state: UsefulProjectState;
  href?: string;
  coverEntryId: string;
}[];

export type UsefulProjectId = (typeof USEFUL_PROJECT_DEFINITIONS)[number]["id"];
export interface UsefulProjectContent {
  id: UsefulProjectId;
  title: string;
  description: string;
  visible: boolean;
  state: UsefulProjectState;
  badge?: string;
}

const usefulProjectIds = USEFUL_PROJECT_DEFINITIONS.map(({ id }) => id);
const rawSource: unknown = source;

function parseCard(id: UsefulProjectId, value: unknown): Omit<UsefulProjectContent, "visible" | "state"> {
  const label = `usefulProjectCards.${id}`;
  const record = expectRecord(value, label);
  expectAllowedKeys(record, ["title", "description", "badge"], ["title", "description"], label);
  const badge = readEditorialText(record.badge, `${label}.badge`);
  return {
    id,
    title: readEditorialText(record.title, `${label}.title`),
    description: readEditorialText(record.description, `${label}.description`),
    ...(badge ? { badge } : {}),
  };
}

function parseSource(value: unknown) {
  const root = expectRecord(value, "usefulProjectCards");
  expectAllowedKeys(root, ["section", "cards"], ["section", "cards"], "usefulProjectCards");
  const section = expectRecord(root.section, "usefulProjectCards.section");
  expectAllowedKeys(section, ["title", "description"], ["title", "description"], "usefulProjectCards.section");
  const cards = expectRecord(root.cards, "usefulProjectCards.cards");
  const parsedCards = normalizeById(
    usefulProjectIds.map((id) => parseCard(id, cards[id])),
    usefulProjectIds,
    "usefulProjectCards.cards",
  );
  const definitionById = new Map(USEFUL_PROJECT_DEFINITIONS.map((definition) => [definition.id, definition] as const));
  return {
    section: {
      title: readEditorialText(section.title, "usefulProjectCards.section.title"),
      description: readEditorialText(section.description, "usefulProjectCards.section.description"),
    },
    cards: parsedCards.map((card) => {
      const definition = definitionById.get(card.id);
      if (!definition) throw new Error(`Missing useful project definition: ${card.id}`);
      return { ...card, visible: definition.visible, state: definition.state };
    }),
  } as const;
}

export const usefulProjectsContent = parseSource(rawSource);
