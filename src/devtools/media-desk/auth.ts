import {
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { Plugin } from "vite";

const AUTH_LOGIN_PATH = "/__media-desk/auth/login";
const AUTH_LOGOUT_PATH = "/__media-desk/auth/logout";
const AUTH_SESSION_PATH = "/__media-desk/auth/session";
const LOGIN_PAGE_PATH = "/tools/media-desk/login/";
const MEDIA_DESK_PATH = "/tools/media-desk/";
const COOKIE_NAME = "__Host-looksawful-media-desk";
const MAX_AUTH_BODY_BYTES = 8 * 1024;
const MAX_LOGIN_ATTEMPTS = 10;
const LOGIN_WINDOW_MS = 5 * 60 * 1000;
const SESSION_TTL_SECONDS = 12 * 60 * 60;
const SCRYPT_KEY_BYTES = 32;

interface MediaDeskAuthConfig {
  username: string;
  passwordHash: string;
  sessionSecret: string;
  publicOrigin?: string;
  allowInsecureCookie: boolean;
}

interface SessionPayload {
  username: string;
  issuedAt: number;
  expiresAt: number;
  nonce: string;
}

interface LoginWindow {
  startedAt: number;
  attempts: number;
}

const loginWindows = new Map<string, LoginWindow>();

function envValue(name: string): string {
  const value = process.env[name]?.trim() ?? "";
  if (!value) throw new Error(`${name} is required when MEDIA_DESK_AUTH=1`);
  return value;
}

function loadAuthConfig(): MediaDeskAuthConfig {
  const publicOrigin = process.env.MEDIA_DESK_PUBLIC_ORIGIN?.trim();
  if (publicOrigin) {
    const url = new URL(publicOrigin);
    if (url.pathname !== "/" || url.search || url.hash) {
      throw new Error("MEDIA_DESK_PUBLIC_ORIGIN must contain only scheme and host");
    }
  }

  return {
    username: envValue("MEDIA_DESK_USERNAME"),
    passwordHash: envValue("MEDIA_DESK_PASSWORD_HASH"),
    sessionSecret: envValue("MEDIA_DESK_SESSION_SECRET"),
    publicOrigin: publicOrigin ? new URL(publicOrigin).origin : undefined,
    allowInsecureCookie: process.env.MEDIA_DESK_ALLOW_INSECURE_AUTH === "1",
  };
}

function html(response: ServerResponse, status: number, body: string): void {
  response.statusCode = status;
  response.setHeader("content-type", "text/html; charset=utf-8");
  response.setHeader("cache-control", "no-store");
  response.setHeader("x-robots-tag", "noindex, nofollow, noarchive");
  response.setHeader("x-content-type-options", "nosniff");
  response.setHeader("referrer-policy", "no-referrer");
  response.end(body);
}

function json(response: ServerResponse, status: number, body: Record<string, unknown>): void {
  response.statusCode = status;
  response.setHeader("content-type", "application/json; charset=utf-8");
  response.setHeader("cache-control", "no-store");
  response.setHeader("x-robots-tag", "noindex, nofollow, noarchive");
  response.end(`${JSON.stringify(body)}\n`);
}

function redirect(response: ServerResponse, location: string): void {
  response.statusCode = 303;
  response.setHeader("location", location);
  response.setHeader("cache-control", "no-store");
  response.end();
}

function loginPage(error = false): string {
  const errorBlock = error
    ? '<p class="error" role="alert">Неверные данные для входа.</p>'
    : "";

  return `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex,nofollow,noarchive">
  <title>Media Desk · looksawful</title>
  <style>
    :root { color-scheme: light; font-family: Inter, ui-sans-serif, system-ui, sans-serif; }
    * { box-sizing: border-box; }
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #f4f4f2; color: #111; }
    main { width: min(92vw, 380px); background: #fff; border: 1px solid #d8d8d3; padding: 28px; }
    h1 { margin: 0 0 8px; font-size: 22px; font-weight: 650; }
    p { margin: 0 0 22px; color: #666; font-size: 14px; line-height: 1.45; }
    label { display: grid; gap: 7px; margin-top: 14px; font-size: 13px; }
    input { width: 100%; border: 1px solid #c7c7c2; background: #fff; padding: 11px 12px; font: inherit; }
    input:focus { outline: 2px solid #111; outline-offset: 1px; }
    button { width: 100%; margin-top: 20px; border: 0; background: #111; color: #fff; padding: 12px 14px; font: inherit; cursor: pointer; }
    .error { margin: 14px 0 0; color: #9d1414; }
  </style>
</head>
<body>
  <main>
    <h1>Media Desk</h1>
    <p>Закрытая рабочая область looksawful.</p>
    ${errorBlock}
    <form method="post" action="${AUTH_LOGIN_PATH}" autocomplete="on">
      <label>Учётная запись<input name="username" autocomplete="username" required maxlength="128"></label>
      <label>Пароль<input name="password" type="password" autocomplete="current-password" required maxlength="512"></label>
      <button type="submit">Войти</button>
    </form>
  </main>
</body>
</html>`;
}

async function readAuthBody(request: IncomingMessage): Promise<URLSearchParams> {
  const chunks: Buffer[] = [];
  let size = 0;

  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.byteLength;
    if (size > MAX_AUTH_BODY_BYTES) throw new Error("Authentication request is too large");
    chunks.push(buffer);
  }

  const contentType = request.headers["content-type"] ?? "";
  if (!contentType.startsWith("application/x-www-form-urlencoded")) {
    throw new Error("Unsupported authentication content type");
  }

  return new URLSearchParams(Buffer.concat(chunks).toString("utf8"));
}

