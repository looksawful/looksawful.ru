const OBJECT_COLUMNS = [
  "key",
  "kind",
  "body_text",
  "storage_path",
  "content_type",
  "custom_metadata",
  "etag",
].join(",");

function stringValue(value) {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function storageConfig(env) {
  const url = stringValue(env?.SUPABASE_URL);
  const secretKey = stringValue(env?.SUPABASE_SECRET_KEY);
  const bucket = stringValue(env?.REVIEW_EVIDENCE_BUCKET);
  if (!url || !secretKey || !bucket) return null;

  let baseUrl;
  try {
    baseUrl = new URL(url);
  } catch {
    return null;
  }

  if (baseUrl.protocol !== "https:" && baseUrl.hostname !== "127.0.0.1" && baseUrl.hostname !== "localhost") {
    return null;
  }

  return {
    baseUrl: baseUrl.toString().replace(/\/$/u, ""),
    secretKey,
    bucket,
  };
}

function apiHeaders(secretKey, json = false) {
  return {
    apikey: secretKey,
    ...(json ? { "Content-Type": "application/json" } : {}),
  };
}

function encodeStoragePath(path) {
  return path.split("/").map((segment) => encodeURIComponent(segment)).join("/");
}

function metadataUrl(config, keys) {
  const url = new URL(`${config.baseUrl}/rest/v1/review_hub_objects`);
  url.searchParams.set("select", OBJECT_COLUMNS);

  if (keys.length === 1) {
    url.searchParams.set("key", `eq.${keys[0]}`);
  } else {
    const values = keys.map((key) => `"${key.replaceAll('"', '\\"')}"`).join(",");
    url.searchParams.set("key", `in.(${values})`);
  }

  return url;
}

async function responseJson(response, label) {
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`${label} failed (${response.status})${detail ? `: ${detail}` : ""}`);
  }
  return response.json();
}

