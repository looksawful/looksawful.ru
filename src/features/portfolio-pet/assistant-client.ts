import {
  createPortfolioAssistantTransport,
  type PortfolioAssistantTransportOptions,
} from "./assistant-transport.ts";
import { resolveBrowserPortfolioConversationStore } from "./conversation-store.ts";
import {
  createPortfolioChatService,
  type PortfolioConversationStore,
} from "./portfolio-chat-service.ts";
import type { PortfolioAssistantRouter } from "./prepared-answers.ts";

export function createPortfolioAssistantClient(
  options: PortfolioAssistantTransportOptions,
  dependencies: {
    router?: PortfolioAssistantRouter;
    conversationStore?: PortfolioConversationStore | null;
  } = {},
) {
  const transport = createPortfolioAssistantTransport(options);
  return createPortfolioChatService({
    provider: transport,
    router: dependencies.router,
    conversationStore: dependencies.conversationStore ?? resolveBrowserPortfolioConversationStore(),
  });
}
