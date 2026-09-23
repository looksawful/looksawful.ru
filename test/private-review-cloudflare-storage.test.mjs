import assert from "node:assert/strict";
import test from "node:test";

import { createCloudflareReviewStorage } from "../lab/functions/review-storage-cloudflare.js";

class MemoryD1 {
  rows = new Map();

  prepare(sql) {
    const db = this;
    return {
      args: [],
      bind(...args) {
        this.args = args;
        return this;
      },
      async first() {
        if (!/^SELECT\s+/iu.test(sql)) throw new Error(`Unexpected first SQL: ${sql}`);
        return db.rows.get(this.args[0]) ?? null;
      },
      async run() {
        if (/^INSERT\s+/iu.test(sql)) {
          const [
            key,
            kind,
            bodyText,
            assetId,
            publicId,
            resourceType,
            deliveryType,
            contentType,
            customMetadata,
            expiresAt,
            etag,
          ] = this.args;
          db.rows.set(key, {
            key,
            kind,
            body_text: bodyText,
            asset_id: assetId,
            public_id: publicId,
            resource_type: resourceType,
            delivery_type: deliveryType,
            content_type: contentType,
            custom_metadata: customMetadata,
            expires_at: expiresAt,
            etag,
          });
          return { success: true, meta: { changes: 1 } };
        }

        if (/^UPDATE\s+/iu.test(sql)) {
          const [
            kind,
            bodyText,
            assetId,
            publicId,
            resourceType,
            deliveryType,
            contentType,
            customMetadata,
            expiresAt,
            nextEtag,
            key,
            expectedEtag,
          ] = this.args;
          const current = db.rows.get(key);
          if (!current || current.etag !== expectedEtag) {
            return { success: true, meta: { changes: 0 } };
          }
          db.rows.set(key, {
            key,
            kind,
            body_text: bodyText,
            asset_id: assetId,
            public_id: publicId,
            resource_type: resourceType,
            delivery_type: deliveryType,
            content_type: contentType,
            custom_metadata: customMetadata,
            expires_at: expiresAt,
            etag: nextEtag,
          });
          return { success: true, meta: { changes: 1 } };
        }

        if (/^DELETE\s+/iu.test(sql)) {
          const changed = db.rows.delete(this.args[0]) ? 1 : 0;
          return { success: true, meta: { changes: changed } };
        }

        throw new Error(`Unexpected run SQL: ${sql}`);
      },
      async all() {
        if (!/^SELECT\s+/iu.test(sql)) throw new Error(`Unexpected all SQL: ${sql}`);
        const [nowIso, limit] = this.args;
        const results = [...db.rows.values()]
          .filter((row) => typeof row.expires_at === "string" && row.expires_at <= nowIso)
          .slice(0, limit);
        return { success: true, results };
      },
    };
  }
}

const ENV = {
  REVIEW_DB: new MemoryD1(),
  CLOUDINARY_CLOUD_NAME: "demo-cloud",
  CLOUDINARY_API_KEY: "api-key",
  CLOUDINARY_API_SECRET: "api-secret",
};

test("Cloudflare review storage keeps JSON authority in D1 with CAS semantics", async () => {
  const calls = [];
  const storage = createCloudflareReviewStorage(
    ENV,
    async (...args) => {
      calls.push(args);
      throw new Error("Cloudinary must not be used for JSON authority state");
    },
  );
  assert.ok(storage);

  const first = await storage.put("review-hub/v1/state/home.json", "{\"version\":1}", {
    httpMetadata: { contentType: "application/json; charset=utf-8" },
  });
  assert.match(first.etag, /^[0-9a-f-]{36}$/u);

  const object = await storage.get("review-hub/v1/state/home.json");
  assert.equal(await object.text(), "{\"version\":1}");
  assert.equal(object.etag, first.etag);
  assert.equal(calls.length, 0);

  const conflict = await storage.put("review-hub/v1/state/home.json", "{\"version\":2}", {
    httpMetadata: { contentType: "application/json; charset=utf-8" },
    onlyIf: { etagMatches: "stale-etag" },
  });
  assert.equal(conflict, null);
  assert.equal(await (await storage.get("review-hub/v1/state/home.json")).text(), "{\"version\":1}");
});

test("Cloudflare review storage puts binary evidence in Cloudinary authenticated assets and retrieves by asset_id", async () => {
  const db = new MemoryD1();
  const calls = [];
  const storage = createCloudflareReviewStorage(
    { ...ENV, REVIEW_DB: db },
    async (url, init = {}) => {
      const href = String(url);
      calls.push({ href, init });

      if (href.endsWith("/image/upload")) {
        assert.match(String(init.headers?.Authorization ?? ""), /^Basic /u);
        assert.equal(init.body.get("type"), "authenticated");
        assert.equal(init.body.get("asset_folder"), "looksawful/review-hub");
        assert.equal(init.body.get("folder"), null);
        return new Response(JSON.stringify({
          asset_id: "asset-immutable-1",
          public_id: "looksawful/review-hub/random",
          resource_type: "image",
          type: "authenticated",
        }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (href.endsWith("/asset/download")) {
        assert.match(String(init.headers?.Authorization ?? ""), /^Basic /u);
        assert.equal(init.body.get("asset_id"), "asset-immutable-1");
        return new Response(new Uint8Array([1, 2, 3]), {
          status: 200,
          headers: { "Content-Type": "image/png" },
        });
      }

      if (href.endsWith("/destroy")) {
        assert.match(String(init.headers?.Authorization ?? ""), /^Basic /u);
        assert.equal(init.body.get("asset_id"), "asset-immutable-1");
        return new Response(JSON.stringify({ result: "ok" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      throw new Error(`Unexpected Cloudinary request: ${href}`);
    },
  );

  const key = "review-hub/v1/targets/project%3Aawful-mockups/abc/reviews/review/evidence/desktop";
  const stored = await storage.put(key, new Uint8Array([1, 2, 3]).buffer, {
    httpMetadata: { contentType: "image/png" },
    customMetadata: { expiresAt: "2026-09-27T00:00:00.000Z" },
  });
  assert.match(stored.etag, /^[0-9a-f-]{36}$/u);

  const row = db.rows.get(key);
  assert.equal(row.kind, "binary");
  assert.equal(row.asset_id, "asset-immutable-1");
  assert.equal(row.delivery_type, "authenticated");
  assert.equal(row.body_text, null);

  const object = await storage.get(key);
  assert.equal(object.httpMetadata.contentType, "image/png");
  assert.deepEqual(
    new Uint8Array(await new Response(object.body).arrayBuffer()),
    new Uint8Array([1, 2, 3]),
  );

  await storage.delete(key);
  assert.equal(db.rows.has(key), false);
  assert.ok(calls.find(({ href }) => href.endsWith("/destroy")));
});

test("Cloudflare review storage fails closed when D1 or Cloudinary server credentials are missing", () => {
  assert.equal(createCloudflareReviewStorage({}), null);
  assert.equal(
    createCloudflareReviewStorage({
      REVIEW_DB: new MemoryD1(),
      CLOUDINARY_CLOUD_NAME: "demo-cloud",
      CLOUDINARY_API_KEY: "api-key",
    }),
    null,
  );
});