async function rpc(config, fetchImpl, name, body) {
  const response = await fetchImpl(`${config.baseUrl}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: apiHeaders(config.secretKey, true),
    body: JSON.stringify(body),
  });
  return responseJson(response, `Supabase RPC ${name}`);
}

async function readMetadata(config, fetchImpl, keys) {
  if (keys.length === 0) return [];
  const response = await fetchImpl(metadataUrl(config, keys), {
    headers: apiHeaders(config.secretKey),
  });
  const rows = await responseJson(response, "Supabase review metadata read");
  return Array.isArray(rows) ? rows : [];
}

async function deleteStoragePaths(config, fetchImpl, paths) {
  if (paths.length === 0) return;

  const response = await fetchImpl(
    `${config.baseUrl}/storage/v1/object/${encodeURIComponent(config.bucket)}`,
    {
      method: "DELETE",
      headers: apiHeaders(config.secretKey, true),
      body: JSON.stringify({ prefixes: paths }),
    },
  );
  await responseJson(response, "Supabase review evidence delete");
}

async function deleteRows(config, fetchImpl, keys) {
  if (keys.length === 0) return { deleted: 0 };
  return rpc(config, fetchImpl, "review_hub_delete_object_rows", { p_keys: keys });
}

function jsonObject(row) {
  const bodyText = row.body_text;
  return {
    etag: row.etag,
    customMetadata: row.custom_metadata ?? {},
    httpMetadata: { contentType: row.content_type },
    body: new TextEncoder().encode(bodyText),
    text: async () => bodyText,
  };
}

async function binaryObject(config, fetchImpl, row) {
  const response = await fetchImpl(
    `${config.baseUrl}/storage/v1/object/${encodeURIComponent(config.bucket)}/${encodeStoragePath(row.storage_path)}`,
    {
      method: "GET",
      headers: apiHeaders(config.secretKey),
      cache: "no-store",
    },
  );

  if (response.status === 404) return null;
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `Supabase review evidence read failed (${response.status})${detail ? `: ${detail}` : ""}`,
    );
  }

  return {
    etag: row.etag,
    customMetadata: row.custom_metadata ?? {},
    httpMetadata: { contentType: row.content_type },
    body: response.body,
  };
}

export function createSupabaseReviewStorage(env, fetchImpl = fetch) {
  const config = storageConfig(env);
  if (!config || typeof fetchImpl !== "function") return null;

  return {
    async get(key) {
      const rows = await readMetadata(config, fetchImpl, [key]);
      const row = rows.find((item) => item?.key === key) ?? rows[0] ?? null;
      if (!row) return null;
      if (row.kind === "json" && typeof row.body_text === "string") return jsonObject(row);
      if (row.kind === "binary" && typeof row.storage_path === "string") {
        return binaryObject(config, fetchImpl, row);
      }
      throw new Error("Supabase review metadata is invalid.");
    },

    async put(key, value, options = {}) {
      const contentType =
        stringValue(options?.httpMetadata?.contentType) ?? "application/octet-stream";
      const customMetadata =
        options?.customMetadata && typeof options.customMetadata === "object"
          ? options.customMetadata
          : {};
      const expectedEtag = stringValue(options?.onlyIf?.etagMatches);
      const isJson = contentType.toLowerCase().startsWith("application/json");

      let kind;
      let bodyText = null;
      let storagePath = null;

      if (isJson) {
        if (typeof value !== "string") {
          throw new TypeError("JSON review objects must be written as strings.");
        }
        kind = "json";
        bodyText = value;
      } else {
        kind = "binary";
        storagePath = key;

        const uploadResponse = await fetchImpl(
          `${config.baseUrl}/storage/v1/object/${encodeURIComponent(config.bucket)}/${encodeStoragePath(key)}`,
          {
            method: "POST",
            headers: {
              ...apiHeaders(config.secretKey),
              "Content-Type": contentType,
              "cache-control": "max-age=0",
              "x-upsert": "true",
            },
            body: value,
          },
        );
        await responseJson(uploadResponse, "Supabase review evidence upload");
      }

      let result;
      try {
        result = await rpc(config, fetchImpl, "review_hub_put_object", {
          p_key: key,
          p_kind: kind,
          p_body_text: bodyText,
          p_storage_path: storagePath,
          p_content_type: contentType,
          p_custom_metadata: customMetadata,
          p_expected_etag: expectedEtag,
        });
      } catch (error) {
        if (storagePath) {
          try {
            await deleteStoragePaths(config, fetchImpl, [storagePath]);
          } catch {
            // A leaked staged object is safer than hiding the original storage error.
          }
        }
        throw error;
      }

      if (!result?.stored) return null;
      return { etag: result.etag };
    },

    async delete(keys) {
      const uniqueKeys = [...new Set(Array.isArray(keys) ? keys : [keys])].filter(Boolean);
      if (uniqueKeys.length === 0) return;

      const rows = await readMetadata(config, fetchImpl, uniqueKeys);
      const storagePaths = [
        ...new Set(
          rows
            .filter((row) => row?.kind === "binary" && typeof row.storage_path === "string")
            .map((row) => row.storage_path),
        ),
      ];

      await deleteStoragePaths(config, fetchImpl, storagePaths);
      await deleteRows(config, fetchImpl, uniqueKeys);
    },

    async cleanupExpired(limit = 200) {
      const safeLimit = Math.max(1, Math.min(Number.isInteger(limit) ? limit : 200, 1000));
      const rows = await rpc(config, fetchImpl, "review_hub_expired_objects", {
        p_limit: safeLimit,
      });
      const expired = Array.isArray(rows) ? rows : [];
      if (expired.length === 0) return { deleted: 0 };

      const storagePaths = [
        ...new Set(
          expired
            .filter((row) => row?.kind === "binary" && typeof row.storage_path === "string")
            .map((row) => row.storage_path),
        ),
      ];

      await deleteStoragePaths(config, fetchImpl, storagePaths);
      await deleteRows(
        config,
        fetchImpl,
        expired.map((row) => row.key),
      );
      return { deleted: expired.length };
    },
  };
}
