"use strict";

const POSTBOX_URL = "https://postbox.cloud.yandex.net/v2/email/outbound-emails";
const FROM_ADDRESS = "site@contact.looksawful.ru";
const TO_ADDRESS = "i@lookawful.ru";
const ALLOWED_ORIGINS = new Set([
  "https://looksawful.ru",
  "https://www.looksawful.ru",
]);
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT = 4;
const recentByIp = new Map();

function json(statusCode, payload, origin = "") {
  const headers = {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    vary: "Origin",
  };
  if (ALLOWED_ORIGINS.has(origin)) headers["access-control-allow-origin"] = origin;
  return { statusCode, headers, body: JSON.stringify(payload) };
}

function normalizeHeaders(headers = {}) {
  return Object.fromEntries(Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value]));
}
function readPayload(event, context) {
  try {
    if (typeof context?.getPayload === "function") return context.getPayload();
    if (event && typeof event.body === "string") return JSON.parse(event.body);
    if (event && typeof event === "object") return event;
  } catch {
    return null;
  }
  return null;
}

function trimString(value, max) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

function validEmail(value) {
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function clientIp(headers) {
  const forwarded = String(headers["x-forwarded-for"] || "").split(",")[0].trim();
  return forwarded || String(headers["x-real-ip"] || "unknown");
}
function rateLimited(ip) {
  const now = Date.now();
  const recent = (recentByIp.get(ip) || []).filter((timestamp) => now - timestamp < RATE_WINDOW_MS);
  if (recent.length >= RATE_LIMIT) {
    recentByIp.set(ip, recent);
    return true;
  }
  recent.push(now);
  recentByIp.set(ip, recent);
  return false;
}

function buildMail(value) {
  const label = value.name || value.email;
  const text = [
    "Новая заявка с looksawful.ru",
    "",
    `Имя: ${value.name || "—"}`,
    `Email: ${value.email}`,
    "",
    "Сообщение:",
    value.message,
    "",
    `Страница: ${value.page || "/"}`,
    `Получено: ${new Date().toISOString()}`,
  ].join("\n");
  return { label, text };
}
module.exports.handler = async function handler(event, context) {
  const headers = normalizeHeaders(event?.headers);
  const origin = String(headers.origin || "");
  const method = String(event?.httpMethod || event?.requestContext?.http?.method || "POST").toUpperCase();

  if (method === "OPTIONS") {
    if (!ALLOWED_ORIGINS.has(origin)) return json(403, { ok: false }, origin);
    return {
      statusCode: 204,
      headers: {
        "access-control-allow-origin": origin,
        "access-control-allow-methods": "POST, OPTIONS",
        "access-control-allow-headers": "Content-Type",
        "access-control-max-age": "600",
        vary: "Origin",
      },
      body: "",
    };
  }

  if (method !== "POST") return json(405, { ok: false, error: "method_not_allowed" }, origin);
  if (!ALLOWED_ORIGINS.has(origin)) return json(403, { ok: false, error: "origin_not_allowed" }, origin);

  const payload = readPayload(event, context);
  if (!payload || typeof payload !== "object") return json(400, { ok: false, error: "invalid_json" }, origin);
  const website = trimString(payload.website, 200);
  if (website) return json(200, { ok: true }, origin);

  const value = {
    name: trimString(payload.name, 120),
    email: trimString(payload.email, 254),
    message: trimString(payload.message, 5000),
    page: trimString(payload.page, 300),
  };
  if (!validEmail(value.email) || value.message.length < 3) {
    return json(422, { ok: false, error: "validation_failed" }, origin);
  }
  if (value.page && !value.page.startsWith("/")) value.page = "/";

  const ip = clientIp(headers);
  if (rateLimited(ip)) return json(429, { ok: false, error: "rate_limited" }, origin);

  const token = context?.token?.access_token;
  if (!token) {
    console.error("contact-mail: missing service-account IAM token", context?.requestId || "unknown");
    return json(503, { ok: false, error: "mail_unavailable" }, origin);
  }

  const mail = buildMail(value);
  const requestBody = {
    FromEmailAddress: FROM_ADDRESS,
    Destination: { ToAddresses: [TO_ADDRESS] },
    ReplyToAddresses: [value.email],
    Content: {
      Simple: {
        Subject: { Data: `Новая заявка — ${mail.label}`, Charset: "UTF-8" },
        Body: { Text: { Data: mail.text, Charset: "UTF-8" } },
      },
    },
  };

  try {
    const response = await fetch(POSTBOX_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-yacloud-subjecttoken": token,
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) {
      console.error("contact-mail: Postbox rejected request", response.status, context?.requestId || "unknown");
      return json(502, { ok: false, error: "mail_rejected" }, origin);
    }
    return json(200, { ok: true }, origin);
  } catch (error) {
    console.error("contact-mail: Postbox request failed", error?.name || "Error", context?.requestId || "unknown");
    return json(502, { ok: false, error: "mail_failed" }, origin);
  }
};
