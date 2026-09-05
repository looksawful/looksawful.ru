import { access, readFile, readdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { Plugin } from "vite";

import {
  parseRegisteredMediaCatalogRecord,
  parseUploadedMediaCatalogRecord,
} from "../../data/media/catalog.ts";
import {
  applyMediaEditorialPatch,
  applyRegisteredMediaEditorialPatch,
  collectContentDeskTextEntries,
  type ContentDeskTextEntry,
} from "./editor-model.ts";

const METADATA_API_PATH = "/__media-desk/metadata";
const METADATA_BULK_API_PATH = "/__media-desk/metadata/bulk";
const TEXTS_API_PATH = "/__media-desk/texts";
const MAX_BODY_BYTES = 128 * 1024;
const MAX_BULK_ITEMS = 100;
const SAFE_ASSET_ID = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;
const SAFE_ARRAY_INDEX = /^(0|[1-9]\d*)$/;
const CMS_RUNTIME_ASSET_PREFIX = "cms-";

const TEXT_SOURCE_FILES = [
  "src/content/navigation.json",
  "src/content/projects.json",
] as const;

const TEXT_SOURCE_DIRECTORIES = [
  "src/content/editorial",
  "src/content/cases",
  "src/content/collections",
  "src/content/shootings",
  "src/content/standalone-projects",
] as const;

interface SaveRequest {
  id: string;
  metadata: Record<string, unknown>;
}

interface TextSaveRequest {
  sourcePath: string;
  fieldPath: string;
  value: string;
}

interface PreparedMediaSave {
  path: string;
  record: Record<string, unknown>;
}

function json(
  response: ServerResponse,
  status: number,
  body: Record<string, unknown>,
): void {
  response.statusCode = status;
  response.setHeader("content-type", "application/json; charset=utf-8");
  response.end(`${JSON.stringify(body)}\n`);
}

async function readJsonBody(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.byteLength;
    if (size > MAX_BODY_BYTES) throw new Error("Request body is too large");
    chunks.push(buffer);
  }
  const source = Buffer.concat(chunks).toString("utf8");
  if (!source) throw new Error("Request body is empty");
  return JSON.parse(source);
}

function parseSaveRequest(value: unknown): SaveRequest {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError("Media Desk save request must be an object");
  }
  const record = value as Record<string, unknown>;
  const unexpected = Object.keys(record).filter((key) => key !== "id" && key !== "metadata");
  if (unexpected.length > 0) {
    throw new Error(`Media Desk save request has unexpected field "${unexpected[0]}"`);
  }
  if (typeof record.id !== "string" || !SAFE_ASSET_ID.test(record.id)) {
    throw new TypeError("Media Desk save request id is invalid");
  }
  if (!record.metadata || typeof record.metadata !== "object" || Array.isArray(record.metadata)) {
    throw new TypeError("Media Desk save request metadata must be an object");
  }
  return { id: record.id, metadata: record.metadata as Record<string, unknown> };
}

function validateBulkSaveRequests(requests: readonly SaveRequest[]): void {
  if (requests.length === 0) {
    throw new TypeError("Media Desk bulk save request must contain at least one item");
  }
  if (requests.length > MAX_BULK_ITEMS) {
    throw new Error(`Media Desk bulk save request exceeds ${MAX_BULK_ITEMS} items`);
  }
  const ids = new Set<string>();
  for (const request of requests) {
    if (ids.has(request.id)) {
      throw new Error(`Media Desk bulk save request contains duplicate id "${request.id}"`);
    }
    ids.add(request.id);
  }
}

function parseBulkSaveRequest(value: unknown): readonly SaveRequest[] {
  if (!Array.isArray(value)) {
    throw new TypeError("Media Desk bulk save request must be an array");
  }
  const requests = value.map(parseSaveRequest);
  validateBulkSaveRequests(requests);
  return requests;
}

function parseTextSaveRequest(value: unknown): TextSaveRequest {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError("Content Desk text save request must be an object");
  }
  const record = value as Record<string, unknown>;
  const allowed = new Set(["sourcePath", "fieldPath", "value"]);
  const unexpected = Object.keys(record).filter((key) => !allowed.has(key));
  if (unexpected.length > 0) {
    throw new Error(`Content Desk text save request has unexpected field "${unexpected[0]}"`);
  }
  if (typeof record.sourcePath !== "string" || record.sourcePath.length === 0) {
    throw new TypeError("Content Desk text save request sourcePath is invalid");
  }
  if (typeof record.fieldPath !== "string") {
    throw new TypeError("Content Desk text save request fieldPath is invalid");
  }
  if (typeof record.value !== "string") {
    throw new TypeError("Content Desk text save request value must be a string");
  }
  return {
    sourcePath: record.sourcePath,
    fieldPath: record.fieldPath,
    value: record.value,
  };
}

