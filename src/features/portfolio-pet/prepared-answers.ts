import {
  buildPortfolioPetKnowledgeCandidates,
  selectApprovedKnowledge,
  type PortfolioPetKnowledgeCandidate,
} from "./knowledge.ts";

export type PortfolioConversationTurn = Readonly<{
  role: "user" | "assistant";
  text: string;
}>;

export type PortfolioConversationState = Readonly<{
  history: readonly PortfolioConversationTurn[];
  activeSourceIds: readonly string[];
}>;

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
        history: readonly PortfolioConversationTurn[];
      };
    }
  | { kind: "no_data" };

export type PortfolioAssistantRouter = (input: {
  message: string;
  locale: "ru" | "en";
  context: Record<string, unknown>;
  conversation?: PortfolioConversationState;
}) => PortfolioAssistantRoute;

interface PreparedDefinition {
  id: "about" | "cases" | "resume";
  sourceIds: readonly string[];
}

const preparedDefinitions: Readonly<Record<PreparedDefinition["id"], PreparedDefinition>> = Object.freeze({
  about: Object.freeze({ id: "about", sourceIds: Object.freeze(["profile.role"]) }),
  cases: Object.freeze({ id: "cases", sourceIds: Object.freeze(["profile.cases_index"]) }),
  resume: Object.freeze({ id: "resume", sourceIds: Object.freeze(["profile.role", "profile.work_scope", "profile.experience"]) }),
});

export const OWNER_APPROVED_SOURCE_IDS = Object.freeze([
  "profile.name",
  "profile.role",
  "profile.about",
  "profile.about_plain",
  "profile.work_scope",
  "profile.cases_index",
  "profile.location",
  "profile.contact",
  "profile.skills",
  "profile.product_ui",
  "profile.branding",
  "profile.team_leadership",
  "profile.shoot_production",
  "profile.commercial",
  "profile.experience",
  "profile.education",
  "profile.languages",
  "profile.principles",
  "project.jestei",
  "project.jestei.interfaces",
  "project.jestei.design_system",
  "project.jestei.communication",
  "project.styx",
  "project.styx.identity",
  "project.styx.production",
  "project.sensetique",
  "project.sensetique.production",
  "project.shootings",
  "project.shootings.details",
] as const);

function normalize(message: string): string {
  return message
    .trim()
    .toLocaleLowerCase()
    .replace(/[!?.,;:()[\]{}]+/gu, " ")
    .replace(/\s+/gu, " ");
}

function includesAny(value: string, fragments: readonly string[]): boolean {
  return fragments.some((fragment) => value.includes(fragment));
}

function isDependentFollowUp(message: string): boolean {
  const value = normalize(message);
  if (!value) return false;
  if (value.startsWith("а ")) return true;
  return includesAny(value, [
    "там", "это", "этот", "эта ", "эти ", "подробнее", "поподробнее", "конкретн", "пример",
    "что именно", "как именно", "почему", "проще", "не понял", "не поняла", "не понятно", "непонят",
    "для старта", "что нужно", "что тебе нужно", "и дальше", "а дальше",
  ]);
}

function isSimplificationRequest(value: string): boolean {
  return includesAny(value, ["проще", "не понял", "не поняла", "не понятно", "непонят", "ничего не понял", "ничего не поняла"]);
}

