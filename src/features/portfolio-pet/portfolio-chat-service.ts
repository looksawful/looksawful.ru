import {
  routePortfolioAssistantRequest,
  type PortfolioAssistantRoute,
} from "./prepared-answers.ts";

export interface PortfolioChatProvider {
  generate(input: Extract<PortfolioAssistantRoute, { kind: "generate" }>): Promise<{ text: string }>;
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
  | { kind: "unavailable" };

export function createPortfolioChatService({ provider }: { provider: PortfolioChatProvider }) {
  return Object.freeze({
    async reply(input: PortfolioChatServiceInput): Promise<PortfolioChatServiceResult> {
      const route = routePortfolioAssistantRequest(input);
      if (route.kind === "prepared") return route;
      if (route.context.sourceIds.length === 0) return Object.freeze({ kind: "no_data" as const });

      try {
        const generated = await provider.generate(route);
        return Object.freeze({
          kind: "generated" as const,
          text: generated.text,
          sourceIds: route.context.sourceIds,
        });
      } catch {
        return Object.freeze({ kind: "unavailable" as const });
      }
    },
  });
}
