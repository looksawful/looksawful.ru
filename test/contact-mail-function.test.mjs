import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const { handler } = require("../serverless/contact-mail/index.js");
const origin = "https://www.looksawful.ru";

function event(payload, ip = "203.0.113.10", requestOrigin = origin) {
  return {
    httpMethod: "POST",
    headers: { origin: requestOrigin, "x-forwarded-for": ip },
    body: JSON.stringify(payload),
  };
}

function context(payload) {
  return {
    requestId: "test-request",
    token: { access_token: "test-iam-token" },
    getPayload: () => payload,
  };
}

const draft = {
  name: "Иван",
  email: "visitor@example.com",
  message: "Хочу обсудить проект.",
  page: "/work/jestei-pool/",
};