function preparedIntent(message: string): PreparedDefinition["id"] | null {
  const value = normalize(message);
  if (!value) return null;

  if (
    /(^| )(резюме|cv|resume)( |$)/u.test(value) ||
    value.includes("покажи резюме") ||
    value.includes("show resume")
  ) return "resume";

  if (
    /(^| )(кейсы|кейс|проекты|работы)( |$)/u.test(value) ||
    value.includes("какие у тебя кейсы") ||
    value.includes("что из работ") ||
    value.includes("можно посмотреть") ||
    /\b(projects?|cases?)\b/u.test(value)
  ) return "cases";

  if (
    value === "обо мне" ||
    value.includes("расскажи о себе") ||
    value.includes("кто ты") ||
    value === "about" ||
    value.includes("about you") ||
    value.includes("who are you")
  ) return "about";

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
  const sourceIds = [...preparedDefinitions[id].sourceIds];
  const selected = sourceIds
    .map((sourceId) => approvedById.get(sourceId))
    .filter((candidate): candidate is PortfolioPetKnowledgeCandidate => Boolean(candidate));

  if (selected.length !== sourceIds.length || selected.length === 0) return null;
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

function addInherited(
  target: string[],
  inherited: readonly string[],
  approvedById: ReadonlyMap<string, PortfolioPetKnowledgeCandidate>,
): void {
  inherited.forEach((sourceId) => addIfApproved(target, sourceId, approvedById));
}

function addProjectDetail(
  selected: string[],
  inherited: readonly string[],
  value: string,
  approvedById: ReadonlyMap<string, PortfolioPetKnowledgeCandidate>,
): void {
  const activeJestei = selected.includes("project.jestei") || inherited.includes("project.jestei");
  const activeStyx = selected.includes("project.styx") || inherited.includes("project.styx");
  const activeSensetique = selected.includes("project.sensetique") || inherited.includes("project.sensetique");
  const activeShootings = selected.includes("project.shootings") || inherited.includes("project.shootings");

  if (activeJestei) {
    if (includesAny(value, ["интерфейс", "ux", "ui", "навигац", "фильтр", "поиск", "сценари", "пример", "конкретн"])) {
      addIfApproved(selected, "project.jestei.interfaces", approvedById);
    }
    if (includesAny(value, ["дизайн-систем", "компонент", "ревью", "процесс", "команд", "разработ"]))) {
      addIfApproved(selected, "project.jestei.design_system", approvedById);
    }
    if (includesAny(value, ["бренд", "ребрендинг", "коммуникац", "tone", "редполит", "рассыл", "лендинг", "реклам"]))) {
      addIfApproved(selected, "project.jestei.communication", approvedById);
    }
  }

  if (activeStyx) {
    if (includesAny(value, ["айдентик", "бренд", "логотип", "упаков", "каталог", "лукбук", "печат"]))) {
      addIfApproved(selected, "project.styx.identity", approvedById);
    }
    if (includesAny(value, ["съём", "съем", "фото", "кампейн", "лукбук", "каталог", "сканограф", "анимац"]))) {
      addIfApproved(selected, "project.styx.production", approvedById);
    }
  }

  if (activeSensetique && includesAny(value, ["продакш", "студи", "зал", "команд", "кастинг", "локац", "съём", "съем", "постпрод"]))) {
    addIfApproved(selected, "project.sensetique.production", approvedById);
  }

  if (activeShootings && includesAny(value, ["съём", "съем", "фото", "продакш", "постпрод", "микс", "как дел"]))) {
    addIfApproved(selected, "project.shootings.details", approvedById);
    addIfApproved(selected, "profile.shoot_production", approvedById);
  }
}

function isCommercialIntent(value: string): boolean {
  return includesAny(value, [
    "заказать", "заказ дизай", "хочу дизайн", "нужен дизайнер", "нужна дизайн", "есть проект",
    "поработать вместе", "сотруднич", "нанять", "обсудить проект", "обсудить дизайн",
    "сколько стоит", "стоимость", "цена", "срок", "для старта", "что нужно от меня",
  ]);
}

