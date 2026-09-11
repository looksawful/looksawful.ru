import {
  buildPortfolioPetKnowledgeCandidates,
  type PortfolioPetKnowledgeCandidate,
} from "./knowledge.ts";

export type PortfolioAssistantRoute =
  | {
      kind: "prepared";
      answerId: "about" | "cases" | "resume";
      text: string;
      sourceIds: readonly string[];
    }
  | {
      kind: "generate";
      message: string;
      context: {
        sourceIds: readonly string[];
        page: string;
        locale: "ru" | "en";
      };
    };

interface PreparedDefinition {
  id: "about" | "cases" | "resume";
  sourceIds: readonly string[] | "visible-projects";
}

const preparedDefinitions: Readonly<Record<PreparedDefinition["id"], PreparedDefinition>> = Object.freeze({
  about: Object.freeze({ id: "about", sourceIds: Object.freeze(["profile.about"]) }),
  cases: Object.freeze({ id: "cases", sourceIds: "visible-projects" }),
  resume: Object.freeze({ id: "resume", sourceIds: Object.freeze(["profile.role", "profile.about"]) }),
});

function normalize(message: string): string {
  return message
    .trim()
    .toLocaleLowerCase()
    .replace(/[!?.,;:()[\]{}]+/gu, " ")
    .replace(/\s+/gu, " ");
}

function preparedIntent(message: string): PreparedDefinition["id"] | null {
  const value = normalize(message);
  if (!value) return null;

  if (
    /(^| )(резюме|cv|resume)( |$)/u.test(value) ||
    value.includes("покажи резюме") ||
    value.includes("show resume")
  ) {
    return "resume";
  }

  if (
    /(^| )(кейсы|кейс|проекты|проект|работы|работ)( |$)/u.test(value) ||
    value.includes("что из работ") ||
    value.includes("можно посмотреть") ||
    /\b(projects?|cases?)\b/u.test(value) ||
    value.includes("worked on")
  ) {
    return "cases";
  }

  if (
    value === "обо мне" ||
    value.includes("расскажи о себе") ||
    value.includes("кто ты") ||
    value === "about" ||
    value.includes("about you") ||
    value.includes("who are you")
  ) {
    return "about";
  }

  return null;
}

function candidateMap(): Map<string, PortfolioPetKnowledgeCandidate> {
  return new Map(buildPortfolioPetKnowledgeCandidates().map((candidate) => [candidate.id, candidate]));
}

function buildPreparedAnswer(id: PreparedDefinition["id"]): Extract<PortfolioAssistantRoute, { kind: "prepared" }> {
  const candidates = candidateMap();
  const definition = preparedDefinitions[id];
  const sourceIds = definition.sourceIds === "visible-projects"
    ? [...candidates.keys()].filter((sourceId) => sourceId.startsWith("project."))
    : [...definition.sourceIds];

  const selected = sourceIds
    .map((sourceId) => candidates.get(sourceId))
    .filter((candidate): candidate is PortfolioPetKnowledgeCandidate => Boolean(candidate));

  if (selected.length === 0) {
    throw new Error(`prepared answer ${id} has no approved source candidates`);
  }

  const text = selected
    .map((candidate) => candidate.title ? `${candidate.title}: ${candidate.text}` : candidate.text)
    .filter((value) => value.trim().length > 0)
    .join("\n");

  if (!text.trim()) throw new Error(`prepared answer ${id} resolved to empty content`);

  return Object.freeze({
    kind: "prepared",
    answerId: id,
    text,
    sourceIds: Object.freeze(sourceIds),
  });
}

function safeSourceIds(context: Record<string, unknown>): readonly string[] {
  if (!Array.isArray(context.approvedSourceIds)) return Object.freeze([]);
  const values = context.approvedSourceIds
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .map((value) => value.trim())
    .slice(0, 12);
  return Object.freeze([...new Set(values)]);
}

export function routePortfolioAssistantRequest(input: {
  message: string;
  locale: "ru" | "en";
  context: Record<string, unknown>;
}): PortfolioAssistantRoute {
  const intent = preparedIntent(input.message);
  if (intent) return buildPreparedAnswer(intent);

  return Object.freeze({
    kind: "generate",
    message: input.message,
    context: Object.freeze({
      sourceIds: safeSourceIds(input.context),
      page: typeof input.context.page === "string" && input.context.page.trim()
        ? input.context.page.trim()
        : "home",
      locale: input.locale,
    }),
  });
}
