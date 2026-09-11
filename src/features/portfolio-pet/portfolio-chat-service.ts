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
  | Extract<PortfolioAssistantRoute, { kind: "generate" }>
  | { kind: "no_data" };

export function createPortfolioChatService({ provider }: { provider: PortfolioChatProvider }) {
  return Object.freeze({
    async reply(input: PortfolioChatServiceInput): Promise<PortfolioChatServiceResult> {
      const route = routePortfolioAssistantRequest(input);
      if (route.kind === "prepared") return route;
      if (route.context.sourceIds.length === 0) return Object.freeze({ kind: "no_data" as const });

      void provider;
      return route;
    },
  });
}
