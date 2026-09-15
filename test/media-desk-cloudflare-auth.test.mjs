import assert from "node:assert/strict";
import test from "node:test";

import {
  createPasswordHash,
  createSessionToken,
  passwordMatches,
  verifySessionToken,
} from "../tools/cloudflare/media-desk/auth.mjs";

test("remote Media Desk password hashes are salted PBKDF2 values", async () => {
  const salt = new Uint8Array(16).fill(7);
  const hash = await createPasswordHash("secret", salt, 210_000);

  assert.match(
    hash,
    /^pbkdf2-sha256\$210000\$[A-Za-z0-9_-]+\$[A-Za-z0-9_-]+$/,
  );
  assert.equal(await passwordMatches("secret", hash), true);
  assert.equal(await passwordMatches("wrong", hash), false);
  assert.equal(await passwordMatches("secret", "invalid"), false);
});

test("remote Media Desk sessions are signed, scoped and expire", async () => {
  const now = Date.UTC(2026, 8, 13, 20, 0, 0);
  const secret = "test-session-secret-32-bytes-minimum";
  const subject = "media.looksawful.ru";
  const token = await createSessionToken(subject, secret, now);

  assert.equal(await verifySessionToken(token, subject, secret, now + 1_000), true);
  assert.equal(
    await verifySessionToken(token, "admin.looksawful.ru", secret, now + 1_000),
    false,
  );
  assert.equal(
    await verifySessionToken(`${token}x`, subject, secret, now + 1_000),
    false,
  );
  assert.equal(
    await verifySessionToken(token, subject, secret, now + 13 * 60 * 60 * 1_000),
    false,
  );
});
