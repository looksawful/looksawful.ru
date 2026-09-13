import {
  routePortfolioAssistantRequest,
  type PortfolioAssistantRoute,
  type PortfolioAssistantRouter,
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

export type PortfolioChatServiceResult =
  | Extract<PortfolioAssistantRoute, { kind: "prepared" }>
  | { kind: "generated"; text: string; sourceIds: readonly string[] }
  | { kind: "no_data" }
  | { kind: "rate_limited" }
  | { kind: "unavailable" };

const MAX_HISTORY_TURNS = 6;

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

export function createPortfolioChatService({
  provider,
  router = routePortfolioAssistantRequest,
}: {
  provider: PortfolioChatProvider;
  router?: PortfolioAssistantRouter;
}) {
  const history: PortfolioConversationTurn[] = [];
  let activeSourceIds: readonly string[] = Object.freeze([]);

  const remember = (userText: string, assistantText: string, sourceIds: readonly string[]): void => {
    history.push(
      Object.freeze({ role: "user", text: userText.trim() }),
      Object.freeze({ role: "assistant", text: assistantText.trim() }),
    );
    if (history.length > MAX_HISTORY_TURNS) history.splice(0, history.length - MAX_HISTORY_TURNS);
    activeSourceIds = Object.freeze([...sourceIds]);
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