function parseScryptHash(encoded: string): { salt: Buffer; expected: Buffer } | null {
  const parts = encoded.split("$");
  if (parts.length !== 4 || parts[0] !== "scrypt" || parts[1] !== "v1") return null;

  try {
    const salt = Buffer.from(parts[2], "base64url");
    const expected = Buffer.from(parts[3], "base64url");
    if (salt.byteLength < 16 || expected.byteLength !== SCRYPT_KEY_BYTES) return null;
    return { salt, expected };
  } catch {
    return null;
  }
}

export function createMediaDeskPasswordHash(password: string, salt = randomBytes(16)): string {
  if (password.length < 12) throw new Error("Media Desk password must be at least 12 characters");
  const digest = scryptSync(password, salt, SCRYPT_KEY_BYTES, {
    N: 16384,
    r: 8,
    p: 1,
    maxmem: 64 * 1024 * 1024,
  });
  return `scrypt$v1$${salt.toString("base64url")}$${digest.toString("base64url")}`;
}

export function verifyMediaDeskPassword(password: string, encoded: string): boolean {
  const parsed = parseScryptHash(encoded);
  if (!parsed) return false;
  const actual = scryptSync(password, parsed.salt, parsed.expected.byteLength, {
    N: 16384,
    r: 8,
    p: 1,
    maxmem: 64 * 1024 * 1024,
  });
  return timingSafeEqual(actual, parsed.expected);
}

function encodePayload(payload: SessionPayload): string {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

function signPayload(encodedPayload: string, secret: string): string {
  return createHmac("sha256", secret).update(encodedPayload).digest("base64url");
}

export function createMediaDeskSessionToken(
  username: string,
  secret: string,
  now = Date.now(),
): string {
  const issuedAt = Math.floor(now / 1000);
  const payload: SessionPayload = {
    username,
    issuedAt,
    expiresAt: issuedAt + SESSION_TTL_SECONDS,
    nonce: randomBytes(12).toString("base64url"),
  };
  const encodedPayload = encodePayload(payload);
  return `${encodedPayload}.${signPayload(encodedPayload, secret)}`;
}

export function verifyMediaDeskSessionToken(
  token: string,
  username: string,
  secret: string,
  now = Date.now(),
): boolean {
  const [encodedPayload, providedSignature, ...extra] = token.split(".");
  if (!encodedPayload || !providedSignature || extra.length > 0) return false;

  const expectedSignature = signPayload(encodedPayload, secret);
  const expectedBuffer = Buffer.from(expectedSignature);
  const providedBuffer = Buffer.from(providedSignature);
  if (expectedBuffer.byteLength !== providedBuffer.byteLength) return false;
  if (!timingSafeEqual(expectedBuffer, providedBuffer)) return false;

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as Partial<SessionPayload>;
    const nowSeconds = Math.floor(now / 1000);
    return payload.username === username
      && typeof payload.issuedAt === "number"
      && typeof payload.expiresAt === "number"
      && payload.issuedAt <= nowSeconds + 60
      && payload.expiresAt > nowSeconds
      && payload.expiresAt - payload.issuedAt === SESSION_TTL_SECONDS
      && typeof payload.nonce === "string"
      && payload.nonce.length >= 8;
  } catch {
    return false;
  }
}

function cookieValue(request: IncomingMessage, name: string): string | undefined {
  const cookie = request.headers.cookie ?? "";
  for (const chunk of cookie.split(";")) {
    const [rawName, ...rest] = chunk.trim().split("=");
    if (rawName === name) return rest.join("=");
  }
  return undefined;
}

function setSessionCookie(
  response: ServerResponse,
  token: string,
  allowInsecureCookie: boolean,
): void {
  const secure = allowInsecureCookie ? "" : "; Secure";
  response.setHeader(
    "set-cookie",
    `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_TTL_SECONDS}${secure}`,
  );
}

function clearSessionCookie(response: ServerResponse, allowInsecureCookie: boolean): void {
  const secure = allowInsecureCookie ? "" : "; Secure";
  response.setHeader(
    "set-cookie",
    `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure}`,
  );
}

