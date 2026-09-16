import type { PortfolioConversationState, PortfolioConversationTurn } from "./prepared-answers.ts";
import type { PortfolioConversationStore } from "./portfolio-chat-service.ts";

const DEFAULT_KEY = "looksawful:portfolio-assistant-conversation:v1";
const MAX_HISTORY_TURNS = 6;
const MAX_HISTORY_TEXT = 700;
const MAX_SOURCE_IDS = 12;

function parseTurn(value: unknown): PortfolioConversationTurn | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  if (record.role !== "user" && record.role !== "assistant") return null;
  if (typeof record.text !== "string") return null;
  const text = record.text.trim().slice(0, MAX_HISTORY_TEXT);
  if (!text) return null;
  return Object.freeze({ role: record.role, text });
}

function parseState(value: unknown): PortfolioConversationState | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const rawHistory = Array.isArray(record.history) ? record.history : [];
  const rawSources = Array.isArray(record.activeSourceIds) ? record.activeSourceIds : [];
  const history = rawHistory
    .map(parseTurn)
    .filter((turn): turn is PortfolioConversationTurn => Boolean(turn))
    .slice(-MAX_HISTORY_TURNS);
  const activeSourceIds = [...new Set(
    rawSources
      .filter((sourceId): sourceId is string => typeof sourceId === "string")
      .map((sourceId) => sourceId.trim())
      .filter(Boolean),
  )].slice(0, MAX_SOURCE_IDS);

  if (!history.length && !activeSourceIds.length) return null;
  return Object.freeze({
    history: Object.freeze(history),
    activeSourceIds: Object.freeze(activeSourceIds),
  });
}

export function createSessionPortfolioConversationStore(
  storage: Pick<Storage, "getItem" | "setItem">,
  key = DEFAULT_KEY,
): PortfolioConversationStore {
  return Object.freeze({
    load(): PortfolioConversationState | null {
      const raw = storage.getItem(key);
      if (!raw) return null;
      try {
        return parseState(JSON.parse(raw));
      } catch {
        return null;
      }
    },
    save(state: PortfolioConversationState): void {
      storage.setItem(key, JSON.stringify({
        history: state.history.slice(-MAX_HISTORY_TURNS).map((turn) => ({
          role: turn.role,
          text: turn.text.trim().slice(0, MAX_HISTORY_TEXT),
        })),
        activeSourceIds: [...new Set(state.activeSourceIds)].slice(0, MAX_SOURCE_IDS),
      }));
    },
  });
}

export function resolveBrowserPortfolioConversationStore(): PortfolioConversationStore | null {
  try {
    const storage = globalThis.sessionStorage;
    return storage ? createSessionPortfolioConversationStore(storage) : null;
  } catch {
    return null;
  }
}
