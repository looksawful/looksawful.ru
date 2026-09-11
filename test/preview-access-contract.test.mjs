import assert from "node:assert/strict";
import test from "node:test";

import {
  getAccessServiceHeaders,
  isAccessChallenge,
  verifyPreviewPrivacy,
} from "../tools/preview/cloudflare-access.mjs";

test("Access service headers require the complete credential pair", () => {
  assert.deepEqual(getAccessServiceHeaders({}), {});
  assert.deepEqual(
    getAccessServiceHeaders({
      CF_ACCESS_CLIENT_ID: "client-id",
      CF_ACCESS_CLIENT_SECRET: "client-secret",
    }),
    {
      "CF-Access-Client-Id": "client-id",
      "CF-Access-Client-Secret": "client-secret",
    },
  );
  assert.throws(
    () => getAccessServiceHeaders({ CF_ACCESS_CLIENT_ID: "client-id" }),
    /both CF_ACCESS_CLIENT_ID and CF_ACCESS_CLIENT_SECRET/i,
  );
});

test("Access challenge recognizes only Cloudflare Access login redirects and denied responses", () => {
  assert.equal(isAccessChallenge(new Response(null, { status: 403 })), true);
  assert.equal(
    isAccessChallenge(new Response(null, {
      status: 302,
      headers: { location: "https://example.cloudflareaccess.com/cdn-cgi/access/login/app" },
    })),
    true,
  );
  assert.equal(
    isAccessChallenge(new Response(null, {
      status: 302,
      headers: { location: "https://example.cloudflareaccess.com.evil.test/cdn-cgi/access/login/app" },
    })),
    false,
  );
  assert.equal(
    isAccessChallenge(new Response(null, {
      status: 302,
      headers: { location: "https://example.cloudflareaccess.com/not-access/login" },
    })),
    false,
  );
  assert.equal(isAccessChallenge(new Response("public", { status: 200 })), false);
});

test("privacy verification always rejects a public preview", async () => {
  const fetchImpl = async () => new Response("public preview", { status: 200 });
  await assert.rejects(
    verifyPreviewPrivacy({
      url: "https://preview.example.test/",
      marker: "preview",
      env: {},
      fetchImpl,
    }),
    /anonymous request still reaches preview content/i,
  );
});

test("privacy verification rejects a public preview when CI service auth is configured", async () => {
  const fetchImpl = async () => new Response("public preview", { status: 200 });
  await assert.rejects(
    verifyPreviewPrivacy({
      url: "https://preview.example.test/",
      marker: "preview",
      env: {
        CF_ACCESS_CLIENT_ID: "client-id",
        CF_ACCESS_CLIENT_SECRET: "client-secret",
      },
      fetchImpl,
    }),
    /anonymous request still reaches preview content/i,
  );
});

test("privacy verification accepts anonymous denial plus authenticated exact content", async () => {
  const requests = [];
  const fetchImpl = async (_url, options = {}) => {
    requests.push(options);
    const headers = options.headers ?? {};
    const hasServiceAuth = Boolean(headers["CF-Access-Client-Id"] && headers["CF-Access-Client-Secret"]);
    if (!hasServiceAuth) {
      return new Response(null, {
        status: 302,
        headers: { location: "https://example.cloudflareaccess.com/cdn-cgi/access/login/app" },
      });
    }
    return new Response("commit=abc123\npreview marker\n", { status: 200 });
  };

  const result = await verifyPreviewPrivacy({
    url: "https://preview.example.test/preview-version.txt",
    marker: "preview marker",
    env: {
      CF_ACCESS_CLIENT_ID: "client-id",
      CF_ACCESS_CLIENT_SECRET: "client-secret",
    },
    fetchImpl,
  });

  assert.equal(result.serviceConfigured, true);
  assert.equal(result.anonymousBlocked, true);
  assert.equal(result.authenticated, true);
  assert.equal(requests[1].headers["CF-Access-Client-Secret"], "client-secret");
});