function isAuthenticated(request: IncomingMessage, config: MediaDeskAuthConfig): boolean {
  const token = cookieValue(request, COOKIE_NAME);
  return token ? verifyMediaDeskSessionToken(token, config.username, config.sessionSecret) : false;
}

function requestOrigin(request: IncomingMessage): string | null {
  const origin = request.headers.origin;
  if (typeof origin === "string" && origin) return origin;
  return null;
}

function expectedOrigin(request: IncomingMessage, config: MediaDeskAuthConfig): string | null {
  if (config.publicOrigin) return config.publicOrigin;
  const host = request.headers.host;
  if (!host) return null;
  const forwardedProto = request.headers["x-forwarded-proto"];
  const proto = typeof forwardedProto === "string" && forwardedProto.split(",")[0]?.trim() === "https"
    ? "https"
    : "http";
  return `${proto}://${host}`;
}

function hasSafeOrigin(request: IncomingMessage, config: MediaDeskAuthConfig): boolean {
  const origin = requestOrigin(request);
  if (!origin) return true;
  const expected = expectedOrigin(request, config);
  return expected !== null && origin === expected;
}

function remoteKey(request: IncomingMessage): string {
  const forwarded = request.headers["cf-connecting-ip"] ?? request.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim()) return forwarded.split(",")[0]!.trim();
  return request.socket.remoteAddress ?? "unknown";
}

function canAttemptLogin(request: IncomingMessage, now = Date.now()): boolean {
  const key = remoteKey(request);
  const current = loginWindows.get(key);
  if (!current || now - current.startedAt >= LOGIN_WINDOW_MS) {
    loginWindows.set(key, { startedAt: now, attempts: 1 });
    return true;
  }
  current.attempts += 1;
  return current.attempts <= MAX_LOGIN_ATTEMPTS;
}

function resetLoginWindow(request: IncomingMessage): void {
  loginWindows.delete(remoteKey(request));
}

function requestPath(request: IncomingMessage): string {
  return new URL(request.url ?? "/", "http://media-desk.invalid").pathname;
}

function unauthorized(request: IncomingMessage, response: ServerResponse): void {
  const path = requestPath(request);
  if (path.startsWith("/__media-desk/")) {
    json(response, 401, { ok: false, error: "Authentication required" });
    return;
  }
  redirect(response, LOGIN_PAGE_PATH);
}

async function handleLogin(
  request: IncomingMessage,
  response: ServerResponse,
  config: MediaDeskAuthConfig,
): Promise<void> {
  if (request.method !== "POST") {
    json(response, 405, { ok: false, error: "Method not allowed" });
    return;
  }
  if (!hasSafeOrigin(request, config)) {
    json(response, 403, { ok: false, error: "Origin rejected" });
    return;
  }
  if (!canAttemptLogin(request)) {
    response.setHeader("retry-after", "300");
    html(response, 429, loginPage(true));
    return;
  }

  try {
    const body = await readAuthBody(request);
    const username = body.get("username") ?? "";
    const password = body.get("password") ?? "";
    const validUser = username === config.username;
    const validPassword = verifyMediaDeskPassword(password, config.passwordHash);
    if (!validUser || !validPassword) {
      html(response, 401, loginPage(true));
      return;
    }

    resetLoginWindow(request);
    const token = createMediaDeskSessionToken(config.username, config.sessionSecret);
    setSessionCookie(response, token, config.allowInsecureCookie);
    redirect(response, MEDIA_DESK_PATH);
  } catch {
    html(response, 400, loginPage(true));
  }
}

function handleLogout(
  request: IncomingMessage,
  response: ServerResponse,
  config: MediaDeskAuthConfig,
): void {
  if (request.method !== "POST") {
    json(response, 405, { ok: false, error: "Method not allowed" });
    return;
  }
  if (!hasSafeOrigin(request, config)) {
    json(response, 403, { ok: false, error: "Origin rejected" });
    return;
  }
  clearSessionCookie(response, config.allowInsecureCookie);
  redirect(response, LOGIN_PAGE_PATH);
}

export function createMediaDeskAuthPlugin(): Plugin {
  const config = loadAuthConfig();

  return {
    name: "looksawful-media-desk-auth",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        const path = requestPath(request);

        if (path === LOGIN_PAGE_PATH || path === LOGIN_PAGE_PATH.slice(0, -1)) {
          if (isAuthenticated(request, config)) {
            redirect(response, MEDIA_DESK_PATH);
          } else {
            html(response, 200, loginPage());
          }
          return;
        }

        if (path === AUTH_LOGIN_PATH) {
          await handleLogin(request, response, config);
          return;
        }

        if (path === AUTH_LOGOUT_PATH) {
          handleLogout(request, response, config);
          return;
        }

        if (path === AUTH_SESSION_PATH) {
          json(response, isAuthenticated(request, config) ? 200 : 401, {
            ok: isAuthenticated(request, config),
          });
          return;
        }

        if (!isAuthenticated(request, config)) {
          unauthorized(request, response);
          return;
        }

        next();
      });
    },
  };
}
