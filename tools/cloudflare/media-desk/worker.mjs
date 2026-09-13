import {
  createSessionToken,
  passwordMatches,
  verifySessionToken,
} from "./auth.mjs";
import {
  isAllowedMediaDeskOrigin,
  sameOriginMutation,
} from "./domain.mjs";

const LOGIN_PATH = "/login";
const LOGOUT_PATH = "/logout";
const SESSION_COOKIE = "__Host-media_desk_session";
const SESSION_MAX_AGE = 12 * 60 * 60;
const MAX_LOGIN_BYTES = 8 * 1024;

function privateHeaders() {
  return {
    "cache-control": "private, no-store",
    "referrer-policy": "no-referrer",
    "x-content-type-options": "nosniff",
    "x-frame-options": "DENY",
    "x-robots-tag": "noindex, nofollow, noarchive",
  };
}

function json(status, body, extraHeaders = {}) {
  return new Response(`${JSON.stringify(body)}\n`, {
    status,
    headers: {
      ...privateHeaders(),
      "content-type": "application/json; charset=utf-8",
      ...extraHeaders,
    },
  });
}

function sessionCookie(token) {
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_MAX_AGE}`;
}

function expiredSessionCookie() {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}

function cookieValue(request, name) {
  const source = request.headers.get("cookie") ?? "";
  for (const chunk of source.split(";")) {
    const [key, ...rest] = chunk.trim().split("=");
    if (key === name) return rest.join("=");
  }
  return undefined;
}

async function readJson(request, maxBytes) {
  const declared = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declared) && declared > maxBytes) {
    throw new Error("Request body is too large");
  }
  const bytes = await request.arrayBuffer();
  if (bytes.byteLength > maxBytes) throw new Error("Request body is too large");
  if (bytes.byteLength === 0) throw new Error("Request body is empty");
  return JSON.parse(new TextDecoder().decode(bytes));
}

function requiredSecret(env, key) {
  const value = env?.[key];
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Missing Media Desk runtime secret: ${key}`);
  }
  return value;
}

async function isAuthenticated(request, env, subject) {
  const token = cookieValue(request, SESSION_COOKIE);
  if (!token) return false;
  return verifySessionToken(
    token,
    subject,
    requiredSecret(env, "MEDIA_DESK_SESSION_SECRET"),
  );
}

async function login(request, env, subject) {
  if (request.method !== "POST") {
    return json(405, { ok: false, error: "Method not allowed" });
  }
  if (!sameOriginMutation(request)) {
    return json(403, { ok: false, error: "Origin rejected" });
  }

  let payload;
  try {
    payload = await readJson(request, MAX_LOGIN_BYTES);
  } catch {
    return json(400, { ok: false, error: "Invalid login request" });
  }

  const password = payload?.password;
  if (typeof password !== "string") {
    return json(400, { ok: false, error: "Invalid login request" });
  }

  const accepted = await passwordMatches(
    password,
    requiredSecret(env, "MEDIA_DESK_PASSWORD_HASH"),
  );
  if (!accepted) return json(401, { ok: false, error: "Invalid credentials" });

  const token = await createSessionToken(
    subject,
    requiredSecret(env, "MEDIA_DESK_SESSION_SECRET"),
  );
  return new Response(null, {
    status: 204,
    headers: {
      ...privateHeaders(),
      "set-cookie": sessionCookie(token),
    },
  });
}

async function logout(request, env, subject) {
  if (request.method !== "POST") {
    return json(405, { ok: false, error: "Method not allowed" });
  }
  if (!sameOriginMutation(request)) {
    return json(403, { ok: false, error: "Origin rejected" });
  }
  if (!(await isAuthenticated(request, env, subject))) {
    return json(401, { ok: false, error: "Authentication required" });
  }
  return new Response(null, {
    status: 204,
    headers: {
      ...privateHeaders(),
      "set-cookie": expiredSessionCookie(),
    },
  });
}

function privateResponse(response) {
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(privateHeaders())) {
    headers.set(name, value);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!isAllowedMediaDeskOrigin(url)) {
      return json(403, { ok: false, error: "Origin rejected" });
    }

    const subject = url.host;
    if (url.pathname === LOGIN_PATH) return login(request, env, subject);
    if (url.pathname === LOGOUT_PATH) return logout(request, env, subject);

    if (!(await isAuthenticated(request, env, subject))) {
      return json(401, { ok: false, error: "Authentication required" });
    }

    if (request.method !== "GET" && request.method !== "HEAD") {
      if (!sameOriginMutation(request)) {
        return json(403, { ok: false, error: "Origin rejected" });
      }
      return json(405, { ok: false, error: "Method not allowed" });
    }

    if (!env?.ASSETS || typeof env.ASSETS.fetch !== "function") {
      return json(503, { ok: false, error: "Static asset binding unavailable" });
    }

    return privateResponse(await env.ASSETS.fetch(request));
  },
};
