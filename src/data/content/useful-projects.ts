import source from "../../content/editorial/useful-project-cards.json" with { type: "json" };
import {
  expectAllowedKeys,
  expectRecord,
  normalizeById,
  readEditorialText,
} from "./editorial-validation.ts";

export type UsefulProjectState = "live" | "coming-soon" | "hidden";
export type UsefulProjectBadge = "NEW";
export type UsefulProjectKind =
  | "app"
  | "library"
  | "extension"
  | "workflow"
  | "asset-library"
  | "scene-library"
  | "shader-library"
  | "project";

interface UsefulProjectDefinition {
  id: string;
  visible: boolean;
  state: UsefulProjectState;
  kind: UsefulProjectKind;
  href?: string;
  coverEntryId?: string;
}

export const USEFUL_PROJECT_DEFINITIONS = [
  {
    id: "awful-cases",
    visible: true,
    state: "live",
    kind: "app",
    href: "/work/awful-cases/",
    coverEntryId: "useful-awful-cases-cover-use-01",
  },
  {
    id: "moves-awful",
    visible: true,
    state: "live",
    kind: "library",
    href: "/work/moves-awful/",
    coverEntryId: "useful-moves-awful-cover-use-01",
  },
  {
    id: "berserk-timer",
    visible: true,
    state: "live",
    kind: "app",
    href: "/work/berserk-timer/",
    coverEntryId: "useful-berserk-timer-cover-use-01",
  },
  {
    id: "awful-studio",
    visible: true,
    state: "coming-soon",
    kind: "extension",
    coverEntryId: "useful-awful-studio-cover-use-01",
  },
  { id: "awful-mockups", visible: false, state: "hidden", kind: "asset-library" },
  { id: "awful-3d-mockups", visible: false, state: "hidden", kind: "asset-library" },
  { id: "awful-textures", visible: false, state: "hidden", kind: "asset-library" },
  { id: "photoshop-translation", visible: false, state: "hidden", kind: "project" },
  { id: "keys", visible: false, state: "hidden", kind: "project" },
  { id: "sea", visible: false, state: "hidden", kind: "project" },
  { id: "comfy-workflows", visible: false, state: "hidden", kind: "workflow" },
  { id: "photoshop-workflows", visible: false, state: "hidden", kind: "workflow" },
  { id: "blender-scenes", visible: false, state: "hidden", kind: "scene-library" },
  { id: "shaders", visible: false, state: "hidden", kind: "shader-library" },
  { id: "3d-assets", visible: false, state: "hidden", kind: "asset-library" },
] as const satisfies readonly UsefulProjectDefinition[];

export type UsefulProjectId = (typeof USEFUL_PROJECT_DEFINITIONS)[number]["id"];
export interface UsefulProjectContent {
  id: UsefulProjectId;
  title: string;
  description: string;
  visible: boolean;
  state: Exclude<UsefulProjectState, "hidden">;
  badge?: UsefulProjectBadge;
}

const usefulProjectIds = USEFUL_PROJECT_DEFINITIONS
  .filter((definition) => definition.visible)
  .map(({ id }) => id);
const rawSource: unknown = source;

function readUsefulProjectBadge(value: unknown, label: string): UsefulProjectBadge | undefined {
  const badge = readEditorialText(value, label);
  if (!badge) return undefined;
  if (badge !== "NEW") throw new Error(`${label} must be NEW when present`);
  return badge;
}

function parseCard(
  id: UsefulProjectId,
  value: unknown,
): Omit<UsefulProjectContent, "visible" | "state"> {
  const label = `usefulProjectCards.${id}`;
  const record = expectRecord(value, label);
  expectAllowedKeys(record, ["title", "description", "badge"], ["title", "description"], label);
  const badge = readUsefulProjectBadge(record.badge, `${label}.badge`);
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
  const definitionById = new Map(
    USEFUL_PROJECT_DEFINITIONS.map((definition) => [definition.id, definition] as const),
  );

  return {
    section: {
      title: readEditorialText(section.title, "usefulProjectCards.section.title"),
      description: readEditorialText(section.description, "usefulProjectCards.section.description"),
    },
    cards: parsedCards.map((card) => {
      const definition = definitionById.get(card.id);
      if (!definition || !definition.visible || definition.state === "hidden") {
        throw new Error(`Missing visible useful project definition: ${card.id}`);
      }
      return { ...card, visible: true, state: definition.state };
    }),
  } as const;
}

export const usefulProjectsContent = parseSource(rawSource);
