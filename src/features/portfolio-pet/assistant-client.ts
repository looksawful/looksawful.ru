import {
  createPortfolioAssistantTransport,
  type PortfolioAssistantTransportOptions,
} from "./assistant-transport.ts";
import { createPortfolioChatService } from "./portfolio-chat-service.ts";
import type { PortfolioAssistantRouter } from "./prepared-answers.ts";

export function createPortfolioAssistantClient(
  options: PortfolioAssistantTransportOptions,
  dependencies: { router?: PortfolioAssistantRouter } = {},
) {
  const transport = createPortfolioAssistantTransport(options);
  return createPortfolioChatService({
    provider: transport,
    router: dependencies.router,
  });
}
