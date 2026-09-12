export interface PublicAssistantSource {
  id: string;
  title?: string;
  text: string;
}

export interface PublicAssistantProviderInput {
  message: string;
  locale: "ru" | "en";
  sources: readonly PublicAssistantSource[];
}

export type PublicAssistantProviderResult =
  | { kind: "answer"; text: string }
  | { kind: "no_data" }
  | { kind: "rate_limited" }
  | { kind: "unavailable" };

export type PublicAssistantProvider = (
  input: PublicAssistantProviderInput,
) => Promise<PublicAssistantProviderResult>;

export interface PublicAssistantHandlerOptions {
  enabled: boolean;
  allowedOrigins: readonly string[];
  sources: Readonly<Record<string, PublicAssistantSource>>;
  provider: PublicAssistantProvider;
}

interface PublicAssistantEvent {
  httpMethod?: string;
  headers?: Record<string, string | undefined>;
  body?: string | null;
}

interface PublicAssistantResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

interface PublicAssistantRequest {
  message: string;
  locale: "ru" | "en";
  sessionId: string;
  sourceIds: readonly string[];
}

const MAX_REQUEST_BODY_LENGTH = 8_192;
const MAX_MESSAGE_LENGTH = 2_000;
const MAX_SESSION_ID_LENGTH = 128;
const MAX_SOURCE_IDS = 12;
const MAX_SOURCE_ID_LENGTH = 128;
const MAX_SOURCE_TEXT_LENGTH = 4_000;
const MAX_TOTAL_SOURCE_TEXT_LENGTH = 12_000;
const MAX_RESPONSE_TEXT_LENGTH = 4_000;

function header(event: PublicAssistantEvent, name: string): string {
  const expected = name.toLowerCase();
  for (const [key, value] of Object.entries(event.headers ?? {})) {
    if (key.toLowerCase() === expected && typeof value === "string") return value;
  }
  return "";
}

function responseHeaders(origin: string, allowed: boolean): Record<string, string> {
  const headers: Record<string, string> = {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    vary: "Origin",
  };
  if (allowed) headers["access-control-allow-origin"] = origin;
  return headers;
}

function jsonResponse(
  statusCode: number,
  payload: unknown,
  origin: string,
  allowed: boolean,
): PublicAssistantResponse {
  return {
    statusCode,
    headers: responseHeaders(origin, allowed),
    body: JSON.stringify(payload),
  };
}

function parseRequest(body: string | null | undefined): PublicAssistantRequest | null {
  if (!body || body.length > MAX_REQUEST_BODY_LENGTH) return null;

  let value: unknown;
  try {
    value = JSON.parse(body);
  } catch {
    return null;
  }
  if (!value || typeof value !== "object") return null;

  const record = value as Record<string, unknown>;
  const message = typeof record.message === "string" ? record.message.trim() : "";
  const locale = record.locale;
  const sessionId = typeof record.sessionId === "string" ? record.sessionId.trim() : "";

  if (!message || message.length > MAX_MESSAGE_LENGTH) return null;
  if (locale !== "ru" && locale !== "en") return null;
  if (!sessionId || sessionId.length > MAX_SESSION_ID_LENGTH) return null;

  const context = record.context;
  if (!context || typeof context !== "object") return null;
  const rawSourceIds = (context as Record<string, unknown>).sourceIds;
  if (!Array.isArray(rawSourceIds) || rawSourceIds.length > MAX_SOURCE_IDS) return null;
  if (!rawSourceIds.every((sourceId) => typeof sourceId === "string")) return null;

  const sourceIds = [...new Set(
    rawSourceIds
      .map((sourceId) => sourceId.trim())
      .filter(Boolean),
  )];

  if (sourceIds.some((sourceId) => sourceId.length > MAX_SOURCE_ID_LENGTH)) return null;

  return { message, locale, sessionId, sourceIds };
}

function approvedSourceContextIsBounded(sources: readonly PublicAssistantSource[]): boolean {
  let totalTextLength = 0;
  for (const source of sources) {
    const textLength = source.text.length;
    if (textLength === 0 || textLength > MAX_SOURCE_TEXT_LENGTH) return false;
    totalTextLength += textLength;
    if (totalTextLength > MAX_TOTAL_SOURCE_TEXT_LENGTH) return false;
  }
  return true;
}

export function createPublicAssistantHandler({
  enabled,
  allowedOrigins,
  sources,
  provider,
}: PublicAssistantHandlerOptions) {
  const originSet = new Set(allowedOrigins);

  return async function handle(event: PublicAssistantEvent): Promise<PublicAssistantResponse> {
    const origin = header(event, "origin");
    const allowedOrigin = originSet.has(origin);

    if (!allowedOrigin) {
      return jsonResponse(403, { kind: "unavailable" }, origin, false);
    }

    if (event.httpMethod === "OPTIONS") {
      return {
        statusCode: 204,
        headers: {
          ...responseHeaders(origin, true),
          "access-control-allow-methods": "POST, OPTIONS",
          "access-control-allow-headers": "content-type",
        },
        body: "",
      };
    }

    if (event.httpMethod !== "POST") {
      return jsonResponse(405, { kind: "unavailable" }, origin, true);
    }

    if (!enabled) {
      return jsonResponse(503, { kind: "unavailable" }, origin, true);
    }

    const request = parseRequest(event.body);
    if (!request) {
      return jsonResponse(400, { kind: "unavailable" }, origin, true);
    }

    const approvedSources = request.sourceIds
      .map((sourceId) => sources[sourceId])
      .filter((source): source is PublicAssistantSource => Boolean(source));

    if (approvedSources.length === 0) {
      return jsonResponse(
        200,
        { kind: "no_data", text: "", sources: [] },
        origin,
        true,
      );
    }

    if (!approvedSourceContextIsBounded(approvedSources)) {
      return jsonResponse(503, { kind: "unavailable" }, origin, true);
    }

    try {
      const result = await provider({
        message: request.message,
        locale: request.locale,
        sources: approvedSources,
      });

      if (result.kind === "rate_limited") {
        return jsonResponse(429, { kind: "rate_limited" }, origin, true);
      }
      if (result.kind === "no_data") {
        return jsonResponse(200, { kind: "no_data", text: "", sources: [] }, origin, true);
      }
      if (result.kind === "unavailable") {
        return jsonResponse(503, { kind: "unavailable" }, origin, true);
      }

      const text = result.text.trim();
      if (!text || text.length > MAX_RESPONSE_TEXT_LENGTH) {
        return jsonResponse(503, { kind: "unavailable" }, origin, true);
      }

      return jsonResponse(
        200,
        {
          kind: "answer",
          text,
          sources: approvedSources.map((source) => source.id),
        },
        origin,
        true,
      );
    } catch {
      return jsonResponse(503, { kind: "unavailable" }, origin, true);
    }
  };
}
