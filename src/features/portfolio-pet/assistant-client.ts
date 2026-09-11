import {
  createPortfolioAssistantTransport,
  type PortfolioAssistantTransportOptions,
} from "./assistant-transport.ts";
import { createPortfolioChatService } from "./portfolio-chat-service.ts";

export function createPortfolioAssistantClient(options: PortfolioAssistantTransportOptions) {
  const transport = createPortfolioAssistantTransport(options);
  return createPortfolioChatService({ provider: transport });
}
