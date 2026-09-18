import stateSource from "../../content/useful-projects.json" with { type: "json" };
import copySource from "../../content/editorial/useful-project-cards.json" with { type: "json" };
import {
  expectAllowedKeys,
  expectArray,
  expectBoolean,
  expectKnownId,
  expectRecord,
  expectStructuralString,
  normalizeById,
  readEditorialText,
} from "./editorial-validation.ts";

export const USEFUL_PROJECT_STATES = ["live", "coming-soon", "hidden"] as const;
export type UsefulProjectState = (typeof USEFUL_PROJECT_STATES)[number];

export const USEFUL_PROJECT_DEFINITIONS = [
  { id: "awful-cases", href: "/work/awful-cases/", coverEntryId: "useful-awful-cases-cover-use-01" },
  { id: "moves-awful", href: "/work/moves-awful/", coverEntryId: "useful-moves-awful-cover-use-01" },
  { id: "berserk-timer", href: "/work/berserk-timer/", coverEntryId: "useful-berserk-timer-cover-use-01" },
  { id: "awful-studio", href: "/work/awful-studio/", coverEntryId: "useful-awful-studio-cover-use-01" },
  { id: "awful-mockups", coverEntryId: "useful-awful-mockups-cover-use-01" },
  { id: "awful-3d-mockups", href: "/work/awful-3d-mockups/", coverEntryId: "useful-awful-3d-mockups-cover-use-01" },
] as const;

export type UsefulProjectId = (typeof USEFUL_PROJECT_DEFINITIONS)[number]["id"];

export interface UsefulProjectContent {
  id: UsefulProjectId;
  title: string;
  description: string;
  visible: boolean;
  state: UsefulProjectState;
  badge?: string;
}

interface UsefulProjectStateSource {
  id: UsefulProjectId;
  visible: boolean;
  state: UsefulProjectState;
}

const usefulProjectIds = USEFUL_PROJECT_DEFINITIONS.map(({ id }) => id);

function parseState(value: unknown, index: number): UsefulProjectStateSource {
  const label = `usefulProjectState[${index}]`;
  const record = expectRecord(value, label);
  expectAllowedKeys(record, ["id", "visible", "state"], ["id", "visible", "state"], label);
  const id = expectKnownId(record.id, usefulProjectIds, `${label}.id`) as UsefulProjectId;
  const stateValue = expectStructuralString(record.state, `${label}.state`);
  if (!USEFUL_PROJECT_STATES.some((state) => state === stateValue)) {
    throw new Error(`${label}.state has unsupported value "${stateValue}"`);
  }
  return {
    id,
    visible: expectBoolean(record.visible, `${label}.visible`),
    state: stateValue as UsefulProjectState,
  };
}

function parseCard(id: UsefulProjectId, value: unknown) {
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

function parseSource(copyValue: unknown, stateValue: unknown) {
  const root = expectRecord(copyValue, "usefulProjectCards");
  expectAllowedKeys(root, ["section", "cards"], ["section", "cards"], "usefulProjectCards");
  const section = expectRecord(root.section, "usefulProjectCards.section");
  expectAllowedKeys(section, ["title", "description"], ["title", "description"], "usefulProjectCards.section");
  const cards = expectRecord(root.cards, "usefulProjectCards.cards");
  const parsedCards = normalizeById(
    usefulProjectIds.map((id) => parseCard(id, cards[id])),
    usefulProjectIds,
    "usefulProjectCards.cards",
  );
  const parsedState = normalizeById(
    expectArray(stateValue, "usefulProjectState").map(parseState),
    usefulProjectIds,
    "usefulProjectState",
  );
  const stateById = new Map(parsedState.map((item) => [item.id, item] as const));
  return {
    section: {
      title: readEditorialText(section.title, "usefulProjectCards.section.title"),
      description: readEditorialText(section.description, "usefulProjectCards.section.description"),
    },
    cards: parsedCards.map((card) => {
      const state = stateById.get(card.id);
      if (!state) throw new Error(`Missing useful project state: ${card.id}`);
      return { ...card, visible: state.visible, state: state.state } satisfies UsefulProjectContent;
    }),
  } as const;
}

export const usefulProjectsContent = parseSource(copySource, stateSource);