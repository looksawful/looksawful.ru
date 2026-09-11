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

export function createPortfolioChatService({ provider }: { provider: PortfolioChatProvider }) {
  return Object.freeze({
    async reply(input: PortfolioChatServiceInput): Promise<PortfolioAssistantRoute> {
      const route = routePortfolioAssistantRequest(input);
      if (route.kind === "prepared") return route;

      void provider;
      return route;
    },
  });
}
