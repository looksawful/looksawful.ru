import assert from "node:assert/strict";
import test from "node:test";

import {
  isAllowedMediaDeskOrigin,
  sameOriginMutation,
} from "../tools/cloudflare/media-desk/domain.mjs";

const PROD = "https://media.looksawful.ru";

function request(headers = {}) {
  return new Request(`${PROD}/tools/media-desk/login`, {
    method: "POST",
    headers,
  });
}

test("Media Desk origin allowlist stays fixed to production and localhost", () => {
  assert.equal(isAllowedMediaDeskOrigin(PROD), true);
  assert.equal(isAllowedMediaDeskOrigin("http://127.0.0.1:8787"), true);
  assert.equal(isAllowedMediaDeskOrigin("https://looksawful.ru"), false);
  assert.equal(isAllowedMediaDeskOrigin("https://media.looksawful.ru.evil.test"), false);
});

test("same-origin mutation accepts an explicit matching Origin", () => {
  assert.equal(sameOriginMutation(request({ origin: PROD })), true);
});

test("same-origin mutation rejects an explicit foreign Origin even with a same-origin Referer", () => {
  assert.equal(
    sameOriginMutation(
      request({ origin: "https://evil.test", referer: `${PROD}/tools/media-desk/` }),
    ),
    false,
  );
});
test("same-origin mutation falls back to a same-origin Referer when Origin is absent", () => {
  assert.equal(
    sameOriginMutation(
      request({ referer: `${PROD}/tools/media-desk/`, "sec-fetch-site": "same-origin" }),
    ),
    true,
  );
});

test("same-origin mutation accepts opaque Origin only with a same-origin Referer", () => {
  assert.equal(
    sameOriginMutation(request({ origin: "null", referer: `${PROD}/tools/media-desk/` })),
    true,
  );
});

test("same-origin mutation rejects fallback requests without trusted navigation context", () => {
  assert.equal(sameOriginMutation(request()), false);
  assert.equal(sameOriginMutation(request({ referer: "https://evil.test/" })), false);
  assert.equal(
    sameOriginMutation(
      request({ referer: `${PROD}/tools/media-desk/`, "sec-fetch-site": "cross-site" }),
    ),
    false,
  );
});
