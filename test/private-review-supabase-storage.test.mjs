import assert from "node:assert/strict";
import test from "node:test";

import { createSupabaseReviewStorage } from "../lab/functions/review-storage-supabase.js";

const ENV = {
  SUPABASE_URL: "https://example.supabase.co",
  SUPABASE_SECRET_KEY: "sb_secret_test",
  REVIEW_EVIDENCE_BUCKET: "private-review-evidence",
};

function jsonResponse(value, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

test("Supabase review storage keeps JSON control objects in Postgres with CAS semantics", async () => {
  const calls = [];
  const fetchImpl = async (url, init = {}) => {
    calls.push({ url: String(url), init });

    if (String(url).includes("/rest/v1/rpc/review_hub_put_object")) {
      const body = JSON.parse(init.body);
      if (body.p_expected_etag === "stale-etag") {
        return jsonResponse({ stored: false, etag: null });
      }
      return jsonResponse({ stored: true, etag: "etag-2" });
    }

    if (String(url).includes("/rest/v1/review_hub_objects?")) {
      return jsonResponse([
        {
          key: "review-hub/v1/state/case-a.json",
          kind: "json",
          body_text: "{\"version\":1}",
          storage_path: null,
          content_type: "application/json; charset=utf-8",
          custom_metadata: { expiresAt: "2026-09-26T00:00:00.000Z" },
          etag: "etag-1",
        },
      ]);
    }

    throw new Error(`Unexpected request: ${url}`);
  };

  const storage = createSupabaseReviewStorage(ENV, fetchImpl);
  assert.ok(storage);

  const object = await storage.get("review-hub/v1/state/case-a.json");
  assert.equal(object.etag, "etag-1");
  assert.deepEqual(object.customMetadata, { expiresAt: "2026-09-26T00:00:00.000Z" });
  assert.equal(await object.text(), "{\"version\":1}");

  const stored = await storage.put(
    "review-hub/v1/state/case-a.json",
    "{\"version\":2}",
    {
      httpMetadata: { contentType: "application/json; charset=utf-8" },
      onlyIf: { etagMatches: "etag-1" },
    },
  );
  assert.equal(stored.etag, "etag-2");

  const conflict = await storage.put(
    "review-hub/v1/state/case-a.json",
    "{\"version\":3}",
    {
      httpMetadata: { contentType: "application/json; charset=utf-8" },
      onlyIf: { etagMatches: "stale-etag" },
    },
  );
  assert.equal(conflict, null);

  const rpcBodies = calls
    .filter(({ url }) => url.includes("/rest/v1/rpc/review_hub_put_object"))
    .map(({ init }) => JSON.parse(init.body));
  assert.equal(rpcBodies[0].p_kind, "json");
  assert.equal(rpcBodies[0].p_expected_etag, "etag-1");
  assert.equal(rpcBodies[0].p_storage_path, null);
});

test("Supabase review storage keeps binary evidence in a private bucket", async () => {
  const calls = [];
  let metadataReads = 0;

  const fetchImpl = async (url, init = {}) => {
    const href = String(url);
    calls.push({ url: href, init });

    if (href.includes("/rest/v1/rpc/review_hub_put_object")) {
      return jsonResponse({ stored: true, etag: "etag-bin" });
    }

    if (href.includes("/rest/v1/review_hub_objects?")) {
      metadataReads += 1;
      return jsonResponse([
        {
          key: "review-hub/v1/cases/case-a/abc/evidence/desktop",
          kind: "binary",
          body_text: null,
          storage_path: "review-hub/v1/cases/case-a/abc/evidence/desktop",
          content_type: "image/png",
          custom_metadata: { expiresAt: "2026-09-26T00:00:00.000Z" },
          etag: "etag-bin",
        },
      ]);
    }

    if (href.includes("/storage/v1/object/private-review-evidence/")) {
      if (init.method === "POST") return jsonResponse({ Key: "stored" });
      return new Response(new Uint8Array([1, 2, 3]), {
        status: 200,
        headers: { "Content-Type": "image/png" },
      });
    }

    throw new Error(`Unexpected request: ${url}`);
  };

  const storage = createSupabaseReviewStorage(ENV, fetchImpl);
  const key = "review-hub/v1/cases/case-a/abc/evidence/desktop";

  await storage.put(key, new Uint8Array([1, 2, 3]).buffer, {
    httpMetadata: { contentType: "image/png" },
    customMetadata: { expiresAt: "2026-09-26T00:00:00.000Z" },
  });

  const object = await storage.get(key);
  assert.equal(metadataReads, 1);
  assert.equal(object.etag, "etag-bin");
  assert.equal(object.httpMetadata.contentType, "image/png");
  assert.deepEqual(new Uint8Array(await new Response(object.body).arrayBuffer()), new Uint8Array([1, 2, 3]));

  const upload = calls.find(({ url, init }) =>
    url.includes("/storage/v1/object/private-review-evidence/") && init.method === "POST"
  );
  assert.ok(upload);
  assert.equal(upload.init.headers["x-upsert"], "true");
  assert.equal(upload.init.headers["Content-Type"], "image/png");
  assert.equal(upload.init.headers.apikey, ENV.SUPABASE_SECRET_KEY);
  assert.equal(upload.init.headers.Authorization, `Bearer ${ENV.SUPABASE_SECRET_KEY}`);
});

test("Supabase review storage deletes physical binaries before metadata rows", async () => {
  const calls = [];

  const fetchImpl = async (url, init = {}) => {
    const href = String(url);
    calls.push({ url: href, init });

    if (href.includes("/rest/v1/review_hub_objects?")) {
      return jsonResponse([
        {
          key: "review-hub/v1/cases/case-a/abc/evidence/desktop",
          kind: "binary",
          body_text: null,
          storage_path: "review-hub/v1/cases/case-a/abc/evidence/desktop",
          content_type: "image/png",
          custom_metadata: {},
          etag: "etag-bin",
        },
        {
          key: "review-hub/v1/cases/case-a/abc/manifest.json",
          kind: "json",
          body_text: "{}",
          storage_path: null,
          content_type: "application/json; charset=utf-8",
          custom_metadata: {},
          etag: "etag-json",
        },
      ]);
    }

    if (href.endsWith("/storage/v1/object/private-review-evidence") && init.method === "DELETE") {
      return jsonResponse([]);
    }

    if (href.includes("/rest/v1/rpc/review_hub_delete_object_rows")) {
      return jsonResponse({ deleted: 2 });
    }

    throw new Error(`Unexpected request: ${url}`);
  };

  const storage = createSupabaseReviewStorage(ENV, fetchImpl);
  await storage.delete([
    "review-hub/v1/cases/case-a/abc/evidence/desktop",
    "review-hub/v1/cases/case-a/abc/manifest.json",
  ]);

  const deleteStorageIndex = calls.findIndex(({ url }) =>
    url.endsWith("/storage/v1/object/private-review-evidence")
  );
  const deleteRowsIndex = calls.findIndex(({ url }) =>
    url.includes("/rest/v1/rpc/review_hub_delete_object_rows")
  );

  assert.ok(deleteStorageIndex >= 0);
  assert.ok(deleteRowsIndex > deleteStorageIndex);
  assert.deepEqual(JSON.parse(calls[deleteStorageIndex].init.body), {
    prefixes: ["review-hub/v1/cases/case-a/abc/evidence/desktop"],
  });
});


test("Supabase review storage cleans expired temporary evidence without touching durable prefixes", async () => {
  const calls = [];

  const fetchImpl = async (url, init = {}) => {
    const href = String(url);
    calls.push({ url: href, init });

    if (href.includes("/rest/v1/rpc/review_hub_expired_objects")) {
      return jsonResponse([
        {
          key: "review-hub/v1/cases/case-a/abc/evidence/desktop",
          kind: "binary",
          storage_path: "review-hub/v1/cases/case-a/abc/evidence/desktop",
          content_type: "image/png",
          etag: "etag-expired",
        },
        {
          key: "review-hub/v1/cases/case-a/abc/manifest.json",
          kind: "json",
          storage_path: null,
          content_type: "application/json; charset=utf-8",
          etag: "etag-manifest",
        },
      ]);
    }

    if (href.endsWith("/storage/v1/object/private-review-evidence") && init.method === "DELETE") {
      return jsonResponse([]);
    }

    if (href.includes("/rest/v1/rpc/review_hub_delete_object_rows")) {
      return jsonResponse({ deleted: 2 });
    }

    throw new Error(`Unexpected request: ${url}`);
  };

  const storage = createSupabaseReviewStorage(ENV, fetchImpl);
  const result = await storage.cleanupExpired(100);

  assert.deepEqual(result, { deleted: 2 });
  const rpc = calls.find(({ url }) => url.includes("/rest/v1/rpc/review_hub_expired_objects"));
  assert.deepEqual(JSON.parse(rpc.init.body), { p_limit: 100 });
  const deletion = calls.find(({ url }) => url.endsWith("/storage/v1/object/private-review-evidence"));
  assert.deepEqual(JSON.parse(deletion.init.body), {
    prefixes: ["review-hub/v1/cases/case-a/abc/evidence/desktop"],
  });
});

test("Supabase review storage fails closed when backend configuration is incomplete", () => {
  assert.equal(createSupabaseReviewStorage({}, async () => new Response()), null);
  assert.equal(
    createSupabaseReviewStorage(
      { SUPABASE_URL: ENV.SUPABASE_URL, REVIEW_EVIDENCE_BUCKET: ENV.REVIEW_EVIDENCE_BUCKET },
      async () => new Response(),
    ),
    null,
  );
});
