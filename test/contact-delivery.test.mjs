import assert from "node:assert/strict";
import test from "node:test";

const moduleUrl = new URL("../src/features/contact-hub/contact-delivery.ts", import.meta.url);

function successResponse(payload) {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

test("contact delivery sends only approved form fields through FormSubmit AJAX", async () => {
  const { submitContactMessage } = await import(moduleUrl.href);
  const calls = [];
  const attachment = new File(["hello"], "brief.txt", { type: "text/plain" });

  const result = await submitContactMessage({
    name: "Аня",
    email: "anna@example.com",
    message: "Нужен дизайн продукта",
    pageUrl: "https://looksawful.ru/",
    attachment,
  }, async (input, init) => {
    calls.push({ input, init });
    return successResponse({ success: "true", message: "Email sent" });
  });

  assert.deepEqual(result, { kind: "sent" });
  assert.equal(calls.length, 1);
  assert.equal(String(calls[0].input), "https://formsubmit.co/ajax/i@lookawful.ru");
  assert.equal(calls[0].init.method, "POST");
  assert.ok(calls[0].init.body instanceof FormData);
  assert.equal(calls[0].init.body.get("email"), "anna@example.com");
  assert.equal(calls[0].init.body.get("message"), "Нужен дизайн продукта");
  assert.equal(calls[0].init.body.get("_replyto"), "anna@example.com");
  assert.equal(calls[0].init.body.get("_url"), "https://looksawful.ru/");
  assert.equal(calls[0].init.body.get("attachment").name, "brief.txt");
  assert.equal(new Headers(calls[0].init.headers).has("content-type"), false);
});

test("contact delivery exposes activation without pretending the message was delivered", async () => {
  const { submitContactMessage } = await import(moduleUrl.href);
  const result = await submitContactMessage({
    name: "",
    email: "anna@example.com",
    message: "Привет",
    pageUrl: "https://pr-788.looksawful-ru-preview.pages.dev/",
  }, async () => successResponse({
    success: "false",
    message: "This form needs Activation. We've sent you an email containing an 'Activate Form' link.",
  }));

  assert.deepEqual(result, { kind: "activation_required" });
});

test("contact delivery rejects attachments above the provider 10MB limit before fetch", async () => {
  const { submitContactMessage } = await import(moduleUrl.href);
  let calls = 0;
  const attachment = new File([new Uint8Array((10 * 1024 * 1024) + 1)], "huge.bin");
  const result = await submitContactMessage({
    name: "",
    email: "anna@example.com",
    message: "Привет",
    pageUrl: "https://looksawful.ru/",
    attachment,
  }, async () => {
    calls += 1;
    return successResponse({ success: "true" });
  });

  assert.deepEqual(result, { kind: "invalid", reason: "attachment_too_large" });
  assert.equal(calls, 0);
});

test("contact delivery fails closed on provider or network errors", async () => {
  const { submitContactMessage } = await import(moduleUrl.href);
  const input = {
    name: "",
    email: "anna@example.com",
    message: "Привет",
    pageUrl: "https://looksawful.ru/",
  };

  const httpFailure = await submitContactMessage(input, async () => new Response("blocked", { status: 403 }));
  assert.deepEqual(httpFailure, { kind: "unavailable" });

  const networkFailure = await submitContactMessage(input, async () => {
    throw new Error("offline");
  });
  assert.deepEqual(networkFailure, { kind: "unavailable" });
});
