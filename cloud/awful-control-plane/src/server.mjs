import { createServer } from "node:http";
import { timingSafeEqual } from "node:crypto";

const PORT = Number.parseInt(process.env.PORT ?? "8080", 10);
const HOST = process.env.HOST ?? "0.0.0.0";
const SERVICE = "awful-control-plane";
const MAX_BODY_BYTES = 1024 * 1024;
const REQUEST_TIMEOUT_MS = Number.parseInt(process.env.UPSTREAM_TIMEOUT_MS ?? "120000", 10);

const YANDEX_AI_BASE_URL = stripTrailingSlash(process.env.YANDEX_AI_BASE_URL ?? "https://ai.api.cloud.yandex.net/v1");
const ALLOWED_ORIGINS = new Set(
  (process.env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean),
);

function stripTrailingSlash(value) {
  return value.replace(/\/+$/, "");
}

function json(res, statusCode, body, extraHeaders = {}) {
  const payload = JSON.stringify(body);
  res.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(payload),
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
    ...extraHeaders,
  });
  res.end(payload);
}

function corsHeaders(req) {
  const origin = req.headers.origin;
  if (!origin || !ALLOWED_ORIGINS.has(origin)) return {};
  return {
    "access-control-allow-origin": origin,
    "access-control-allow-headers": "authorization, content-type",
    "access-control-allow-methods": "GET, POST, OPTIONS",
    vary: "Origin",
  };
}

function tokenMatches(provided, expected) {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

function authorize(req) {
  const expected = process.env.AWFUL_INTERNAL_TOKEN;
  if (!expected) return { ok: false, status: 503, code: "auth_not_configured" };

  const header = req.headers.authorization ?? "";
  if (!header.startsWith("Bearer ")) return { ok: false, status: 401, code: "unauthorized" };

  const provided = header.slice("Bearer ".length);
  if (!tokenMatches(provided, expected)) return { ok: false, status: 401, code: "unauthorized" };
  return { ok: true };
}

async function readJson(req) {
  const chunks = [];
  let size = 0;

  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) {
      const error = new Error("request_too_large");
      error.status = 413;
      throw error;
    }
    chunks.push(chunk);
  }

  if (chunks.length === 0) return {};

  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    const error = new Error("invalid_json");
    error.status = 400;
    throw error;
  }
}

async function forwardYandexResponseRequest({ model, input, instructions, tools }) {
  const apiKey = process.env.YANDEX_AI_API_KEY;
  if (!apiKey) return { status: 503, body: { error: "yandex_not_configured" } };

  const selectedModel = model ?? process.env.YANDEX_AI_MODEL;
  if (!selectedModel) return { status: 400, body: { error: "model_required" } };
  if (input === undefined || input === null || input === "") {
    return { status: 400, body: { error: "input_required" } };
  }

  const upstreamBody = { model: selectedModel, input };
  if (instructions !== undefined) upstreamBody.instructions = instructions;
  if (tools !== undefined) upstreamBody.tools = tools;

  let upstream;
  try {
    upstream = await fetch(`${YANDEX_AI_BASE_URL}/responses`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(upstreamBody),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    return {
      status: 502,
      body: {
        error: "upstream_unreachable",
        provider: "yandex",
        detail: error?.name === "TimeoutError" ? "timeout" : "network_error",
      },
    };
  }

  const text = await upstream.text();
  let body;
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { error: "upstream_non_json_response", provider: "yandex", status: upstream.status };
  }

  return { status: upstream.status, body };
}

function capabilities() {
  return {
    service: SERVICE,
    version: "0.2.0",
    serverAiProvider: {
      yandex: Boolean(process.env.YANDEX_AI_API_KEY),
    },
    clients: {
      chatgpt: "planned_via_mcp_app",
      codex: "planned_via_mcp",
    },
    planned: {
      mcp: false,
      objectStorage: false,
      mediaDesk: false,
      cms: false,
      tracker: false,
      video: false,
      vision: false,
      translate: false,
      speech: false,
      observability: false,
    },
  };
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
  const cors = corsHeaders(req);

  if (req.method === "OPTIONS") {
    res.writeHead(Object.keys(cors).length ? 204 : 403, cors);
    res.end();
    return;
  }

  if (req.method === "GET" && url.pathname === "/healthz") {
    json(res, 200, { status: "ok", service: SERVICE }, cors);
    return;
  }

  if (req.method === "GET" && url.pathname === "/readyz") {
    const authConfigured = Boolean(process.env.AWFUL_INTERNAL_TOKEN);
    json(res, authConfigured ? 200 : 503, {
      status: authConfigured ? "ready" : "not_ready",
      service: SERVICE,
      authConfigured,
    }, cors);
    return;
  }

  const auth = authorize(req);
  if (!auth.ok) {
    json(res, auth.status, { error: auth.code }, cors);
    return;
  }

  if (req.method === "GET" && url.pathname === "/v1/capabilities") {
    json(res, 200, capabilities(), cors);
    return;
  }

  if (req.method === "POST" && url.pathname === "/v1/ai/responses") {
    try {
      const body = await readJson(req);
      const result = await forwardYandexResponseRequest(body);
      json(res, result.status, result.body, cors);
    } catch (error) {
      json(res, error.status ?? 500, { error: error.message ?? "internal_error" }, cors);
    }
    return;
  }

  json(res, 404, { error: "not_found" }, cors);
});

server.listen(PORT, HOST, () => {
  console.log(`${SERVICE} listening on http://${HOST}:${PORT}`);
});
