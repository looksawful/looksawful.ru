import {
  routePortfolioAssistantRequest,
  type PortfolioAssistantRoute,
  type PortfolioAssistantRouter,
  type PortfolioConversationState,
  type PortfolioConversationTurn,
} from "./prepared-answers.ts";

type GenerateRoute = Extract<PortfolioAssistantRoute, { kind: "generate" }>;

export type PortfolioChatProviderResult =
  | { text: string }
  | { kind: "answer"; text: string; sources: readonly string[] }
  | { kind: "no_data"; text: string; sources: readonly string[] }
  | { kind: "rate_limited" }
  | { kind: "unavailable" };

export interface PortfolioChatProvider {
  generate(input: GenerateRoute): Promise<PortfolioChatProviderResult>;
}

export interface PortfolioChatServiceInput {
  message: string;
  locale: "ru" | "en";
  context: Record<string, unknown>;
}

export interface PortfolioConversationStore {
  load(): PortfolioConversationState | null;
  save(state: PortfolioConversationState): void;
}

export type PortfolioChatServiceResult =
  | Extract<PortfolioAssistantRoute, { kind: "prepared" }>
  | { kind: "generated"; text: string; sourceIds: readonly string[] }
  | { kind: "no_data" }
  | { kind: "rate_limited" }
  | { kind: "unavailable" };

const MAX_HISTORY_TURNS = 6;
const MAX_HISTORY_TEXT = 700;
const MAX_ACTIVE_SOURCE_IDS = 12;

function providerState(
  result: PortfolioChatProviderResult,
): "answer" | "no_data" | "rate_limited" | "unavailable" {
  if (!("kind" in result)) return "answer";
  return result.kind;
}

function providerText(result: PortfolioChatProviderResult): string {
  if ("kind" in result && result.kind !== "answer") return "";
  return result.text.trim();
}

function sanitizeTurn(turn: PortfolioConversationTurn): PortfolioConversationTurn | null {
  if (turn.role !== "user" && turn.role !== "assistant") return null;
  const text = turn.text.trim().slice(0, MAX_HISTORY_TEXT);
  if (!text) return null;
  return Object.freeze({ role: turn.role, text });
}

function sanitizeState(value: PortfolioConversationState | null): PortfolioConversationState {
  const history = (value?.history ?? [])
    .map(sanitizeTurn)
    .filter((turn): turn is PortfolioConversationTurn => Boolean(turn))
    .slice(-MAX_HISTORY_TURNS);
  const activeSourceIds = [...new Set(
    (value?.activeSourceIds ?? [])
      .filter((sourceId): sourceId is string => typeof sourceId === "string")
      .map((sourceId) => sourceId.trim())
      .filter(Boolean),
  )].slice(0, MAX_ACTIVE_SOURCE_IDS);

  return Object.freeze({
    history: Object.freeze(history),
    activeSourceIds: Object.freeze(activeSourceIds),
  });
}

export function createPortfolioChatService({
  provider,
  router = routePortfolioAssistantRequest,
  conversationStore,
}: {
  provider: PortfolioChatProvider;
  router?: PortfolioAssistantRouter;
  conversationStore?: PortfolioConversationStore | null;
}) {
  let initialState: PortfolioConversationState;
  try {
    initialState = sanitizeState(conversationStore?.load() ?? null);
  } catch {
    initialState = sanitizeState(null);
  }

  const history: PortfolioConversationTurn[] = [...initialState.history];
  let activeSourceIds: readonly string[] = initialState.activeSourceIds;

  const persist = (): void => {
    if (!conversationStore) return;
    try {
      conversationStore.save(Object.freeze({
        history: Object.freeze([...history]),
        activeSourceIds: Object.freeze([...activeSourceIds]),
      }));
    } catch {
      // Session persistence is a convenience boundary; chat must remain usable if storage fails.
    }
  };

  const remember = (userText: string, assistantText: string, sourceIds: readonly string[]): void => {
    const userTurn = sanitizeTurn({ role: "user", text: userText });
    const assistantTurn = sanitizeTurn({ role: "assistant", text: assistantText });
    if (userTurn) history.push(userTurn);
    if (assistantTurn) history.push(assistantTurn);
    if (history.length > MAX_HISTORY_TURNS) history.splice(0, history.length - MAX_HISTORY_TURNS);
    activeSourceIds = Object.freeze([...new Set(sourceIds.map((sourceId) => sourceId.trim()).filter(Boolean))].slice(0, MAX_ACTIVE_SOURCE_IDS));
    persist();
  };

  return Object.freeze({
    async reply(input: PortfolioChatServiceInput): Promise<PortfolioChatServiceResult> {
      const route = router({
        ...input,
        conversation: Object.freeze({
          history: Object.freeze([...history]),
          activeSourceIds,
        }),
      });

      if (route.kind === "prepared") {
        remember(input.message, route.text, route.sourceIds);
        return route;
      }
      if (route.kind === "no_data") return Object.freeze({ kind: "no_data" as const });
      if (route.context.sourceIds.length === 0) return Object.freeze({ kind: "no_data" as const });

      try {
        const generated = await provider.generate(route);
        const state = providerState(generated);

        if (state === "no_data") return Object.freeze({ kind: "no_data" as const });
        if (state === "rate_limited") return Object.freeze({ kind: "rate_limited" as const });
        if (state === "unavailable") return Object.freeze({ kind: "unavailable" as const });

        const text = providerText(generated);
        if (!text) return Object.freeze({ kind: "unavailable" as const });

        remember(input.message, text, route.context.sourceIds);
        return Object.freeze({
          kind: "generated" as const,
          text,
          sourceIds: route.context.sourceIds,
        });
      } catch {
        return Object.freeze({ kind: "unavailable" as const });
      }
    },
  });
}
