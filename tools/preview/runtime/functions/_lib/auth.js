const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

export const SESSION_COOKIE_NAME = "__Host-preview_session";
export const HUMAN_SESSION_SECONDS = 12 * 60 * 60;
export const CI_SESSION_SECONDS = 30 * 60;

const HASH_PREFIX = "sha256:";
const HASH_PATTERN = /^sha256:([A-Za-z0-9_-]{43})$/;
const REQUIRED_BINDINGS = [
  "PREVIEW_PASSWORD_HASH",
  "PREVIEW_SESSION_SECRET",
  "PREVIEW_CI_TOKEN_HASH",
];

function bytesToBase64Url(bytes) {
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  }
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/u, "");
}

function base64UrlToBytes(value) {
  if (typeof value !== "string" || !/^[A-Za-z0-9_-]+$/u.test(value)) {
    throw new Error("invalid base64url value");
  }
  const base64 = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded = `${base64}${"=".repeat((4 - (base64.length % 4)) % 4)}`;
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function constantTimeEqual(left, right) {
  const maxLength = Math.max(left.length, right.length);
  let difference = left.length ^ right.length;
  for (let index = 0; index < maxLength; index += 1) {
    difference |= (left[index] ?? 0) ^ (right[index] ?? 0);
  }
  return difference === 0;
}

async function sha256(value) {
  const digest = await crypto.subtle.digest("SHA-256", textEncoder.encode(value));
  return new Uint8Array(digest);
}

async function hmacSha256(secret, value) {
  const key = await crypto.subtle.importKey(
    "raw",
    textEncoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, textEncoder.encode(value));
  return new Uint8Array(signature);
}

export async function hashSecretForProvisioning(secret) {
  if (typeof secret !== "string" || secret.length < 16) {
    throw new Error("secret must contain at least 16 characters");
  }
  return `${HASH_PREFIX}${bytesToBase64Url(await sha256(secret))}`;
}

export async function verifyHashedSecret(secret, verifier) {
  if (typeof secret !== "string" || typeof verifier !== "string") return false;
  const match = HASH_PATTERN.exec(verifier);
  if (!match) return false;

  try {
    const expected = base64UrlToBytes(match[1]);
    const actual = await sha256(secret);
    return constantTimeEqual(actual, expected);
  } catch {
    return false;
  }
}

export function requireAuthConfig(env) {
  const source = env && typeof env === "object" ? env : {};
  for (const binding of REQUIRED_BINDINGS) {
    if (typeof source[binding] !== "string" || source[binding].length === 0) {
      throw new Error(`missing required preview auth binding: ${binding}`);
    }
  }

  if (!HASH_PATTERN.test(source.PREVIEW_PASSWORD_HASH)) {
    throw new Error("PREVIEW_PASSWORD_HASH must use sha256:<base64url-digest> format");
  }
  if (!HASH_PATTERN.test(source.PREVIEW_CI_TOKEN_HASH)) {
    throw new Error("PREVIEW_CI_TOKEN_HASH must use sha256:<base64url-digest> format");
  }
  if (textEncoder.encode(source.PREVIEW_SESSION_SECRET).byteLength < 32) {
    throw new Error("PREVIEW_SESSION_SECRET must contain at least 32 bytes");
  }

  return {
    passwordHash: source.PREVIEW_PASSWORD_HASH,
    sessionSecret: source.PREVIEW_SESSION_SECRET,
    ciTokenHash: source.PREVIEW_CI_TOKEN_HASH,
  };
}

function normalizeHost(host) {
  if (typeof host !== "string" || !host.trim()) throw new Error("session host is required");
  return host.trim().toLowerCase();
}

export async function createSessionToken({ host, secret, now = Math.floor(Date.now() / 1000), ttlSeconds }) {
  if (!Number.isSafeInteger(now) || now < 0) throw new Error("session now must be a non-negative integer timestamp");
  if (!Number.isSafeInteger(ttlSeconds) || ttlSeconds <= 0) throw new Error("session ttlSeconds must be a positive integer");
  if (typeof secret !== "string" || textEncoder.encode(secret).byteLength < 32) {
    throw new Error("session secret must contain at least 32 bytes");
  }

  const payload = {
    v: 1,
    host: normalizeHost(host),
    exp: now + ttlSeconds,
  };
  const encodedPayload = bytesToBase64Url(textEncoder.encode(JSON.stringify(payload)));
  const signature = bytesToBase64Url(await hmacSha256(secret, encodedPayload));
  return `${encodedPayload}.${signature}`;
}

export async function verifySessionToken(token, { host, secret, now = Math.floor(Date.now() / 1000) } = {}) {
  if (typeof token !== "string" || typeof secret !== "string" || !Number.isSafeInteger(now)) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;

  try {
    const [encodedPayload, encodedSignature] = parts;
    const actualSignature = base64UrlToBytes(encodedSignature);
    const expectedSignature = await hmacSha256(secret, encodedPayload);
    if (!constantTimeEqual(actualSignature, expectedSignature)) return null;

    const payload = JSON.parse(textDecoder.decode(base64UrlToBytes(encodedPayload)));
    if (payload === null || typeof payload !== "object" || Array.isArray(payload)) return null;
    if (payload.v !== 1) return null;
    if (payload.host !== normalizeHost(host)) return null;
    if (!Number.isSafeInteger(payload.exp) || payload.exp <= now) return null;
    return payload;
  } catch {
    return null;
  }
}

export function cookieHeader(token) {
  return `${SESSION_COOKIE_NAME}=${token}`;
}

export function sessionSetCookie(token, maxAgeSeconds = HUMAN_SESSION_SECONDS) {
  if (!Number.isSafeInteger(maxAgeSeconds) || maxAgeSeconds <= 0) {
    throw new Error("cookie max age must be a positive integer");
  }
  return `${cookieHeader(token)}; Path=/; Max-Age=${maxAgeSeconds}; Secure; HttpOnly; SameSite=Strict`;
}

export function clearSessionCookie() {
  return `${SESSION_COOKIE_NAME}=; Path=/; Max-Age=0; Secure; HttpOnly; SameSite=Strict`;
}

export function readSessionCookie(request) {
  const cookie = request.headers.get("cookie") ?? "";
  for (const part of cookie.split(";")) {
    const trimmed = part.trim();
    const separator = trimmed.indexOf("=");
    if (separator <= 0) continue;
    if (trimmed.slice(0, separator) === SESSION_COOKIE_NAME) {
      return trimmed.slice(separator + 1);
    }
  }
  return null;
}

export function safeNextPath(value, origin) {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return "/";
  }
  try {
    const url = new URL(value, origin);
    if (url.origin !== origin) return "/";
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/";
  }
}

export function requestHasSameOrigin(request) {
  const expected = new URL(request.url).origin;
  const origin = request.headers.get("origin");
  return origin === expected;
}

export function privateSecurityHeaders(headers = new Headers()) {
  const result = new Headers(headers);
  result.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  result.set("Cache-Control", "private, no-store");
  result.set("X-Content-Type-Options", "nosniff");
  result.set("Referrer-Policy", "no-referrer");
  result.set("X-Frame-Options", "DENY");
  result.set("Content-Security-Policy", "frame-ancestors 'none'; worker-src 'none'");
  return result;
}

export function secureResponse(response) {
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: privateSecurityHeaders(response.headers),
  });
}

export function unavailableResponse() {
  return secureResponse(new Response("Private preview authentication is unavailable.\n", {
    status: 503,
    headers: { "content-type": "text/plain; charset=utf-8" },
  }));
}
