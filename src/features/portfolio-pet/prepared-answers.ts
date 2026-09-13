import {
  buildPortfolioPetKnowledgeCandidates,
  selectApprovedKnowledge,
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
    }
  | { kind: "no_data" };

export type PortfolioAssistantRouter = (input: {
  message: string;
  locale: "ru" | "en";
  context: Record<string, unknown>;
}) => PortfolioAssistantRoute;

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

function pageProjectSlug(page: string): string | null {
  const normalized = page.trim().replace(/^https?:\/\/[^/]+/u, "").replace(/[?#].*$/u, "");
  const segments = normalized.split("/").filter(Boolean);
  if (segments.length === 0) return page === "home" ? null : page;
  if (segments[0] === "work" && segments[1]) return segments[1];
  if (segments.length === 1) return segments[0];
  return null;
}

function pageFromContext(context: Record<string, unknown>): string {
  if (typeof context.page !== "string") return "home";

  const raw = context.page.trim();
  if (!raw || raw === "home" || raw === "/") return "home";

  if (/^https?:\/\//iu.test(raw)) {
    try {
      const url = new URL(raw);
      if (url.hostname !== "looksawful.ru" && url.hostname !== "www.looksawful.ru") return "home";
      return pageProjectSlug(url.pathname) ?? "home";
    } catch {
      return "home";
    }
  }

  return pageProjectSlug(raw) ?? "home";
}

function buildPreparedAnswer(
  id: PreparedDefinition["id"],
  approvedById: ReadonlyMap<string, PortfolioPetKnowledgeCandidate>,
): Extract<PortfolioAssistantRoute, { kind: "prepared" }> | null {
  const definition = preparedDefinitions[id];
  const sourceIds = definition.sourceIds === "visible-projects"
    ? [...approvedById.keys()].filter((sourceId) => sourceId.startsWith("project."))
    : [...definition.sourceIds];

  if (sourceIds.length === 0) return null;

  const selected = sourceIds
    .map((sourceId) => approvedById.get(sourceId))
    .filter((candidate): candidate is PortfolioPetKnowledgeCandidate => Boolean(candidate));

  if (definition.sourceIds !== "visible-projects" && selected.length !== sourceIds.length) {
    return null;
  }
  if (selected.length === 0) return null;

  const text = selected
    .map((candidate) => candidate.title ? `${candidate.title}: ${candidate.text}` : candidate.text)
    .filter((value) => value.trim().length > 0)
    .join("\n");

  if (!text.trim()) return null;

  return Object.freeze({
    kind: "prepared",
    answerId: id,
    text,
    sourceIds: Object.freeze(selected.map((candidate) => candidate.id)),
  });
}

function relevantApprovedSourceIds(
  page: string,
  approvedById: ReadonlyMap<string, PortfolioPetKnowledgeCandidate>,
  groundingMode: "page" | "all",
): readonly string[] {
  if (groundingMode === "all") return Object.freeze([...approvedById.keys()].slice(0, 12));
  const projectSlug = pageProjectSlug(page);
  const projectId = projectSlug ? `project.${projectSlug}` : null;
  if (projectId && approvedById.has(projectId)) return Object.freeze([projectId]);
  if ((page === "home" || page === "/") && approvedById.has("profile.about")) {
    return Object.freeze(["profile.about"]);
  }
  return Object.freeze([]);
}

export function createPortfolioAssistantRouter({
  approvedSourceIds,
  groundingMode = "page",
}: {
  approvedSourceIds: readonly string[];
  groundingMode?: "page" | "all";
}): PortfolioAssistantRouter {
  const candidates = buildPortfolioPetKnowledgeCandidates();
  const knownIds = new Set(candidates.map((candidate) => candidate.id));
  const trustedApprovedIds = [...new Set(approvedSourceIds)]
    .filter((sourceId) => knownIds.has(sourceId));
  const approved = selectApprovedKnowledge(candidates, trustedApprovedIds);
  const approvedById = new Map(approved.map((candidate) => [candidate.id, candidate]));

  return (input) => {
    const intent = preparedIntent(input.message);
    if (intent) {
      return buildPreparedAnswer(intent, approvedById)
        ?? Object.freeze({ kind: "no_data" as const });
    }

    const page = pageFromContext(input.context);
    return Object.freeze({
      kind: "generate",
      message: input.message,
      context: Object.freeze({
        sourceIds: relevantApprovedSourceIds(page, approvedById, groundingMode),
        page,
        locale: input.locale,
      }),
    });
  };
}

export function createPreviewPortfolioAssistantRouter(): PortfolioAssistantRouter {
  const approvedSourceIds = buildPortfolioPetKnowledgeCandidates().map((candidate) => candidate.id);
  return createPortfolioAssistantRouter({ approvedSourceIds, groundingMode: "all" });
}

// #718 is still awaiting owner approval. Production retrieval therefore fails closed.
export const routePortfolioAssistantRequest = createPortfolioAssistantRouter({
  approvedSourceIds: Object.freeze([]),
});
