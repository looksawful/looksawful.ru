const PASSWORD_SCHEME = "pbkdf2-sha256";
const PASSWORD_BYTES = 32;
const MIN_ITERATIONS = 100_000;
const SESSION_TTL_SECONDS = 12 * 60 * 60;
const encoder = new TextEncoder();
const decoder = new TextDecoder();

function cryptoApi() {
  const value = globalThis.crypto;
  if (!value?.subtle || typeof value.getRandomValues !== "function") {
    throw new Error("Web Crypto is required for Media Desk authentication");
  }
  return value;
}

function base64UrlEncode(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/u, "");
}

function base64UrlDecode(value) {
  if (typeof value !== "string" || !/^[A-Za-z0-9_-]+$/u.test(value)) {
    throw new TypeError("Invalid base64url value");
  }
  const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
  const padding = "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(`${normalized}${padding}`);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function constantTimeEqual(left, right) {
  if (!(left instanceof Uint8Array) || !(right instanceof Uint8Array)) return false;
  if (left.length !== right.length) return false;
  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left[index] ^ right[index];
  }
  return mismatch === 0;
}

async function derivePassword(password, salt, iterations) {
  if (typeof password !== "string" || password.length === 0) {
    throw new TypeError("Media Desk password must be a non-empty string");
  }
  if (!(salt instanceof Uint8Array) || salt.length < 16) {
    throw new TypeError("Media Desk password salt must contain at least 16 bytes");
  }
  if (!Number.isInteger(iterations) || iterations < MIN_ITERATIONS) {
    throw new TypeError(`Media Desk PBKDF2 iterations must be at least ${MIN_ITERATIONS}`);
  }

  const crypto = cryptoApi();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt,
      iterations,
    },
    key,
    PASSWORD_BYTES * 8,
  );
  return new Uint8Array(bits);
}

export async function createPasswordHash(
  password,
  salt = cryptoApi().getRandomValues(new Uint8Array(16)),
  iterations = 210_000,
) {
  const digest = await derivePassword(password, salt, iterations);
  return `${PASSWORD_SCHEME}$${iterations}$${base64UrlEncode(salt)}$${base64UrlEncode(digest)}`;
}

export async function passwordMatches(password, encodedHash) {
  if (typeof encodedHash !== "string") return false;
  const match = /^pbkdf2-sha256\$(\d+)\$([A-Za-z0-9_-]+)\$([A-Za-z0-9_-]+)$/u.exec(encodedHash);
  if (!match) return false;

  const iterations = Number(match[1]);
  if (!Number.isInteger(iterations) || iterations < MIN_ITERATIONS) return false;

  try {
    const salt = base64UrlDecode(match[2]);
    const expected = base64UrlDecode(match[3]);
    if (expected.length !== PASSWORD_BYTES) return false;
    const actual = await derivePassword(password, salt, iterations);
    return constantTimeEqual(actual, expected);
  } catch {
    return false;
  }
}

async function hmac(value, secret) {
  if (typeof secret !== "string" || secret.length < 32) {
    throw new TypeError("Media Desk session secret must contain at least 32 characters");
  }
  const crypto = cryptoApi();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(value)));
}

export async function createSessionToken(subject, secret, now = Date.now()) {
  if (typeof subject !== "string" || subject.length === 0) {
    throw new TypeError("Media Desk session subject must be a non-empty string");
  }
  const issuedAt = Math.floor(now / 1000);
  const payload = {
    sub: subject,
    iat: issuedAt,
    exp: issuedAt + SESSION_TTL_SECONDS,
    nonce: base64UrlEncode(cryptoApi().getRandomValues(new Uint8Array(12))),
  };
  const encodedPayload = base64UrlEncode(encoder.encode(JSON.stringify(payload)));
  const signature = base64UrlEncode(await hmac(encodedPayload, secret));
  return `${encodedPayload}.${signature}`;
}

export async function verifySessionToken(token, subject, secret, now = Date.now()) {
  if (typeof token !== "string" || typeof subject !== "string") return false;
  const [encodedPayload, encodedSignature, ...rest] = token.split(".");
  if (!encodedPayload || !encodedSignature || rest.length > 0) return false;

  let providedSignature;
  try {
    providedSignature = base64UrlDecode(encodedSignature);
  } catch {
    return false;
  }

  let expectedSignature;
  try {
    expectedSignature = await hmac(encodedPayload, secret);
  } catch {
    return false;
  }
  if (!constantTimeEqual(providedSignature, expectedSignature)) return false;

  try {
    const payload = JSON.parse(decoder.decode(base64UrlDecode(encodedPayload)));
    const nowSeconds = Math.floor(now / 1000);
    return payload?.sub === subject
      && Number.isInteger(payload.iat)
      && Number.isInteger(payload.exp)
      && payload.iat <= nowSeconds + 60
      && payload.exp > nowSeconds
      && payload.exp - payload.iat === SESSION_TTL_SECONDS
      && typeof payload.nonce === "string"
      && payload.nonce.length >= 8;
  } catch {
    return false;
  }
}
