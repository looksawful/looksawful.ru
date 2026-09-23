const REVIEW_PREFIX = "review-hub/v1/";
const CLOUDINARY_FOLDER = "looksawful/review-hub";

function stringValue(value) {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function storageConfig(env) {
  const db = env?.REVIEW_DB;
  const cloudName = stringValue(env?.CLOUDINARY_CLOUD_NAME);
  const apiKey = stringValue(env?.CLOUDINARY_API_KEY);
  const apiSecret = stringValue(env?.CLOUDINARY_API_SECRET);

  if (!db || typeof db.prepare !== "function" || !cloudName || !apiKey || !apiSecret) {
    return null;
  }

  return { db, cloudName, apiKey, apiSecret };
}

function basicAuthorization(config) {
  return `Basic ${btoa(`${config.apiKey}:${config.apiSecret}`)}`;
}

async function responseJson(response, label) {
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`${label} failed (${response.status})${detail ? `: ${detail}` : ""}`);
  }
  return response.json();
}

function customMetadata(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value;
}

function parseCustomMetadata(value) {
  if (typeof value !== "string") return {};
  try {
    const parsed = JSON.parse(value);
    return customMetadata(parsed);
  } catch {
    return {};
  }
}

function rowObject(row) {
  return {
    etag: row.etag,
    customMetadata: parseCustomMetadata(row.custom_metadata),
    httpMetadata: { contentType: row.content_type },
  };
}

async function readRow(config, key) {
  return config.db
    .prepare(
      `SELECT key, kind, body_text, asset_id, public_id, resource_type, delivery_type,
              content_type, custom_metadata, expires_at, etag
       FROM review_hub_objects
       WHERE key = ?
       LIMIT 1`,
    )
    .bind(key)
    .first();
}

async function writeRow(config, row, expectedEtag) {
  if (expectedEtag) {
    const result = await config.db
      .prepare(
        `UPDATE review_hub_objects
         SET kind = ?, body_text = ?, asset_id = ?, public_id = ?, resource_type = ?,
             delivery_type = ?, content_type = ?, custom_metadata = ?, expires_at = ?, etag = ?
         WHERE key = ? AND etag = ?`,
      )
      .bind(
        row.kind,
        row.bodyText,
        row.assetId,
        row.publicId,
        row.resourceType,
        row.deliveryType,
        row.contentType,
        row.customMetadata,
        row.expiresAt,
        row.etag,
        row.key,
        expectedEtag,
      )
      .run();
    return Number(result?.meta?.changes ?? 0) === 1;
  }

  await config.db
    .prepare(
      `INSERT INTO review_hub_objects (
         key, kind, body_text, asset_id, public_id, resource_type, delivery_type,
         content_type, custom_metadata, expires_at, etag
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET
         kind = excluded.kind,
         body_text = excluded.body_text,
         asset_id = excluded.asset_id,
         public_id = excluded.public_id,
         resource_type = excluded.resource_type,
         delivery_type = excluded.delivery_type,
         content_type = excluded.content_type,
         custom_metadata = excluded.custom_metadata,
         expires_at = excluded.expires_at,
         etag = excluded.etag`,
    )
    .bind(
      row.key,
      row.kind,
      row.bodyText,
      row.assetId,
      row.publicId,
      row.resourceType,
      row.deliveryType,
      row.contentType,
      row.customMetadata,
      row.expiresAt,
      row.etag,
    )
    .run();
  return true;
}

async function uploadEvidence(config, fetchImpl, value, contentType) {
  const form = new FormData();
  const bytes =
    value instanceof ArrayBuffer
      ? value
      : ArrayBuffer.isView(value)
        ? value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength)
        : await new Response(value).arrayBuffer();

  form.set("file", new Blob([bytes], { type: contentType }), "evidence");
  form.set("type", "authenticated");
  form.set("asset_folder", CLOUDINARY_FOLDER);

  const response = await fetchImpl(
    `https://api.cloudinary.com/v1_1/${encodeURIComponent(config.cloudName)}/image/upload`,
    {
      method: "POST",
      headers: { Authorization: basicAuthorization(config) },
      body: form,
    },
  );
  const result = await responseJson(response, "Cloudinary review evidence upload");
  if (
    typeof result?.asset_id !== "string" ||
    typeof result?.public_id !== "string" ||
    result?.resource_type !== "image" ||
    result?.type !== "authenticated"
  ) {
    throw new Error("Cloudinary review evidence upload returned invalid asset identity.");
  }
  return {
    assetId: result.asset_id,
    publicId: result.public_id,
    resourceType: result.resource_type,
    deliveryType: result.type,
  };
}

