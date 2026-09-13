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
const DESK_PATH = "/tools/media-desk/";
const SESSION_COOKIE = "__Host-media_desk_session";
const SESSION_MAX_AGE = 12 * 60 * 60;
const MAX_LOGIN_BYTES = 8 * 1024;

function privateHeaders() {
  return {
    "cache-control": "private, no-store",
    "content-security-policy": "default-src 'self'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'",
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

function html(status, body, extraHeaders = {}) {
  return new Response(body, {
    status,
    headers: {
      ...privateHeaders(),
      "content-type": "text/html; charset=utf-8",
      ...extraHeaders,
    },
  });
}

function redirect(location, extraHeaders = {}) {
  return new Response(null, {
    status: 303,
    headers: {
      ...privateHeaders(),
      location,
      ...extraHeaders,
    },
  });
}

function loginPage(error = "") {
  const message = error ? `<p class="error" role="alert">${error}</p>` : "";
  return `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow,noarchive">
<title>Media Desk · looksawful</title>
<style>
:root{font-family:Inter,ui-sans-serif,system-ui,sans-serif;color:#111;background:#f3f3f0;color-scheme:light}
*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;padding:24px}
main{width:min(100%,380px);background:#fff;border:1px solid #d6d6d0;padding:28px}
h1{margin:0 0 8px;font-size:22px}p{margin:0 0 18px;color:#666;font-size:14px;line-height:1.45}
label{display:grid;gap:7px;font-size:13px}input{width:100%;border:1px solid #bbb;padding:12px;font:inherit}
input:focus{outline:2px solid #111;outline-offset:1px}button{width:100%;margin-top:18px;border:0;background:#111;color:#fff;padding:12px;font:inherit;cursor:pointer}
.error{color:#9a1616}
</style>
</head>
<body><main><h1>Media Desk</h1><p>Закрытая рабочая область looksawful.</p>${message}<form method="post" action="/login"><label>Пароль<input type="password" name="password" autocomplete="current-password" required maxlength="512"></label><button type="submit">Войти</button></form></main></body>
</html>`;
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

async function readBody(request, maxBytes) {
  const declared = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declared) && declared > maxBytes) throw new Error("Request body is too large");
  const bytes = await request.arrayBuffer();
  if (bytes.byteLength > maxBytes) throw new Error("Request body is too large");
  if (bytes.byteLength === 0) throw new Error("Request body is empty");
  return new TextDecoder().decode(bytes);
}

async function readLoginPayload(request) {
  const source = await readBody(request, MAX_LOGIN_BYTES);
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/x-www-form-urlencoded")) {
    return { password: new URLSearchParams(source).get("password") ?? "", form: true };
  }
  if (contentType.includes("application/json")) {
    const value = JSON.parse(source);
    return { password: value?.password, form: false };
  }
  throw new Error("Unsupported login content type");
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
  return verifySessionToken(token, subject, requiredSecret(env, "MEDIA_DESK_SESSION_SECRET"));
}

async function login(request, env, subject) {
  if (request.method === "GET" || request.method === "HEAD") return html(200, loginPage());
  if (request.method !== "POST") return json(405, { ok: false, error: "Method not allowed" });
  if (!sameOriginMutation(request)) return json(403, { ok: false, error: "Origin rejected" });

  let payload;
  try {
    payload = await readLoginPayload(request);
  } catch {
    return json(400, { ok: false, error: "Invalid login request" });
  }
  if (typeof payload.password !== "string" || payload.password.length === 0) {
    return payload.form
      ? html(400, loginPage("Введите пароль."))
      : json(400, { ok: false, error: "Invalid login request" });
  }

  const accepted = await passwordMatches(
    payload.password,
    requiredSecret(env, "MEDIA_DESK_PASSWORD_HASH"),
  );
  if (!accepted) {
    return payload.form
      ? html(401, loginPage("Неверный пароль."))
      : json(401, { ok: false, error: "Invalid credentials" });
  }

  const token = await createSessionToken(subject, requiredSecret(env, "MEDIA_DESK_SESSION_SECRET"));
  const headers = { "set-cookie": sessionCookie(token) };
  return payload.form ? redirect(DESK_PATH, headers) : new Response(null, {
    status: 204,
    headers: { ...privateHeaders(), ...headers },
  });
}

async function logout(request, env, subject) {
  if (request.method !== "POST") return json(405, { ok: false, error: "Method not allowed" });
  if (!sameOriginMutation(request)) return json(403, { ok: false, error: "Origin rejected" });
  if (!(await isAuthenticated(request, env, subject))) {
    return json(401, { ok: false, error: "Authentication required" });
  }
  return new Response(null, {
    status: 204,
    headers: { ...privateHeaders(), "set-cookie": expiredSessionCookie() },
  });
}

function privateResponse(response) {
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(privateHeaders())) headers.set(name, value);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function wantsHtml(request) {
  return (request.headers.get("accept") ?? "").includes("text/html");
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!isAllowedMediaDeskOrigin(url)) return json(403, { ok: false, error: "Origin rejected" });

    const subject = url.host;
    if (url.pathname === LOGIN_PATH) return login(request, env, subject);
    if (url.pathname === LOGOUT_PATH) return logout(request, env, subject);

    if (!(await isAuthenticated(request, env, subject))) {
      return wantsHtml(request)
        ? html(401, loginPage())
        : json(401, { ok: false, error: "Authentication required" });
    }

    if (url.pathname === "/") return redirect(DESK_PATH);

    if (request.method !== "GET" && request.method !== "HEAD") {
      if (!sameOriginMutation(request)) return json(403, { ok: false, error: "Origin rejected" });
      return json(405, { ok: false, error: "Method not allowed" });
    }

    if (!env?.ASSETS || typeof env.ASSETS.fetch !== "function") {
      return json(503, { ok: false, error: "Static asset binding unavailable" });
    }

    return privateResponse(await env.ASSETS.fetch(request));
  },
};
