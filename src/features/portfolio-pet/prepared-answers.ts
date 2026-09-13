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

export const OWNER_APPROVED_SOURCE_IDS = Object.freeze([
  "profile.name",
  "profile.role",
  "profile.about",
  "profile.location",
  "profile.contact",
  "profile.skills",
  "profile.experience",
  "profile.education",
  "profile.languages",
  "profile.principles",
  "project.jestei",
  "project.styx",
  "project.sensetique",
  "project.shootings",
] as const);

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

function addIfApproved(
  target: string[],
  sourceId: string,
  approvedById: ReadonlyMap<string, PortfolioPetKnowledgeCandidate>,
): void {
  if (approvedById.has(sourceId) && !target.includes(sourceId)) target.push(sourceId);
}

function relevantApprovedSourceIds(
  message: string,
  page: string,
  approvedById: ReadonlyMap<string, PortfolioPetKnowledgeCandidate>,
  groundingMode: "page" | "all",
): readonly string[] {
  if (groundingMode === "all") return Object.freeze([...approvedById.keys()].slice(0, 12));

  const value = normalize(message);
  const selected: string[] = [];
  const projectSlug = pageProjectSlug(page);
  const projectId = projectSlug ? `project.${projectSlug}` : null;
  if (projectId) addIfApproved(selected, projectId, approvedById);

  if (/\b(jestei|джестей)\b/u.test(value)) addIfApproved(selected, "project.jestei", approvedById);
  if (/\b(styx|стикс)\b/u.test(value)) addIfApproved(selected, "project.styx", approvedById);
  if (/\b(sensetique|сенсетик)\b/u.test(value)) addIfApproved(selected, "project.sensetique", approvedById);
  if (/\b(shootings?|съ[её]мк|фотограф|микс медиа|микс-медиа)\b/u.test(value)) {
    addIfApproved(selected, "project.shootings", approvedById);
  }

  if (/\b(навык|уме|компетен|технолог|инструмент|стек|figma|blender|javascript|typescript|python|three|webgl|glsl|ai|ии|нейросет|ребрендинг|айдентик|ux|ui|cjm|motion|моушен|дизайн-систем)\b/u.test(value)) {
    addIfApproved(selected, "profile.skills", approvedById);
    addIfApproved(selected, "profile.principles", approvedById);
  }

  if (/\b(опыт|карьер|работал|работа|компан|должност|роль|mad cow|li-ne|line agency|прогресс|риа|московские новости|puma|h&m|детск)\b/u.test(value)) {
    addIfApproved(selected, "profile.experience", approvedById);
  }

  if (/\b(образован|учил|учился|университет|мпгу|диплом|курс|обучен|hexlet|stepik|figma academy)\b/u.test(value)) {
    addIfApproved(selected, "profile.education", approvedById);
  }

  if (/\b(язык|английск|чешск|english|czech)\b/u.test(value)) {
    addIfApproved(selected, "profile.languages", approvedById);
  }

  if (/\b(где жив|город|локаци|москв)\b/u.test(value)) {
    addIfApproved(selected, "profile.location", approvedById);
  }

  if (/\b(email|e-mail|почт|связаться|контакт|написать)\b/u.test(value)) {
    addIfApproved(selected, "profile.contact", approvedById);
  }

  if (/\b(принцип|подход|процесс|руковод|команд|дирекшн)\b/u.test(value)) {
    addIfApproved(selected, "profile.principles", approvedById);
  }

  if (selected.length === 0 || page === "home" || page === "/") {
    addIfApproved(selected, "profile.role", approvedById);
    addIfApproved(selected, "profile.about", approvedById);
  }

  return Object.freeze(selected.slice(0, 12));
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
        sourceIds: relevantApprovedSourceIds(input.message, page, approvedById, groundingMode),
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

// Owner content approval was completed on 2026-09-13. Visual/deployment approval remains separate.
export const routePortfolioAssistantRequest = createPortfolioAssistantRouter({
  approvedSourceIds: OWNER_APPROVED_SOURCE_IDS,
});
