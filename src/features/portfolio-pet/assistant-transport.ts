import { buildPortfolioPetKnowledgeCandidates } from "./knowledge.ts";
import type { PortfolioAssistantRoute } from "./prepared-answers.ts";

type GenerateRoute = Extract<PortfolioAssistantRoute, { kind: "generate" }>;

type FetchLike = (
  input: string | URL | Request,
  init?: RequestInit,
) => Promise<Response>;

export type PortfolioAssistantTransportResult =
  | { kind: "answer"; text: string; sources: readonly string[] }
  | { kind: "no_data"; text: string; sources: readonly string[] }
  | { kind: "rate_limited" }
  | { kind: "unavailable" };

export interface PortfolioAssistantTransport {
  generate(route: GenerateRoute): Promise<PortfolioAssistantTransportResult>;
}

export interface PortfolioAssistantTransportOptions {
  sessionId: string;
  endpoint?: string;
  timeoutMs?: number;
  fetchImpl?: FetchLike;
}

const DEFAULT_ENDPOINT = "https://api.looksawful.ru/v1/portfolio-chat";
const DEFAULT_TIMEOUT_MS = 8_000;
const MAX_SOURCE_IDS = 12;
const PUBLIC_SITE_ORIGIN = "https://looksawful.ru";
const KNOWN_SOURCE_IDS = new Set(
  buildPortfolioPetKnowledgeCandidates().map((candidate) => candidate.id),
);

function unavailable(): PortfolioAssistantTransportResult {
  return Object.freeze({ kind: "unavailable" as const });
}

function safeSources(value: unknown, allowedSourceIds: readonly string[]): readonly string[] {
  if (!Array.isArray(value)) return Object.freeze([]);
  const allowed = new Set(allowedSourceIds);

  const sources = value
    .filter((source): source is string => typeof source === "string" && source.trim().length > 0)
    .map((source) => source.trim())
    .filter((source) => allowed.has(source))
    .slice(0, MAX_SOURCE_IDS);

  return Object.freeze([...new Set(sources)]);
}

function safeRequestSourceIds(value: readonly string[]): readonly string[] {
  const sourceIds = value
    .filter((sourceId) => KNOWN_SOURCE_IDS.has(sourceId))
    .slice(0, MAX_SOURCE_IDS);

  return Object.freeze([...new Set(sourceIds)]);
}

function safeCurrentPath(value: string, sourceIds: readonly string[]): string {
  const raw = value.trim();
  if (!raw || raw === "home") return "/";

  let parsed: URL;
  try {
    parsed = new URL(raw, `${PUBLIC_SITE_ORIGIN}/`);
  } catch {
    return "/";
  }

  if (/^https?:\/\//iu.test(raw) && parsed.origin !== PUBLIC_SITE_ORIGIN) return "/";

  const segments = parsed.pathname.split("/").filter(Boolean);
  if (segments.length === 0) return "/";

  const projectSlug = segments.length === 1
    ? segments[0]
    : segments.length === 2 && segments[0] === "work"
      ? segments[1]
      : null;

  if (!projectSlug || !sourceIds.includes(`project.${projectSlug}`)) return "/";
  return `/work/${projectSlug}/`;
}

function parseResponse(
  payload: unknown,
  allowedSourceIds: readonly string[],
): PortfolioAssistantTransportResult {
  if (!payload || typeof payload !== "object") return unavailable();

  const record = payload as Record<string, unknown>;
  if (record.kind === "rate_limited") {
    return Object.freeze({ kind: "rate_limited" as const });
  }
  if (record.kind === "unavailable") return unavailable();

  if (record.kind === "answer") {
    if (typeof record.text !== "string" || !record.text.trim()) return unavailable();
    return Object.freeze({
      kind: "answer" as const,
      text: record.text.trim(),
      sources: safeSources(record.sources, allowedSourceIds),
    });
  }

  if (record.kind === "no_data") {
    if (typeof record.text !== "string") return unavailable();
    return Object.freeze({
      kind: "no_data" as const,
      text: record.text.trim(),
      sources: safeSources(record.sources, allowedSourceIds),
    });
  }

  return unavailable();
}

export function createPortfolioAssistantTransport({
  sessionId,
  endpoint = DEFAULT_ENDPOINT,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  fetchImpl = globalThis.fetch.bind(globalThis),
}: PortfolioAssistantTransportOptions): PortfolioAssistantTransport {
  if (!sessionId.trim()) throw new Error("assistant transport requires a non-empty sessionId");

  const requestTimeoutMs = Number.isFinite(timeoutMs) && timeoutMs > 0
    ? timeoutMs
    : DEFAULT_TIMEOUT_MS;

  return Object.freeze({
    async generate(route: GenerateRoute): Promise<PortfolioAssistantTransportResult> {
      const controller = new AbortController();
      const timeout = globalThis.setTimeout(() => controller.abort(), requestTimeoutMs);
      const sourceIds = safeRequestSourceIds(route.context.sourceIds);

      try {
        const response = await fetchImpl(endpoint, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            message: route.message,
            locale: route.context.locale,
            sessionId,
            context: {
              currentPath: safeCurrentPath(route.context.page, sourceIds),
              sourceIds,
            },
          }),
          signal: controller.signal,
        });

        if (response.status === 429) {
          return Object.freeze({ kind: "rate_limited" as const });
        }
        if (!response.ok) return unavailable();

        try {
          return parseResponse(await response.json(), sourceIds);
        } catch {
          return unavailable();
        }
      } catch {
        return unavailable();
      } finally {
        globalThis.clearTimeout(timeout);
      }
    },
  });
}
