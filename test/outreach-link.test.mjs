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

test("supports approved recruiter and Instagram attribution pairs", async () => {
  const { buildOutreachUrl } = await import(builderUrl.href);

  const approved = [
    ["hh", "message", "job_search"],
    ["telegram", "dm", "job_search"],
    ["email", "outreach", "job_search"],
    ["linkedin", "dm", "job_search"],
    ["instagram", "dm", "job_search"],
    ["instagram", "bio", "portfolio"],
    ["instagram", "story", "portfolio"],
  ];

  for (const [source, medium, campaign] of approved) {
    assert.match(buildOutreachUrl({ destination: "/", source, medium, campaign }), /^https:\/\/www\.looksawful\.ru\//);
  }

  for (const input of [
    { source: "hh", medium: "dm", campaign: "job_search" },
    { source: "google", medium: "cpc", campaign: "job_search" },
    { source: "telegram", medium: "message", campaign: "job_search" },
    { source: "instagram", medium: "bio", campaign: "job_search" },
    { source: "instagram", medium: "dm", campaign: "portfolio" },
  ]) {
    assert.throws(
      () => buildOutreachUrl({ destination: "/", ...input }),
      /approved outreach/i,
    );
  }
});

test("builds canonical Instagram URLs without PII", async () => {
  const { buildOutreachUrl } = await import(builderUrl.href);

  assert.equal(
    buildOutreachUrl({
      destination: "/cv/",
      source: "instagram",
      medium: "dm",
      campaign: "job_search",
      content: "cv",
      batch: "2026w38a",
    }),
    "https://www.looksawful.ru/cv/?utm_source=instagram&utm_medium=dm&utm_campaign=job_search&utm_content=cv&utm_id=2026w38a",
  );

  assert.equal(
    buildOutreachUrl({
      destination: "/",
      source: "instagram",
      medium: "bio",
      campaign: "portfolio",
      content: "home",
      batch: "2026w38a",
    }),
    "https://www.looksawful.ru/?utm_source=instagram&utm_medium=bio&utm_campaign=portfolio&utm_content=home&utm_id=2026w38a",
  );
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