function relevantApprovedSourceIds(
  message: string,
  page: string,
  approvedById: ReadonlyMap<string, PortfolioPetKnowledgeCandidate>,
  conversation?: PortfolioConversationState,
): readonly string[] {
  const value = normalize(message);
  const selected: string[] = [];
  const inherited = conversation?.activeSourceIds ?? [];
  const followUp = isDependentFollowUp(value);
  const activeCommercial = inherited.includes("profile.commercial");
  const commercial = isCommercialIntent(value) || (activeCommercial && followUp);

  if (commercial) {
    addIfApproved(selected, "profile.commercial", approvedById);
    addIfApproved(selected, "profile.contact", approvedById);
    if (includesAny(value, ["интерфейс", "продукт", "ux", "ui", "сайт", "приложен", "дизайн"])) {
      addIfApproved(selected, "profile.product_ui", approvedById);
    }
    return Object.freeze(selected.slice(0, 12));
  }

  const inheritedProjects = inherited.filter((sourceId) => sourceId.startsWith("project."));
  if (isSimplificationRequest(value) && inheritedProjects.length === 0) {
    addIfApproved(selected, "profile.about_plain", approvedById);
    return Object.freeze(selected);
  }

  if (followUp) addInherited(selected, inherited, approvedById);

  const projectSlug = pageProjectSlug(page);
  const projectId = projectSlug ? `project.${projectSlug}` : null;
  if (projectId) addIfApproved(selected, projectId, approvedById);

  if (includesAny(value, ["jestei", "джестей"])) addIfApproved(selected, "project.jestei", approvedById);
  if (includesAny(value, ["styx", "стикс"])) addIfApproved(selected, "project.styx", approvedById);
  if (includesAny(value, ["sensetique", "сенсетик"])) addIfApproved(selected, "project.sensetique", approvedById);
  if (includesAny(value, ["shooting", "съём", "съем", "фотограф", "микс медиа", "микс-медиа"])) {
    addIfApproved(selected, "project.shootings", approvedById);
  }

  if (includesAny(value, ["что ты делаешь", "чем занима", "твоя работа", "что делаешь вообще", "чем ты занима"]))) {
    addIfApproved(selected, "profile.work_scope", approvedById);
  }

  const interfaceQuestion = includesAny(value, [
    "интерфейс", "ux", "ui", "навигац", "фильтр", "поиск", "сценари", "user flow", "cjm",
    "прототип", "дизайн-систем", "удоб", "экран",
  ]);
  if (interfaceQuestion) {
    addIfApproved(selected, "profile.product_ui", approvedById);
    addIfApproved(selected, "profile.skills", approvedById);
  }

  if (includesAny(value, ["ребрендинг", "брендинг", "айдентик", "визуальн систем", "логотип", "шрифт", "палитр", "упаков"]))) {
    addIfApproved(selected, "profile.branding", approvedById);
  }

  if (includesAny(value, ["креативн", "команд", "руковод", "ревью", "ставишь задач", "управляешь", "дизайн-лид"]))) {
    addIfApproved(selected, "profile.team_leadership", approvedById);
  }

  if (includesAny(value, ["съёмочн", "съемочн", "продюсирован", "кастинг", "локац", "ретуш", "цветокорр", "постпрод"]))) {
    addIfApproved(selected, "profile.shoot_production", approvedById);
  }

  if (followUp && inherited.includes("profile.work_scope") && includesAny(value, ["подробнее", "конкретн", "пример", "что именно"]))) {
    addIfApproved(selected, "profile.product_ui", approvedById);
    addIfApproved(selected, "profile.branding", approvedById);
    addIfApproved(selected, "profile.team_leadership", approvedById);
  }

  addProjectDetail(selected, inherited, value, approvedById);

  if (includesAny(value, [
    "навык", "уме", "компетен", "технолог", "инструмент", "стек", "figma", "blender",
    "javascript", "typescript", "python", "three", "webgl", "glsl", " ai", "ии", "нейросет", "motion", "моушен",
  ])) {
    addIfApproved(selected, "profile.skills", approvedById);
  }

  if (includesAny(value, [
    "опыт", "карьер", "работал", "работа", "компан", "должност", "роль", "mad cow", "li-ne",
    "line agency", "прогресс", "риа", "московские новости", "puma", "h&m", "детск",
  ])) addIfApproved(selected, "profile.experience", approvedById);

  if (includesAny(value, [
    "образован", "учил", "учился", "университет", "мпгу", "диплом", "курс", "обучен", "hexlet",
    "stepik", "figma academy",
  ])) addIfApproved(selected, "profile.education", approvedById);

  if (includesAny(value, ["язык", "английск", "чешск", "english", "czech"])) addIfApproved(selected, "profile.languages", approvedById);
  if (includesAny(value, ["где жив", "город", "локаци", "москв"])) addIfApproved(selected, "profile.location", approvedById);
  if (includesAny(value, ["email", "e-mail", "почт", "связаться", "контакт", "написать"])) addIfApproved(selected, "profile.contact", approvedById);
  if (includesAny(value, ["принцип", "подход", "процесс", "дирекшн"])) addIfApproved(selected, "profile.principles", approvedById);

  if (selected.length === 0) {
    addIfApproved(selected, "profile.role", approvedById);
    addIfApproved(selected, "profile.about", approvedById);
  }

  return Object.freeze(selected.slice(0, 12));
}

export function createPortfolioAssistantRouter({
  approvedSourceIds,
}: {
  approvedSourceIds: readonly string[];
  groundingMode?: "page" | "all";
}): PortfolioAssistantRouter {
  const candidates = buildPortfolioPetKnowledgeCandidates();
  const knownIds = new Set(candidates.map((candidate) => candidate.id));
  const trustedApprovedIds = [...new Set(approvedSourceIds)].filter((sourceId) => knownIds.has(sourceId));
  const approved = selectApprovedKnowledge(candidates, trustedApprovedIds);
  const approvedById = new Map(approved.map((candidate) => [candidate.id, candidate]));

  return (input) => {
    const followUp = isDependentFollowUp(input.message) && Boolean(input.conversation?.history.length);
    const intent = followUp ? null : preparedIntent(input.message);
    if (intent) {
      return buildPreparedAnswer(intent, approvedById)
        ?? Object.freeze({ kind: "no_data" as const });
    }

    const page = pageFromContext(input.context);
    return Object.freeze({
      kind: "generate",
      message: input.message,
      context: Object.freeze({
        sourceIds: relevantApprovedSourceIds(input.message, page, approvedById, input.conversation),
        page,
        locale: input.locale,
        history: Object.freeze([...(input.conversation?.history ?? [])].slice(-6)),
      }),
    });
  };
}

export function createPreviewPortfolioAssistantRouter(): PortfolioAssistantRouter {
  const approvedSourceIds = buildPortfolioPetKnowledgeCandidates().map((candidate) => candidate.id);
  return createPortfolioAssistantRouter({ approvedSourceIds });
}

// Owner content approval was completed on 2026-09-13. Visual/deployment approval remains separate.
export const routePortfolioAssistantRequest = createPortfolioAssistantRouter({
  approvedSourceIds: OWNER_APPROVED_SOURCE_IDS,
});
