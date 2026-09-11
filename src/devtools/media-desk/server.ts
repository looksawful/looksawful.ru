import { access, readdir } from "node:fs/promises";
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
import {
  readVersionedFile,
  replaceFileTransactionally,
  replaceFilesTransactionally,
  requireExpectedRevision,
  revisionForSource,
  RevisionConflictError,
  serializeCanonicalJson,
  type TransactionHooks,
} from "./transaction-store.ts";

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
  expectedRevision: string;
  metadata: Record<string, unknown>;
}

interface TextSaveRequest {
  sourcePath: string;
  fieldPath: string;
  value: string;
  expectedRevision: string;
}

export interface VersionedContentDeskTextEntry extends ContentDeskTextEntry {
  revision: string;
}

interface PreparedMediaSave {
  path: string;
  record: Record<string, unknown>;
  expectedRevision: string;
  nextSource: string;
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

function writeErrorStatus(error: unknown): number {
  return error instanceof RevisionConflictError ? 409 : 400;
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
  const unexpected = Object.keys(record).filter(
    (key) => key !== "id" && key !== "metadata" && key !== "expectedRevision",
  );
  if (unexpected.length > 0) {
    throw new Error(`Media Desk save request has unexpected field "${unexpected[0]}"`);
  }
  if (typeof record.id !== "string" || !SAFE_ASSET_ID.test(record.id)) {
    throw new TypeError("Media Desk save request id is invalid");
  }
  if (!record.metadata || typeof record.metadata !== "object" || Array.isArray(record.metadata)) {
    throw new TypeError("Media Desk save request metadata must be an object");
  }
  return {
    id: record.id,
    expectedRevision: requireExpectedRevision(record.expectedRevision),
    metadata: record.metadata as Record<string, unknown>,
  };
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
    requireExpectedRevision(request.expectedRevision);
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
  const allowed = new Set(["sourcePath", "fieldPath", "value", "expectedRevision"]);
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
    expectedRevision: requireExpectedRevision(record.expectedRevision),
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

async function readTextSource(
  root: string,
  sourcePath: string,
): Promise<{ sourcePath: string; value: unknown; source: string; revision: string }> {
  const absolutePath = resolve(root, sourcePath);
  const versioned = await readVersionedFile(absolutePath);
  return {
    sourcePath,
    value: JSON.parse(versioned.source),
    source: versioned.source,
    revision: versioned.revision,
  };
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

export async function loadContentDeskTextEntries(
  root: string,
): Promise<readonly VersionedContentDeskTextEntry[]> {
  const sources: Record<string, unknown> = {};
  const revisions = new Map<string, string>();

  const addSource = async (sourcePath: string): Promise<void> => {
    const loaded = await readTextSource(root, sourcePath);
    sources[sourcePath] = loaded.value;
    revisions.set(sourcePath, loaded.revision);
  };

  for (const sourcePath of TEXT_SOURCE_FILES) {
    await addSource(sourcePath);
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
      await addSource(sourcePath);
    }
  }

  return collectContentDeskTextEntries(sources).map((entry) => ({
    ...entry,
    revision: revisions.get(entry.sourcePath) ?? "",
  }));
}

export async function saveContentDeskText(
  root: string,
  request: TextSaveRequest,
): Promise<VersionedContentDeskTextEntry> {
  const expectedRevision = requireExpectedRevision(request.expectedRevision);
  const entries = await loadContentDeskTextEntries(root);
  const allowed = entries.some(
    (entry) => entry.sourcePath === request.sourcePath && entry.fieldPath === request.fieldPath,
  );
  if (!allowed) {
    throw new Error(
      `Content Desk text entry "${request.sourcePath}#${request.fieldPath}" is not editable`,
    );
  }

  const current = await readTextSource(root, request.sourcePath);
  if (current.revision !== expectedRevision) {
    throw new RevisionConflictError(
      `Revision conflict for Content Desk source "${request.sourcePath}"`,
    );
  }

  const next = replaceContentDeskTextLeaf(current.value, request.fieldPath, request.value);
  const candidateEntries = collectContentDeskTextEntries({ [request.sourcePath]: next });
  if (!candidateEntries.some((entry) => entry.fieldPath === request.fieldPath)) {
    throw new Error(
      `Content Desk text entry "${request.sourcePath}#${request.fieldPath}" is not editable after validation`,
    );
  }

  const nextSource = serializeCanonicalJson(next);
  await replaceFileTransactionally({
    path: resolve(root, request.sourcePath),
    expectedRevision,
    nextSource,
  });

  return {
    sourcePath: request.sourcePath,
    fieldPath: request.fieldPath,
    value: request.value,
    revision: revisionForSource(nextSource),
  };
}

export async function loadMediaDeskRevision(root: string, id: string): Promise<string> {
  if (!SAFE_ASSET_ID.test(id)) throw new TypeError("Media Desk asset id is invalid");
  const target = await existingRecordPath(root, id);
  return (await readVersionedFile(target.path)).revision;
}

async function prepareMediaDeskMetadata(
  root: string,
  request: SaveRequest,
): Promise<PreparedMediaSave> {
  const expectedRevision = requireExpectedRevision(request.expectedRevision);
  const target = await existingRecordPath(root, request.id);
  const versioned = await readVersionedFile(target.path);
  if (versioned.revision !== expectedRevision) {
    throw new RevisionConflictError(`Revision conflict for media catalog record "${request.id}"`);
  }
  const current = JSON.parse(versioned.source) as Record<string, unknown>;
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
  return {
    path: target.path,
    record: next,
    expectedRevision,
    nextSource: serializeCanonicalJson(next),
  };
}

async function writePreparedMediaSave(
  prepared: PreparedMediaSave,
  hooks: TransactionHooks = {},
): Promise<void> {
  await replaceFileTransactionally(
    {
      path: prepared.path,
      expectedRevision: prepared.expectedRevision,
      nextSource: prepared.nextSource,
    },
    hooks,
  );
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
  hooks: TransactionHooks = {},
): Promise<readonly Record<string, unknown>[]> {
  validateBulkSaveRequests(requests);

  const prepared: PreparedMediaSave[] = [];
  for (const request of requests) {
    prepared.push(await prepareMediaDeskMetadata(root, request));
  }

  await replaceFilesTransactionally(
    prepared.map((item) => ({
      path: item.path,
      expectedRevision: item.expectedRevision,
      nextSource: item.nextSource,
    })),
    hooks,
  );
  return prepared.map(({ record }) => record);
}

function requestAssetId(request: IncomingMessage): string {
  const url = new URL(request.url ?? "/", "http://localhost");
  const id = url.searchParams.get("id") ?? "";
  if (!SAFE_ASSET_ID.test(id)) throw new TypeError("Media Desk asset id is invalid");
  return id;
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
          json(
            response,
            request.method === "GET" ? 500 : writeErrorStatus(error),
            { ok: false, error: message },
          );
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
          const revisions = await Promise.all(
            payload.map(async ({ id }) => ({ id, revision: await loadMediaDeskRevision(root, id) })),
          );
          json(response, 200, { ok: true, records, revisions });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Unknown Media Desk error";
          json(response, writeErrorStatus(error), { ok: false, error: message });
        }
      });

      server.middlewares.use(METADATA_API_PATH, async (request, response) => {
        if (request.method !== "GET" && request.method !== "POST") {
          json(response, 405, { ok: false, error: "Method not allowed" });
          return;
        }

        try {
          if (request.method === "GET") {
            const id = requestAssetId(request);
            const revision = await loadMediaDeskRevision(root, id);
            json(response, 200, { ok: true, id, revision });
            return;
          }

          const payload = parseSaveRequest(await readJsonBody(request));
          const record = await saveMediaDeskMetadata(root, payload);
          const revision = await loadMediaDeskRevision(root, payload.id);
          json(response, 200, { ok: true, record, revision });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Unknown Media Desk error";
          json(
            response,
            request.method === "GET" ? 400 : writeErrorStatus(error),
            { ok: false, error: message },
          );
        }
      });
    },
  };
}
