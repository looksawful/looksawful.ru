import assert from "node:assert/strict";
import test from "node:test";

const builderUrl = new URL("../tools/outreach-link.mjs", import.meta.url);

test("builds deterministic canonical hunter links from bounded UTM inputs", async () => {
  const { buildOutreachUrl } = await import(builderUrl.href);
  assert.equal(typeof buildOutreachUrl, "function");

  assert.equal(
    buildOutreachUrl({
      destination: "/work/jestei-pool/",
      source: "hh",
      medium: "message",
      campaign: "job_search",
      content: "jestei-pool",
      batch: "2026w37a",
    }),
    "https://www.looksawful.ru/work/jestei-pool/?utm_source=hh&utm_medium=message&utm_campaign=job_search&utm_content=jestei-pool&utm_id=2026w37a",
  );
});

test("supports only approved outreach source and medium pairs", async () => {
  const { buildOutreachUrl } = await import(builderUrl.href);

  const approved = [
    ["hh", "message"],
    ["telegram", "dm"],
    ["email", "outreach"],
    ["linkedin", "dm"],
  ];

  for (const [source, medium] of approved) {
    assert.match(buildOutreachUrl({ destination: "/", source, medium, campaign: "job_search" }), /^https:\/\/www\.looksawful\.ru\//);
  }

  for (const input of [
    { source: "hh", medium: "dm" },
    { source: "google", medium: "cpc" },
    { source: "telegram", medium: "message" },
  ]) {
    assert.throws(
      () => buildOutreachUrl({ destination: "/", ...input, campaign: "job_search" }),
      /approved outreach source\/medium/i,
    );
  }
});

test("rejects PII-like or unbounded free-form attribution values", async () => {
  const { buildOutreachUrl } = await import(builderUrl.href);

  for (const input of [
    { content: "hunter@example.com" },
    { content: "Jane Doe" },
    { content: "company/person" },
    { batch: "recruiter@example.com" },
    { batch: "Jane Doe" },
  ]) {
    assert.throws(
      () => buildOutreachUrl({
        destination: "/cv/",
        source: "email",
        medium: "outreach",
        campaign: "job_search",
        ...input,
      }),
      /safe attribution token/i,
    );
  }
});

test("rejects external, query-bearing and fragment-bearing destinations", async () => {
  const { buildOutreachUrl } = await import(builderUrl.href);

  for (const destination of [
    "https://example.com/",
    "/cv/?already=tracked",
    "/work/jestei-pool/#contact",
    "../private",
  ]) {
    assert.throws(
      () => buildOutreachUrl({
        destination,
        source: "linkedin",
        medium: "dm",
        campaign: "job_search",
      }),
      /canonical site path/i,
    );
  }
});

test("rejects unknown fields instead of accidentally serializing personal data", async () => {
  const { buildOutreachUrl } = await import(builderUrl.href);

  assert.throws(
    () => buildOutreachUrl({
      destination: "/cv/",
      source: "hh",
      medium: "message",
      campaign: "job_search",
      recruiter: "Jane Doe",
    }),
    /unsupported outreach field/i,
  );
});
