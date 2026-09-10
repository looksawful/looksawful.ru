import assert from "node:assert/strict";
import test from "node:test";

import {
  createMediaDeskPasswordHash,
  createMediaDeskSessionToken,
  verifyMediaDeskPassword,
  verifyMediaDeskSessionToken,
} from "../src/devtools/media-desk/auth.ts";

test("Media Desk password hashes verify only the original password", () => {
  const hash = createMediaDeskPasswordHash("correct horse battery staple", Buffer.alloc(16, 7));

  assert.match(hash, /^scrypt\$v1\$/);
  assert.equal(verifyMediaDeskPassword("correct horse battery staple", hash), true);
  assert.equal(verifyMediaDeskPassword("wrong password value", hash), false);
  assert.equal(verifyMediaDeskPassword("correct horse battery staple", "broken"), false);
});

test("Media Desk session tokens are signed, user-bound and expire", () => {
  const now = Date.UTC(2026, 8, 10, 18, 0, 0);
  const secret = "test-session-secret-that-is-long-enough-for-tests";
  const token = createMediaDeskSessionToken("looksawful", secret, now);

  assert.equal(verifyMediaDeskSessionToken(token, "looksawful", secret, now + 1_000), true);
  assert.equal(verifyMediaDeskSessionToken(token, "someone-else", secret, now + 1_000), false);
  assert.equal(verifyMediaDeskSessionToken(`${token}x`, "looksawful", secret, now + 1_000), false);
  assert.equal(verifyMediaDeskSessionToken(token, "looksawful", secret, now + 13 * 60 * 60 * 1_000), false);
});