function persistedUploadId(id: string): string {
  return id.startsWith(CMS_RUNTIME_ASSET_PREFIX)
    ? id.slice(CMS_RUNTIME_ASSET_PREFIX.length)
    : id;
}

async function existingRecordPath(root: string, id: string): Promise<{
  path: string;
  origin: "registered" | "upload";
  recordId: string;
}> {
  const uploadId = persistedUploadId(id);
  const candidates = [
    {
      path: resolve(root, "src/content/media-catalog/registered", `${id}.json`),
      origin: "registered" as const,
      recordId: id,
    },
    {
      path: resolve(root, "src/content/media-catalog/uploads", `${uploadId}.json`),
      origin: "upload" as const,
      recordId: uploadId,
    },
  ];

  for (const candidate of candidates) {
    try {
      await access(candidate.path);
      return candidate;
    } catch {}
  }

  throw new Error(`Media catalog record "${id}" was not found`);
}

async function readTextSource(root: string, sourcePath: string): Promise<[string, unknown]> {
  const absolutePath = resolve(root, sourcePath);
  return [sourcePath, JSON.parse(await readFile(absolutePath, "utf8"))];
}

function arrayIndex(segment: string): number | null {
  if (!SAFE_ARRAY_INDEX.test(segment)) return null;
  const index = Number(segment);
  return Number.isSafeInteger(index) ? index : null;
}

function existingPathValue(container: unknown, segment: string, fieldPath: string): unknown {
  if (Array.isArray(container)) {
    const index = arrayIndex(segment);
    if (index === null || index >= container.length) {
      throw new Error(`Content Desk text field "${fieldPath}" no longer exists`);
    }
    return container[index];
  }
  if (
    !container
    || typeof container !== "object"
    || !Object.prototype.hasOwnProperty.call(container, segment)
  ) {
    throw new Error(`Content Desk text field "${fieldPath}" no longer exists`);
  }
  return (container as Record<string, unknown>)[segment];
}

export function replaceContentDeskTextLeaf(
  source: unknown,
  fieldPath: string,
  value: string,
): unknown {
  if (fieldPath === "") {
    if (typeof source !== "string") {
      throw new TypeError("Content Desk root text field must still be a string");
    }
    return value;
  }

  const segments = fieldPath.split(".");
  let parent: unknown = source;
  for (const segment of segments.slice(0, -1)) {
    parent = existingPathValue(parent, segment, fieldPath);
  }

  const leafSegment = segments.at(-1) ?? "";
  const current = existingPathValue(parent, leafSegment, fieldPath);
  if (typeof current !== "string") {
    throw new TypeError(`Content Desk text field "${fieldPath}" must still be a string`);
  }

  if (Array.isArray(parent)) {
    const index = arrayIndex(leafSegment);
    if (index === null || index >= parent.length) {
      throw new Error(`Content Desk text field "${fieldPath}" no longer exists`);
    }
    parent[index] = value;
  } else if (parent && typeof parent === "object") {
    (parent as Record<string, unknown>)[leafSegment] = value;
  } else {
    throw new Error(`Content Desk text field "${fieldPath}" no longer exists`);
  }

  return source;
}

export async function loadContentDeskTextEntries(root: string): Promise<readonly ContentDeskTextEntry[]> {
  const sources: Record<string, unknown> = {};

  for (const sourcePath of TEXT_SOURCE_FILES) {
    const [path, value] = await readTextSource(root, sourcePath);
    sources[path] = value;
  }

  for (const directoryPath of TEXT_SOURCE_DIRECTORIES) {
    const absoluteDirectory = resolve(root, directoryPath);
    const entries = await readdir(absoluteDirectory, { withFileTypes: true });
    const jsonFiles = entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
      .map((entry) => entry.name)
      .sort();

    for (const filename of jsonFiles) {
      const sourcePath = join(directoryPath, filename).replaceAll("\\", "/");
      const [path, value] = await readTextSource(root, sourcePath);
      sources[path] = value;
    }
  }

  return collectContentDeskTextEntries(sources);
}

