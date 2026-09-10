const SESSION_TTL_SECONDS = 12 * 60 * 60;
const encoder = new TextEncoder();
const decoder = new TextDecoder();

function bytesToHex(bytes) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
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
  const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
  const padding = "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(`${normalized}${padding}`);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function sha256(value) {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(value)));
}

async function hmac(value, secret) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(value)));
}

function constantTimeEqual(left, right) {
  if (left.length !== right.length) return false;
  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left[index] ^ right[index];
  }
  return mismatch === 0;
}

export async function passwordMatches(password, expectedSha256Hex) {
  if (!/^[a-f0-9]{64}$/u.test(expectedSha256Hex)) return false;
  const digest = await sha256(password);
  const expected = Uint8Array.from(
    expectedSha256Hex.match(/.{2}/gu) ?? [],
    (chunk) => Number.parseInt(chunk, 16),
  );
  return constantTimeEqual(digest, expected);
}

export async function createSessionToken(username, secret, now = Date.now()) {
  const issuedAt = Math.floor(now / 1000);
  const payload = {
    username,
    issuedAt,
    expiresAt: issuedAt + SESSION_TTL_SECONDS,
    nonce: base64UrlEncode(crypto.getRandomValues(new Uint8Array(12))),
  };
  const encodedPayload = base64UrlEncode(encoder.encode(JSON.stringify(payload)));
  const signature = base64UrlEncode(await hmac(encodedPayload, secret));
  return `${encodedPayload}.${signature}`;
}

export async function verifySessionToken(token, username, secret, now = Date.now()) {
  const [encodedPayload, encodedSignature, ...rest] = token.split(".");
  if (!encodedPayload || !encodedSignature || rest.length > 0) return false;

  let providedSignature;
  try {
    providedSignature = base64UrlDecode(encodedSignature);
  } catch {
    return false;
  }

  const expectedSignature = await hmac(encodedPayload, secret);
  if (!constantTimeEqual(providedSignature, expectedSignature)) return false;

  try {
    const payload = JSON.parse(decoder.decode(base64UrlDecode(encodedPayload)));
    const nowSeconds = Math.floor(now / 1000);
    return payload.username === username
      && Number.isInteger(payload.issuedAt)
      && Number.isInteger(payload.expiresAt)
      && payload.issuedAt <= nowSeconds + 60
      && payload.expiresAt > nowSeconds
      && payload.expiresAt - payload.issuedAt === SESSION_TTL_SECONDS
      && typeof payload.nonce === "string"
      && payload.nonce.length >= 8;
  } catch {
    return false;
  }
}

export function sha256HexForDocumentation(bytes) {
  return bytesToHex(bytes);
}