async function downloadEvidence(config, fetchImpl, assetId) {
  const form = new FormData();
  form.set("asset_id", assetId);

  const response = await fetchImpl(
    `https://api.cloudinary.com/v1_1/${encodeURIComponent(config.cloudName)}/asset/download`,
    {
      method: "POST",
      headers: { Authorization: basicAuthorization(config) },
      body: form,
      cache: "no-store",
    },
  );
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `Cloudinary review evidence download failed (${response.status})${detail ? `: ${detail}` : ""}`,
    );
  }
  return response.body;
}

async function destroyEvidence(config, fetchImpl, assetId) {
  const form = new FormData();
  form.set("asset_id", assetId);

  const response = await fetchImpl(
    `https://api.cloudinary.com/v1_1/${encodeURIComponent(config.cloudName)}/destroy`,
    {
      method: "POST",
      headers: { Authorization: basicAuthorization(config) },
      body: form,
    },
  );
  const result = await responseJson(response, "Cloudinary review evidence delete");
  if (result?.result !== "ok" && result?.result !== "not found") {
    throw new Error("Cloudinary review evidence delete returned an unexpected result.");
  }
}

async function deleteRow(config, key) {
  await config.db
    .prepare("DELETE FROM review_hub_objects WHERE key = ?")
    .bind(key)
    .run();
}

export function createCloudflareReviewStorage(env, fetchImpl = fetch) {
  const config = storageConfig(env);
  if (!config || typeof fetchImpl !== "function") return null;

  return {
    async get(key) {
      const row = await readRow(config, key);
      if (!row) return null;

      if (row.kind === "json" && typeof row.body_text === "string") {
        return {
          ...rowObject(row),
          body: new TextEncoder().encode(row.body_text),
          text: async () => row.body_text,
        };
      }

      if (row.kind === "binary" && typeof row.asset_id === "string") {
        return {
          ...rowObject(row),
          body: await downloadEvidence(config, fetchImpl, row.asset_id),
        };
      }

      throw new Error("Review storage row is invalid.");
    },

    async put(key, value, options = {}) {
      if (typeof key !== "string" || !key.startsWith(REVIEW_PREFIX)) {
        throw new TypeError("Invalid Review storage key.");
      }

      const contentType =
        stringValue(options?.httpMetadata?.contentType) ?? "application/octet-stream";
      const metadata = customMetadata(options?.customMetadata);
      const expiresAt = stringValue(metadata.expiresAt);
      const expectedEtag = stringValue(options?.onlyIf?.etagMatches);
      const etag = crypto.randomUUID();
      const isJson = contentType.toLowerCase().startsWith("application/json");

      let asset = null;
      let bodyText = null;
      if (isJson) {
        if (typeof value !== "string") {
          throw new TypeError("JSON Review objects must be written as strings.");
        }
        bodyText = value;
      } else {
        asset = await uploadEvidence(config, fetchImpl, value, contentType);
      }

      const row = {
        key,
        kind: isJson ? "json" : "binary",
        bodyText,
        assetId: asset?.assetId ?? null,
        publicId: asset?.publicId ?? null,
        resourceType: asset?.resourceType ?? null,
        deliveryType: asset?.deliveryType ?? null,
        contentType,
        customMetadata: JSON.stringify(metadata),
        expiresAt,
        etag,
      };

      let stored = false;
      try {
        stored = await writeRow(config, row, expectedEtag);
      } catch (error) {
        if (asset) {
          try {
            await destroyEvidence(config, fetchImpl, asset.assetId);
          } catch {}
        }
        throw error;
      }

      if (!stored) {
        if (asset) {
          try {
            await destroyEvidence(config, fetchImpl, asset.assetId);
          } catch {}
        }
        return null;
      }

      return { etag };
    },

    async delete(keys) {
      const uniqueKeys = [...new Set(Array.isArray(keys) ? keys : [keys])].filter(Boolean);
      for (const key of uniqueKeys) {
        const row = await readRow(config, key);
        if (!row) continue;
        if (row.kind === "binary" && typeof row.asset_id === "string") {
          await destroyEvidence(config, fetchImpl, row.asset_id);
        }
        await deleteRow(config, key);
      }
    },

    async cleanupExpired(limit = 200) {
      const safeLimit = Math.max(1, Math.min(Number.isInteger(limit) ? limit : 200, 1000));
      const nowIso = new Date().toISOString();
      const result = await config.db
        .prepare(
          `SELECT key, kind, body_text, asset_id, public_id, resource_type, delivery_type,
                  content_type, custom_metadata, expires_at, etag
           FROM review_hub_objects
           WHERE expires_at IS NOT NULL
             AND expires_at <= ?
             AND key LIKE 'review-hub/v1/targets/%'
           ORDER BY expires_at ASC
           LIMIT ?`,
        )
        .bind(nowIso, safeLimit)
        .all();
      const rows = Array.isArray(result?.results) ? result.results : [];
      await this.delete(rows.map((row) => row.key));
      return { deleted: rows.length };
    },
  };
}