export async function saveContentDeskText(
  root: string,
  request: TextSaveRequest,
): Promise<ContentDeskTextEntry> {
  const entries = await loadContentDeskTextEntries(root);
  const allowed = entries.some(
    (entry) => entry.sourcePath === request.sourcePath && entry.fieldPath === request.fieldPath,
  );
  if (!allowed) {
    throw new Error(
      `Content Desk text entry "${request.sourcePath}#${request.fieldPath}" is not editable`,
    );
  }

  const [sourcePath, current] = await readTextSource(root, request.sourcePath);
  const next = replaceContentDeskTextLeaf(current, request.fieldPath, request.value);
  await writeFile(resolve(root, sourcePath), `${JSON.stringify(next, null, 2)}\n`, "utf8");
  return { sourcePath, fieldPath: request.fieldPath, value: request.value };
}

async function prepareMediaDeskMetadata(
  root: string,
  request: SaveRequest,
): Promise<PreparedMediaSave> {
  const target = await existingRecordPath(root, request.id);
  const current = JSON.parse(await readFile(target.path, "utf8")) as Record<string, unknown>;
  if (current.id !== target.recordId) {
    throw new Error(`Media catalog record id mismatch for "${request.id}"`);
  }

  const next = target.origin === "registered"
    ? applyRegisteredMediaEditorialPatch(current, request.metadata)
    : applyMediaEditorialPatch(current, request.metadata);

  if (target.origin === "registered") {
    parseRegisteredMediaCatalogRecord(next);
  } else {
    parseUploadedMediaCatalogRecord(next);
  }
  return { path: target.path, record: next };
}

async function writePreparedMediaSave(prepared: PreparedMediaSave): Promise<void> {
  await writeFile(prepared.path, `${JSON.stringify(prepared.record, null, 2)}\n`, "utf8");
}

export async function saveMediaDeskMetadata(
  root: string,
  request: SaveRequest,
): Promise<Record<string, unknown>> {
  const prepared = await prepareMediaDeskMetadata(root, request);
  await writePreparedMediaSave(prepared);
  return prepared.record;
}

export async function saveMediaDeskMetadataBulk(
  root: string,
  requests: readonly SaveRequest[],
): Promise<readonly Record<string, unknown>[]> {
  validateBulkSaveRequests(requests);

  const prepared: PreparedMediaSave[] = [];
  for (const request of requests) {
    prepared.push(await prepareMediaDeskMetadata(root, request));
  }

  for (const item of prepared) {
    await writePreparedMediaSave(item);
  }
  return prepared.map(({ record }) => record);
}

export function createMediaDeskWritePlugin(root: string): Plugin {
  return {
    name: "looksawful-media-desk-write",
    apply: "serve",
    configureServer(server) {
      if (process.env.CONTENT_DESK_WRITE !== "1") return;

      server.middlewares.use(TEXTS_API_PATH, async (request, response) => {
        if (request.method !== "GET" && request.method !== "POST") {
          json(response, 405, { ok: false, error: "Method not allowed" });
          return;
        }

        try {
          if (request.method === "GET") {
            const entries = await loadContentDeskTextEntries(root);
            json(response, 200, { ok: true, entries });
            return;
          }
          const payload = parseTextSaveRequest(await readJsonBody(request));
          const entry = await saveContentDeskText(root, payload);
          json(response, 200, { ok: true, entry });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Unknown Content Desk error";
          json(response, request.method === "GET" ? 500 : 400, { ok: false, error: message });
        }
      });

      server.middlewares.use(METADATA_BULK_API_PATH, async (request, response) => {
        if (request.method !== "POST") {
          json(response, 405, { ok: false, error: "Method not allowed" });
          return;
        }

        try {
          const payload = parseBulkSaveRequest(await readJsonBody(request));
          const records = await saveMediaDeskMetadataBulk(root, payload);
          json(response, 200, { ok: true, records });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Unknown Media Desk error";
          json(response, 400, { ok: false, error: message });
        }
      });

      server.middlewares.use(METADATA_API_PATH, async (request, response) => {
        if (request.method !== "POST") {
          json(response, 405, { ok: false, error: "Method not allowed" });
          return;
        }

        try {
          const payload = parseSaveRequest(await readJsonBody(request));
          const record = await saveMediaDeskMetadata(root, payload);
          json(response, 200, { ok: true, record });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Unknown Media Desk error";
          json(response, 400, { ok: false, error: message });
        }
      });
    },
  };
}
