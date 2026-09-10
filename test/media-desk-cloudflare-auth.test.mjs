import assert from "node:assert/strict";
import test from "node:test";

import {
  createSessionToken,
  passwordMatches,
  verifySessionToken,
} from "../tools/cloudflare/media-desk/auth.mjs";

test("Cloudflare Media Desk password verification uses SHA-256 digest", async () => {
  const expected = "2bb80d537b1da3e38bd30361aa855686bde0ba0d9670a54e8c3f7187cae1c2f";
  assert.equal(await passwordMatches("secret", expected), true);
  assert.equal(await passwordMatches("wrong", expected), false);
  assert.equal(await passwordMatches("secret", "not-a-digest"), false);
});

test("Cloudflare Media Desk session tokens are signed and expire", async () => {
  const now = Date.UTC(2026, 8, 10, 20, 0, 0);
  const secret = "session-secret-for-test-only-please-ignore";
  const token = await createSessionToken("looksawful", secret, now);

  assert.equal(await verifySessionToken(token, "looksawful", secret, now + 1_000), true);
  assert.equal(await verifySessionToken(token, "other", secret, now + 1_000), false);
  assert.equal(await verifySessionToken(`${token}x`, "looksawful", secret, now + 1_000), false);
  assert.equal(await verifySessionToken(token, "looksawful", secret, now + 13 * 60 * 60 * 1_000), false);
});
